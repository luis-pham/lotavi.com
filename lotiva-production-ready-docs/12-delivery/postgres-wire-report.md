---
title: "Postgres wire-up report"
document_id: "DEL-PG-001"
version: "1.0.0"
status: "approved"
owners: ["Engineering"]
last_updated: "2026-07-25"
---

## Summary
API no longer depends on in-memory arrays for business paths. `LotivaRepos` is implemented for memory and Postgres; `LOTIVA_STORE=postgres` uses Drizzle + RLS transactions (`SET LOCAL app.tenant_id`).

## Changes
- `packages/application` — expanded ports (`LotivaRepos`, identity/catalog/audit/…)
- `packages/infrastructure` — `createPostgresRepos`, `app_meta` migration, idempotent seed
- `apps/api` — `initAppContext()`, routes use repos only
- `infra/compose` — API entrypoint migrate+seed, postgres healthcheck
- `scripts/dev-with-postgres.sh`, RLS test `postgres-rls.test.ts` (gated by `RUN_PG_TESTS=1`)

## How to run Postgres path
```bash
./scripts/dev-with-postgres.sh
# or full compose:
docker compose -f infra/compose/docker-compose.yml up --build
```

## Tests
- Unit/memory: `pnpm test` (green)
- RLS Postgres: `RUN_PG_TESTS=1 LOTIVA_STORE=postgres pnpm --filter @lotiva/infrastructure test`

## Note
This environment had no Docker daemon; Postgres integration tests are skipped until Docker/Postgres is available locally or in CI (CI already has pgvector service).
