# A12 — Observability audit

> **Historical audit snapshot.** Post-V1.5 diagnostic counters exist (not billing-authoritative).  
> Canonical classes: [docs/voice/architecture.md](../voice/architecture.md) · [v1-5-observability.md](./v1-5-observability.md).

## Voice-specific metrics/logs today (audit-time; supersede with v1-5-observability)

| Signal | Present? | Direct-mode classification |
|--------|----------|----------------------------|
| Voice session starts | Implicit via API access logs only | Requires explicit counter |
| Active sessions | In-memory Map size (not exported) | Server lease table |
| Audio ingress/egress | No | Browser telemetry (untrusted) / lost if no upload |
| Gemini connect latency | No | Provider or browser |
| First audio latency | No | Browser telemetry |
| Transcript latency | No | Browser + server tool timing |
| Tool / RAG latency | No (not wired) | Server |
| Interruption | No | Browser |
| Reconnect | No | Both |
| Provider errors | Minimal | Provider + server mint errors |
| Session duration | No | Heartbeat |
| Usage/cost | No | Provider reconciliation — **must not trust client for billing** |
| Ticket outcome | Via text ticket metrics, not voice | Server confirm path |

## Dashboards / alerts

No voice-specific Prometheus rules found beyond generic API (`apps/api` observability plugin).  
Staging compose includes Prometheus scrape config — **not voice-aware**.

## Changes required before pilot voice

- Counters: `voice_session_start`, `voice_session_end`, `voice_mint_denied`, `voice_ws_auth_fail`
- Histograms: mint latency, tool latency, RAG latency
- Alerts: elevated mint denials, session lease exhaustion, provider errors
- Correlation: `guest_session_id`, `voice_session_id`, `tenant_id`, `property_id` (never raw tokens)
