# V1.5.13 — Real provider smoke test

## Status: BLOCKED

**Reason:** `GEMINI_API_KEY` unset; no HTTPS staging deployment accessible from this agent environment; Docker unavailable locally for full stack proof.

## Required proof checklist

| # | Proof | Result |
|---|-------|--------|
| 1 | Backend mints real ephemeral credential | BLOCKED |
| 2 | Browser connects to real Gemini Live | BLOCKED |
| 3 | Long-lived API key absent from browser | implemented (code) / not runtime-verified |
| 4 | Microphone audio reaches Gemini | BLOCKED |
| 5 | Gemini returns audio | BLOCKED |
| 6 | Browser plays audio | BLOCKED |
| 7 | Input transcript | BLOCKED |
| 8 | Output transcript | BLOCKED |
| 9 | Session stops cleanly | BLOCKED |
| 10 | Second session after cleanup | BLOCKED |
| 11 | Expired token fails safely | BLOCKED |
| 12 | Token reuse behavior | BLOCKED |
| 13 | Quota failure maps safely | BLOCKED |
| 14 | Session record final state | BLOCKED |

## Operator runbook (when credentials exist)

1. Enable staging gates per `v1-5-staging-enablement.md`
2. Authenticate guest via QR on HTTPS staging
3. Start experimental voice → grant mic → speak short phrase
4. Capture sanitized metrics (no tokens) into this file
5. Verify DB `voice_sessions.status` terminal
6. Run `node scripts/scan-frontend-secrets.mjs apps/web/.next`
