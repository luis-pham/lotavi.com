# A8 — Session and reconnect audit

## Lifecycle (implemented)

| Phase | Behavior |
|-------|----------|
| Create | `POST /api/v1/voice/sessions` → `newId()` voice session; `connect()`; return ids |
| Server id | UUID `voiceSessionId` (memory key) |
| Browser id | Only displayed via status; not stored |
| Gemini id | **None** |
| Heartbeat | **None** |
| Reconnect | **None** (`connection.reconnecting` event type unused) |
| Server restart | **All voice sessions lost** (in-memory Map) |
| Browser refresh | New HTTP session; old memory entry orphaned until process recycle |
| Network interrupt | WS close; no resume |
| GoAway | **None** |
| Timeout / terminate | `close()` / `session.close` only |
| Concurrent slot release | **None** |

## Where state lives

| Store | Voice state |
|-------|-------------|
| Browser memory | Status string only |
| Backend memory | `GeminiLiveAdapter.sessions` Map |
| Redis | Not used for voice |
| PostgreSQL `voice_sessions` | **Schema only** — no writes from voice routes |
| Gemini resumption handle | N/A |

## Lost if media moves to browser

Anything not yet persisted (essentially all voice runtime). Direct mode would still need a **server session record** (Postgres) for authz, quota, audit — currently missing even for relay.

## Duplicate ticket / tool risks on reconnect

**Not applicable to voice today** (no tools).  
Text ticket confirm already uses idempotency keys — that pattern must be reused when voice write tools are added.
