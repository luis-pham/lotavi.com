# Architecture (as implemented)

Modular monolith:

```text
apps/web          Next.js guest / staff / admin UI
apps/api          Fastify REST + voice WebSocket + staff SSE
apps/worker       BullMQ jobs (Redis); memory hello-loop only when ALLOW_MEMORY_STORE
apps/embedding-service  FastAPI stub vectors (deterministic) — swap EmbeddingGemma later
packages/*        domain, application, infrastructure, contracts, UI
infra/compose     Caddy, Postgres(pgvector), Redis, Prometheus
```

## Persistence

- Production/staging: `LOTIVA_STORE=postgres` required.
- Memory store: isolated tests / local with `ALLOW_MEMORY_STORE=true`.
- Tenant context via `SET LOCAL app.tenant_id` in transactions (`withTenant`).

## Realtime

- Staff: SSE `/api/v1/staff/events`.
- Publish via Redis channel `lotiva:staff:tickets` when Redis connects; in-process fallback for single-node/dev.

## Voice

- Feature flag `VOICE_ENABLED` (default false).
- Production refuses voice without `GEMINI_API_KEY`.
- Gemini Live adapter is provider-shaped but not a verified Live streaming integration.
