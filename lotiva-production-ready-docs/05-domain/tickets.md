---
title: "Ticket Domain"
document_id: "DOM-TICKET-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["ticket business rules"]
implemented_by: []
reviewed_by: []
---


# Ticket aggregate

States:
new → accepted → in_progress → completed → guest_confirmed.
Alternative: needs_information, cancelled, reopened.

Rules:
- AI chỉ prepare.
- Ticket chỉ tạo sau explicit confirmation.
- Create phải idempotent.
- Completed không đồng nghĩa guest resolved.
- Guest chọn chưa giải quyết → reopened.
- Mọi state transition tạo ticket event immutable.
- Staff chỉ thao tác ticket đúng tenant/property/department permission.
