# A16 — Incremental migration plan (do not implement in this audit)

## Feature-flag naming (fit existing conventions)

Existing: `VOICE_ENABLED`, `GEMINI_API_KEY` (env, uppercase, parse in `LotivaEnvSchema`).

Proposed additions (document only):

| Flag | Purpose |
|------|---------|
| `VOICE_TRANSPORT=relay\|direct\|off` | Media plane selector (`off` ≡ disabled) |
| `DIRECT_GEMINI_ENABLED` | Hard gate for direct mint |
| `DIRECT_GEMINI_PROPERTY_ALLOWLIST` | Pilot properties |
| `VOICE_TRANSCRIPT_ENABLED` | Persist/accept transcripts |
| `VOICE_AUDIO_RECORDING_ENABLED` | Default false |
| `VOICE_MAX_SESSION_SECONDS` | Server lease TTL |
| `VOICE_MAX_CONCURRENT_PER_PROPERTY` | Concurrency |
| `VOICE_TEXT_FALLBACK_ENABLED` | Default true |

## Phases

### Phase 0 — Safety baseline
- Scope: Fix WS guest ownership; persist `voice_sessions`; keep `VOICE_ENABLED=false`
- Files: `routes/voice.ts`, postgres repos, tests
- Exit: Unauthenticated WS rejected; row created on session start
- Rollback: flag off

### Phase 1 — Transport abstraction
- Scope: Expand `VoiceProviderPort` events; no browser Gemini yet
- Files: `ports.ts`, adapter, contracts
- Exit: Contract tests for canonical events without SDK leak

### Phase 2 — Server session / token API
- Scope: Mint endpoint returning short-lived credential **if provider supports**
- Dependency: external provider verification
- Exit: Token never logged; guest+property bound
- Rollback: disable mint route

### Phase 3 — Direct browser transport
- Scope: Mic, Live client, playback, interrupt behind allowlist
- Files: `GuestPortal` or `VoiceSession` component
- Exit: Audio in/out on allowlisted property in staging
- Rollback: `VOICE_TRANSPORT=relay` or `off`

### Phase 4 — Read-only RAG tool bridge
- Scope: Server tool `knowledge.search` using existing retrieval
- Exit: wrong-property=0; approved-only
- Rollback: disable tool in allowlist

### Phase 5 — Write tools + confirmation
- Scope: Map to prepare/confirm ticket use-cases + idempotency
- Exit: exactly one ticket; reconnect replay safe
- Rollback: read-only tools only

### Phase 6 — Transcript / usage telemetry
- Scope: Ordered events, dedupe, heartbeat expiry; provider usage reconcile
- Exit: dashboards; billing not based on client alone

### Phase 7 — Staging pilot
- Scope: Green Ruby device matrix
- Exit: evidence pack; incidents runbook

### Phase 8 — Relay retirement decision
- Scope: Compare relay vs direct metrics
- Exit: written decision; keep relay code until criteria met

## Global rollback

`VOICE_ENABLED=false` (already production default).
