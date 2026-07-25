---
title: "Voice Tool Contracts"
document_id: "API-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["AI tools"]
implemented_by: []
reviewed_by: []
---


# Tools

Read:
- search_knowledge
- get_current_schedule
- get_active_announcements
- get_ticket_status

Prepare:
- prepare_service_request

Confirmed write:
- confirm_service_request

Escalation:
- handoff_to_staff

Mỗi tool có JSON Schema, execution mode, timeout, authorization, idempotency policy và structured result.
