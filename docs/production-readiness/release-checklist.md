# Release checklist

- [ ] Config validation passes for staging/prod env files
- [ ] `LOTIVA_STORE=postgres`, memory/demo seed flags false
- [ ] Migrations applied (`0000`–`0003`)
- [ ] Seed via CLI; no public seed route
- [ ] RLS tests `RUN_PG_TESTS=1` green
- [ ] Unit/contract/integration green in CI
- [ ] Playwright E2E against Postgres green
- [ ] k6 pilot thresholds recorded
- [ ] Backup + restore drill evidence attached
- [ ] Voice disabled unless real-provider smoke attached
- [ ] Secrets rotated; no README credentials in prod
- [ ] TLS + DNS on staging verified
- [ ] Rollback procedure rehearsed
- [ ] On-call knows runbooks
