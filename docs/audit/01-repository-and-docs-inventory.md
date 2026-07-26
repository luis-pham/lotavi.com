# 01 — Repository and documentation inventory

**Audit date:** 2026-07-27 · **Repo:** `/Users/huypq/Documents/Projects/lotavi` @ `1d2ae69`

---

## 1. Repository discovery

| Item | Finding | Evidence |
|------|---------|----------|
| Cursor workspace `…/lotiva` | **Not a git repo**; only `scripts/` stub | `git -C …/lotiva` → fatal |
| Actual product git root | `/Users/huypq/Documents/Projects/lotavi` | `.git` present |
| Remote | `git@github.com:luis-pham/lotavi.com.git` | `git remote -v` |
| Package manager | **pnpm** `11.11.0` | root `package.json` `packageManager` |
| Node | `>=22` | `engines` |
| Monorepo | pnpm workspaces + Turbo | `pnpm-workspace.yaml`, `turbo.json` |
| Apps | `apps/api`, `apps/web`, `apps/worker`, `apps/embedding-service` | directory listing |
| Packages | `domain`, `application`, `contracts`, `infrastructure`, `design-tokens`, `design-system`, `ui` | `packages/` |
| Docs | `docs/`, `lotiva-production-ready-docs/` (~200 MD files) | inventory below |
| DB / migrations | Drizzle SQL under `packages/infrastructure/drizzle/` (`0000`–`0009`) | listed |
| Schema ORM | `packages/infrastructure/src/db/schema.ts` | |
| Tests | vitest root config; Playwright under `apps/web/e2e/` | `vitest.config.ts` |
| Env examples | `.env.example` | |
| Build scripts | `pnpm build`, `typecheck`, `lint`, `test`, `db:*` | `package.json` |
| Infra | `infra/compose/` including `docker-compose.hostinger.yml` | |
| Deploy scripts | `scripts/hostinger-*.sh` | |

### Root scripts (exact)

```text
build, dev, lint, typecheck, test, db:generate, db:migrate, db:seed,
build:packages, dev:api, knowledge:reembed, format
```

---

## 2. Documentation corpus map

| Area | Approx count | Role |
|------|-------------:|------|
| Root `README.md` | 1 | Canonical repo entry (Lotavi / lotavi.com) |
| Brand HTML (root + brandkit duplicate) | 2 | Brand guidelines (name **Lotiva**) |
| Phase 0 PDF (root + sources duplicate) | 2 | Legacy scope source (text not extracted) |
| `lotiva-production-ready-docs/**` | ~120 | Approved product/architecture pack (mixed aspirational) |
| `docs/voice/**` | 6 | **Canonical voice SoT** |
| `docs/architecture/adr/` | 1 | Direct Gemini browser ADR |
| `docs/production-readiness/**` | 43 | Pilot / F7 / F8 evidence |
| `docs/voice-direct-migration/**` | 29 | Legacy migration audit trail |
| `docs/domain-localization/**` | 6 | Domain/locale |
| `docs/phase0-evidence/*.png` | 16 | Phase 0 UI screenshots (memory) |
| This audit | `docs/audit/**` | Current-state audit (this pack) |

Declared pack priority: `lotiva-production-ready-docs/00-governance/documentation-map.md`  
**Exception:** voice → prefer `docs/voice/*`.

---

## 3. Likely canonical vs legacy

| Question | Prefer | Status |
|----------|--------|--------|
| Repo entry | `README.md` | Canonical |
| Voice on/off / real? | `docs/voice/current-status.md` | Canonical |
| Phase 0 nav | `…/02-experience/information-architecture.md` + phase0 screen contracts | Canonical for ops IA |
| Phase 0 verify | `…/12-delivery/phase0-verification-report.md` | Canonical CONDITIONAL PASS |
| Pilot ship status | `docs/production-readiness/executive-status.md` | Canonical pilot |
| Glossary nouns | `…/00-governance/glossary.md` | Spec — **conflicts with Journey/`rooms` code** |
| F0–F5 “done” board | `…/12-delivery/execution-roadmap.md` | Legacy-leaning overclaim |
| Pack voice/WS relay | bannered files under pack | Legacy |
| `docs/voice-direct-migration/*` | audit trail only | Legacy |
| Original Phase 0 PDF | historical | Legacy |

---

## 4. Explicit documentation contradictions

### Journey vs Stay / Voyage

| Source | Claim |
|--------|--------|
| Glossary / ER | Stay context + Voyage — no “Journey” |
| Phase 0 IA / admin UI / table | **Journeys** + `journeys` |
| Seed | journey named “Current stay” |
| Code also has | `guest_stays` |

### Cabin vs Room

| Source | Claim |
|--------|--------|
| Phase 0 UI/API | Cabins / `/admin/cabins` / `assign-cabin` |
| Schema / pilot runbook | `rooms`, rooms 1208/1209 |
| Glossary | Room/Cabin dual |

### Vessel vs Property

| Source | Claim |
|--------|--------|
| Domain | **Property** is tenancy unit |
| Voice/ops docs | Vessel network (Green Ruby) — not a table |

### Phase 0 scope (three definitions)

1. Original Inform+Serve including voice (`phase-0-product-scope.md`)
2. F0–F5 engineering slices including Brand Studio / voice gateway (`execution-roadmap.md`)
3. 2026-07-26 Ops Console IA (Brand Studio / payments out)

### Portal Content vs Portal Builder / Brand Studio

- Phase 0 nav: Portal Content; Full Brand Studio **out**
- F1 reports: Brand Studio draft/publish **done**
- No formal “Portal Builder” name in code

### Operations Console vs Product Admin

- Phase 0: narrow ops + basic org/settings
- Pack personas/screens: Knowledge, Brand Studio, Prompts, AI Settings, Analytics, Audit

### Mock vs real API

- “Done/PASS” often = memory or local conditional
- Postgres E2E / real embeddings / real Gemini often BLOCKED or NOT RUN
- Production ready endpoint currently reports `store:postgres` (health evidence 2026-07-27)

### Brand / domain

- Pack/HTML: **Lotiva** / lotiva.vn vs public **Lotavi** / lotavi.com

### Ticket states

- Domain docs: `new→accepted→…→guest_confirmed`
- Phase 0 runtime map: `submitted→acknowledged→in_progress→resolved` (+ UI aliases)

---

## 5. Hotel / resort in docs

- README and brand: hotels / resorts / cruises
- Voice vertical prompts: `cruise.md`, `hotel.md` (planned)
- Phase 0 ops IA: **cruise-biased nouns** (Cabins, Journeys)
- No Resort profile document as implemented product

---

## 6. Inventory completeness note

Full per-file table for ~208 documents is summarized in agent research during this audit; high-signal files are listed above. Stale index: `lotiva-production-ready-docs/00-governance/file-index.md` omits later phase0-* contracts/gap/verify files.
