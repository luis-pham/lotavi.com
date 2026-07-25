# F8 Final Verification Report

## FINAL CLASSIFICATION

```text
PILOT READY
```

**Not** `CONDITIONAL PRODUCTION READY — TEXT EXPERIENCE ONLY` — critical staging evidence gates remain unproven.

**Not** `PRODUCTION READY`.

## Release scope

| Dimension | Value |
|-----------|-------|
| text | supervised pilot only |
| voice | disabled (`VOICE_ENABLED=false`) |
| supported properties | one controlled property |
| tested traffic assumptions | limited local; staging load not run |
| persistence | PostgreSQL |
| operational oversight | required |

## Phase results

| Phase | Result | Notes |
|-------|--------|-------|
| F8.0 Baseline | PASS | 32/32 tests; infra gaps inventoried |
| F8.1 EmbeddingGemma | BLOCKED | Real weights not available |
| F8.2 pgvector | BLOCKED | Extension/image not available locally |
| F8.3 Re-embedding | CONDITIONAL PASS | CLI + dry-run; live model embed pending |
| F8.4 Hybrid retrieval | CONDITIONAL PASS | Lexical/FTS/trgm proven; dense SQL unproven |
| F8.5 Staging deploy | BLOCKED | No Docker/DNS/TLS |
| F8.6 Playwright E2E | BLOCKED | Staging host missing; `RUN_E2E=1` not run |
| F8.7 Business k6 | BLOCKED | No k6 / no staging |
| F8.8 Staging restore | BLOCKED | Staging missing (local restore remains F7 PASS) |
| F8.9 Rate limiting | CONDITIONAL PASS | Redis limiter + fail-closed + tests; multi-replica live proof pending |
| F8.10 Observability | CONDITIONAL PASS | Config present; staging alert firings missing |
| F8.11 Release/rollback | CONDITIONAL PASS | Runbook ready; staging drill not executed |
| F8.12 Gemini Live | BLOCKED | Keep voice disabled |

## Implemented changes (this phase)

- Redis distributed rate limiter + fail-closed + route coverage (QR/login/reset/chat/confirm/SSE)
- Production config: forbid stub embeddings; require `REQUIRE_REDIS_RATE_LIMIT`
- Migration `0006_pgvector_column.sql` (safe no-op without vector package)
- Hybrid SQL native `<=>` dense path when pgvector present
- Re-embed CLI (`pnpm knowledge:reembed`)
- Embedding `/v1/diagnostics`
- Staging compose env hardening

## Database migrations

- `0006_pgvector_column.sql` (applied locally; vector column skipped)

## Indexes added

- `knowledge_chunks_embedding_hnsw_idx` — only when vector extension installed (not on this host)

## Environment variables added or changed

```text
EMBEDDING_BACKEND
EMBEDDING_ALLOW_STUB
EMBEDDING_MODEL_ID
EMBEDDING_MODEL_PATH
REQUIRE_REDIS_RATE_LIMIT
```

## External infrastructure used

| Resource | Used? |
|----------|-------|
| Local Postgres | Yes |
| pgvector | No |
| Redis | No |
| Docker | No |
| Staging DNS/TLS | No |
| EmbeddingGemma weights | No |
| k6 | No |

## Verification evidence

| Item | Result |
|------|--------|
| tests | **32/32 PASS** (`RUN_PG_TESTS=1`) |
| model result | BLOCKED |
| pgvector result | BLOCKED (migration no-op) |
| retrieval metrics | eval suite PASS; dense SQL unproven |
| E2E result | BLOCKED |
| load result | BLOCKED |
| restore result | local F7 PASS; staging BLOCKED |
| staging result | BLOCKED |
| observability result | CONDITIONAL |
| rollback result | CONDITIONAL (docs only) |

## Security findings

- Residual: multi-replica rate limit **code** ready but **not** live-verified across replicas
- Stub embeddings / memory store still refused in production config
- Voice remains disabled

## Known limitations

1. No real EmbeddingGemma verification
2. No pgvector dense SQL proof
3. No DNS/TLS staging
4. No Playwright staging E2E
5. No business k6 evidence
6. No staging clean restore
7. Workspace is not a git repository (no commit SHA)

