# Lotavi voice — production enablement gates

**Status today:** Production voice enablement is **BLOCKED**.  
**Canonical status table:** [current-status.md](./current-status.md)

## Safe defaults (all environments until gates pass)

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

Do not expose secret values in documentation or client env.

## Development capability flags

Development may enable the direct spike with explicit local flags (example shape):

```text
NODE_ENV=development
VOICE_ENABLED=true
VOICE_TRANSPORT=direct
DIRECT_GEMINI_ENABLED=true
DIRECT_GEMINI_PROPERTY_ALLOWLIST=<property-id>
GEMINI_API_KEY=<server-only>
VOICE_WRITE_TOOLS_ENABLED=false
VOICE_RAG_TOOLS_ENABLED=false
```

This is a **capability spike**, not production readiness.

## Staging capability flags (fail-fast)

Staging direct mode is allowed only when **all** of the following are satisfied (config rejects incomplete sets):

```text
NODE_ENV=staging
VOICE_ENABLED=true
VOICE_TRANSPORT=direct
DIRECT_GEMINI_ENABLED=true
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=true
DIRECT_GEMINI_PROPERTY_ALLOWLIST=<non-empty>
GEMINI_API_KEY=<server-only>
PUBLIC_WEB_URL=https://…
PUBLIC_API_URL=https://…
VOICE_WRITE_TOOLS_ENABLED=false
VOICE_RAG_TOOLS_ENABLED=false
```

Property allowlist is required for staging tests.

## Production

- `DIRECT_GEMINI_ENABLED=true` must be **rejected** at startup.  
- Do not enable voice in production until verification gates below pass.  
- Text chat remains the supported guest channel.

## Verification gates (before any production consideration)

| Gate | Required result |
|------|-----------------|
| Real ephemeral mint against Gemini | Proven |
| Browser ↔ Gemini Live connect | Proven |
| Long-lived key absent from browser | Proven |
| Mic audio → Gemini → playback | Proven |
| Input + output transcription | Proven |
| Clean stop + resource release | Proven |
| Token expiry / reuse handled safely | Proven |
| Provider errors → text fallback | Proven |
| Security tests (ownership, allowlist, no tools, prod forbid) | Pass |
| Desktop Chrome | Pass |
| Android Chrome | Pass |
| iPhone Safari | Pass |
| No critical security issues | Pass |

Green Ruby Wi-Fi may remain BLOCKED for generic provider classification but remains a **pilot readiness** blocker for vessel deployment.

## Production enablement gates (additional)

Even after verification:

1. No voice RAG/write tools until V2 confirmation design ships.  
2. Billing-quality usage reconciliation if cost attribution is required.  
3. Explicit ops runbook + rollback to voice-off defaults.  
4. CSP and secret-scan green on production build artifacts.  
5. Product/security sign-off — **not** implied by this document.

## Rollback

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

## V2 gate

Do not begin voice RAG or write tools until voice verification reaches at least **CONDITIONAL PASS** with real provider audio and required security controls. See [README.md](./README.md).
