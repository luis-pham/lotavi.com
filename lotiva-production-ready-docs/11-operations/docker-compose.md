---
title: "Docker Compose"
document_id: "OPS-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["compose"]
implemented_by: []
reviewed_by: []
---


# Services
caddy, web, api, worker, embedding-service, postgres, redis, backup, prometheus, grafana, loki/agent, uptime monitor.

Health checks bắt buộc.
Restart policy.
Resource limits.
No public DB ports.

## Caddy / host routing

Production Caddy routes `lotiva.vn`, `app.lotiva.vn`, `api.lotiva.vn` (TLS).
Staging dùng `staging.lotiva.vn` và `api.staging.lotiva.vn`.
Local compose bind localhost ports; không cần DNS `lotiva.vn`.
