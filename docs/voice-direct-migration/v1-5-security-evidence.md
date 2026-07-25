# V1.5.16 — Security evidence

## Implemented controls

| Control | Evidence |
|---------|----------|
| Inactive/expired/revoked guest cannot mint | `requireActiveGuest` (QR active + expiry) |
| Property outside allowlist cannot mint | `propertyAllowlisted` before mint |
| Guest A cannot use session B | `assertOwnedByGuest` |
| Browser tenant/property/model/tools ignored | Mint handler voids client fields; cookie SoT |
| Token no-store | `Cache-Control: no-store`, `Pragma: no-cache` |
| Token not logged / not in errors | Mint catch returns generic message |
| Token not persisted | No DB column for token |
| Production cannot enable direct | Config fail-fast |
| Staging requires acknowledgement | `DIRECT_GEMINI_STAGING_ACKNOWLEDGED` |
| Write/RAG tools forced off | Config rejects enabled flags |
| Mint rate limit | `voice-mint:` rate limit key |
| Concurrent cap | `VOICE_MAX_CONCURRENT_PER_PROPERTY` |
| Heartbeat ownership | `heartbeat(id, tenant, guest)` |
| Stale cleanup releases cap | `abandonStale` unit test |
| CSP Gemini only when direct allowed | `apps/web/next.config.ts` — no wildcard host |
| Long-lived key absent from frontend | Server-only `GEMINI_API_KEY`; scan script |

## Unit / config tests

- `packages/contracts/src/config.test.ts` — prod forbid, staging gates, tools forbid
- `packages/infrastructure/src/voice/voice-session-safety.test.ts`
- `packages/infrastructure/src/voice/voice-heartbeat.test.ts`
- `packages/infrastructure/src/voice/ephemeral-token.test.ts`

## Not executed here

| Item | Status |
|------|--------|
| Real mint against Gemini | BLOCKED (no key) |
| Bundle secret scan on production build | run when `.next` exists |
| Manual Network/Console token leak review on staging | BLOCKED (no staging) |
