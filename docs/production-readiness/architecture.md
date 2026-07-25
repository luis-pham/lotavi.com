# Architecture (as implemented)

Modular monolith:

```text
apps/web          Next.js guest / staff / admin UI
apps/api          Fastify REST + voice control plane (not a Gemini media relay) + staff SSE
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

> Canonical docs: [`docs/voice/README.md`](../voice/README.md), ADR [`ADR-direct-gemini-live-browser`](../architecture/adr/ADR-direct-gemini-live-browser.md).

- Defaults: `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false`.
- Production refuses voice without `GEMINI_API_KEY` if voice is enabled; production **forbids** direct Gemini mode.
- Target: browser ↔ Gemini Live media; Lotavi control plane for auth/mint/quota/sessions.
- `GeminiLiveAdapter` is **not** a working media relay. Direct spike exists; provider/device verification **BLOCKED**.
- No voice RAG, write tools, or voice-triggered tickets.
