# Knowledge retrieval

## Implemented

- Approved/published documents only.
- Tenant + property filters.
- Vietnamese normalization + synonym expansion (`packages/domain/src/vietnamese.ts`).
- Lexical scoring with bigram soft match (memory + postgres repos).
- Normalized columns + `pg_trgm` indexes (migration `0002`).
- Eval corpus + runner: `packages/infrastructure/src/retrieval/eval-{corpus.json,test.ts}`.
- Low-confidence fallback message (locale-aware).

## Thresholds (current)

- Minimum score to answer: `0.15`
- Eval answerable hit-rate target: ≥ 80% on memory corpus

## Not yet production-complete

- Real EmbeddingGemma weights (service is deterministic stub).
- Persisted pgvector similarity in the query path.
- True hybrid fusion (vector + FTS + trgm) inside SQL.
- Translation-grade multilingual indexing.

## Operator rule

If evidence is missing or low-confidence, assistant must not guess — offer staff handoff.
