# 02 — Route and screen inventory

**Audit date:** 2026-07-27 · Evidence from `apps/web`, `apps/api`  
**Store:** same HTTP surface for `LOTIVA_STORE=memory|postgres` (impl in infrastructure).

---

## Auth / protection summary

| Layer | Behavior | Evidence |
|-------|----------|----------|
| Staff cookie | Signed JSON after `POST /api/v1/auth/login` | `apps/api/src/routes/auth.ts` |
| Guest cookie | After `POST /api/v1/guest/sessions/from-qr` | `guest.ts`, `guest-auth.ts` |
| Next middleware | Locale only; **passthrough** `/admin` `/staff` `/g/` | `apps/web/src/middleware.ts` |
| Client route guard | **None** (localStorage flags unused) | `admin/page.tsx`, `staff/page.tsx` |
| API RBAC | Enforced per route | `phase0.ts`, `admin.ts`, `staff.ts` |

**CONFIG_ADMIN_ROLES** (no manager): settings, QR list/scan, portal-content, categories, staff CRUD, departments.  
**ADMIN_ROLES** (+ manager): overview, requests, guests, journeys, announcements, cabins.

---

## Marketing

| Path | Source | Role | Status | API | Notes |
|------|--------|------|--------|-----|-------|
| `/` | `app/page.tsx` | public | VERIFIED | redirect | → `/{locale}/` |
| `/[locale]` | `app/[locale]/page.tsx` | public | VERIFIED | optional meta/seed | MarketingLanding |
| robots/sitemap | `robots.ts`, `sitemap.ts` | public | VERIFIED | — | |

---

## Auth screens

| Path | Source | Status | API | Persist | Perms | Tests |
|------|--------|--------|-----|---------|-------|-------|
| `/admin` | `app/admin/page.tsx` | VERIFIED login UI | `POST /auth/login` | session cookie | API after login | e2e phase0 |
| `/staff` | `app/staff/page.tsx` | VERIFIED login UI | same | cookie | API | e2e |

No logout UI · No password-reset UI (API exists).

---

## Admin console

Shell: `ConsoleLayout` + `ADMIN_NAV` (`apps/web/src/lib/nav.ts`).

| Path | Page / component | Purpose | Status | API-backed | Persist | L/E/E | Perms | Tests |
|------|------------------|---------|--------|------------|---------|-------|-------|-------|
| `/admin/overview` | `OverviewPage.tsx` | KPIs | PARTIAL | `GET /admin/overview` | read | Yes | API admin | e2e/screenshots |
| `/admin/requests` | `RequestsPage.tsx` | list/board/drawer | PARTIAL | requests + notes + bulk | yes (status/notes/bulk) | Yes | API admin | e2e/screenshots |
| `/admin/guests` | `ResourcePage` | guest CRUD | PARTIAL | guests collection | yes if valid body | Yes | API admin | smoke |
| `/admin/cabins` | `ResourcePage` | cabin list | PARTIAL / broken create-delete | GET/PATCH only | update only | Yes | API admin | smoke |
| `/admin/journeys` | `ResourcePage` | journeys | PARTIAL | CRUD | yes | Yes | API admin | smoke |
| `/admin/announcements` | `ResourcePage` | announcements | PARTIAL | CRUD | yes | Yes | API admin | smoke |
| `/admin/portal-content` | `ResourcePage` | sections | PARTIAL | GET + PUT/POST upsert; no PATCH/DELETE match | partial | Yes | configAdmin | smoke |
| `/admin/categories` | `ResourcePage` | categories | PARTIAL | CRUD | yes | Yes | configAdmin | — |
| `/admin/qr-access` | `ResourcePage` | QR list | PARTIAL / mostly broken CRUD | GET list; create/revoke/rotate elsewhere | list yes | Yes | configAdmin | smoke |
| `/admin/staff` | `ResourcePage` | staff | PARTIAL / create payload mismatch | GET/POST/PATCH | create likely 400 | Yes | configAdmin | — |
| `/admin/departments` | `ResourcePage` | departments | PARTIAL | CRUD | yes | Yes | configAdmin | smoke |
| `/admin/settings` | `ResourcePage` | settings | MOCKED-as-CRUD / broken | GET object + PUT | UI mismatch | Yes | configAdmin | smoke click |

