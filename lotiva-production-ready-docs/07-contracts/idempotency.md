---
title: "Idempotency"
document_id: "API-005"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["idempotency"]
implemented_by: []
reviewed_by: []
---


# Idempotency

Key scope: tenant + operation + idempotency key.
Store request hash, response, status, expiry.
Nếu cùng key khác payload → conflict.
Ticket confirmation dùng pendingActionId + expectedVersion.
