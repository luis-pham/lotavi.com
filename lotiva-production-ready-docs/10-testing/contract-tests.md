---
title: "Provider Contract Tests"
document_id: "TEST-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["voice provider contracts"]
implemented_by: []
reviewed_by: []
---


# Contract suite
create session, send audio, receive canonical audio, input/output transcript, tool call, tool result, interrupt, cancellation, reconnect/resume, usage, error normalization, idempotent close, no provider type leak.
