# Locale resolution

## Priority (root `/` and auto-detect)

1. Cookie `lotavi_locale` (`vi` \| `en`)
2. Locale in URL
3. `Accept-Language` (weighted)
4. Trusted country header (`CF-IPCountry`, `x-vercel-ip-country`, `x-country-code`)
5. English (`en`)

## Explicit locale paths

`/vi/*` and `/en/*` **never** redirect based on browser language or country/IP.

Visiting an explicit path also refreshes `lotavi_locale` to that locale (URL intent).

## Cookie

| Property | Value |
|----------|-------|
| Name | `lotavi_locale` (override via `LOCALE_COOKIE_NAME`) |
| Values | `vi`, `en` |
| Path | `/` |
| SameSite | `Lax` |
| Secure | HTTPS / production |
| Max-Age | 365 days |
| Host | host-only for lotavi.com |

Invalid cookie values are ignored.

## Country fallback (active only)

| Country | Locale |
|---------|--------|
| VN | vi |
| other / missing | en (after browser fails) |

Future (after locale activated): TH→th, ID→id, KR→ko, JP→ja.

Country never overrides cookie or explicit URL.

## Guest portal

Separate from marketing:

1. guest/session saved locale  
2. browser language  
3. property default  
4. English  

Marketing country detection must not override guest session locale.  
Guest paths stay `/g/{token}` (no `/vi/g/...`).
