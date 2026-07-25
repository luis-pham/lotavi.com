---
title: "System Context"
document_id: "ARCH-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["system context"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note (voice).**  
> Public brand is **Lotavi** (`lotavi.com`). Internal packages may still say `lotiva`.  
> Voice media is **not** a verified Lotavi “Voice Gateway” relay. See [docs/voice/README.md](../../docs/voice/README.md).

# System context

Product: **Lotavi** (`lotavi.com`; legacy refs may say Lotiva / lotiva.vn).

Actors: Guest, Staff, Manager, Property Admin, Platform Admin.

External systems:
- Gemini (text/RAG server-mediated today; Live voice provider for **planned/staging** direct media).
- Cloudflare R2.
- SMTP/email auth provider optional.
- Future OpenAI Realtime adapter (not implemented).

Core system:
- Next.js web.
- Fastify API (**control plane** for voice; not a working Gemini media relay).
- PostgreSQL/pgvector.
- Redis/BullMQ.
- Embedding service.
- Worker.

Voice defaults remain off. Text is the operational guest channel for pilot.
