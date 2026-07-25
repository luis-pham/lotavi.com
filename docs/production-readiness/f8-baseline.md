# F8 Baseline (2026-07-25)

## Classification entering F8

```text
PILOT READY
```

## Environment discovery

| Capability | Status |
|------------|--------|
| Git repository | **Absent** (no `.git`) |
| Docker / podman | **Not found** |
| Local Postgres | Available (`lotiva` DB) |
| pgvector extension | **Not installed** |
| Redis | **Not reachable** (`redis-cli` missing / no ping) |
| k6 | **Not found** |
| Real DNS/TLS staging host | **Unavailable** |
| EmbeddingGemma weights | **Not mounted** |

## Verification run (F8.0)

```bash
pnpm build:packages   # PASS
DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm db:migrate
# → 0006 applied; vector column skipped (no pgvector package)
NODE_ENV=test ALLOW_MEMORY_STORE=true RUN_PG_TESTS=1 LOTIVA_STORE=postgres \
  DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm test
# → 32/32 PASS
pnpm knowledge:reembed -- --dry-run
# → dry-run OK (1 published chunk; embedding service not ready)
```

## Implemented vs executable vs blocked

| Area | Implemented | Executable now | External block |
|------|-------------|----------------|----------------|
| Config fail-fast | Yes | Yes | — |
| Hybrid FTS/trgm | Yes | Yes on local PG | Dense SQL needs pgvector |
| Embedding adapter | Yes | Stub only | Model artifact + GPU/CPU download |
| Playwright E2E | Spec ready | Needs stack + browsers | Staging hostname |
| Staging compose/TLS | Manifests | No | Docker + DNS |
| Business k6 | Script | No | k6 binary + staging |
| Clean restore | Script proven locally | Yes locally | Staging infra |
| Multi-replica rate limit | Memory only | — | Redis + code (to implement) |

## Dependency order for F8

1. Config: forbid stub embeddings in prod-like
2. Redis distributed rate limiter (code + tests)
3. Re-embed CLI + pgvector-ready migration/SQL
4. Attempt model / docker / redis evidence
5. Document BLOCKED gates honestly

## Failures found

None in unit/RLS/eval suite. Infrastructure gaps prevent CONDITIONAL PRODUCTION READY gates.
