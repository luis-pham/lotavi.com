---
title: "Tenant Isolation Security"
document_id: "SEC-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["tenant isolation"]
implemented_by: []
reviewed_by: []
---


# Controls
tenant context middleware, transaction wrapper, repository signature, RLS, scoped cache keys, scoped object keys, scoped queue jobs, audit, tests.

Không nhận tenantId từ client làm nguồn tin cậy. Tenant resolve từ authenticated membership hoặc verified QR context.
