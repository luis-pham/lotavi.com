---
title: "Container Architecture"
document_id: "ARCH-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["container architecture"]
implemented_by: []
reviewed_by: []
---


# Containers

- `web`: Next.js Guest/Admin/Staff.
- `api`: Fastify REST + WebSocket.
- `worker`: BullMQ workers.
- `embedding-service`: FastAPI + EmbeddingGemma.
- `postgres`: business data + pgvector.
- `redis`: cache, queue, pub/sub, ephemeral state.
- `caddy`: TLS/reverse proxy.
- `monitoring`: Prometheus/Grafana/Loki or equivalent.
