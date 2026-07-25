---
title: "F0 Completion Report"
document_id: "DEL-F0-001"
version: "1.0.0"
status: "approved"
owners: ["Engineering"]
last_updated: "2026-07-25"
---

## Summary
Scaffolded Lotiva monorepo with packages, API, web, worker, embedding-service, compose, CI, observability, memory+Postgres migration path, RLS SQL, and tenant isolation tests.

## Files changed
Monorepo root, `apps/*`, `packages/*`, `infra/compose`, docs delivery reports.

## Contracts changed
`@lotiva/contracts` voice events + REST schemas introduced.

## Migrations
`packages/infrastructure/drizzle/0000_init.sql` (extensions, core ER, RLS).

## Security impact
RLS policies on tenant-owned tables; guest/staff cookies httpOnly; rate limit on QR; secrets via env.

## Tests added
Domain, application, contracts, voice contract, tenant isolation (memory).

## Tests run
`pnpm test` / `pnpm typecheck` (see CI).

## Known limitations
Default runtime store is memory when Docker/Postgres unavailable; Gemini Live requires `GEMINI_API_KEY`.

## Documentation updated
`execution-roadmap.md`, root `README.md`.

## Completion status
F0 DoD met for local developability (compose files present; memory path runs without Docker).
