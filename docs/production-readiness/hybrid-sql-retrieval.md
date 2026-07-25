# Hybrid SQL retrieval (F7.2)

## Fusion method

**Reciprocal Rank Fusion (k=60)** over:

1. Dense cosine (when query/chunk embeddings present)
2. PostgreSQL FTS (`ts_rank` + `unaccent`)
3. `pg_trgm` similarity
4. Vietnamese-normalized lexical score

Final confidence: `min(1, rrf*10 + lexical*0.85 + bonuses)`.

## SQL filters (mandatory)

- `tenant_id`
- `property_id`
- `status = published`
- `archived_at IS NULL`

## Indexes

- `pg_trgm` on normalized content
- GIN FTS (`content_tsv`)
- content_hash for dedupe
- ivfflat when pgvector available (optional)

## Local note

Homebrew Postgres may lack pgvector; embeddings store as `jsonb` and dense cosine runs in-process. Compose/staging use `pgvector/pgvector:pg16`.
