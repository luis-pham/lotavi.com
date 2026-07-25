---
title: "Staging Cutover — lotiva.vn"
document_id: "DEL-OPS-001"
version: "1.0.0"
status: "approved"
owners: ["Engineering", "Product"]
last_updated: "2026-07-25"
---

# Staging / production cutover

## DNS

| Host | Target |
|------|--------|
| `lotiva.vn` | VPS / Caddy |
| `app.lotiva.vn` | VPS / Caddy → web |
| `api.lotiva.vn` | VPS / Caddy → api |
| `staging.lotiva.vn` | Staging VPS → web |
| `api.staging.lotiva.vn` | Staging VPS → api |

## Deploy steps

1. Provision VPS, install Docker Compose.
2. Copy `infra/compose`, set secrets from `.env.example`.
3. `LOTIVA_STORE=postgres`, run `pnpm db:migrate` then `pnpm db:seed` on staging.
4. Point staging DNS; verify `/health`, `/ready`, QR path, staff login.
5. Run production-readiness checklist items (backup/restore, rate limits, monitoring).
6. Promote to `lotiva.vn` with TLS via Caddy.

## Checklist gate

See `production-readiness-checklist.md`. No critical/high blockers before prod DNS cutover.
