# F8.10 — Observability Evidence

## Result

```text
CONDITIONAL PASS
```

Unresolved condition: metrics/correlation hooks and Prometheus scrape config exist; staging dashboards + triggered alert firings not executed (no staging Prometheus target).

## Present in repo

- API observability plugin (metrics counters, correlation ids)
- `infra/compose/prometheus.yml` (staging compose)
- Documented alert intents from F7 observability closure

## Required but not proven on staging

Dashboards/queries for API/DB/Redis/queue/embedding/retrieval/ticket/SSE/password-reset abuse.

Triggered alerts:

- readiness failure
- embedding unavailable
- Redis unavailable
- high API error rate
- backup failure simulation
- excessive invalid-token attempts

## Correlation IDs expected

`request_id`, `trace_id`, `tenant_id`, `property_id`, `guest_session_id`, `conversation_id`, `ticket_id`, `job_id`

Never log raw QR tokens or secrets.
