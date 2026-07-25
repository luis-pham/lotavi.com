# Observability closure (F7.12)

## Metrics (`/metrics`)

requests, errors, QR invalid, tickets created (+ ready/health)

## Alerts (pilot)

- readiness failure
- API error rate
- embedding `/ready` down
- queue DLQ growth
- backup/restore drill failure
- repeated invalid tokens
- high retrieval fallback rate

## Correlation

`x-correlation-id` on responses; domain IDs in structured logs when logger enabled. Raw tokens redacted.
