# Lotavi current-state audit — Executive summary

**Audit date:** 2026-07-27  
**Git root:** `/Users/huypq/Documents/Projects/lotavi`  
**HEAD:** `1d2ae69` (`origin/main`, GitHub `luis-pham/lotavi.com`)  
**Workspace note:** Cursor workspace path `…/lotiva` is a non-git stub; real code is `…/lotavi`.

**Labels used:** VERIFIED · PARTIAL · MOCKED · MISSING · INCORRECT MODEL · UNKNOWN

---

## Clear answers

### What is truly complete?

| Area | Status | Evidence |
|------|--------|----------|
| Monorepo scaffold (web/api/worker/embedding + packages) | VERIFIED | `apps/*`, `packages/*`, `pnpm-workspace.yaml` |
| Guest QR → session → chat → prepare/confirm ticket | PARTIAL→near VERIFIED on code path | `GuestPortal.tsx`, `guest.ts`, ticket repos |
| Staff My Work accept/start/complete + domain transitions | PARTIAL | `MyWorkPage.tsx`, `staff.ts`, `domain/ticket.ts` |
| Admin requests list/board/drawer + notes | PARTIAL | `RequestsPage.tsx`, `phase0.ts` |
| Auth login + server RBAC on APIs | PARTIAL | Cookie staff/guest; no Next middleware gate |
| Postgres schema + migrations through `0009_phase0_ops` | VERIFIED (schema exists) | `packages/infrastructure/drizzle/` |
| Production Hostinger deploy (postgres store, voice off) | VERIFIED (health) | `evidence/05-prod-health.txt` — `store:postgres` |
| Marketing locale site | VERIFIED | `apps/web` `[locale]`, middleware tests |
| Local typecheck + build + root vitest | VERIFIED this audit | `evidence/01|02b|04` |

### What is only UI?

- Several Admin/Staff pages are generic `ResourcePage` shells over mismatched APIs: **Settings, Cabins create/delete, Staff create, QR CRUD, Staff Profile**.
- Staff department-queue / lookup / notifications are thin tables, not the full UX contracts.
- Admin Overview “Cabins” KPI expects fields the overview API does not return.

### What is mocked?

| Item | Evidence |
|------|----------|
| `GET /api/v1/admin/ai-settings` static object | `apps/api/src/routes/admin.ts:157–165` |
| Staff message `translateDemo` | `apps/api/src/routes/staff.ts` (~185) |
| Embedding service stub (not real EmbeddingGemma weights) | prod-readiness F8 embedding BLOCKED |
| Voice media / Gemini smoke | `docs/voice/current-status.md` — BLOCKED / not production |
| Phase 0 screenshot + lifecycle verification ran on **memory** | `phase0-verification-report.md` CONDITIONAL PASS |
| LocalStorage `lotiva-*-authed` flags unused for gating | admin/staff login pages |

### What is missing?

- Full **Portal Builder** (section ordering/live preview beyond thin `portal_content`)
- **Knowledge Base / AI config / Intent mapping / Handover rules** product admin UIs (APIs partial)
- Production-ready **Voice** config + playground
- Property-type profiles (Cruise/Hotel/Resort) — `properties.vertical` unused
- Guest confirm-completion / reopen UI
- Admin assign UI (API exists)
- SLA → `dueAt` calculation
- Client/route protection for `/admin` `/staff`
- Playwright Postgres E2E not run in Phase 0 or this audit
- Dedicated notification entity + SSE UI
- `ticket_events` writers (schema only)

### Does the end-to-end request workflow work?

**PARTIAL.**

Code path exists for both memory and postgres:

`QR session → prepare → confirm (submitted) → admin/staff list → staff status (acknowledged → in_progress → resolved) → guest ticket list`

**Verified in prior session** via memory API smoke + screenshots (`docs/phase0-evidence/`, `phase0-verification-report.md`).  
**Not re-executed** as Playwright against postgres in this audit. Production `/ready` reports postgres OK, but full guest→staff→guest UI lifecycle on prod was **not** exercised here.

