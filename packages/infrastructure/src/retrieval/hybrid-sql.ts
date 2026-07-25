import { normalizeSearchText, scoreKnowledgeMatch } from "@lotiva/domain";
import { sql } from "drizzle-orm";

type SqlDb = {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>;
};

export type HybridHit = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
  denseScore: number;
  ftsScore: number;
  trigramScore: number;
  criticality: string;
  locale: string | null;
};

export type HybridSearchInput = {
  tenantId: string;
  propertyId: string;
  query: string;
  normalizedQuery: string;
  searchTerms: string[];
  queryEmbedding?: number[];
  limit: number;
  locale?: string;
  hasPgvector: boolean;
};

/**
 * Hybrid retrieval: dense (pgvector or jsonb cosine) + FTS + trigram.
 * Fusion: Reciprocal Rank Fusion (k=60) + exact/locale bonuses.
 * Property/tenant/published filters enforced in SQL.
 */
export async function hybridSearchSql(
  db: SqlDb,
  input: HybridSearchInput,
): Promise<HybridHit[]> {
  const qNorm = input.normalizedQuery || normalizeSearchText(input.query);
  const limit = Math.min(Math.max(input.limit, 1), 20);
  const emb = input.queryEmbedding;
  const embLiteral =
    emb && emb.length === 768 ? `[${emb.map((n) => Number(n).toFixed(8)).join(",")}]` : null;

  // Candidate pool via SQL — tenant/property/published filters only (no cross-property leakage).
  // Soft ranking in SQL; fusion + Vietnamese-normalized lexical scoring in process.
  const rows = await db.execute(sql`
    WITH base AS (
      SELECT
        c.id AS chunk_id,
        c.document_id,
        d.title AS document_title,
        c.content,
        coalesce(c.content_normalized, lower(c.content)) AS content_norm,
        coalesce(c.criticality, d.criticality, 'normal') AS criticality,
        coalesce(c.locale, d.locale) AS locale,
        c.embedding
      FROM knowledge_chunks c
      INNER JOIN knowledge_documents d ON d.id = c.document_id
      WHERE c.tenant_id = ${input.tenantId}::uuid
        AND c.property_id = ${input.propertyId}::uuid
        AND d.status = 'published'
        AND d.archived_at IS NULL
    )
    SELECT
      chunk_id,
      document_id,
      document_title,
      content,
      content_norm,
      criticality,
      locale,
      similarity(lower(unaccent(content_norm)), lower(unaccent(${qNorm}))) AS trigram_score,
      ts_rank(
        to_tsvector('simple', lower(unaccent(content_norm))),
        plainto_tsquery('simple', lower(unaccent(${qNorm})))
      ) AS fts_score,
      embedding
    FROM base
    ORDER BY (
      similarity(lower(unaccent(content_norm)), lower(unaccent(${qNorm}))) * 0.55
      + ts_rank(
          to_tsvector('simple', lower(unaccent(content_norm))),
          plainto_tsquery('simple', lower(unaccent(${qNorm})))
        ) * 0.45
    ) DESC
    LIMIT 80
  `);

  type Row = {
    chunk_id: string;
    document_id: string;
    document_title: string;
    content: string;
    content_norm: string;
    criticality: string;
    locale: string | null;
    trigram_score: number;
    fts_score: number;
    embedding: unknown;
  };

  const candidates: Row[] = (() => {
    if (Array.isArray(rows)) return rows as unknown as Row[];
    if (rows && typeof rows === "object" && Array.isArray((rows as { rows?: Row[] }).rows)) {
      return (rows as { rows: Row[] }).rows;
    }
    // drizzle-orm + postgres.js RowList is iterable / array-like
    try {
      return [...(rows as Iterable<Row>)];
    } catch {
      return [];
    }
  })();

  // When pgvector is live, pull dense ranks from SQL operator (not app-side cosine).
  const denseSqlScores = new Map<string, number>();
  if (input.hasPgvector && embLiteral) {
    try {
      // Numeric-only literal from controlled float formatting — safe for sql.raw.
      const queryVector = sql.raw(`'${embLiteral}'::vector`);
      const denseRows = await db.execute(sql`
        SELECT
          c.id AS chunk_id,
          (1 - (c.embedding_vector <=> ${queryVector}))::float8 AS dense_score
        FROM knowledge_chunks c
        INNER JOIN knowledge_documents d ON d.id = c.document_id
        WHERE c.tenant_id = ${input.tenantId}::uuid
          AND c.property_id = ${input.propertyId}::uuid
          AND d.status = 'published'
          AND d.archived_at IS NULL
          AND c.embedding_vector IS NOT NULL
        ORDER BY c.embedding_vector <=> ${queryVector}
        LIMIT 40
      `);
      const denseList = (() => {
        if (Array.isArray(denseRows)) return denseRows as { chunk_id: string; dense_score: number }[];
        if (denseRows && typeof denseRows === "object" && Array.isArray((denseRows as { rows?: unknown[] }).rows)) {
          return (denseRows as { rows: { chunk_id: string; dense_score: number }[] }).rows;
        }
        try {
          return [...(denseRows as Iterable<{ chunk_id: string; dense_score: number }>)];
        } catch {
          return [];
        }
      })();
      for (const row of denseList) {
        denseSqlScores.set(row.chunk_id, Number(row.dense_score) || 0);
      }
    } catch {
      // Column/index may not exist yet — fall back to jsonb cosine below.
    }
  }

  const withDense = candidates.map((r) => {
    const dense =
      denseSqlScores.get(r.chunk_id) ??
      (denseSqlScores.size === 0 ? cosineAgainst(r.embedding, emb) : 0);
    const hay = normalizeSearchText(`${r.document_title} ${r.content}`);
    const lexical = scoreKnowledgeMatch(hay, input.searchTerms.length ? input.searchTerms : [qNorm]);
    return {
      ...r,
      dense_score: dense,
      lexical_score: lexical,
      trigram_score: Number(r.trigram_score) || 0,
      fts_score: Number(r.fts_score) || 0,
    };
  });

  // RRF fusion
  const k = 60;
  const byDense = [...withDense].sort((a, b) => b.dense_score - a.dense_score);
  const byFts = [...withDense].sort((a, b) => b.fts_score - a.fts_score);
  const byTrgm = [...withDense].sort((a, b) => b.trigram_score - a.trigram_score);
  const byLex = [...withDense].sort((a, b) => b.lexical_score - a.lexical_score);

  const rankMap = new Map<string, number>();
  const applyRank = (list: typeof withDense, weight: number) => {
    list.forEach((item, idx) => {
      const prev = rankMap.get(item.chunk_id) ?? 0;
      rankMap.set(item.chunk_id, prev + weight / (k + idx + 1));
    });
  };
  applyRank(byDense, embLiteral ? 1.0 : 0.0);
  applyRank(byFts, 1.0);
  applyRank(byTrgm, 1.0);
  applyRank(byLex, 0.8);

  // Scale RRF (~0.01–0.08) into a usable confidence band; blend with lexical.
  const hits: HybridHit[] = withDense
    .map((r) => {
      const rrf = rankMap.get(r.chunk_id) ?? 0;
      let score = Math.min(1, rrf * 10 + r.lexical_score * 0.85);
      const hay = normalizeSearchText(`${r.document_title} ${r.content}`);
      if (hay.includes(qNorm) && qNorm.length >= 4) score = Math.min(1, score + 0.15);
      if (input.locale && r.locale && r.locale.startsWith(input.locale.slice(0, 2))) {
        score = Math.min(1, score + 0.05);
      }
      return {
        chunkId: r.chunk_id,
        documentId: r.document_id,
        documentTitle: r.document_title,
        content: r.content,
        score,
        denseScore: r.dense_score,
        ftsScore: r.fts_score,
        trigramScore: r.trigram_score,
        criticality: r.criticality,
        locale: r.locale,
      };
    })
    .filter((h) => h.score >= 0.12)
    .sort((a, b) => b.score - a.score);

  // Deduplicate by chunk
  const seen = new Set<string>();
  const deduped: HybridHit[] = [];
  for (const h of hits) {
    if (seen.has(h.chunkId)) continue;
    seen.add(h.chunkId);
    deduped.push(h);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

function cosineAgainst(embedding: unknown, query?: number[]): number {
  if (!query || query.length !== 768 || embedding == null) return 0;
  let vec: number[] | null = null;
  if (Array.isArray(embedding)) vec = embedding as number[];
  else if (typeof embedding === "string") {
    try {
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) vec = parsed;
    } catch {
      // pgvector may return "(...)" text
      const inner = embedding.replace(/^\[|\]$/g, "");
      vec = inner.split(",").map((x) => Number(x.trim()));
    }
  } else if (typeof embedding === "object" && embedding !== null && "length" in (embedding as object)) {
    vec = Array.from(embedding as ArrayLike<number>);
  }
  if (!vec || vec.length !== 768) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < 768; i++) {
    const a = vec[i]!;
    const b = query[i]!;
    dot += a * b;
    na += a * a;
    nb += b * b;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? Math.max(0, dot / denom) : 0;
}

export async function detectPgvector(db: SqlDb): Promise<boolean> {
  try {
    const rows = await db.execute(sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`);
    const list = (rows as unknown as { rows?: unknown[] }).rows ?? (rows as unknown as unknown[]);
    return list.length > 0;
  } catch {
    return false;
  }
}
