# Lotavi (lotavi.com)

Guest Portal QR + AI text (and future voice) for hotels / resorts / cruises.

- **Voice (canonical):** [`docs/voice/README.md`](./docs/voice/README.md) — voice is **disabled**; no production rollout
- Product docs (historical package name retained): [`lotiva-production-ready-docs/`](./lotiva-production-ready-docs/)
- Production readiness: [`docs/production-readiness/`](./docs/production-readiness/)
- Text/pilot status: [`docs/production-readiness/final-verification-report.md`](./docs/production-readiness/final-verification-report.md)

## Stack

- `apps/web` — Next.js (Guest / Staff / Admin)
- `apps/api` — Fastify REST + voice control-plane routes (WS ownership gate; not a working Gemini media relay) + staff SSE
- `apps/worker` — BullMQ (memory only with explicit `ALLOW_MEMORY_STORE`)
- `apps/embedding-service` — FastAPI embedding stub (swap EmbeddingGemma later)
- `packages/*` — domain, application, infrastructure, contracts, design system
- `infra/compose` — Caddy, Postgres/pgvector, Redis, Prometheus

## Local (memory)

```bash
pnpm install
cp .env.example .env
# LOTIVA_STORE=memory requires ALLOW_MEMORY_STORE=true
pnpm build:packages
pnpm --filter @lotiva/api dev
pnpm --filter @lotiva/web dev
```

Public `GET /api/v1/meta/seed` only when `ALLOW_DEMO_SEED=true` in development.

## Local (Postgres — recommended)

```bash
export DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva
export LOTIVA_STORE=postgres
export ALLOW_MEMORY_STORE=false
export ALLOW_DEMO_SEED=true   # local only
export SESSION_SECRET=dev-only-change-me-to-a-long-random-secret
export VOICE_ENABLED=false
pnpm db:migrate && pnpm db:seed
pnpm --filter @lotiva/api dev
```

RLS tests:

```bash
RUN_PG_TESTS=1 LOTIVA_STORE=postgres DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm test
```

Local demo accounts are seeded only for development. **Never enable `ALLOW_DEMO_SEED` or default passwords in staging/production.**

## Production rules

- `NODE_ENV=production|staging` + `LOTIVA_STORE=memory` → process refuses to start
- `ALLOW_DEMO_SEED` forbidden in staging/production
- Keep `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false` until gates in [`docs/voice/production-gates.md`](./docs/voice/production-gates.md) pass
- `VOICE_ENABLED=true` requires `GEMINI_API_KEY` in staging/production; production **rejects** `DIRECT_GEMINI_ENABLED=true`
- Lotavi is not a working Gemini audio media relay; see [`docs/voice/architecture.md`](./docs/voice/architecture.md)

## Compose

```bash
cd infra/compose && docker compose up --build
```

Hosts: `lotiva.vn`, `app.lotiva.vn`, `api.lotiva.vn`.
