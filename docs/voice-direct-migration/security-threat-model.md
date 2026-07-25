# A10 — Security threat model (voice)

> **Canonical security boundary:** [docs/voice/security-boundary.md](../voice/security-boundary.md)  
> **Architecture ADR:** [docs/architecture/adr/ADR-direct-gemini-live-browser.md](../architecture/adr/ADR-direct-gemini-live-browser.md)

Legend: **Current** = as implemented · **Direct risk** = browser↔Gemini media · **Mitigation** = required before enablement

| Threat | Current protection | Direct-mode risk | Mitigation | Verification |
|--------|-------------------|------------------|------------|--------------|
| Gemini API key in browser | Key server-only | High if long-lived key shipped | Ephemeral mint only; never `NEXT_PUBLIC` key | Bundle secret scan |
| Ephemeral token theft | Short TTL + uses=1 intent | High | Bind guest + property; no persist; no logs | Provider smoke |
| Token replay | uses=1 intent | High | Prove provider reject on reuse | Provider smoke |
| Repeated mint abuse | Rate limit on mint | Medium | Keep limits + concurrency | Unit/integration |
| Guest session theft | Signed cookie + `requireActiveGuest` | High | Revalidate QR/expiry on mint/heartbeat | Security tests |
| Revoked QR | Checked on active guest paths including mint | High | Keep revalidation | Revoke mid-session test |
| Client-supplied tenant/property | Ignored; cookie + DB SoT | Critical if trusted | Never trust browser scope | Mint ignores body IDs |
| Client-modified model/tools/instructions | Server-locked on mint | Critical | Ignore client fields | Contract tests |
| Client-forged tool calls | **No voice tools implemented** | Critical when added | Server execute + allowlist | Future V2 |
| Duplicate tickets from voice | **Not implemented** | High when added | Confirmation + idempotency | Future V2 |
| Transcript tampering | Diagnostic only; not billing | Medium | Non-authoritative telemetry | Policy |
| Fake usage events | Not billing SoT | High for billing | Provider reconciliation **not started** | Future |
| Stale / abandoned sessions | Heartbeat + abandon cleanup | Medium | TTL 90s default | Unit tests |
| Cross-guest voice session access | `assertOwnedByGuest` | Critical | Keep ownership on all voice routes | Unit tests |
| CSP `connect-src` | Env-gated Gemini origins when direct CSP enabled | Medium | No wildcards | Staging check |
| Bundle secret leakage | No key in frontend env | High | CI scan | `scan-frontend-secrets.mjs` |

## Explicit current statements

- Long-lived Gemini keys remain server-side.  
- Ephemeral credentials are never persisted.  
- Browser telemetry is not billing-authoritative.  
- Write tools / RAG tools for voice are not implemented.  
- Production direct mode remains forbidden.  
- Voice defaults: `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false`.

## Historical note

Earlier audit drafts claimed voice WS accepted any `sessionId` without ownership. **V0 implemented ownership checks** on the relay WS and related routes. Treat those older sentences as obsolete if found elsewhere; this file is the migration-folder threat model and defers to `docs/voice/security-boundary.md`.
