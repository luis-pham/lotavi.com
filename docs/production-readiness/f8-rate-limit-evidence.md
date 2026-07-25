# F8.9 — Multi-replica Rate Limiting

## Result

```text
CONDITIONAL PASS
```

Unresolved condition: Redis-backed limiter implemented and unit-tested with mock Redis; live multi-replica shared-limit proof requires Redis + ≥2 API replicas (Redis not installed on this host).

## Implemented

- `packages/infrastructure/src/redis-rate-limit.ts`
  - `RedisRateLimiter` (atomic INCRBY + EXPIRE)
  - `FailClosedRateLimiter` when Redis required but unavailable
  - `createRateLimiter()` factory
- Config: `REQUIRE_REDIS_RATE_LIMIT=true` mandatory in staging/production
- API wiring: `apps/api/src/app-context.ts`
- Applied routes:
  - QR scan
  - login
  - password-reset
  - chat
  - ticket confirm
  - SSE connect
- Staging compose sets `REQUIRE_REDIS_RATE_LIMIT=true`

## Tests executed

```text
packages/infrastructure/src/redis-rate-limit.test.ts — PASS (3)
packages/contracts/src/config.test.ts — production Redis requirement PASS
```

## Not executed

| Case | Status |
|------|--------|
| One replica live Redis | BLOCKED (no redis-server) |
| Two replicas share counter | BLOCKED |
| Redis outage fail-closed under load | Code path only |
| Proxy IP / trust proxy tuning | Not staging-verified |

## Safe Redis-down behavior

Production/staging with `REQUIRE_REDIS_RATE_LIMIT=true`: sensitive routes deny (`fail-closed`) rather than silently using process-local buckets.
