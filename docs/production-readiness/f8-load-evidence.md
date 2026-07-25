# F8.7 — Business k6 Load Test

## Result

```text
BLOCKED
```

Unresolved condition: `k6` binary not installed; staging target unavailable. Health-only traffic is explicitly not accepted as evidence.

## Prepared scripts

- `infra/load/k6-pilot.js`
- `infra/load/k6-business.js`

## Assumptions (document before run)

| Assumption | Pilot default |
|------------|---------------|
| Properties | 1 |
| Concurrent guests | 25 |
| Concurrent staff | 5 |
| Voice | disabled |
| Knowledge size | seed corpus |

## Exact commands

```bash
brew install k6   # or equivalent
k6 run -e BASE_URL=https://api.staging.lotiva.vn infra/load/k6-business.js
# then 2× pilot + saturation
```

## SLO targets (unless repo defines stronger)

- guest portal p95 < 1.5s
- token validation p95 < 300ms
- retrieval p95 < 800ms
- ticket confirmation p95 < 700ms
- staff update p95 < 500ms
- business error rate < 1%
- duplicate ticket rate = 0
- cross-tenant leak = 0
