# 03 — Capability matrix

**Audit date:** 2026-07-27  
**Status legend:** VERIFIED · PARTIAL · MOCKED · MISSING · INCORRECT MODEL · UNKNOWN

Columns: Capability | Docs | UI | API | Schema | Persistence | Permissions | Tests | Status | Evidence | Recommended action

---

## Operations

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| Overview | Y | Y | Y | derived | read | API | e2e smoke | PARTIAL | `OverviewPage.tsx`, `phase0.ts` overview; KPI field mismatch | Align UI KPIs to API |
| Request list | Y | Y | Y | tickets | Y | API | e2e | PARTIAL | `RequestsPage.tsx` | Keep; enrich assignee names |
| Request board | Y | Y | Y | tickets | Y | API | e2e toggle | PARTIAL | BoardView; no DnD | Optional DnD later |
| Request detail | Y | drawer | Y | tickets+notes | Y | API | unit/e2e | PARTIAL | `RequestDrawer.tsx` | Add assign control |
| Assignment | Y | **N** | Y | assigneeId | Y | API | — | PARTIAL | `PATCH .../assign` unused by UI | Wire UI or SoT=staff accept |
| Accept | Y | Y staff | Y | transition | Y | API | e2e | PARTIAL | `MyWorkPage` + `staff.ts` | Stabilize postgres E2E |
| Start | Y | Y | Y | transition | Y | API | e2e | PARTIAL | same | same |
| Pause | Y | waiting | Y | waiting_guest/external | Y | API | — | PARTIAL | status map in staff.ts | Clarify UX label vs domain |
| Complete | Y | Y | Y | →resolved | Y | API | e2e | PARTIAL | UI “completed”→resolved | Document mapping |
| Escalation | Y | Y | Y | escalated | Y | API | — | PARTIAL | staff escalate flag | Keep |
| Bulk actions | Y | Y | Y | updateTicket | Y | API | — | PARTIAL | bulk PATCH | Verify postgres |
| Internal notes | Y | Y | Y | ticket_notes | Y | API | unit | PARTIAL | visibility default internal | Keep |
| Guest-visible updates | Y | N notes | list status | tickets | status only | guest | — | PARTIAL | no guest notes API | Decide product need |
| SLA | Y | display if dueAt | patch dueAt | dueAt + defaults | **defaults not applied** | — | — | MISSING calc | ops seed SLA minutes | Implement dueAt on create |
| Audit timeline | Y | thin shift activity | transitions | ticket_transitions; **ticket_events unused** | transitions | API | — | PARTIAL | schema events dead | Use transitions or wire events |
| Notifications | Y | thin unread | GET | tickets.unreadStaff | flag | API | — | PARTIAL | not notification entity | Define entity or rename |
| Staff workspace | Y | Y | Y | — | Y | API | e2e | PARTIAL | MyWork | Fix profile |
| Department queue | Y | thin | Y | tickets | read | API | — | PARTIAL | ResourcePage | Dedicated queue UX |
| Shift handover | Y | Y | Y | handover_notes | Y | API | — | PARTIAL | CRUD ResourcePage | Keep |

## Guest experience

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| Guest Portal home | Y | Y | session+content | sessions, portal_content | Y | guest | screenshots | PARTIAL | `GuestPortal.tsx` | Verticalize labels |
| Quick requests | Y | Y | prepare/confirm | pending+tickets | Y | guest | API smoke | PARTIAL | guest.ts | Postgres E2E |
| Active requests | Y | Y | GET tickets | tickets | Y | guest | — | PARTIAL | list + STATUS_LABEL | Polling optional |
| Request status | Y | Y | GET | status | Y | guest | memory smoke | PARTIAL | no live push | |
| Announcements | Y | Y | Y | announcements | Y | guest | — | PARTIAL | | |
| Explore / schedules | Y | Y | schedules | schedules | Y | guest | — | PARTIAL | | |
| Mobile navigation | Y | Y | — | — | — | — | screenshot | PARTIAL | tabs in GuestPortal | |
| Guest identity/context | Y | room label | session | guest_sessions | Y | QR | — | PARTIAL | stayContextId always null | Wire journey/stay |
| Expired access | Y | Y | reject | QR/session | — | — | screenshot invalid QR | PARTIAL | | |

## Product administration

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| Property settings | Y | broken ResourcePage | GET/PUT | property_settings | Y if PUT used | configAdmin | — | PARTIAL | settings page mismatch | Dedicated settings form |
| Branding / logo / colors | Y Brand Studio | **N Phase0** | brand draft APIs | theme tables | Y via API | admin | F1 claims | PARTIAL | admin.ts brand | Out of Phase0 nav |
| Banner management | Y | N | N dedicated | — | — | — | — | MISSING | | Portal Builder later |
| Portal Builder | aspirational | N | N | — | — | — | — | MISSING | | Milestone later |
| Section ordering/visibility | Phase0 portal content | thin CRUD | portal-content | portal_content | PARTIAL | configAdmin | — | PARTIAL | ResourcePage mismatch | Fix verbs |
| Live portal preview | Y | N | N | — | — | — | — | MISSING | | |
| Services/facilities | docs | via portal content | thin | portal_content | PARTIAL | — | — | PARTIAL | | |
| Quick action config | docs | categories | categories | request_categories | Y | configAdmin | — | PARTIAL | | |
| Navigation config | docs | N | N | — | — | — | — | MISSING | | |
| Language config | locale docs | guest locale API unused in UI | PATCH locale | guest_sessions | PARTIAL | guest | unit locale | PARTIAL | | |

