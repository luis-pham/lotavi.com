# V1.5.8 / V1.5.9 — Session lifecycle & heartbeat

## States

`created` → `token_issued` → `connecting` → `active` → `disconnecting` → `ended`  
Failure paths: `failed` | `expired` | `abandoned`

Browser lifecycle POSTs are labeled **diagnosticOnly** — not billing-quality truth.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/voice/sessions` | create + concurrency + allowlist |
| POST | `/api/v1/voice/direct/ephemeral` | mint → `token_issued` |
| POST | `/api/v1/voice/sessions/:id/lifecycle` | diagnostic ack |
| POST | `/api/v1/voice/sessions/:id/heartbeat` | ownership + rate limit |
| POST | `/api/v1/voice/sessions/:id/end` | clean end |
| GET | `/api/v1/voice/sessions/:id/state` | owned state |

## Heartbeat / abandon

| Setting | Default | Rationale |
|---------|---------|-----------|
| Client heartbeat interval | 25s | well under TTL; tolerates brief mobile loss |
| `VOICE_HEARTBEAT_TTL_SECONDS` | 90 | abandon after ~3 missed beats; avoids killing brief network blips |
| Cleanup trigger | on new session create | bounded sweep via `abandonStale` |

Stale sessions → `abandoned` + `termination_reason=heartbeat_timeout` + `ended_at` → releases concurrency slot.

## Persistence rules

- Persist session row + status + heartbeat timestamps
- **Never** persist ephemeral tokens

## Status

- Implemented (memory + postgres)
- Unit-tested heartbeat ownership + abandon slot release
- Provider/device evidence: BLOCKED
