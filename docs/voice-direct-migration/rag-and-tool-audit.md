# A6 / A7 — RAG, grounding, tools, tickets (voice path)

## Voice path: RAG

**Verified: voice does not call knowledge retrieval.**

Text chat path (separate): `packages/application/src/use-cases/chat.ts` → `sendGuestChat` with hybrid search, thresholds, grounding metadata.

Voice `connect` config only passes `{ conversationId }` and does not invoke `KnowledgeRepository`.

### Answers required by audit brief

| Question | Answer |
|----------|--------|
| Would direct browser voice remove an existing pre-response safety gate? | **No existing voice safety gate** to remove. Text chat gates do not apply to voice yet. |
| Can RAG be exposeable as allowlisted server tool without trusting browser? | **Yes in design** — not implemented. Browser must not supply tenant/property; server derives from guest session. |
| Preserve wrong-property = 0? | Reuse SQL filters in `hybridSearchSql` / knowledge repos; tools must run in tenant-scoped server context. |
| Prohibited / handoff answers | Mirror text: emergency escalation, no-answer, critical thresholds — **not wired to voice**. |

## Voice path: tools and tickets

**Verified: no Gemini function declarations, no `tool.call` emission, no ticket creation from voice.**

Canonical event types reserved in `packages/contracts/src/voice-events.ts`:

- `tool.call`, `tool.result`, `action.confirmation_required`

Unused by adapter/routes.

### Ticket creation today (non-voice)

- Guest HTTP: prepare → confirm (`GuestPortal` + `apps/api/src/routes/guest.ts`)
- Idempotency keys on confirm
- Outbox + SSE for staff

Voice does not call these.

### Hypothetical tool classification (for future direct mode)

| Class | Examples (product intent) | Executor must be |
|-------|---------------------------|------------------|
| Read-only | knowledge search, ticket status | Server, guest-scoped |
| Write | prepare request, confirm ticket, cancel, handoff | Server + **explicit guest confirmation** + idempotency |

### Unsafe patterns to avoid

- Generic “execute arbitrary tool” from browser-supplied name/args
- Trusting client-supplied `tenantId` / `propertyId`
- Auto-confirming tickets from model tool calls without UI confirmation

**Current browser cannot safely sit between Gemini and write tools** — not because of a bad tool bridge, but because **no tool bridge exists** and guest WS auth is incomplete.
