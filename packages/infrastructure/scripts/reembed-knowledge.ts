#!/usr/bin/env tsx
/**
 * Safe re-embedding of approved/active knowledge chunks.
 *
 * Usage:
 *   DATABASE_URL=... EMBEDDING_SERVICE_URL=... pnpm tsx scripts/reembed-knowledge.ts [flags]
 *
 * Flags:
 *   --dry-run
 *   --tenant <uuid>
 *   --property <uuid>
 *   --force
 *   --batch-size <n>
 *   --resume-after <chunk-uuid>
 */
import { createHash } from "node:crypto";
import postgres from "postgres";

const args = process.argv.slice(2);
function flag(name: string): boolean {
  return args.includes(name);
}
function opt(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const dryRun = flag("--dry-run");
const force = flag("--force");
const tenantId = opt("--tenant");
const propertyId = opt("--property");
const resumeAfter = opt("--resume-after");
const batchSize = Math.min(64, Math.max(1, Number(opt("--batch-size") ?? "16")));

const databaseUrl = process.env.DATABASE_URL ?? "postgres://lotiva:lotiva@localhost:5432/lotiva";
const embeddingUrl = process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8081";
const expectedModel = process.env.EMBEDDING_MODEL_ID ?? "google/embeddinggemma-300m";

type ChunkRow = {
  id: string;
  tenant_id: string;
  property_id: string;
  content: string;
  content_hash: string | null;
  embedding_model: string | null;
  embedding_model_version: string | null;
  embedding_dimension: number | null;
};

async function embedBatch(texts: string[]) {
  const res = await fetch(`${embeddingUrl}/v1/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ texts }),
  });
  if (!res.ok) throw new Error(`embedding service ${res.status}`);
  return (await res.json()) as {
    embeddings: number[][];
    model: string;
    model_version: string;
    dimensions: number;
  };
}

async function main() {
  const sql = postgres(databaseUrl, { max: 2 });

  const ready = await fetch(`${embeddingUrl}/ready`).catch(() => null);
  if (!ready?.ok) {
    console.error("embedding service not ready:", embeddingUrl);
    if (!dryRun) process.exit(1);
  } else {
    console.log("embedding ready:", await ready.json());
  }

  const rows = await sql<ChunkRow[]>`
    SELECT c.id, c.tenant_id, c.property_id, c.content, c.content_hash,
           c.embedding_model, c.embedding_model_version, c.embedding_dimension
    FROM knowledge_chunks c
    INNER JOIN knowledge_documents d ON d.id = c.document_id
    WHERE d.status = 'published'
      AND d.archived_at IS NULL
      ${tenantId ? sql`AND c.tenant_id = ${tenantId}::uuid` : sql``}
      ${propertyId ? sql`AND c.property_id = ${propertyId}::uuid` : sql``}
      ${resumeAfter ? sql`AND c.id > ${resumeAfter}::uuid` : sql``}
    ORDER BY c.id
  `;

  let skipped = 0;
  let embedded = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const todo: ChunkRow[] = [];
    for (const row of batch) {
      const hash = row.content_hash ?? createHash("sha256").update(row.content).digest("hex");
      const sameModel =
        row.embedding_model === expectedModel ||
        (row.embedding_model_version ?? "").includes(expectedModel);
      const dimsOk = row.embedding_dimension === 768;
      if (!force && sameModel && dimsOk && row.content_hash === hash) {
        skipped += 1;
        continue;
      }
      todo.push({ ...row, content_hash: hash });
    }
    if (!todo.length) continue;

    console.log(
      JSON.stringify({
        msg: dryRun ? "dry-run-batch" : "embed-batch",
        size: todo.length,
        firstId: todo[0]!.id,
      }),
    );
    if (dryRun) {
      embedded += todo.length;
      continue;
    }

    try {
      const meta = await embedBatch(todo.map((r) => r.content));
      if (meta.dimensions !== 768) throw new Error(`dimension ${meta.dimensions}`);
      for (let j = 0; j < todo.length; j++) {
        const row = todo[j]!;
        const vec = meta.embeddings[j]!;
        if (!vec || vec.length !== 768 || vec.some((n) => !Number.isFinite(n))) {
          throw new Error(`invalid vector for chunk ${row.id}`);
        }
        const literal = `[${vec.map((n) => Number(n).toFixed(8)).join(",")}]`;
        await sql`
          UPDATE knowledge_chunks
          SET
            embedding = ${sql.json(vec)},
            content_hash = ${row.content_hash},
            embedding_model = ${meta.model},
            embedding_model_version = ${meta.model_version},
            embedding_dimension = 768,
            embedded_at = now()
          WHERE id = ${row.id}::uuid
        `;
        // Best-effort pgvector sync
        await sql
          .unsafe(
            `UPDATE knowledge_chunks
             SET embedding_vector = '${literal}'::vector
             WHERE id = '${row.id}'::uuid
               AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
               AND EXISTS (
                 SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'knowledge_chunks' AND column_name = 'embedding_vector'
               )`,
          )
          .catch(() => undefined);
        embedded += 1;
      }
    } catch (err) {
      failed += todo.length;
      console.error(
        JSON.stringify({
          msg: "batch-failed",
          error: (err as Error).message,
          resumeAfter: todo[0]!.id,
        }),
      );
      await sql.end();
      process.exit(2);
    }
  }

  const counts = await sql<
    { published_chunks: string; with_dim_768: string; archived_active: string }[]
  >`
    SELECT
      (SELECT count(*)::text FROM knowledge_chunks c
         JOIN knowledge_documents d ON d.id = c.document_id
        WHERE d.status = 'published' AND d.archived_at IS NULL) AS published_chunks,
      (SELECT count(*)::text FROM knowledge_chunks c
         JOIN knowledge_documents d ON d.id = c.document_id
        WHERE d.status = 'published' AND d.archived_at IS NULL
          AND c.embedding_dimension = 768) AS with_dim_768,
      (SELECT count(*)::text FROM knowledge_chunks c
         JOIN knowledge_documents d ON d.id = c.document_id
        WHERE d.archived_at IS NOT NULL AND c.embedding IS NOT NULL) AS archived_active
  `;

  console.log(
    JSON.stringify({
      msg: "reembed-complete",
      dryRun,
      force,
      tenantId: tenantId ?? null,
      propertyId: propertyId ?? null,
      skipped,
      embedded,
      failed,
      counts: counts[0],
    }),
  );
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
