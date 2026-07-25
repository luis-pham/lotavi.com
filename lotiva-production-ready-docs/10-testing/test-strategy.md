---
title: "Test Strategy"
document_id: "TEST-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["test strategy"]
implemented_by: []
reviewed_by: []
---


# Test pyramid
Unit → integration with Testcontainers → provider contract → E2E Playwright → load K6 → security.

Không mock database cho RLS tests.
Không gọi Gemini trong unit tests.
Provider integration tests tách suite, quota-aware.
