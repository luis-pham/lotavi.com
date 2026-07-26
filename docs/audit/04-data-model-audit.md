# 04 — Data model audit

**Source of truth:** `packages/infrastructure/src/db/schema.ts`  
**Migrations:** `packages/infrastructure/drizzle/0000_init.sql` … `0009_phase0_ops.sql`

---

## 1. Migration timeline

| Migration | Adds |
|-----------|------|
| 0000 | Core tenancy, rooms, QR, sessions, themes, conversations, knowledge, schedules, announcements, tickets, voice, prompts, audit, RLS seeds |
| 0001 | app_meta |
| 0002–0005 | production foundations, transitions RLS, F7 auth/outbox/FTS, normalize |
| 0006 | pgvector column |
| 0007–0008 | voice session safety + heartbeat |
| 0009 | **Phase 0 ops:** departments, categories, journeys, guests, guest_stays, notes, handover, property_settings, portal_content; ticket/user/room/QR/announcement extensions |

---

## 2. Entity catalog (important)

Scoping: **T** = tenant_id, **P** = property_id.

| Concept (product) | Table / type | Path | Key fields | FKs | Lifecycle | Cruise-specific? | Hotel/resort readiness |
|-------------------|--------------|------|------------|-----|-----------|------------------|------------------------|
| Tenant | `tenants` | schema.ts | name, slug | — | — | No | Ready |
| Property | `properties` | schema.ts | name, **vertical** default `hotel` | → tenants | — | Vertical unused | Ready; wire vertical |
| Vessel | — | — | — | — | — | Docs only | N/A |
| Hotel / Resort | — | via `vertical` | — | — | — | Not first-class | Extension via profile |
| Accommodation unit | `rooms` | schema.ts | label, deck, zone, active | T+P | active flag | deck cruise-leaning | Ready as room/villa base |
| Cabin (UI) | same `rooms` | API `/cabins` | — | — | — | **Label/API only** | Alias layer |
| Deck / Floor / Building / Zone | `rooms.deck`, `rooms.zone` | schema | text | — | — | deck lean | Floor/building MISSING |
| Journey | `journeys` | 0009 | name, status, startsAt, endsAt | T+P | upcoming… | **Name cruise-leaning** | Reuse as stay period |
| Stay / Reservation | `guest_stays` | 0009 | guestId, journeyId, roomId, status | soft/SQL FKs | status | Links journey | Ready as stay assignment |
| Voyage (docs) | no table | glossary | — | — | — | Doc noun | Map to journeys |
| Guest | `guests` | 0009 | displayName, email, locale | T+P | active | No | Ready |
| Booking | — | — | — | — | — | — | MISSING |
| Request / Ticket | `tickets` | schema | status, roomId, journeyId?, assigneeId, priority, escalated, dueAt, … | T+P + session/room | state machine | journeyId optional | Ready |
| Department | `departments` | 0009 | slug, SLA, manager | T+P | active | No | Ready |
| Staff | `users` | schema | role, departmentId | T | active | No | Ready |
| QR | `qr_contexts` | schema | tokenHash, roomId, qrLevel default **`cabin`**, journeyId | T+P+room | revoke/rotate | default cabin | Change defaults |
| Access token | opaque QR token (hashed) | domain + qr | — | — | — | No | Ready |
| Access session | `guest_sessions` | schema | qrContextId, roomId, expiresAt | T+P | expiry | No | Ready |
| Portal | themes + `portal_content` | schema | tokens jsonb; sections | T+P | draft/publish themes | Seed “Welcome aboard” | Ready |
| Banner | — | — | — | — | — | — | MISSING entity |
| Knowledge source/chunk | `knowledge_documents`, `knowledge_chunks` | schema | embeddings, locale | T+P | — | Content may mention cruise | Ready |
| AI configuration | prompt_profiles/versions + **static ai-settings** | schema + admin.ts | — | — | — | — | PARTIAL |
| Voice configuration | env flags + `voice_sessions` | schema + contracts | transport, status | — | session lifecycle | No | Runtime ≠ admin product |

### Application port gap

`stayContextId` on QR resolve is always `null` in memory and postgres repos (`ports.ts`, `postgres-repos.ts`, `memory/store.ts`) — journey/stay not wired into guest open context.

---

## 3. Relationships (as implemented)

```text
Tenant 1—* Property
Property 1—* Room, Journey, Department, Category, Guest, Announcement, Schedule, QR, PortalContent, Settings
Guest *—* Room via GuestStay (also Journey)
QR → Room (+ optional Journey)
GuestSession → QR + Room
Ticket → GuestSession + Room (+ optional Journey, Category, Assignee)
TicketNote → Ticket
TicketTransition → Ticket
HandoverNote → Property (+ Department)
```

---

## 4. Cruise vs hospitality-general

| Pattern | Finding |
|---------|---------|
| Neutral core | tenants, properties, rooms, tickets, sessions, knowledge |
| Cruise-leaning | journeys naming, deck, qr_level=`cabin`, announcement target `current_journey`, UI Cabins |
| Unused vertical switch | `properties.vertical` |
| Missing resort concepts | villa, building, floor as first-class |
| Docs ER | Voyage/StayContext dual — **≠** code table names |

---

## 5. Hotel/resort change cost per entity

| Entity | Rename | Extend | Replace |
|--------|--------|--------|---------|
| rooms | No (prefer terminology overlay) | floor/building/type | No |
| journeys | Optional rename/alias StayPeriod | profile labels | No |
| guest_stays | No | reservation fields | No |
| qr_level defaults | Change defaults | area/property levels | No |
| properties.vertical | No | enum + feature packs | No |
| tickets | No | stay context | No |
