---
title: "Caching Architecture"
document_id: "ARCH-007"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["cache"]
implemented_by: []
reviewed_by: []
---


# Redis cache

- exact FAQ;
- retrieval result;
- active voice state;
- pending action;
- rate limit;
- idempotency;
- Socket.IO/pub-sub adapter;
- BullMQ.

Semantic cache embeddings lưu PostgreSQL/pgvector, payload nóng có thể cache Redis.

Invalidation bằng version:
knowledge_version, schedule_version, announcement_version, portal_theme_version, prompt_version.
