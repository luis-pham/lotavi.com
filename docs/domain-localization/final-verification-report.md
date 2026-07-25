# Domain & localization — final verification report

## FINAL CLASSIFICATION

```text
CONDITIONAL PASS
```

Implementation and automated tests pass. Live DNS/TLS for `lotavi.com` / `lotavi.vn` and production country-header verification remain external.

## Canonical domain

```text
https://lotavi.com
```

## Active locales

- `vi` → `/vi/` (`lang=vi`, hreflang `vi-VN`)
- `en` → `/en/` (`lang=en`, hreflang `en`)

## Future-ready locales

`th`, `id`, `ko`, `ja`, `fr` — architecture prepared; public paths 307 → `/en/`; not in sitemap/hreflang.

## Locale resolution order

1. Cookie `lotavi_locale`
2. URL locale
3. `Accept-Language` (weighted)
4. Trusted country header
5. English

## Implemented changes

- Next.js middleware locale routing (`307` on `/`)
- Dictionaries for Vietnamese + English marketing content (Lotavi brand messaging)
- Language switcher (header, accessible)
- Self-canonical + reciprocal hreflang + `x-default` → `/en/`
- `robots.ts` / `sitemap.ts`
- Guest `/g/*`, staff, admin → `noindex`
- Staging → disallow all when `NEXT_PUBLIC_SITE_ENV=staging` or staging host
- Caddy configs for `lotavi.com` and `lotavi.vn` → `/vi{uri}`
- CORS/env examples updated to lotavi.com origins (not `.vn`)

## Routes added or changed

| Route | Behavior |
|-------|----------|
| `/` | 307 → `/vi/` or `/en/` |
| `/vi/` | Vietnamese landing |
| `/en/` | English landing |
| `/th/` etc. | 307 → `/en/` |
| `/g/{token}` | unchanged path; noindex; no locale redirect |
| `/staff`, `/admin` | passthrough; noindex |

## Metadata changes

Locale-specific title, description, Open Graph (`vi_VN` / `en_US`), Twitter, canonical, alternates.

## Canonical and hreflang result

- `/vi/` canonical → `https://lotavi.com/vi/`
- `/en/` canonical → `https://lotavi.com/en/`
- Reciprocal `vi-VN` + `en` + `x-default` → en

## Cookie behavior

`lotavi_locale` set on root resolve, explicit locale visit, and language switcher. Path=/; SameSite=Lax; Secure on HTTPS; 365 days.

## Country-detection behavior

Trusted headers only; VN → vi when browser unmatched; TH/ID/KR/JP prepared but inactive → en.

## Guest-route behavior

No `/vi/g/...`; excluded from marketing middleware redirects; `noindex,nofollow`; excluded from sitemap.

## lotavi.vn redirect behavior

Caddy `301` to `https://lotavi.com/vi{uri}`. **Runtime DNS/TLS verification BLOCKED.**

## Environment variables added or changed

```text
PUBLIC_WEB_URL / NEXT_PUBLIC_WEB_URL
PUBLIC_APP_URL / PUBLIC_API_URL
STAGING_WEB_URL / STAGING_API_URL
DEFAULT_LOCALE / SUPPORTED_LOCALES
LOCALE_COOKIE_NAME
NEXT_PUBLIC_SITE_ENV
CORS_ORIGINS → lotavi.com family (no lotavi.vn)
```

## Tests added

- `apps/web/src/i18n/resolve-locale.test.ts` (25)
- `apps/web/src/i18n/routes.test.ts` (4)
- `apps/web/src/middleware.test.ts` (8)

**37/37 PASS** in `@lotiva/web`

## Verification evidence

```bash
cd apps/web && pnpm test          # 37 passed
cd apps/web && pnpm typecheck     # pass
NODE_ENV=production NEXT_PUBLIC_WEB_URL=https://lotavi.com pnpm --filter @lotiva/web build  # pass
```

Build emits `/[locale]` for `vi` + `en`, `robots.txt`, `sitemap.xml`, middleware.

## External blockers

| Item | Status |
|------|--------|
| DNS lotavi.com / www / app / api | Not verified here |
| DNS lotavi.vn redirect | Not verified here |
| TLS certificates | Not verified here |
| Production deployment | Not verified here |
| Country headers at edge | Not verified here |

## Known limitations

- Marketing page sections beyond the current landing structure use dictionaries but do not invent a full multi-page IA
- Slug map includes future hotel-solution pair for switcher; pages not created yet
- Internal package names remain `@lotiva/*`
- Demo emails may still use `@lotiva.vn` locally

## Files changed

- `apps/web/src/middleware.ts` + tests
- `apps/web/src/i18n/**`
- `apps/web/src/app/[locale]/**`
- `apps/web/src/app/layout.tsx`, `page.tsx`, `robots.ts`, `sitemap.ts`
- `apps/web/src/components/MarketingLanding.tsx`, `LanguageSwitcher.tsx`
- `apps/web/next.config.ts` (`trailingSlash`)
- `infra/compose/Caddyfile*.lotavi.*`, staging compose/env
- `docs/domain-localization/**`

## Exact local commands

```bash
pnpm --filter @lotiva/web test
pnpm --filter @lotiva/web typecheck
NODE_ENV=production NEXT_PUBLIC_WEB_URL=http://localhost:3000 pnpm --filter @lotiva/web build
pnpm --filter @lotiva/web dev
# open http://localhost:3000/ → 307 to /vi/ or /en/
```

## Exact deployment commands

```bash
# Mount production Caddyfiles when DNS ready
docker compose -f infra/compose/docker-compose.staging.yml up -d --build
# Production: combine Caddyfile.lotavi.com + Caddyfile.lotavi.vn
```

## Exact DNS records required

See `dns-checklist.md`.

## Manual verification checklist

- [ ] `lotavi.com/` → temporary redirect to `/vi/` or `/en/`
- [ ] `/vi/` stays Vietnamese with English browser
- [ ] `/en/` stays English with VN country header
- [ ] Language switch sets cookie and navigates
- [ ] View-source: canonical + hreflang reciprocal
- [ ] `<html lang>` correct
- [ ] `/g/{token}` not locale-prefixed; noindex
- [ ] staging robots disallow
- [ ] `lotavi.vn/` → `lotavi.com/vi/` (when DNS live)
- [ ] No redirect loops
