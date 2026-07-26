---
title: "Phase 0 Verification Report"
document_id: "DEL-P0-VERIFY"
version: "1.0.0"
status: "active"
last_updated: "2026-07-26"
---

# Phase 0 final verification report

## 1. Executive status

**CONDITIONAL PASS**

Phase 0 Admin/Staff shells, ops APIs, guest portal request flow, RBAC, unit/typecheck/build, screenshot matrix, and an API-level guest→staff lifecycle (`submitted → acknowledged → in_progress → resolved`) were verified on a local memory stack.

Not claimed as full PASS: Playwright E2E against PostgreSQL production compose (`RUN_E2E=1`) was not executed in this session; some UX-literal extras (board drag-and-drop, QR download/print, SSE live notifications UI, full audit drawer timeline) remain thinner than the long-form screen contracts. Production must apply migration `0009_phase0_ops.sql` before claiming prod readiness.

## 2. Completed route inventory

### Admin
- `/admin` login
- `/admin/overview`
- `/admin/requests` (list + board + drawer)
- `/admin/guests`
- `/admin/cabins`
- `/admin/journeys`
- `/admin/announcements`
- `/admin/portal-content`
- `/admin/categories`
- `/admin/qr-access`
- `/admin/staff`
- `/admin/departments`
- `/admin/settings`

### Staff
- `/staff` login
- `/staff/my-work`
- `/staff/department-queue`
- `/staff/lookup`
- `/staff/shift-activity`
- `/staff/handover`
- `/staff/notifications`
- `/staff/profile`

### Guest
- `/g/[token]` portal (home, info, requests, assistant)
- invalid QR error state

## 3. Completed workflow inventory

| Workflow | Verified how |
|----------|--------------|
| Admin login → overview | Browser screenshot + API login |
| Staff forbidden on admin settings | HTTP 403 |
| Guest QR session open | API + guest screenshot |
| Guest prepare/confirm request | API smoke (memory) |
| Staff department queue → accept → start → complete | API smoke (memory) — status path `submitted → acknowledged → in_progress → resolved` |
| Guest sees updated ticket status | API guest tickets after complete (`resolved`) |
| Departments/categories seed | API list + unit test |
| Request transition invalid rejected | Unit test |

## 4. Permission matrix

See `02-experience/permissions-matrix-phase0.md`.

Runtime:
- Ops admin: `property_admin`, `platform_admin`, `manager`
- Config admin (settings/QR/portal/categories/staff/depts): `property_admin`, `platform_admin` only
- Staff routes: `staff` (+ elevated roles)
- Server-enforced on `/api/v1/admin/*` and `/api/v1/staff/*`

## 5. Database / migration changes

- `packages/infrastructure/drizzle/0009_phase0_ops.sql`
- Schema additions: departments, request_categories, journeys, guests, guest_stays, ticket_notes, handover_notes, property_settings, portal_content; ticket priority/assignee/escalated/source/etc.; users.departmentId/active; announcement/QR/room extensions

## 6. Test results

| Check | Result |
|-------|--------|
| `pnpm test` | **81 passed**, 2 skipped (postgres RLS) |
| `@lotiva/api` typecheck | **PASS** |
| `@lotiva/web` typecheck/lint | **PASS** |
| `@lotiva/web` build | **PASS** |
| Phase0 ops unit tests | **PASS** |
| Playwright postgres E2E (`RUN_E2E`) | **NOT RUN** this session |
| API lifecycle smoke (memory) | **PASS** |

## 7. Screenshot matrix

Evidence directory: `docs/phase0-evidence/`

| File | Screen |
|------|--------|
| `01-admin-login.png` | Admin login |
| `02-admin-overview.png` | Overview |
| `03-admin-requests-list.png` | Requests list |
| `04-admin-requests-board.png` | Requests board |
| `05-admin-guests.png` | Guests |
| `06-admin-cabins.png` | Cabins |
| `07-admin-journeys.png` | Journeys |
| `08-admin-qr.png` | QR access |
| `09-admin-staff.png` | Staff |
| `10-admin-portal-content.png` | Portal content |
| `10b-admin-departments.png` | Departments |
| `10c-admin-settings.png` | Settings |
| `10d-admin-announcements.png` | Announcements |
| `10e-admin-categories.png` | Categories |
| `11-staff-my-work.png` | Staff My Work |
| `12-staff-department-queue.png` | Department queue |
| `13-staff-my-work-mobile.png` | Staff mobile |
| `14-guest-home.png` | Guest home |
| `15-guest-requests.png` | Guest requests |
| `16-guest-invalid-qr.png` | Invalid QR |

## 8. Remaining gaps

- Board drag-and-drop with transition validation not implemented (click/actions only)
- QR download/print-ready asset generation not implemented (list/copy/regenerate APIs exist partially)
- Staff SSE notification center not wired to EventSource (unread list API exists)
- Request drawer audit/timeline depth is notes-focused; full transition history UI incomplete
- Overview attention blocks do not yet include every queue type from the long-form Overview spec (voice errors, missing translations)
- Postgres migrate+seed+E2E on Hostinger/prod compose not re-verified after Phase 0 schema

## 9. Known limitations

- Local cookie auth requires same-site hosts (`localhost` web + `localhost` API); `127.0.0.1` vs `localhost` breaks cookies
- Memory store used for screenshot/smoke in this session; production must run migration `0009_phase0_ops.sql`
- Demo password remains `admin123` in seed — rotate for production

## 10. Exact blockers

None blocking local Phase 0 development. Production deploy requires applying `0009_phase0_ops.sql` and rebuilding web with `NEXT_PUBLIC_API_URL`.

## 11. Recommended next phase

1. Run `RUN_E2E=1` Playwright against postgres compose and fix any drifts
2. Wire SSE into Staff notifications + sound mute
3. QR PDF/PNG export + scan analytics
4. Deeper Overview attention aggregations
5. Then Phase 1 modules (payments/folios/etc.) only after Phase 0 postgres E2E is green
