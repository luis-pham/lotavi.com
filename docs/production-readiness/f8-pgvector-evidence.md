# F8.2 — pgvector Staging Verification

## Result

```text
BLOCKED
```

Unresolved condition: local Postgres has no `vector` package (`pg_available_extensions` empty); Docker/`pgvector/pgvector:pg16` not available on this host.

## Implemented

- Migration `0006_pgvector_column.sql`
  - Creates extension when available
  - Adds `embedding_vector vector(768)` + HNSW (`vector_cosine_ops`) when extension present
  - No-ops safely when extension missing (verified locally)
- Hybrid SQL dense candidate query uses `embedding_vector <=> query::vector` when `hasPgvector=true`

## Local execution evidence (2026-07-25)

```bash
DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm db:migrate
# apply 0006_pgvector_column.sql
# NOTICE: skipping embedding_vector column — vector extension not installed

psql ... -c "SELECT extname FROM pg_extension WHERE extname='vector'"
# 0 rows
```

## Required staging proof (not run)

```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
\d+ knowledge_chunks
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'knowledge_chunks';
EXPLAIN ANALYZE
SELECT id, 1 - (embedding_vector <=> '[...]'::vector) AS score
FROM knowledge_chunks
WHERE tenant_id = $1 AND property_id = $2 AND embedding_vector IS NOT NULL
ORDER BY embedding_vector <=> '[...]'::vector
LIMIT 20;
```

Must also prove tenant/property/published/archived filters inside SQL and zero wrong-property candidates.

## Unblock

```bash
# Requires Docker
docker compose -f infra/compose/docker-compose.staging.yml up -d postgres
# then migrate + EXPLAIN ANALYZE as above
```
