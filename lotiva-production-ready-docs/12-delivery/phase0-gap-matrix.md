---
title: "Phase 0 UX-literal Gap Matrix"
document_id: "DEL-P0-GAP"
version: "1.0.0"
status: "active"
last_updated: "2026-07-26"
---

# Phase 0 gap matrix

| Area | Required | Current | Missing | Backend | UI | Tests | Priority |
|------|----------|---------|---------|---------|----|-------|----------|
| Admin Overview | Attention + workload + activity | Thin home counts | Full ops overview | Partial | Partial | None | P1 |
| Admin Guest Requests | Board/list/drawer/bulk | None | Full ops console | None→Build | None→Build | None→Build | P0 |
| Guests / Cabins / Journeys | CRUD + assignments | rooms only | Guests, journeys, cabin ops | Partial | None | None | P0 |
| Announcements | Admin CRUD + guest render | Guest read only | Admin write + targeting | Partial | None | None | P0 |
| Portal Content / Categories | CMS + category routing | Theme stub | Content + categories | None | None | None | P0 |
| QR & Guest Access | List/generate/revoke/rotate | API create only | List UI + levels | Partial | None | Partial | P0 |
| Staff / Departments | Invite, roles, dept queues | Team list read | Write + dept model | Partial | None | None | P0 |
| Basic Settings | Property settings persist | AI stub | Settings model | None | None | None | P1 |
| Staff My Work / Queue | Task-first queues | Flat inbox | Assignee/dept filters | Partial | Partial | Partial | P0 |
| Lookup / Shift / Handover / Notifs / Profile | Staff ops | Realtime API only | Screens + models | Partial | None | None | P1 |
| Guest QR→request→status | E2E serve loop | Works (spike UX) | Categories + polish | Done | Partial | Partial | P0 |
| App shell + RBAC | SaaS shell role-aware | Single pages | Shell + ACL | Partial | None | None | P0 |

## Milestone order
M0 audit → M1 shell/RBAC → M2 requests → M3 staff → M4 guests/cabins/journeys → M5 QR → M6 portal/categories/announcements → M7 guest E2E → M8 polish → M9 verify
