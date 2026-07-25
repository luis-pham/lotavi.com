# Voice reliability

## Status: BLOCKED for production enablement

- Canonical voice events: `packages/contracts/src/voice-events.ts`
- Adapter: `packages/infrastructure/src/voice/gemini-live-adapter.ts` (handshake placeholder)
- `VOICE_ENABLED=false` by default; production requires `GEMINI_API_KEY` if enabled
- Text chat remains available when voice is disabled

## Required before enabling in pilot

1. Real Gemini Live streaming smoke (audio in/out, interrupt, confirm tool)
2. Persist `voice_sessions` rows
3. Authenticate WebSocket with guest session ownership
4. Usage/cost telemetry and session duration limits
5. Capture non-secret latency evidence

Until then: keep voice off in staging/production.
