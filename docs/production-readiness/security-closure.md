# Security closure (F7.11)

| Finding | Status |
|---------|--------|
| Memory/demo seed in prod | Closed (config fail-fast) |
| Unsigned guest cookies | Closed |
| Knowledge as prompt injection vector | Mitigated: extractive answers; context marked untrusted |
| Password reset missing | Closed (token workflow) |
| SSE cross-property leak | Mitigated: property filter + outbox |
| Multi-replica rate limit | Residual (in-process limiter) |
| Full RLS table coverage | Residual (expanded for outbox) |
| Dependency audit automation | Residual (manual/`pnpm audit` recommended in CI next) |

No compliance certification claimed.
