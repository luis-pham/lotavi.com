---
title: "Abuse and Rate Limits"
document_id: "SEC-006"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["rate limits"]
implemented_by: []
reviewed_by: []
---


# Rate limits
QR scans, guest session creation, voice session, audio bandwidth, tool calls, login, password reset, uploads, publish actions.

Use Redis token bucket/sliding window. Return canonical retry info.