## QR and access

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| QR creation | Y | broken ResourcePage | POST /admin/qr | qr_contexts | Y | admin | — | PARTIAL | admin.ts | Wire dedicated UI |
| QR assignment | Y | N | roomId on create | roomId | Y | — | — | PARTIAL | | |
| QR destination | guest `/g/{token}` | Y | from-qr | tokenHash | Y | — | e2e | PARTIAL | | |
| Room/cabin context | Y | Cabin copy | roomId | rooms | Y | — | — | INCORRECT MODEL labels | Terminology layer |
| Area QR | docs | N | qrLevel field | qr_level | unknown use | — | — | PARTIAL | default `cabin` | |
| Guest session | Y | Y | from-qr | guest_sessions | Y | — | e2e | PARTIAL | | |
| Expiration | Y | invalid state | activeUntil/expires | Y | — | — | PARTIAL | | |
| Revocation | Y | N UI | POST revoke | revokedAt | Y | admin | — | PARTIAL | Wire UI | |
| Access analytics | docs | scanCount fields | PATCH scan | scanCount | PARTIAL | — | — | PARTIAL | | |
| Print/download | docs | N | N | — | — | — | — | MISSING | | |

## AI

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| Assistant profile | Y | N | N | prompts? | — | — | — | MISSING | | Later |
| Knowledge Base | Y | N Phase0 | GET/POST knowledge | knowledge_* | PARTIAL | admin | F8 blocked real embed | PARTIAL | admin.ts | Later |
| Document upload | Y | N | POST | docs | PARTIAL | — | — | PARTIAL | | |
| URL ingestion | Y | N | N | — | — | — | — | MISSING | | |
| FAQ editor | Y | N | via knowledge | — | — | — | — | MISSING | | |
| Processing status | Y | N | embedded flag | — | PARTIAL | — | — | PARTIAL | | |
| Retrieval testing | Y | N | chat uses retrieval | hybrid SQL | PARTIAL | — | eval test | PARTIAL | | |
| AI instructions / tone / languages / guardrails | Y | N | prompts API thin | prompt_* | PARTIAL | — | — | PARTIAL | | |
| Handover rules (AI) | Y | N | N | — | — | — | — | MISSING | staff handover ≠ AI rules | |
| Intent detection / mapping | Y | N | chat intent path partial | pending_actions | PARTIAL | — | tickets test | PARTIAL | | |
| Tool/action permissions | Y | N | voice tools N | — | — | — | — | MISSING | voice SoT | |
| Conversation logs | Y | N | messages tables | conversations | PARTIAL | — | — | PARTIAL | | |
| Unanswered questions | Y | N | N | — | — | — | — | MISSING | | |
| Playground | Y | N | N | — | — | — | — | MISSING | | |
| AI settings screen | Y | N | **static mock** | — | N | admin | — | MOCKED | admin.ts:157 | Replace later |

## Voice

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| Enable/disable | Y gates | guest UI gated | capabilities | env flags | env | — | voice tests | PARTIAL | prod voiceEnabled:false | Keep off |
| Provider/model/voice/speed/tone | Y | N admin | N real config | — | — | — | — | MISSING | | Later |
| Barge-in / silence / duration | Y | partial client | session APIs | voice_sessions | PARTIAL | guest | unit safety | PARTIAL | | |
| Transcript / consent / limits / cost | Y | N | N complete | partial fields | — | — | — | MISSING/PARTIAL | voice SoT | |
| Voice test console | Y | N admin | N | — | — | — | — | MISSING | | |
| Real Gemini smoke | Y | — | ephemeral path | — | — | — | BLOCKED | BLOCKED | current-status.md | Do not enable prod |

## Property profiles

| Capability | Docs | UI | API | Schema | Persist | Perms | Tests | Status | Evidence | Action |
|------------|------|----|-----|--------|---------|-------|-------|--------|----------|--------|
| Cruise / Hotel / Resort profiles | prompts | N | N | vertical text | write-only | — | — | MISSING | schema default hotel unused | Design later |
| Terminology resolver | glossary | N | N | — | — | — | — | MISSING | hardcoded Cabin/Journey | |
| Feature flags | config matrix | N | env | — | env | — | — | PARTIAL | voice flags | |
| Default depts/categories/sections | seed | via seed | seedPhase0Extras | tables | Y | — | ops.test | PARTIAL | ops.ts | Profile packs later |
