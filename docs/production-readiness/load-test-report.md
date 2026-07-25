# Load test (F7.9)

Script: `infra/load/k6-business.js`

```bash
k6 run -e API_URL=http://127.0.0.1:4000 -e QR_TOKEN=<token> infra/load/k6-business.js
```

## Target SLOs (text-only)

- ready/chat p95 < 1.5s
- error rate < 1%
- duplicate ticket rate = 0
- cross-tenant leak = 0

## Status

Script ready; sustained load run not executed in this session → CONDITIONAL.
