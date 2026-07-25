# Domain architecture — Lotavi

## Canonical marketing domain

```text
https://lotavi.com
```

## Locale URLs (active)

```text
https://lotavi.com/vi/
https://lotavi.com/en/
```

## Future-ready (not publicly indexed until complete)

```text
https://lotavi.com/th/
https://lotavi.com/id/
https://lotavi.com/ko/
https://lotavi.com/ja/
https://lotavi.com/fr/
```

Inactive locale paths currently **307 → `/en/`** and are not listed in sitemap/hreflang.

## Product surfaces

| Surface | URL |
|---------|-----|
| App | `https://app.lotavi.com` |
| API | `https://api.lotavi.com` |
| Guest portal | `https://lotavi.com/g/{token}` (no locale prefix) |
| Staging web | `https://staging.lotavi.com` |
| Staging API | `https://api.staging.lotavi.com` |

## Vietnam defensive domain

```text
https://lotavi.vn/*  →  301  https://lotavi.com/vi/*
```

`.vn` must **not** serve duplicate marketing content. See `lotavi-vn-redirect.md`.

## Brand

Public brand: **Lotavi**  
Internal package/env prefixes may still use `lotiva` / `LOTIVA_*` for compatibility.
