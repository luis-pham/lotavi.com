# 06 — UI and workflow verification

**Audit date:** 2026-07-27  
**Screenshots:** `docs/audit/evidence/*.png` (copied from `docs/phase0-evidence/`, captured 2026-07-26 on **memory** stack)  
**This audit did not re-run interactive browser E2E.**

---

## 1. App shell

| Criterion | Assessment | Evidence |
|-----------|------------|----------|
| Shell consistency | PARTIAL — shared ConsoleShell for admin/staff | `ConsoleShell.tsx`, `console.css` |
| Sidebar | PARTIAL — nav from `nav.ts` | ADMIN_NAV / STAFF_NAV |
| Responsive drawer | PARTIAL — mobile staff screenshot exists | `13-staff-my-work-mobile.png` |
| Command palette | PARTIAL — ⌘K route jump, unauthenticated | `CommandPalette.tsx` |
| Visual consistency | PARTIAL — design tokens + console CSS; ResourcePages look uniform | packages/design-* |
| Hardcoded display name in layout | MOCKED UX | `ConsoleLayout.tsx` |

---

## 2. Operations UX

| Criterion | Assessment | Evidence |
|-----------|------------|----------|
| Table usability | PARTIAL — DataTable on requests | `DataTable.tsx`, `03-admin-requests-list.png` |
| Board usability | PARTIAL — board toggle; no drag-drop | `04-admin-requests-board.png` |
| Detail drawer | PARTIAL — status + internal notes | `RequestDrawer.tsx` |
| Search / filter / sort | PARTIAL — search + status filter; sort limited | RequestsPage |
| Bulk actions | PARTIAL — accept/complete bulk | RequestsPage |
| Loading / empty / error | PARTIAL on specialized pages | LoadingState / EmptyState / ErrorState |
| Mobile staff | PARTIAL | screenshot 13 |

---

## 3. ResourcePage screens (visual vs functional)

Screenshots show populated tables for guests/cabins/journeys/QR/staff/portal/settings/etc.  
**Visual completeness ≠ CRUD correctness** (see 02/05 mismatches).

| Screen | Screenshot | Functional note |
|--------|------------|-----------------|
| Settings | `10c-admin-settings.png` | GET shape ≠ ResourcePage |
| QR | `08-admin-qr.png` | Create/edit/delete not wired to real verbs |
| Staff | `09-admin-staff.png` | Create body mismatch |
| Cabins | `06-admin-cabins.png` | No POST/DELETE API |
| Profile | (nav only) | API missing — ErrorState expected |

---

## 4. Guest portal UX

| Criterion | Assessment | Evidence |
|-----------|------------|----------|
| Home composition | PARTIAL | `14-guest-home.png` |
| Requests flow | PARTIAL | `15-guest-requests.png` |
| Invalid QR | PARTIAL | `16-guest-invalid-qr.png` |
| Cabin terminology | cruise-biased display | GuestPortal copy |
| Chat / voice entry | chat present; voice gated | GuestPortal + voice flags |

---

## 5. Accessibility / keyboard

| Criterion | Assessment |
|-----------|------------|
| Basics (labels, contrast) | UNKNOWN this audit — pack has a11y docs; no automated a11y run here |
| Keyboard | PARTIAL — palette only verified in code |
| Focus management in drawer | UNKNOWN |

---

## 6. Workflow verification status

| Workflow | Prior evidence | This audit |
|----------|----------------|------------|
| Admin login → overview | screenshots + e2e | not re-run |
| Guest QR → request | memory API + screenshots | code re-traced PARTIAL |
| Staff accept→start→complete | memory API + e2e gated | code re-traced PARTIAL |
| Guest sees resolved | memory API | code path yes; no live re-test |
| Postgres Playwright | NOT RUN (Phase 0 report) | still NOT RUN |
| Production UI login | not exercised | health only |

### Classification for “Phase 0 workflow works E2E”

**PARTIAL** — credible on memory; production postgres store up; full UI E2E on postgres **UNKNOWN/unproven**.

---

## 7. Build/UI artifact check

`pnpm build` succeeded including Next routes for all admin/staff/guest paths (`evidence/04-build.txt`).
