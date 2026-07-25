---
title: "Threat Model"
document_id: "SEC-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["threat model"]
implemented_by: []
reviewed_by: []
---


# Threat surfaces
QR token, guest session, WebSocket, voice stream, provider, prompt injection, upload, tenant isolation, admin account, staff permissions, cache, worker, backup.

Mỗi release phải review spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege.
