# Lotavi voice — security boundary

**Canonical status:** [current-status.md](./current-status.md)  
**ADR:** [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md)

## Non-negotiable invariants

- Long-lived Gemini API keys remain **server-side only**.  
- Ephemeral credentials are **never persisted** in PostgreSQL.  
- Ephemeral credentials are **not** logged or returned in error payloads.  
- The browser is **untrusted**: client-supplied tenant/property/model/tools/system instruction are ignored for authoritative decisions.  
- Browser telemetry is **not** billing-authoritative.  
- Write tools for voice are **not currently implemented**.  
- Voice RAG tools are **not currently implemented**.  
- Production direct mode remains **forbidden** until gates in [production-gates.md](./production-gates.md) pass.  
- Voice defaults remain off:

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

## Threat model (voice / direct media)

| Threat | Status of control | Notes |
|--------|-------------------|-------|
| Ephemeral token theft | Mitigated (short TTL, uses=1 intent) | Runtime reuse/expiry behavior not yet provider-proven |
| Token replay | Mitigated by design intent | Must be verified in provider smoke |
| Repeated mint abuse | Rate limit on mint | Keep limits on in staging |
| Client-modified configuration | Server locks model/modalities/tools | Client body fields ignored |
| Client-forged tool calls | N/A today (no voice tools) | Planned: server executes tools only |
| Client-supplied tenant/property | Rejected; cookie + DB session SoT | Never trust browser scope |
| Transcript tampering | Telemetry only today | Not billing / not ticket evidence |
| Fake usage events | Not billing SoT | Provider reconciliation **not started** |
| Duplicate tool execution | N/A today | Planned: idempotency keys |
| Duplicate ticket creation | N/A for voice today | Text path has confirmation/idempotency |
| Stale / abandoned sessions | Heartbeat + abandon cleanup | Implemented; vessel network unproven |
| CSP `connect-src` | Env-gated Gemini origins; no wildcards | Staging/dev only when direct CSP enabled |
| Browser bundle secret leakage | Key must never be `NEXT_PUBLIC_*` | Scan script exists; keep in CI |
| QR / session revocation | `requireActiveGuest` checks QR active + expiry | Must remain on every mint |
| Cross-tenant / cross-guest voice-session access | `assertOwnedByGuest` | Covered by unit tests |

## Credential handling

| Credential | Where | Persist? | Browser? |
|------------|-------|----------|----------|
| `GEMINI_API_KEY` | API server env | Secret store only | **Never** |
| Ephemeral Live token | Mint response → browser memory | **Never** in DB | Short-lived only |
| Guest session cookie | Signed cookie | Session row in Postgres | Yes (session id, not Gemini key) |

## Tool / RAG / confirmation boundary (planned)

When voice tools are eventually added:

1. Gemini may **propose** function calls.  
2. Lotavi validates guest, property, allowlist, and policy.  
3. Read tools (RAG) return grounded snippets only.  
4. Write tools require **explicit guest confirmation**.  
5. PostgreSQL remains SoT for tickets; Gemini cannot persist tickets directly.

**Today:** none of the voice tool path is implemented.

## Related docs

- [../voice-direct-migration/security-threat-model.md](../voice-direct-migration/security-threat-model.md)  
- [../production-readiness/security-threat-model.md](../production-readiness/security-threat-model.md)  
