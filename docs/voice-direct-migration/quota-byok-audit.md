# A11 — Quota, cost, BYOK audit

## Current accounting

| Mechanism | Present for voice? |
|-----------|-------------------|
| Bytes relayed | No |
| WS duration | No |
| Gemini usage metadata | No |
| Transcript duration | No |
| Session count limits | No |
| Tenant API key | No — single `GEMINI_API_KEY` |
| Lotavi platform key | Env only |
| Manual kill switch | `VOICE_ENABLED=false` |

## Direct-mode questions

| Question | Verified answer |
|----------|-----------------|
| Enforce session creation caps? | **Not today**; feasible via mint API + Redis/PG counters |
| Concurrent-session caps? | **Not today**; feasible via leases |
| Terminate already-connected direct session? | **Unknown** — needs provider capability verification |
| Abandoned session detection? | **None**; needs heartbeat TTL |
| Reconcile provider usage? | **No pipeline**; must not trust client-only metrics for billing |
| BYOK implemented? | **No** |
| Mint ephemeral with tenant key without exposing key? | **Not implemented**; **provider support unverified** |
| Invalid/exhausted tenant key? | N/A; today global key missing → connect error in prod-like |

## Recommendation

Do not enable billing-critical voice until:

1. Server session records exist  
2. Mint + heartbeat enforce caps  
3. Provider usage export or server-side observation exists  
4. BYOK design documented if required for multi-tenant
