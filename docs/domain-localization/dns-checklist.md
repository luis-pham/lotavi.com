# DNS checklist — Lotavi

## Production

| Record | Type | Target |
|--------|------|--------|
| `lotavi.com` | A/AAAA | edge / load balancer |
| `www.lotavi.com` | CNAME/A | apex or redirect edge |
| `app.lotavi.com` | A/AAAA/CNAME | app edge |
| `api.lotavi.com` | A/AAAA/CNAME | API edge |
| `lotavi.vn` | A/AAAA | redirect edge (Caddy) |
| `www.lotavi.vn` | A/AAAA/CNAME | same redirect edge |

## Staging

| Record | Type | Target |
|--------|------|--------|
| `staging.lotavi.com` | A/AAAA/CNAME | staging edge |
| `api.staging.lotavi.com` | A/AAAA/CNAME | staging API |

## TLS

- Issue certificates for all hosts above
- Confirm HTTP→HTTPS
- Confirm `.vn` redirect target uses HTTPS on `.com`

## Country headers

If using Cloudflare / Vercel, confirm trusted country headers reach Next middleware:

- `CF-IPCountry`
- `x-vercel-ip-country`

Do not trust arbitrary client-supplied country headers.
