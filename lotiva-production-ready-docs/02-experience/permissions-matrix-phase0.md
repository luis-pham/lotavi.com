---
title: "Phase 0 Permission Matrix"
document_id: "UX-PERM-P0"
version: "1.0.0"
status: "approved"
last_updated: "2026-07-26"
---

# Phase 0 permission matrix

Roles used in runtime: `platform_admin`, `property_admin`, `manager` (Reception / Dept Manager), `staff`.

| Capability | platform_admin | property_admin | manager | staff |
|------------|----------------|----------------|---------|-------|
| Admin console | Yes | Yes | Yes (ops) | No |
| Settings / QR admin / Portal content / Categories / Staff / Depts | Yes | Yes | No | No |
| Guest Requests assign / escalate | Yes | Yes | Yes | Limited (own/dept) |
| Staff My Work | Yes | Yes | Yes | Yes |
| Department Queue (own dept) | All | All | Yes | Yes |
| Cross-department queue | Yes | Yes | Manager only if elevated | No |
| Guest portal | N/A | N/A | N/A | N/A |

Server enforces every mutating route. UI hides links as UX only.
