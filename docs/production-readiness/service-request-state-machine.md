# Service request state machine

Domain: `packages/domain/src/ticket.ts`

## States

`draft` → `awaiting_guest_confirmation` → `submitted` → `acknowledged` → `assigned` → `in_progress` → `resolved` → `guest_confirmed`  
Also: `needs_info`, `reopened`, `cancelled`  
Legacy aliases: `new`→`submitted`, `accepted`→`acknowledged`, `completed`→`resolved`

## Rules

- Guests confirm before create (`confirmTicketAction` + idempotency key).
- Transitions validated by `assertTicketTransition`.
- Persistence writes immutable `ticket_transitions` + optimistic `tickets.version`.
- Concurrent stale updates → `CONCURRENCY_CONFLICT` (HTTP 409).
- Guest may `guest_confirmed` or `reopen` after `resolved`.

## Transition table (summary)

| From | Allowed to |
|------|------------|
| submitted | acknowledged, assigned, cancelled, in_progress |
| acknowledged | assigned, in_progress, needs_info, cancelled |
| in_progress | needs_info, resolved, cancelled |
| resolved | guest_confirmed, reopened |
| guest_confirmed | reopened |
| cancelled | reopened |
