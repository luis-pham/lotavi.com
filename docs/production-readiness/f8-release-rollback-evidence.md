# F8.11 — Release and Rollback Drill

## Result

```text
CONDITIONAL PASS
```

Unresolved condition: runbook and backup-first process documented; full staging container release + intentional rollback not executed (no Docker/DNS).

## Documented procedure

1. Immutable release id (`RELEASE_VERSION` / image digest)
2. Build containers
3. Pre-deploy backup
4. Validate migrations
5. Deploy
6. `/ready` + smoke + E2E smoke
7. Observe metrics
8. Roll back application image
9. Verify data intact + guest/staff smoke

## Independent disable switches

| Capability | Switch |
|------------|--------|
| Chat generation | feature/config kill-switch / scale API |
| Embedding ingestion | stop embedding-service / worker jobs |
| Realtime | stop Redis pubsub / SSE clients |
| Worker jobs | scale worker to 0 |
| Voice | `VOICE_ENABLED=false` (default; must remain) |

## Exact rollback commands (when Docker available)

```bash
./scripts/backup-postgres.sh
docker compose -f infra/compose/docker-compose.staging.yml up -d api@<previous-digest>
curl -sS https://api.staging.lotiva.vn/ready
```