Gaps in the “claimed” Phase 0 story: admin assign UI missing; guest completion confirm UI missing; no guest-visible notes; no SLA due dates; timeline is `ticket_transitions` + notes, not `ticket_events`.

### Are KB, AI, Voice, Portal Builder, QR Access actually implemented?

| Capability | Status |
|------------|--------|
| Knowledge Base | PARTIAL — schema + admin API upload; no Phase 0 admin nav UI; embedding often stub |
| AI Chat Configuration | MOCKED/MISSING — ai-settings static; no config console |
| Voice | PARTIAL control-plane / safety; production **disabled** (`voiceEnabled:false`) |
| Portal Builder | MISSING as product; thin **Portal Content** CRUD PARTIAL |
| QR & Guest Access | PARTIAL — create/revoke/rotate APIs exist; Phase 0 QR page is ResourcePage mismatch; guest from-qr works |

### Is the code currently cruise-specific?

**PARTIAL / cruise-biased UI + API naming on a mostly neutral schema.**

- Tables: `rooms`, `guest_stays`, `properties.vertical` default `'hotel'`
- Product UI/API: Cabins, Journeys, `assign-cabin`, `qr_level` default `cabin`, guest copy “Cabin”
- No Vessel / Villa / Resort entities
- Terminology **not** centralized by vertical

### How risky is hotel/resort support?

**Moderate for Hotel** if terminology + defaults are profiled (schema mostly reusable).  
**Higher for Resort** (villas/buildings) — needs model extension.  
**Highest risk:** shipping hotel UI while cabin/journey language and defaults remain hardcoded; dual docs (Journey vs Voyage/Stay) will confuse implementers.

### What should be preserved?

- Ticket state machine + prepare/confirm + staff transitions
- Tenant/property scoping + RLS direction
- Guest QR opaque token model
- Phase 0 ops tables (departments, categories, notes, handover)
- Voice **off-by-default** safety gates
- Marketing/domain localization work
- Hostinger localhost-bind + nginx coexistence pattern

### What should be refactored? (later — not now)

- Canonical terminology layer (Accommodation Unit / Stay Period) with cruise profile labels
- ResourcePage vs real API contracts
- Unify Journey vs StayContext / Voyage docs with code
- Wire or remove dead APIs/screens (profile, ticket_events, unused admin brand screens)

### What must be built next?

Stabilize Phase 0 ops on postgres (fix ResourcePage mismatches, assign UI or document staff-self-assign, E2E postgres, settings/QR/staff forms) **before** Portal Builder / KB / Voice productization / multi-vertical.

### What must not be changed yet?

- Do not rename `rooms`/`tickets` tables or rewrite the modular monolith
- Do not enable production voice
- Do not delete Brand Studio / knowledge API surfaces while “cleaning” Phase 0 nav
- Do not start Hotel/Resort profile implementation until canonical docs + terminology decision exist

---

## Top findings (compressed)

1. Real git product is `lotavi`, not workspace stub `lotiva`.
2. Phase 0 ops console is the newest product surface; pack docs describe a larger Product Admin.
3. Core request spine is real API + persistence-capable; several console pages are UI shells.
4. Permissions are server-side on API only — pages are not route-guarded.
5. Docs contradict on Phase 0 scope, Journey/Stay, Cabin/Room, Portal Content vs Brand Studio.
6. Cruise bias is mostly presentation/API naming; schema is hospitality-leaning.
7. KB/AI/Voice/Portal Builder are not deployable product features today.
8. Production is live on postgres with voice off; Phase 0 E2E on postgres still unproven in automation.
9. `properties.vertical` is write-only — no profile system.
10. Build/typecheck/root tests pass; package-level `pnpm -r test` is a tooling footgun.

---

## Recommended single next milestone

**Stabilize Phase 0 Ops Console on Postgres (no new product domains):** fix ResourcePage/API mismatches (settings, QR, staff, cabins), add admin assign or document staff-self-assign as SoT, run `RUN_E2E=1` postgres Playwright, publish one canonical Phase 0 doc index that supersedes conflicting scopes.

Do not start hospitality generalization or Portal Builder until that milestone is approved.
