---
title: "Deployment Architecture"
document_id: "ARCH-008"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["deployment"]
implemented_by: []
reviewed_by: []
---


# VPS deployment

Docker Compose:
caddy, web, api, worker, embedding-service, postgres, redis, monitoring, backup.

Không public postgres/redis/embedding ports.
Chỉ Caddy public 80/443.
R2 dùng signed upload/download.

## Public hostnames

Caddy terminate TLS cho `lotiva.vn` và subdomain:

- `lotiva.vn` / `app.lotiva.vn` → web (Guest Portal + Admin)
- `api.lotiva.vn` → api / voice gateway (HTTP + WebSocket)
- `staging.lotiva.vn` / `api.staging.lotiva.vn` → staging stack

CORS và cookie domain scoped theo environment host ở trên.
