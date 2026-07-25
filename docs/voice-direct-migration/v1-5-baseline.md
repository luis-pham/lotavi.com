# V1.5.0 — Baseline (2026-07-26)

## Git

| Item | Value |
|------|--------|
| Commit (origin/main tip when baseline started) | `9f95914616bf481b3612c5f9c06731026a097e49` |
| Working tree | Dirty — V0/V1 voice changes uncommitted |
| GEMINI_API_KEY in environment | **unset** |
| Local Docker | **none** |
| HTTPS staging | **unavailable** |

## Commands run

```bash
pnpm exec vitest run apps/api/src/voice-contract.test.ts \
  packages/infrastructure/src/voice packages/contracts/src/config.test.ts \
  packages/contracts/src/voice-events.test.ts
# → 18/18 PASS

pnpm --filter @lotiva/web typecheck   # PASS
pnpm --filter @lotiva/api typecheck   # PASS
```

## Current direct-mode implementation

- Mint: `POST /api/v1/voice/direct/ephemeral` (REST `v1alpha/auth_tokens`)
- Browser spike: `VoiceDirectSpike.tsx` (ScriptProcessor PCM → WS; basic playback)
- Persistence: `voice_sessions` + ownership (V0)
- Defaults: `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false`
- Staging/production: previously **forbidden** for `DIRECT_GEMINI_ENABLED`

## Unverified assumptions (entering V1.5)

- Exact Live setup JSON + transcription fields for current Gemini models
- Token-in-query-param vs Authorization header behavior
- Real mic → Gemini → playback on Safari/Chrome
- Green Ruby / Starlink network

## External infrastructure

| Resource | Available |
|----------|-----------|
| Gemini credentials | No |
| HTTPS staging host | No |
| Desktop/Android/iPhone devices for this agent | No |
| Green Ruby Wi-Fi | No |
| Local Docker | No |

## Failures found at baseline

- None in focused unit/typecheck suite (18/18 then expanded after V1.5 edits)
- Direct mode previously hard-forbidden in staging (relaxed only under explicit ack gate in V1.5.1)

## Unverified assumptions carried into implementation

See `v1-5-provider-verification.md`. Runtime provider behavior remains unproven without credentials.
