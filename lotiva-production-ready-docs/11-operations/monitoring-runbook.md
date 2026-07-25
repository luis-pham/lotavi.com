---
title: "Monitoring Runbook"
document_id: "OPS-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["monitoring"]
implemented_by: []
reviewed_by: []
---


# Metrics
HTTP latency/error, WebSocket count, reconnects, voice session success, first-audio latency, tool latency, cache hit, DB pool, pgvector latency, queue depth, job failures, ticket delivery latency.

Structured logs có correlationId, tenantId, propertyId, sessionId nhưng không có secrets/PII.
