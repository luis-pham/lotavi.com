# Configuration matrix

| Variable | Dev | Staging | Production | Notes |
|----------|-----|---------|------------|-------|
| `NODE_ENV` | development | staging | production | |
| `LOTIVA_STORE` | memory or postgres | postgres | postgres | memory forbidden in staging/prod |
| `ALLOW_MEMORY_STORE` | true if memory | false | false | Explicit opt-in |
| `ALLOW_DEMO_SEED` | true (local) | false | false | Public GET seed route |
| `DATABASE_URL` | required for postgres | required | required | |
| `REDIS_URL` | optional | required | required | Worker + SSE fanout |
| `SESSION_SECRET` | ≥32 recommended | ≥32 required | ≥32 required | Cookie signing |
| `VOICE_ENABLED` | false | false until verified | false until verified | |
| `GEMINI_API_KEY` | optional | required if voice | required if voice | Never log |
| `SEED_ADMIN_PASSWORD` | local only | unset | unset | Force unique secrets |
| `CORS_ORIGINS` | localhost | staging hosts | lotiva.vn hosts | Comma-separated |
| `EMBEDDING_SERVICE_URL` | local | internal | internal | |

## Fail-fast examples

```bash
NODE_ENV=production LOTIVA_STORE=memory
# → Invalid Lotiva configuration / process exit

NODE_ENV=production LOTIVA_STORE=postgres VOICE_ENABLED=true
# → requires GEMINI_API_KEY
```
