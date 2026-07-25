---
title: "Threat Model"
document_id: "SEC-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["threat model"]
implemented_by: []
reviewed_by: []
---

> **Voice threats:** see [docs/voice/security-boundary.md](../../docs/voice/security-boundary.md) (ephemeral token theft/replay, mint abuse, client-forged tools, fake usage, CSP, bundle leakage, abandoned sessions, etc.).  
> Production direct voice remains forbidden; long-lived Gemini keys stay server-side.

# Threat surfaces
QR token, guest session, WebSocket, voice stream / ephemeral credentials, provider, prompt injection, upload, tenant isolation, admin account, staff permissions, cache, worker, backup.

Mỗi release phải review spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege.
