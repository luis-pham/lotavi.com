# 05 — API, persistence, and permissions audit

**Audit date:** 2026-07-27

---

## 1. Store modes

| Mode | Boot | Persistence | Realtime | Prod |
|------|------|-------------|----------|------|
| `memory` | in-process seed | process memory | Redis skipped | Forbidden unless test |
| `postgres` | ping + repos + RLS helpers | PostgreSQL | outbox + Redis | Required |

Evidence: `apps/api/src/app-context.ts`, production `/ready` → `store:postgres` (`evidence/05-prod-health.txt`).

---

## 2. Request lifecycle trace (code)

### Step A — Guest creates

| Layer | Detail | Evidence |
|-------|--------|----------|
| Frontend | `prepareRequest` / `confirmRequest` | `GuestPortal.tsx` |
| API | `POST .../tickets/prepare`, `.../confirm` | `guest.ts` |
| Auth | `requireActiveGuest` | `guest-auth.ts` |
| Validation | Prepare/Confirm schemas | `packages/contracts` |
| DB | pending_actions → tickets status `submitted` | memory store / postgres-repos |
| Audit | outbox `ticket.created` (PG); no audit_logs append | guest.ts |
| UI refresh | `refreshTickets()` | GuestPortal |

### Step B — Admin receives

| Layer | Detail | Evidence |
|-------|--------|----------|
| Frontend | `GET /api/v1/admin/requests` | `RequestsPage.tsx` |
| Auth | ADMIN_ROLES | `phase0.ts` |
| DB | listTickets | `ops.ts` |

### Step C — Admin assigns

| Layer | Detail | Evidence |
|-------|--------|----------|
| API | `PATCH .../requests/:id/assign` | `phase0.ts` |
| DB | `updateTicket` assigneeId | `ops.ts` |
| Frontend | **No caller** | RequestDrawer only patches status |
| De facto | Staff accept sets assigneeId | `staff.ts` |

**Status:** API VERIFIED · UI MISSING → overall PARTIAL

### Step D — Staff accept / start / complete

| Layer | Detail | Evidence |
|-------|--------|----------|
| Frontend | status buttons | `MyWorkPage.tsx` |
| API | `PATCH /staff/tickets/:id/status` | `staff.ts` |
| Validation | `assertTicketTransition` | `domain/ticket.ts` |
| Mapping | accepted→acknowledged, completed→resolved | staff.ts |
| DB | tickets.transition + ticket_transitions | repos |
| UI refresh | `load()` | MyWorkPage |

### Step E — Guest sees status

| Layer | Detail | Evidence |
|-------|--------|----------|
| Frontend | tickets list STATUS_LABEL | GuestPortal |
| API | `GET /guest/tickets` | guest.ts |
| Push | **none** (manual refresh after confirm only) | |

### Step F — Timeline

| Mechanism | Written | UI |
|-----------|---------|-----|
| `ticket_transitions` | Yes | Shift activity merge |
| `ticket_notes` | Yes (internal default) | Request drawer |
| `ticket_events` | **Never** | — |
| `ticket_outbox_events` | Yes (PG) | SSE publish |

### Overall lifecycle classification

**PARTIAL** — spine wired for memory and postgres; Phase 0 memory API smoke previously VERIFIED; postgres Playwright **NOT RUN** this audit; admin assign UI and guest confirm-completion UI absent.

---

## 3. Admin/Staff action matrix (high signal)

| Action | Frontend | Endpoint | Auth | DB write | UI refresh | Audit |
|--------|----------|----------|------|----------|------------|-------|
| Login | admin/staff pages | POST auth/login | public RL | staff cookie | navigate | — |
| Overview load | OverviewPage | GET overview | admin | read | — | — |
| Request status | RequestDrawer | PATCH requests/:id | admin | updateTicket | onChanged | transitions if status |
| Bulk accept/complete | RequestsPage | PATCH bulk | admin | yes | reload | — |
| Internal note | RequestDrawer | POST notes | admin/staff | ticket_notes | reload notes | — |
| Assign | **none** | PATCH assign | admin | yes | — | — |
| Staff status | MyWorkPage | PATCH staff status | staff+ | transition | load | outbox |
| Escalate | MyWorkPage | status+escalate | staff+ | escalated+urgent | load | — |
| Handover CRUD | ResourcePage | staff/handover | staff+ | handover_notes | reload | — |
| Settings save | ResourcePage **broken** | PUT settings | configAdmin | property_settings | fail likely | — |
| QR create | ResourcePage **broken** | POST admin/qr (unused path) | admin | qr_contexts | — | — |
| Staff create | ResourcePage **wrong body** | POST admin/staff | configAdmin | users | 400 likely | — |
| Portal content | ResourcePage **partial** | PUT/POST | configAdmin | portal_content | partial | — |
| Brand publish | **no UI** | POST brand/publish | admin | themes | — | — |
| Knowledge upload | **no UI** | POST knowledge | admin | knowledge | — | — |
| AI settings | **no UI** | GET static | admin | none | — | MOCKED |

---

## 4. Permissions and multi-tenancy

| Check | Result | Evidence |
|-------|--------|----------|
| Authentication | Cookie staff/guest | auth.ts, guest-auth.ts |
| Role resolution | From cookie role string | readStaff |
| Admin/Staff **route** protection | **MISSING** | middleware passthrough |
| Server permission checks | **PRESENT** on APIs | phase0 CONFIG vs ADMIN |
| Hidden nav ≠ auth | Confirmed — pages load, API 403 | ConsoleLayout |
| Property/tenant isolation | Intended via withTenant / seed single property | postgres ops + RLS tests (2 skipped without DB) |
| Data leakage risk | Low if only API used; **UI loads shells without auth** | Any browser can open `/admin/overview` HTML |
| Manager vs configAdmin | Manager ops yes, settings/QR/staff/depts **403** | phase0.ts + e2e claim |

---

## 5. Notes / SLA / guest completion

| Topic | Finding |
|-------|---------|
| Note visibility | Default `internal`; UI never sets guest-visible |
| SLA | `defaultSlaMinutes` seeded; **dueAt not computed** on ticket create |
| Guest confirm-completion / reopen | API only; **no web usage** |
| Escalation | Persists | 

---

## 6. Production persistence signal

`GET https://api.lotavi.com/ready` → `{"store":"postgres","postgres":"ok","voiceEnabled":false}` — VERIFIED this audit.  
Does **not** by itself prove Phase 0 UI CRUD correctness on prod.