## External blockers

1. Docker (or equivalent) + `pgvector/pgvector:pg16`
2. Redis for distributed rate-limit proof
3. Approved EmbeddingGemma artifact path
4. Staging DNS + TLS certificates
5. k6 binary

## Production conditions (if pilot continues)

- One property, supervised traffic
- `VOICE_ENABLED=false`
- `LOTIVA_STORE=postgres`
- Operator oversight for backups and incidents
- Do not market as production-ready text experience until F8 critical gates PASS

## Exact local commands

```bash
pnpm install
pnpm build:packages
pnpm db:migrate
NODE_ENV=test ALLOW_MEMORY_STORE=true RUN_PG_TESTS=1 LOTIVA_STORE=postgres \
  DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm test
pnpm knowledge:reembed -- --dry-run
./scripts/restore-drill.sh
```

## Exact CI commands

```bash
pnpm install
pnpm build:packages
pnpm lint
pnpm typecheck
pnpm test
# with services:
RUN_PG_TESTS=1 LOTIVA_STORE=postgres DATABASE_URL=$DATABASE_URL pnpm test
```

## Exact staging deployment commands

```bash
docker compose -f infra/compose/docker-compose.staging.yml up -d --build
```

## Exact re-embedding commands

```bash
pnpm knowledge:reembed -- --dry-run
pnpm knowledge:reembed -- --tenant <uuid> --property <uuid>
pnpm knowledge:reembed -- --force
```

## Exact Playwright commands

```bash
RUN_E2E=1 PLAYWRIGHT_BASE_URL=https://staging.lotiva.vn pnpm --filter @lotiva/web e2e
```

## Exact k6 commands

```bash
k6 run -e BASE_URL=https://api.staging.lotiva.vn infra/load/k6-business.js
```

## Exact backup / restore / rollback commands

```bash
./scripts/backup-postgres.sh
./scripts/restore-postgres.sh
./scripts/restore-drill.sh
# rollback: redeploy previous image digest after backup
```

## Files changed (F8)

- `packages/contracts/src/config.ts` + tests
- `packages/infrastructure/src/redis-rate-limit.ts` + tests
- `packages/infrastructure/src/redis.ts`
- `packages/infrastructure/src/retrieval/hybrid-sql.ts`
- `packages/infrastructure/drizzle/0006_pgvector_column.sql`
- `packages/infrastructure/scripts/reembed-knowledge.ts`
- `apps/api/src/app-context.ts`
- `apps/api/src/routes/guest.ts`, `auth.ts`, `realtime.ts`
- `apps/embedding-service/app/main.py`
- `infra/compose/docker-compose.staging.yml`
- `docs/production-readiness/f8-*.md`

## Recommended next phase

**F8 completion on real staging host:**

1. Provision Docker + DNS/TLS + Redis + pgvector Postgres
2. Mount EmbeddingGemma weights → F8.1 PASS
3. Migrate + re-embed → F8.2/F8.3/F8.4 dense proof
4. Run Playwright + k6 + restore + rollback drills
5. Live multi-replica rate-limit verification
6. Re-evaluate for `CONDITIONAL PRODUCTION READY — TEXT EXPERIENCE ONLY`

## Final release gate checklist (text-only)

| # | Gate | Proven? |
|---|------|---------|
| 1–3 | Postgres only / no memory / no stub | Config yes; staging runtime no |
| 4–5 | Real EmbeddingGemma dim 768 | No |
| 6–8 | pgvector + dense SQL + FTS/trgm | FTS/trgm yes; pgvector no |
| 9–12 | Hybrid eval safety zeros | Partial (local eval) |
| 13–15 | Staging E2E + duplicate ticket + SSE | No |
| 16–17 | DNS/TLS + business load | No |
| 18–20 | Staging restore + smoke + RLS | No |
| 21–23 | Distributed RL + obs + rollback | Partial |
| 24–25 | No critical security / voice off | Voice off yes; RL live pending |

Because critical non-voice gates remain unproven → retain **PILOT READY**.
