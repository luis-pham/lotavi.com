# V1.5 — Final verification report

**Date:** 2026-07-26  
**Git tip at start:** `9f95914616bf481b3612c5f9c06731026a097e49` (working tree dirty with V0/V1/V1.5 changes)

## FINAL V1.5 CLASSIFICATION

**BLOCKED**

Real Gemini provider smoke, HTTPS staging, and required device matrix could not be executed in this environment. Implementation and unit/config security gates are in place; they are **not** a substitute for PASS.

---

## Release impact

| Surface | Impact |
|---------|--------|
| production | Direct mode remains forbidden; voice defaults off |
| staging | May enable direct only with full safety gate + ack |
| development | Direct spike with explicit flags |
| voice tools | None (write/RAG forced false) |
| text chat | Unchanged; used as fallback UX |

## Phase results

| Phase | Result |
|-------|--------|
| V1.5.0 Baseline | DONE |
| V1.5.1 Staging enablement | IMPLEMENTED + unit-tested |
| V1.5.2 Ephemeral hardening | IMPLEMENTED |
| V1.5.3 Provider verification | DOCUMENTED from official API; runtime BLOCKED |
| V1.5.4 Audio capture | IMPLEMENTED; real mic BLOCKED |
| V1.5.5 Audio playback | IMPLEMENTED; real playback BLOCKED |
| V1.5.6 Transcription UI | IMPLEMENTED (diagnostic panel); provider BLOCKED |
| V1.5.7 Interruption | IMPLEMENTED (provider-native + client clear); runtime BLOCKED |
| V1.5.8 Session lifecycle | IMPLEMENTED |
| V1.5.9 Heartbeat/cleanup | IMPLEMENTED + unit-tested |
| V1.5.10 Error → text fallback | IMPLEMENTED |
| V1.5.11 CSP | IMPLEMENTED (env-gated Gemini connect-src) |
| V1.5.12 Spike isolation | IMPLEMENTED |
| V1.5.13 Provider smoke | **BLOCKED** |
| V1.5.14 Device matrix | **NOT STARTED / BLOCKED** |
| V1.5.15 Green Ruby | **BLOCKED** |
| V1.5.16 Security tests | IMPLEMENTED (unit/config); runtime mint BLOCKED |
| V1.5.17 Automation | Unit + Playwright guard; format/lint/build as available |
| V1.5.18 Observability | IMPLEMENTED |
| V1.5.19 Documentation | DONE |

## Provider verification

| Item | Value |
|------|-------|
| API version | v1alpha (constrained) |
| Model | `gemini-2.5-flash-preview-native-audio-dialog` (configurable) |
| Token behavior | uses=1, short new-session expiry — **not runtime proven** |
| WebSocket result | BLOCKED |
| Transcription result | BLOCKED |
| Interruption result | BLOCKED |

## Real-device results

Desktop Chrome / Android Chrome / iPhone Safari: **NOT STARTED**

## Green Ruby network result

**BLOCKED**

## Security evidence

See `v1-5-security-evidence.md`. Production direct forbid + staging ack + no tools + ownership + no-store mint: **implemented / unit-tested**.

## Session lifecycle evidence

Memory + schema migration `0008_voice_heartbeat.sql`; abandon releases cap (unit-tested).

## Latency measurements

Instrumentation present; **no real samples**.

## Errors encountered

- No `GEMINI_API_KEY`
- No local Docker / HTTPS staging
- Official ephemeral-tokens page fetch timed out once (Live API reference retrieved)

## Implemented changes (summary)

- Staging safety gate + env vars
- Hardened mint response + lifecycle/heartbeat routes
- Voice metrics
- Hardened `VoiceDirectSpike` (worklet, playback queue, transcripts, barge-in clear, fallback)
- CSP Gemini allowlist when direct CSP flag/env set
- Staging compose `NODE_ENV=staging` + voice defaults off
- Docs under `docs/voice-direct-migration/v1-5-*.md`

## Environment variables added/changed

| Variable | Role |
|----------|------|
| `DIRECT_GEMINI_STAGING_ACKNOWLEDGED` | Staging operator ack |
| `VOICE_HEARTBEAT_TTL_SECONDS` | Abandon TTL (default 90) |
| `VOICE_WRITE_TOOLS_ENABLED` / `VOICE_RAG_TOOLS_ENABLED` | Must stay false |
| `PUBLIC_WEB_URL` / `PUBLIC_API_URL` | Staging HTTPS checks |
| `NEXT_PUBLIC_DIRECT_GEMINI_CSP` | Optional web CSP Gemini connect-src |

## Tests added

- Config staging/production negative tests
- Ephemeral URL helper tests
- Heartbeat/abandon tests
- Playwright voice UI guard (mocked)

## Commands executed

```bash
pnpm exec vitest run apps/api/src/voice-contract.test.ts \
  packages/infrastructure/src/voice packages/contracts/src/config.test.ts \
  packages/contracts/src/voice-events.test.ts
# packages build + api/web typecheck
```

## External blockers

1. Gemini API credentials  
2. Deployed HTTPS staging with DNS/TLS  
3. Desktop / Android / iPhone test devices  
4. Green Ruby guest network  
5. Local Docker (for full compose proof)

## Known limitations

- Browser must place ephemeral token in WS URL query (provider constraint)
- Lifecycle browser acks are diagnostic, not billing SoT
- Real interruption PASS requires provider audio generation evidence

## Rollback

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

## Recommended next phase

Do **not** start V2 RAG/tools until at least **CONDITIONAL PASS** with real provider audio.

When unblocked: complete smoke + Chrome/Android/iPhone matrix → then V2.1 transcript ingestion onward.
