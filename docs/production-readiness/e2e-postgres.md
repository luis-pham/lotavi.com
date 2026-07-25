# Playwright PostgreSQL E2E (F7.5)

```bash
# stack: postgres api:4000 web:3000, ALLOW_DEMO_SEED=true, LOTIVA_STORE=postgres
pnpm --filter @lotiva/web e2e:install
RUN_E2E=1 pnpm --filter @lotiva/web e2e
```

Config: `apps/web/playwright.config.ts`  
Spec: `apps/web/e2e/guest-staff-flow.spec.ts`

Traces/screenshots retained on failure.
