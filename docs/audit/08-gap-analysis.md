# 08 — Gap analysis

**Audit date:** 2026-07-27  
**Classes:** Complete · Partially implemented · UI only · Backend only · Mocked · Missing · Incorrect model · Blocked · Unknown

---

## 1. Major capability classifications

| Capability | Class |
|------------|-------|
| Monorepo + deploy path | Partially implemented (prod up) |
| Guest QR session + chat + request create | Partially implemented |
| Staff My Work status workflow | Partially implemented |
| Admin requests ops | Partially implemented |
| Admin generic ResourcePages (settings/QR/staff/cabins) | UI only / Incorrect contract |
| Staff profile | UI only (API missing) |
| Admin assign | Backend only |
| Guest confirm-completion / reopen | Backend only |
| Brand Studio | Backend only (no Phase 0 UI) |
| Knowledge admin | Backend only + embedding often stub |
| AI settings | Mocked |
| Portal Builder | Missing |
| Voice product admin / playground | Missing (runtime safety Partial; prod Blocked) |
| Intent/handover AI rules | Missing |
| Property profiles Cruise/Hotel/Resort | Missing (Incorrect model: unused vertical) |
| SLA dueAt engine | Missing |
| ticket_events timeline | Missing writers (schema only) |
| Next.js route auth | Missing |
| Postgres Playwright E2E | Unknown / not run (Blocked by process) |
| Real EmbeddingGemma | Blocked (F8) |
| Real Gemini voice smoke | Blocked |

---

## 2. Prioritized gaps

### P0 — Blockers to a credible demo

1. **Broken console forms** that look real but fail: Settings, Staff create, QR CRUD, Cabins create/delete, Staff Profile.  
2. **Document honest demo script** (staff self-assign via Accept; memory vs postgres).  
3. **Guest-facing “Cabin” copy** when demoing hotel-branded seed.  
4. **Prove one postgres UI lifecycle** (or clearly label memory-only).  

### P1 — Blockers to pilot deployment

1. Postgres Playwright E2E (`RUN_E2E=1`) green.  
2. Admin assign UI **or** explicit SoT that staff accept is the only assign path.  
3. Dedicated Settings + QR management UIs matching APIs.  
4. Client or middleware auth for `/admin` `/staff` (defense in depth).  
5. Migration `0009` confirmed on all envs; seed/idempotency documented.  
6. SLA/dueAt or remove SLA claims from UI copy.  
7. Realtime notifications: either wire SSE UI or remove “live” claims.  

### P2 — Blockers to multi-property / multi-vertical rollout

1. Canonical terminology + `properties.vertical` behavior.  
2. Hotel profile defaults (labels, qr_level, announcement targets).  
3. Tenant/property admin UX beyond single-property seed.  
4. Portal Content → real CMS / Portal Builder.  
5. Knowledge + grounded answering with real embeddings.  
6. Stronger RLS test evidence in CI (currently skipped without DB).  

### P3 — Later enhancements

1. Voice configuration + playground (after gates).  
2. Intent mapping / AI tool permissions productization.  
3. Resort villa/building model.  
4. Access analytics / QR print templates.  
5. Full Product Admin (Brand Studio nav, prompts editor, audit UI).  
6. Payments/PMS/integrations (explicitly out of Phase 0).  

---

## 3. What not to do next

- Do not implement Hotel+Resort+Voice+Portal Builder in one milestone.  
- Do not rewrite schema names for cosmetic cruise→hotel rename.  
- Do not treat pack “F0–F5 done” as current product truth.  

---

## 4. Mapping to audit labels

| Gap theme | Label |
|-----------|-------|
| Core request spine | PARTIAL |
| ResourcePage mismatches | UI only / Incorrect model |
| AI settings | MOCKED |
| Portal Builder / profiles / voice admin | MISSING |
| Gemini / EmbeddingGemma real | BLOCKED |
| Postgres E2E | UNKNOWN (not executed) |
