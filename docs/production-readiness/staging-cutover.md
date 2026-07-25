# Staging cutover

## Target topology

Caddy (TLS) → web + api; worker; embedding-service; Postgres+pgvector; Redis; Prometheus; object storage (optional).

## Hosts

- `staging.lotiva.vn` / `api.staging.lotiva.vn` (or agreed staging hosts)

## Checklist

1. Provision secrets (`SESSION_SECRET`, DB, Redis) — not demo defaults
2. `LOTIVA_STORE=postgres` `ALLOW_DEMO_SEED=false` `VOICE_ENABLED=false`
3. Persistent volumes + migrate
4. Health/ready green
5. Seed **Green Ruby** via CLI only (not public GET)
6. Run Postgres E2E (`RUN_E2E=1`)
7. Backup + restore drill
8. DNS + TLS validation
9. Rollback: previous container image + DB restore point

## External blocker

Actual DNS/TLS/cloud access is required to mark staging complete. Manifests/compose are prepared under `infra/compose`.
