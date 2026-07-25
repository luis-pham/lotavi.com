# Pilot runbook — Green Ruby Demo

> **Voice status:** disabled. Canonical voice docs: [`docs/voice/README.md`](../voice/README.md).  
> Green Ruby **network** voice verification: [`docs/voice-direct-migration/v1-5-green-ruby-network.md`](../voice-direct-migration/v1-5-green-ruby-network.md) — **BLOCKED** / pending.

## Voice pilot constraints (current)

- Voice is **not yet enabled** for the Green Ruby pilot.  
- Green Ruby Wi-Fi / Starlink voice tests are **pending** (do not substitute office Wi-Fi).  
- **Text remains the operational fallback.**  
- No raw audio recording is enabled by default.  
- Transcript retention is **not** a production commitment.  
- No ticket may be created by voice until confirmed write tools are implemented (not started).  
- Future staging voice tests require a non-empty property allowlist + staging safety acknowledgement.  
- Defaults: `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false`.

## Property contents

- Branding theme, rooms 1208/1209, QR tokens
- Knowledge: pool hours, Wi-Fi, safety/emergency
- Staff: `staff@lotiva.vn` / admin user (local seed password only)
- Breakfast schedule + welcome announcement

## Ops procedures

| Task | Action |
|------|--------|
| Property onboarding | Seed tenant/property; publish theme; publish knowledge |
| Knowledge approval | Admin publish only; draft never retrieved |
| QR generate | `POST /api/v1/admin/qr` — capture raw token once |
| QR rotate | `POST /api/v1/admin/qr/:id/rotate` |
| QR revoke | `POST /api/v1/admin/qr/:id/revoke` |
| Voice disable | `VOICE_ENABLED=false` `VOICE_TRANSPORT=off` `DIRECT_GEMINI_ENABLED=false` + restart API |
| Provider outage | Keep text chat; voice already off for pilot |
| Queue failure | Inspect BullMQ; restart worker; jobs retry with backoff |
| DB restore | `scripts/restore-postgres.sh` + `verify-restore.sh` |
| Guest privacy | Export/delete via DB ops + audit access control |
| Rollback | Redeploy previous image; restore DB snapshot |

## Device checks

Validate guest portal on iPhone Safari, Android Chrome; staff UI on desktop; throttle network in DevTools.
