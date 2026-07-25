# F8.8 — Clean Restore on Staging

## Result

```text
BLOCKED
```

Unresolved condition: staging infrastructure unavailable. Local clean restore drill remains PASS from F7 (`scripts/restore-drill.sh`) but does **not** satisfy F8 staging restore gate.

## Local (prior) evidence — not staging

- Backup + restore into empty DB
- `/ready` after restore
- RLS suite PASS

## Staging procedure (not run)

1. Seed realistic data on staging
2. `./scripts/backup-postgres.sh`
3. Record checksum + schema version
4. Empty restore DB
5. `./scripts/restore-postgres.sh`
6. Start app against restored DB
7. Verify `/ready`, pgvector, embeddings, RLS
8. Retrieval subset + Playwright smoke
9. Record duration / row counts / FK checks

A dump without restore does not count.
