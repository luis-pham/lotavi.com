# F8.6 — Full Playwright E2E on Staging

## Result

```text
BLOCKED
```

Unresolved condition: staging hostname unavailable; `RUN_E2E=1` full stack not executed this session.

## Prepared

- `apps/web/playwright.config.ts`
- `apps/web/e2e/guest-staff-flow.spec.ts`

## Exact command (when staging up)

```bash
export RUN_E2E=1
export PLAYWRIGHT_BASE_URL=https://staging.lotiva.vn
export API_BASE_URL=https://api.staging.lotiva.vn
pnpm --filter @lotiva/web exec playwright install --with-deps
pnpm --filter @lotiva/web e2e
```

## Required scenario coverage (spec intent)

Primary guest→ticket→staff→guest status path, plus negative/resilience cases listed in F8 brief. Tests must assert PostgreSQL state, not UI labels alone.

## Capture required after run

Playwright report, traces/screenshots on failure, duration, pass/fail/skip counts, release identity, staging hostname.
