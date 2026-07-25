# SEO — canonical & hreflang

## Canonical

Each locale page self-references:

```html
<link rel="canonical" href="https://lotavi.com/vi/">
<link rel="canonical" href="https://lotavi.com/en/">
```

## hreflang (reciprocal, active only)

```html
<link rel="alternate" hreflang="vi-VN" href="https://lotavi.com/vi/">
<link rel="alternate" hreflang="en" href="https://lotavi.com/en/">
<link rel="alternate" hreflang="x-default" href="https://lotavi.com/en/">
```

Implemented via Next.js `metadata.alternates` in `app/[locale]/layout.tsx`.

## HTML lang

| Route | `<html lang>` |
|-------|----------------|
| `/vi/` | `vi` |
| `/en/` | `en` |

Set from middleware header `x-lotavi-locale` in root layout.

## robots

| Surface | Policy |
|---------|--------|
| `/vi/`, `/en/` | index, follow |
| `/g/*` | noindex, nofollow |
| `/staff`, `/admin` | noindex, nofollow |
| staging host | disallow all |

## sitemap

Only active marketing URLs (`/vi/`, `/en/`) with alternate language refs.  
Excludes guest, app auth, API, staging, `.vn` duplicates.
