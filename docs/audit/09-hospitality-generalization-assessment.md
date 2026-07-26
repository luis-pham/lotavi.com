# 09 — Hospitality generalization assessment

**Audit date:** 2026-07-27  
**Goal:** Assess difficulty of Cruise + Hotel + Resort — **do not implement**.

Classes: Reusable unchanged · Reusable with terminology configuration · Requires moderate refactor · Requires schema migration · Requires new capability · Should remain profile-specific

---

## 1. Subsystem assessment

| Subsystem | Classification | Notes |
|-----------|----------------|-------|
| Operations Console | Reusable with terminology configuration | Requests/depts/staff generic; fix ResourcePages first |
| Staff Console | Reusable with terminology configuration | My Work/queue generic; cabin lookup → unit lookup |
| Request workflow | Reusable unchanged (core) | Status machine hospitality-neutral |
| Guest Portal | Reusable with terminology configuration | Hardcoded Cabin/Welcome aboard → profile strings |
| QR and access | Reusable with terminology configuration + moderate refactor | Defaults qr_level; dual cabin/rooms API |
| Guests | Reusable unchanged | `guests` + stays |
| Cabins/Rooms/Villas | Moderate refactor + later schema for villa/building | Today = `rooms`; resort needs extension |
| Journey/Stay/Reservation | Moderate refactor (naming/docs) | `journeys`+`guest_stays` ≈ stay period; reservation fields thin |
| Announcements | Reusable with terminology configuration | Change target defaults per profile |
| Departments / categories | Reusable unchanged | Seed packs per profile |
| Portal CMS | Requires new capability | Thin portal_content ≠ Builder |
| Knowledge Base | Reusable unchanged (model) + new capability (admin UX/real embed) | |
| AI configuration | Requires new capability | Mock settings today |
| Voice | Requires new capability + remain profile/network-specific | Vessel Wi‑Fi concerns cruise-specific |
| Analytics | Requires new capability | Thin aggregates API, no Phase 0 UI |

---

## 2. Vertical difficulty

### Cruise (current bias)
- **Effort to keep working:** Low if no rename churn.  
- **Gaps:** Deep cruise domain (itinerary, tender, embark) **not** modeled — only light flavors.  

### Hotel
- **Effort:** Moderate.  
- Mostly terminology + defaults + wire `vertical`.  
- Schema already defaults `vertical: hotel` and uses `rooms`.  
- Risk: shipping hotel demo with Cabin UI.  

### Resort
- **Effort:** Higher.  
- Needs accommodation typing (villa/room), possibly building/zone hierarchy, longer-stay semantics.  
- Can start as Hotel profile + unit types before full resort IA.  

---

## 3. What must stay profile-specific

- Voice network assumptions (vessel/ship Wi‑Fi)  
- Prompt vertical packs (cruise vs hotel language)  
- Default portal welcome copy / activity framing  
- QR level vocabulary (cabin vs room vs area)  
- Optional deck vs floor labeling  

---

## 4. What should not be changed yet

- Ticket aggregate and transition rules  
- QR opaque token hashing model  
- Tenant/property RLS direction  
- Hostinger deploy topology  

---

## 5. Risk summary for generalization

| Risk | Severity |
|------|----------|
| Docs noun conflict (Journey/Voyage/Stay) during refactor | High (process) |
| Dual API cabins+rooms without deprecation policy | Medium |
| Premature table renames breaking prod | High |
| Building Portal Builder before ops stable | High (scope) |
| Enabling voice during generalization | High (safety) |

**Overall:** Hotel support is **feasible without schema rewrite** if terminology configuration is introduced carefully. Resort and full AI/Voice productization are **separate capability tracks**, not “label swaps.”
