# Staging evidence (F7.8)

## Prepared

- `infra/compose/docker-compose.staging.yml`
- `infra/compose/Caddyfile.staging` (TLS hosts)
- Required env: `NODE_ENV=production`, `LOTIVA_STORE=postgres`, memory/demo/voice off

## DNS required

```text
staging.lotiva.vn       → staging LB/IP
api.staging.lotiva.vn   → staging LB/IP
```

## Status

**BLOCKED** — no DNS/TLS execution in this environment.
