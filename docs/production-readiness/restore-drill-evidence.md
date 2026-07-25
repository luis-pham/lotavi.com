# Restore drill evidence (F7.7)

## Executed 2026-07-25

| Field | Value |
|-------|-------|
| Script | `scripts/restore-drill.sh` |
| Backup | `/tmp/lotiva-restore-drill-20260725T113647Z/backups/lotiva-source-20260725T113647Z.sql.gz` |
| Target DB | `lotiva_restore_20260725T113647Z` (clean create) |
| Ready | `{"status":"ok","checks":{"store":"postgres","postgres":"ok"}}` |
| RLS after restore | PASS (2 tests) |
| App smoke | QR session + chat against restored DB |

Re-run:

```bash
./scripts/restore-drill.sh
```

## Assumptions

- RPO: last successful dump
- RTO: ~5–15 minutes for pilot DB size
- Redis ephemeral; queues rebuild from Postgres
