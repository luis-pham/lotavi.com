# Pilot runbook — Green Ruby Demo

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
| Voice disable | `VOICE_ENABLED=false` + restart API |
| Provider outage | Keep text chat; voice already off for pilot |
| Queue failure | Inspect BullMQ; restart worker; jobs retry with backoff |
| DB restore | `scripts/restore-postgres.sh` + `verify-restore.sh` |
| Guest privacy | Export/delete via DB ops + audit access control |
| Rollback | Redeploy previous image; restore DB snapshot |

## Device checks

Validate guest portal on iPhone Safari, Android Chrome; staff UI on desktop; throttle network in DevTools.
