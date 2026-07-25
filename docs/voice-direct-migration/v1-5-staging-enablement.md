# V1.5.1 — Safe staging enablement

## Policy

| Environment | Direct Gemini |
|-------------|---------------|
| development | Allowed with explicit flags |
| staging | Allowed only when **all** safety conditions pass (fail-fast) |
| production | **Always forbidden** (`DIRECT_GEMINI_ENABLED=true` rejects startup) |

## Staging required conditions

```text
NODE_ENV=staging
VOICE_ENABLED=true
VOICE_TRANSPORT=direct
DIRECT_GEMINI_ENABLED=true
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=true
DIRECT_GEMINI_PROPERTY_ALLOWLIST=<non-empty csv of property UUIDs>
GEMINI_API_KEY=<server-only>
PUBLIC_WEB_URL=https://…
PUBLIC_API_URL=https://…
VOICE_WRITE_TOOLS_ENABLED=false
VOICE_RAG_TOOLS_ENABLED=false
```

## Rollback (always safe)

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
DIRECT_GEMINI_STAGING_ACKNOWLEDGED=false
```

## Compose note

`infra/compose/docker-compose.staging.yml` defaults voice **off** and uses `NODE_ENV=staging` so the staging gate can apply when operators opt in. Production builds must keep `NODE_ENV=production` with direct disabled.

## Status

- **Implemented** in `packages/contracts/src/config.ts`
- **Unit-tested** negative/positive cases in `config.test.ts`
- **Provider-tested / device-tested:** NOT STARTED (no HTTPS staging + credentials here)
