# Backup and restore

## Scripts

```bash
export DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva
./scripts/backup-postgres.sh ./backups
./scripts/restore-postgres.sh ./backups/lotiva-<stamp>.sql.gz
./scripts/verify-restore.sh
```

## Policy (pilot)

- Daily `pg_dump` gzip; retain 14 days.
- Encrypt at rest via volume/disk encryption or encrypted object storage upload (operator-owned).
- Redis: ephemeral; rebuild queues after loss; tickets remain in Postgres.
- Migrations: forward-fix preferred; keep SQL migrations immutable.

## Verification requirement

A backup is not verified until restore into a clean database passes `verify-restore.sh` and a guest QR smoke succeeds.

## Evidence status

Scripts are in-repo. Record restore drill output in the final verification report when executed in the target environment.
