# Observability

## Logs

Fastify request logs with correlation id. Redact secrets/tokens. Prefer IDs: `request_id`, `tenant_id`, `property_id`, `guest_session_id`, `service_request_id`, `job_id`.

## Metrics (`GET /metrics`)

Process counters: requests, errors, QR attempts, tickets created. Prometheus scrape configured in compose.

## Health

| Endpoint | Meaning |
|----------|---------|
| `/health` | Liveness |
| `/ready` | Postgres reachability (degraded 503 if down) |

## Pilot alerts (guidance)

- API error rate > 5% for 5m
- `/ready` failing 2m
- Queue failed jobs / DLQ growth
- Invalid QR rate spike
- Ticket create failures
- Retrieval no-answer rate sustained > 40% (content gap, not outage)

## Load assumptions (k6 pilot)

See `infra/load/k6-pilot.js`: 20 VUs / 1m; thresholds p95 < 800ms on health endpoints. Expand to chat/ticket paths before go-live.
