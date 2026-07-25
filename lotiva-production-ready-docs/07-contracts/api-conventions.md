---
title: "API Conventions"
document_id: "API-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["REST conventions"]
implemented_by: []
reviewed_by: []
---


# REST

Base `/api/v1`.
JSON only except upload signed URLs.
Error envelope:
```json
{"error":{"code":"TICKET_NOT_FOUND","message":"...","correlationId":"...","details":{}}}
```
Idempotency-Key bắt buộc cho create ticket, publish, invite và destructive retryable writes.
Pagination cursor-based.
