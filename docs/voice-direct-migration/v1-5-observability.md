# V1.5.18 — Observability

## Metrics (Prometheus text via `/metrics`)

Counters (bounded labels: `environment`, `provider`, `model`, `result`, `termination_reason`):

- `voice_session_created_total`
- `voice_token_mint_total` / `voice_token_mint_failed_total`
- `voice_connection_attempt_total` / `voice_connection_active_total` / `voice_connection_failed_total`
- `voice_session_ended_total` / `voice_session_abandoned_total`
- `voice_input_transcript_received_total` / `voice_output_transcript_received_total`
- `voice_interruption_total`
- `voice_text_fallback_total`
- `voice_heartbeat_total`

Gauge samples:

- `voice_first_audio_latency_ms_avg` (ring buffer ≤64 samples)

## Forbidden labels

guest token · transcript text · room number · session ID · tenant name · ephemeral token

## Status

- Implemented in `apps/api/src/lib/voice-metrics.ts`
- Staging verification of scrape: NOT STARTED
