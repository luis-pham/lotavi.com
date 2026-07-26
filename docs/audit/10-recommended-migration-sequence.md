# 10 — Recommended migration sequence

**Audit date:** 2026-07-27  
**Nature:** Planning only — **do not implement** without explicit approval.

Priorities match the requested order, adjusted by audit evidence (stabilize before expand).

---

## Sequence

### 1. Stabilize current working behavior *(next milestone)*

- Fix ResourcePage ↔ API mismatches: settings, QR, staff create, cabins, portal-content, staff profile.  
- Decide assign SoT (admin UI vs staff-accept-only) and document.  
- Run Playwright `RUN_E2E=1` against postgres; capture evidence.  
- Add minimal route protection for `/admin` `/staff` HTML shells.  
- Keep production voice **off**.  

**Exit:** Credible postgres demo of QR → request → staff complete → guest status.

### 2. Establish canonical documentation

- One Phase 0 scope doc superseding pack conflicts (pointer file).  
- Freeze Journey/Stay/Cabin/Room vocabulary decision for code+docs.  
- Banner or supersede execution-roadmap overclaims and voice-historical pack pages.  
- Keep `docs/voice/*` as voice SoT.  

**Exit:** Agents/humans have one reading order without contradictions on Phase 0.

### 3. Introduce shared Hospitality Core abstractions *(design, thin code)*

- Terminology resolver interface driven by `properties.vertical` (and later profile packs).  
- Neutral domain names in application layer; profile labels at edges.  
- **No** mass table renames.  

**Exit:** Design ADR + small library stub; cruise behavior unchanged.

### 4. Preserve current cruise behavior

- Cruise profile = current strings/defaults (cabin, journey, deck).  
- Regression suite locks guest/staff/admin cruise labels where intended.  

### 5. Correct QR and access model

- Dedicated QR admin UI: create, assign room, revoke, rotate, expiry, scan stats.  
- Align `qr_level` defaults with profile.  
- Wire stay/journey context into session open (`stayContextId` today null).  

### 6. Add Portal Builder and branding

- Elevate portal_content beyond ResourcePage.  
- Section order/visibility + live preview.  
- Reconnect Brand Studio APIs to a deliberate nav item (or fold into Builder).  

### 7. Add Knowledge Base and AI configuration

- Admin KB UI over existing APIs.  
- Replace static ai-settings.  
- Real embeddings when F8 blockers cleared.  
- Intent mapping / unanswered later in same track.  

### 8. Add Voice configuration and playground

- Only after `docs/voice` gates pass.  
- Admin enablement, limits, test console.  
- No production enablement by default.  

### 9. Add Hotel profile

- Terminology pack: Room, Stay, Floor.  
- Default seeds for hotel departments/categories/portal.  
- Demo property with `vertical=hotel` and hotel UI labels.  

### 10. Add Resort profile

- Unit types (villa/room), optional building/zone.  
- Resort seed pack + IA tweaks.  

---

## Explicit non-goals until step 1 exits

- Multi-vertical marketing rewrite  
- Payments / PMS / folios  
- Production voice  
- Schema rename migrations for cosmetic terms  

---

## Suggested approval gate

Ask for approval only on **Step 1** next. Do not start Steps 2–10 in the same change set.