**No Phase 0 pages** for: Brand Studio, Knowledge, Prompts, AI Settings, Team, Audit, Analytics — though `admin.ts` APIs exist for several.

Screenshots: `docs/audit/evidence/01-admin-login.png` … `10e-admin-categories.png`.

---

## Staff workspace

| Path | Component | Purpose | Status | API | Persist | Notes |
|------|-----------|---------|--------|-----|---------|-------|
| `/staff/my-work` | `MyWorkPage.tsx` | shift actions | PARTIAL→strong | my-work, queue, status, notes | status/notes yes | Best staff surface |
| `/staff/department-queue` | ResourcePage RO | unassigned | PARTIAL | GET queue | read | Thin table |
| `/staff/lookup` | ResourcePage RO | search | PARTIAL | GET lookup | read | Client filter; API `?search` unused |
| `/staff/shift-activity` | ResourcePage RO | activity | PARTIAL | GET | read | Transitions+notes merge |
| `/staff/handover` | ResourcePage | notes | PARTIAL | CRUD handover | yes | |
| `/staff/notifications` | ResourcePage RO | unread tickets | PARTIAL | GET notifications | read | Not a notification entity |
| `/staff/profile` | ResourcePage | profile | MISSING API | expects `/staff/profile` | no | Use `/api/v1/me` instead |

SSE `/staff/events` — **no web consumer**.

Screenshots: `11-staff-my-work.png`, `12-staff-department-queue.png`, `13-staff-my-work-mobile.png`.

---

## Guest portal

| Path | Source | Status | APIs used | Persist | Notes |
|------|--------|--------|-----------|---------|-------|
| `/g/[token]` | `GuestPortal.tsx` | PARTIAL | from-qr, schedules, announcements, tickets, categories, portal-content, chat, prepare/confirm, voice | tickets/chat yes | Cabin copy hardcoded |

Unused guest APIs in UI: confirm-completion, reopen, PATCH locale, GET me (partial).

Screenshots: `14-guest-home.png`, `15-guest-requests.png`, `16-guest-invalid-qr.png`.

---

## API catalog (grouped)

### Public / meta
- `GET /health`, `/ready`, `/metrics`
- `GET /api/v1/meta/seed` (dev + `ALLOW_DEMO_SEED`)
- `GET /api/v1/voice/capabilities`

### Auth
- `POST /api/v1/auth/login|logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/password-reset/request|confirm`

### Guest
- sessions/from-qr, me, locale, chat, schedules, announcements  
- tickets prepare/confirm/list + confirm-completion/reopen  
- request-categories, portal-content  
- voice sessions / ephemeral / heartbeat / lifecycle / end + WS

### Staff
- tickets list/get/status/notes/messages  
- my-work, department-queue, lookup, notifications, shift-activity  
- handover CRUD  
- events / events/since  
- `GET /api/v1/me`

### Admin (repos) — `admin.ts`
- home, brand draft/publish/rollback, knowledge, **ai-settings (static)**, prompts, team, audit, analytics  
- qr create/revoke/rotate

### Admin (phase0) — `phase0.ts`
- overview, requests (+ bulk, notes, assign/priority/escalate)  
- departments, categories, journeys, guests (+assign-cabin), cabins/rooms, announcements  
- portal-content, settings, qr list/scan, staff

Registration: `apps/api/src/server.ts` (auth → guest → staff → admin → phase0 → voice → realtime).

---

## Responsive / a11y / command palette

| Feature | Status | Evidence |
|---------|--------|----------|
| Console shell + sidebar | PARTIAL | `ConsoleShell.tsx` |
| Mobile drawer | PARTIAL | CSS `console.css`; mobile staff screenshot |
| Command palette ⌘K | PARTIAL | nav jump only, no auth |
| Loading/Empty/Error | PARTIAL on specialized pages; ResourcePage has basics | components |
| Keyboard beyond palette | UNKNOWN / limited | not systematically tested this audit |
