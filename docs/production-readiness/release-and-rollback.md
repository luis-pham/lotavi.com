# Release and rollback (F7.13)

## Deploy

```bash
./scripts/backup-postgres.sh ./backups
# build/push images
pnpm db:migrate
# deploy api/web/worker/embedding
curl -fsS https://api.staging.lotiva.vn/ready
RUN_E2E=1 ... # staging E2E
```

## Feature kill switches

```text
VOICE_ENABLED=false
# disable ingestion: stop worker / skip admin publish
# disable realtime: staff UI still polls tickets list
```

## Rollback

1. Redeploy previous images
2. Restore DB from pre-deploy dump if migration is incompatible
3. Prefer forward-fix migrations

## Kill chat generation

Serve fallback-only by setting embedding service down + accepting retrieval fallback (or feature flag in a future release).
