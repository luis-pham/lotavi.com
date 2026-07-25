---
title: "Module Boundaries"
document_id: "ARCH-003"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["module boundaries"]
implemented_by: []
reviewed_by: []
---


# Modules
identity, tenants, properties, qr-context, guest-session, conversation, voice, knowledge, retrieval, schedules, announcements, tickets, translation, analytics, audit, branding, prompt-management.

Dependency:
domain ← application ← infrastructure ← delivery.

Cross-module communication qua public service hoặc domain event.
