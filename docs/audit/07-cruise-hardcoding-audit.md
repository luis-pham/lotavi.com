# 07 — Cruise hardcoding audit

**Audit date:** 2026-07-27  
**Search terms:** vessel, cruise, cabin, journey, deck, itinerary, embark, disembark, tender, activity schedule, activeJourney, journeyId, cabinId, vesselId (+ hotel, resort, villa, stay, reservation)

---

## 1. Terms with no product-code hits

`vesselId`, `cabinId`, `activeJourney`, `embark`, `disembark`, `tender`, `itinerary`, `villa`, `resort` (as identifiers), `activity schedule` as code identifier.

`vessel` appears in **docs** (Green Ruby / voice network), not schema.

---

## 2. Highest-risk hardcoding

| Risk | Class | Evidence | Why high risk |
|------|-------|----------|---------------|
| API `/admin/cabins` + `assign-cabin` over `rooms` | API contract / business logic | `apps/api/src/routes/phase0.ts`, `ops.ts` | Hotel clients inherit cruise paths |
| Guest copy “Cabin …” | Display | `GuestPortal.tsx` | Guest-facing wrong vertical |
| `qr_level` default `'cabin'` | Database constraint/default | `schema.ts`, `0009_phase0_ops.sql` | All properties get cruise default |
| Announcement target default `current_journey` | Schema default | schema / 0009 | Hotel stay targeting wrong noun |
| Admin nav Cabins / Journeys | Route structure / display | `apps/web/src/lib/nav.ts` | Product language cruise-first |
| `properties.vertical` unused | Business logic gap | schema + seed write-only | Cannot switch terminology |
| Overview expects `cabins` KPI | Display / API assumption | `OverviewPage.tsx` vs overview API | UI/API drift |

---

## 3. Classification catalog (product code)

### Schema / migration
- `journeys`, `journey_id` — schema
- `rooms.deck` — schema (cruise-leaning optional)
- `qr_level` default cabin — schema
- `announcements.target` default current_journey — schema
- `properties.vertical` default hotel — schema (unused switch)

### API / routes
- `/admin/cabins`, `/admin/rooms` dual — API/route
- `assign-cabin` / `assignCabin` — API + business logic
- `/admin/journeys` — API/route
- Response preference `cabin` over `roomLabel` in drawer — display + contract assumption

### Business logic
- Journey CRUD, assignCabin, announcement defaults — `ops.ts`
- Seed portal “Welcome aboard”, journey “Current stay” — seed
- QR resolve `stayContextId: null` — business logic gap

### Display (scattered; **not** in product i18n)
- Nav + ResourcePage titles Cabins/Journeys
- GuestPortal Cabin strings
- Staff lookup copy mentioning cabins
- Marketing i18n mentions hotels/cruises/decks (`apps/web/src/i18n/messages/*`) — marketing only

### Seed / demo / test
- Seed `vertical: "hotel"` + Green Ruby naming — seed
- Knowledge “pool deck” — seed
- E2E expects `/cabins`, `/journeys` labels — test
- Eval corpus “drive the cruise ship?” — test/seed

### Harmless
- “core journey” wording in e2e titles (flow sense)
- Docs-only vessel network language

---

## 4. Centralization assessment

| Layer | Centralized? |
|-------|----------------|
| Marketing copy | Partially via i18n messages |
| Admin/staff/guest product UI | **No** — hardcoded English cruise nouns |
| API paths | **No** — cabin/journey embedded |
| Schema | Mixed neutral + cruise-leaning defaults |
| Vertical prompts | Docs only (`prompts/voice/verticals/*`) |

**Verdict:** Terminology is **scattered**. No runtime terminology resolver. Hotel seed + cruise UI is the active inconsistency.

---

## 5. Permission / route structure cruise bias

- No permission rules keyed on cruise.
- Route structure `/admin/cabins` is cruise-named but role gates are generic admin/configAdmin.

---

## 6. Recommended non-action (for this audit)

Do **not** mass-rename tables now. Record as: overlay terminology + fix defaults + wire `vertical` later (see `10-recommended-migration-sequence.md`).
