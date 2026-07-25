# A15 — Target architecture

> **Promoted to canonical docs.**  
> Source of truth: [docs/voice/architecture.md](../voice/architecture.md), [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md).  
> Status: [docs/voice/current-status.md](../voice/current-status.md).

ADR status: **Accepted for staged capability verification** (not production approved). Media path and control plane below match the accepted direction; provider/device verification remain blocked.

## Flows

### Text (unchanged)

```text
Browser → Lotavi API → sendGuestChat → hybrid retrieval → grounded answer → Postgres
```

### Voice media (candidate after verification)

```text
Browser ←ephemeral credential— Lotavi API
Browser ←realtime audio→ Gemini Live (direct)
Browser → Lotavi tool/heartbeat APIs → RAG / tickets / audit
```

### Fallback / interim

```text
Browser → Lotavi WS → (future) GeminiLiveAdapter relay
```

Retain relay **as optional** until direct proven; today neither media path is real.

## Components

| Component | Why | Reuses / replaces | Location |
|-----------|-----|-------------------|----------|
| Voice session mint API | Authz, quota, bind guest | Extends `routes/voice.ts` | API |
| `voice_sessions` persistence | SoT for leases/audit | Existing Drizzle table | Postgres |
| Ephemeral credential service | Avoid key in browser | New; inside infrastructure voice module | API |
| Browser audio + Live client | Capture/play/interrupt | **New** (nothing reusable) | Web |
| Allowlisted tool bridge | RAG read + confirmed writes | Reuse `chat` retrieval + ticket use-cases | API |
| Heartbeat / lease | Abandoned sessions | Redis or PG | API + Redis |
| Canonical events (subset) | UI state | `voice-events.ts` | contracts |
| Text fallback | Reliability | Existing chat UI | Web |
| Optional relay adapter | Rollback | `GeminiLiveAdapter` filled in | infrastructure |

## Invariants

- Browser never sends authoritative `tenantId` / `propertyId`
- Write tools require same confirmation semantics as HTTP Requests
- `VOICE_ENABLED=false` until smoke evidence
- Long-lived `GEMINI_API_KEY` never in web bundle
