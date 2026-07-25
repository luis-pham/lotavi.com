# Final verification report

## FINAL CLASSIFICATION

```text
PILOT READY
```

Safe for a **controlled single-property pilot** with voice disabled and ops monitoring. Not broad production.

## Phase results

| Phase | Result | Notes |
|-------|--------|-------|
| F6.1 Config fail-fast | PASS | Typed schema; memory/demo/voice guards; Dockerfile defaults fixed |
| F6.2 PostgreSQL SoT | CONDITIONAL PASS | Migrations + repos; transition history + version; E2E still gated |
| F6.3 Guest QR security | PASS | Opaque tokens, expiry, revoke, rotate, rate limit, signed cookies, revoke recheck |
| F6.4 Hybrid retrieval | CONDITIONAL PASS | VN normalize + eval; stub embeddings / no SQL vector hybrid yet |
| F6.5 Locale policy | PASS | Canonical resolver + session locale PATCH |
| F6.6 Chat grounding | CONDITIONAL PASS | Intent + approved-only + confirm nudge; extractive answers |
| F6.7 Gemini Live | BLOCKED | Adapter incomplete; keep `VOICE_ENABLED=false` |
| F6.8 State machine | PASS | Domain table + transition audit + concurrency |
| F6.9 Staff realtime/worker | CONDITIONAL PASS | SSE + Redis pubsub; worker durable when Redis up |
| F6.10 Auth/RBAC/audit | CONDITIONAL PASS | scrypt, rate limit, roles; no password-reset workflow |
| F6.11 Observability | CONDITIONAL PASS | health/ready/metrics/logs; limited dependency checks |
| F6.12 E2E | CONDITIONAL PASS | Playwright skeleton; requires `RUN_E2E=1` stack |
| F6.13 Load | CONDITIONAL PASS | k6 health pilot only |
| F6.14 Backup/restore | CONDITIONAL PASS | Scripts ready; drill evidence env-dependent |
| F6.15 Security | CONDITIONAL PASS | Threat model; residual multi-replica rate limit / RLS gaps |
| F6.16 Staging | BLOCKED | Needs DNS/TLS/infra access |
| F6.17 Pilot seed/runbooks | PASS | Green Ruby dataset + runbooks |

## Implemented changes (summary)

- Production config schema + refuse memory/demo seed in prod-like envs
- Guest cookie unsign + QR revoke session invalidation
- QR rotate admin API
- Ticket optimistic concurrency + `ticket_transitions`
- Locale policy + guest locale endpoint
- Staff role enforcement on mutations; Redis SSE fanout
- Retrieval eval corpus; pilot seed content; backup scripts
- Docs under `docs/production-readiness/*`
- CI: migrate/seed, `RUN_PG_TESTS`, config negative check

## Verification evidence (captured 2026-07-25)

| Check | Result |
|-------|--------|
| `pnpm build:packages` | PASS |
| `pnpm test` (26 tests, `RUN_PG_TESTS=1`) | PASS including Postgres RLS |
| Config refuse `NODE_ENV=production` + `LOTIVA_STORE=memory` | PASS |
| Migrations `0002`/`0003` applied | PASS (`rotated_from` present; `ticket_transitions` RLS) |
| Postgres smoke: `/ready` | `{"status":"ok","checks":{"store":"postgres","postgres":"ok"}}` |
| QR session + signed cookie | PASS (room 1208, theme loaded) |
| Chat `ho boi o dau` | Grounded Pool hours answer, score 1 |
| Ticket prepare→confirm | Created `ticketId` with idempotency key |
| `backup-postgres.sh` + `verify-restore.sh` | PASS (dump written; counts verified on live DB) |
| Playwright E2E | NOT RUN (`RUN_E2E` gated) |
| Gemini Live real provider | BLOCKED |
| Staging TLS | BLOCKED |

Commands:

```bash
pnpm install
pnpm build:packages
NODE_ENV=test ALLOW_MEMORY_STORE=true RUN_PG_TESTS=1 LOTIVA_STORE=postgres \
  DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm test

# Config negative (expect throw):
cd packages/contracts && node --input-type=module -e \
  "import { parseLotivaEnv } from './dist/index.js'; parseLotivaEnv({NODE_ENV:'production',LOTIVA_STORE:'memory',SESSION_SECRET:'x'.repeat(32)})"

# Postgres smoke (API):
export DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva
export LOTIVA_STORE=postgres ALLOW_DEMO_SEED=true ALLOW_MEMORY_STORE=false
export SESSION_SECRET=dev-only-change-me-to-a-long-random-secret
export VOICE_ENABLED=false API_PORT=4012
pnpm exec tsx apps/api/src/server.ts
# then QR → chat → ticket confirm via curl

./scripts/backup-postgres.sh ./backups
./scripts/verify-restore.sh
```

## Known limitations

- Embedding service is a deterministic stub
- Retrieval not full pgvector hybrid SQL
- Voice not real-provider verified
- Staff sessions not centrally revocable
- Playwright/k6 not exhaustive

## External blockers

1. Gemini API credentials + Live smoke
2. Staging DNS/TLS infrastructure access
3. Encrypted offsite backup target + scheduled restore drill sign-off

## Security findings

- Fixed: public seed in prod, memory in prod Docker defaults, unsigned guest cookies
- Open: multi-replica rate limits, incomplete RLS table coverage, voice WS auth if enabled

## Operational readiness

Runbooks present. Pilot with voice off recommended.

## Migrations added

- `0002_production_foundations.sql`
- `0003_rls_transitions.sql`

## Environment variables added/changed

`ALLOW_MEMORY_STORE`, `ALLOW_DEMO_SEED`, `VOICE_ENABLED`, stricter `SESSION_SECRET`, production Docker defaults.

## Exact rollback

1. Redeploy previous API/web/worker images
2. Restore Postgres from last known-good dump
3. Confirm `/ready` and guest QR smoke
4. Keep `VOICE_ENABLED=false`

## Recommended next phase

F6.7 real Gemini Live verification + pgvector hybrid query path + staging E2E/restore evidence → target **CONDITIONAL PRODUCTION READY**.
