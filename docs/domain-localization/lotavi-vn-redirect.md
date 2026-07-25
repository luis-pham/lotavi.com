# lotavi.vn redirect

## Intent

`lotavi.vn` is a **Vietnamese local entry point**, not a second website.

## Configuration

File: `infra/compose/Caddyfile.lotavi.vn`

```caddy
lotavi.vn, www.lotavi.vn {
  redir https://lotavi.com/vi{uri} permanent
}
```

Examples:

| Request | Response |
|---------|----------|
| `https://lotavi.vn/` | `301 → https://lotavi.com/vi/` |
| `https://lotavi.vn/path` | `301 → https://lotavi.com/vi/path` |
| `https://www.lotavi.vn/x` | `301 → https://lotavi.com/vi/x` |

## Requirements

- 301/308 permanent
- Preserve path (and query via `{uri}`)
- Host-bound (no open redirect)
- Do not proxy duplicate HTML from `.vn`
- Do not set `lotavi.com` cookies from `.vn`
- Do not add `.vn` to API CORS origins

## Runtime status

**BLOCKED** until DNS + TLS for `lotavi.vn` / `www.lotavi.vn` are verified in deployment.
