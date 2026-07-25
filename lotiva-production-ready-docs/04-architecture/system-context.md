---
title: "System Context"
document_id: "ARCH-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["system context"]
implemented_by: []
reviewed_by: []
---


# System context

Product: Lotiva (`lotiva.vn`).

Actors: Guest, Staff, Manager, Property Admin, Platform Admin.

External systems:
- Gemini Live Native Audio.
- Cloudflare R2.
- SMTP/email auth provider optional (`noreply@lotiva.vn`).
- Future OpenAI Realtime adapter.

Core system:
- Next.js web (`lotiva.vn` / `app.lotiva.vn`).
- Fastify API/Voice Gateway (`api.lotiva.vn`).
- PostgreSQL/pgvector.
- Redis/BullMQ.
- Embedding service.
- Worker.
