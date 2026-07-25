# Lotavi voice — current status

**Last reconciled:** 2026-07-26  
**Canonical entry:** [README.md](./README.md)

## Product summary

- **Text experience:** PILOT READY  
- **Voice:** disabled by default  
- **Production voice rollout:** not allowed  
- **Real Gemini provider smoke:** not executed  
- **Desktop Chrome / Android Chrome / iPhone Safari voice tests:** not executed  
- **Green Ruby network verification:** blocked  
- **Voice RAG tools:** not implemented  
- **Voice write tools / voice-triggered tickets:** not implemented  

## Safe defaults

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

Development/staging may enable direct mode only through explicit, fail-fast flags documented in [production-gates.md](./production-gates.md). Production must reject `DIRECT_GEMINI_ENABLED=true`.

## Canonical status table

| Capability | Classification |
|------------|----------------|
| Voice safety foundation | **PASS** |
| Voice session persistence | **PASS** |
| WS ownership validation | **PASS** |
| Ephemeral mint implementation | **CONDITIONAL PASS** |
| Browser audio implementation | **CONDITIONAL PASS** |
| Real Gemini provider smoke | **BLOCKED** |
| Desktop Chrome | **NOT STARTED** |
| Android Chrome | **NOT STARTED** |
| iPhone Safari | **NOT STARTED** |
| Green Ruby Wi-Fi | **BLOCKED** |
| Voice RAG | **NOT STARTED** |
| Voice write tools | **NOT STARTED** |
| Voice ticket creation | **NOT STARTED** |
| Voice usage reconciliation | **NOT STARTED** |
| Production voice enablement | **BLOCKED** |

### How to read classifications

- **PASS** — implemented and covered by automated/safety evidence appropriate to that layer (not a claim of production readiness).  
- **CONDITIONAL PASS** — code path exists; real provider/device proof incomplete.  
- **BLOCKED** — cannot proceed without external credentials, staging HTTPS, devices, or vessel network.  
- **NOT STARTED** — not implemented or not executed.

## Current implemented behavior

- Voice safety foundation (guest auth, ownership, concurrency/rate limits, defaults off).  
- Persisted `voice_sessions` with ownership checks.  
- Authenticated relay WebSocket gate (not a working media relay to Gemini).  
- Direct Gemini ephemeral-token minting code path (server-side key).  
- Development/staging browser capability spike (`VoiceDirectSpike`) behind flags.  
- Heartbeat / abandoned-session cleanup code.  
- Staging-only safety acknowledgement gate for direct mode.  
- Diagnostic voice metrics (not billing-authoritative).  

## Current verified behavior

- Unit/config/security tests for ownership, config gates, and related helpers.  
- Frontend bundle secret scan performed in V1.5 workstream (no long-lived key in built assets for that build).  
- **Not verified:** real Gemini Live connect, mic→model→playback, transcripts, barge-in on devices, Green Ruby network.

## Planned target behavior

See [architecture.md](./architecture.md) and the [ADR](../architecture/adr/ADR-direct-gemini-live-browser.md):

- Realtime **media** browser ↔ Gemini Live (ephemeral credential).  
- Lotavi **control plane** for auth, mint, quota, RAG tools, confirmed actions, persistence, audit, telemetry.  
- Text remains server-mediated with RAG.  

## Explicitly not implemented

- Working server media relay to Gemini  
- Voice RAG tools  
- Voice write tools / ticket creation from voice  
- BYOK / per-tenant Gemini keys  
- Billing-quality voice usage reconciliation  
- Production session resumption as a supported product feature  
- Raw audio recording (kept off by default)  
- Production transcript retention commitment  

## Related evidence

- [V1.5 final report](../voice-direct-migration/v1-5-final-verification-report.md) — classification **BLOCKED**  
- [V1.5 provider smoke](../voice-direct-migration/v1-5-provider-smoke.md)  
- [V1.5 device matrix](../voice-direct-migration/v1-5-device-matrix.md)  
- [Green Ruby network](../voice-direct-migration/v1-5-green-ruby-network.md)  
