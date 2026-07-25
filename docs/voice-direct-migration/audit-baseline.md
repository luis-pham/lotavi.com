# A1 — Repository and baseline

**Audit date:** 2026-07-25  
**Mode:** read-only (no production source changes)

## Repository

| Item | Value |
|------|--------|
| Root | `/Users/huypq/Documents/Projects/lotiva` |
| Package manager | pnpm `11.11.0` (workspace) |
| Monorepo | `apps/*` + `packages/*` (turbo) |
| Web | Next.js 15 App Router (`apps/web`) |
| API | Fastify 5 (`apps/api`) |
| Git commit | `9f95914616bf481b3612c5f9c06731026a097e49` |
| Branch | `main` (tracks `origin/main`) |
| Node | v24.14.1 |
| Python | 3.9.6 (embedding-service only; unused by voice) |

## Workspace apps/packages

- `apps/web`, `apps/api`, `apps/worker`, `apps/embedding-service`
- `packages/contracts`, `domain`, `application`, `infrastructure`, `ui`, `design-*`

## Voice-related environment variables (verified in schema/code)

| Variable | Role | Default / notes |
|----------|------|-----------------|
| `VOICE_ENABLED` | Feature flag | `false`; prod/staging require `GEMINI_API_KEY` if true (`packages/contracts/src/config.ts`) |
| `GEMINI_API_KEY` | Provider key (server) | Optional; required when voice on in prod-like |
| `GUEST_COOKIE_NAME` | Guest auth for voice session create | default `lotiva_guest` |

No `VOICE_TRANSPORT`, ephemeral-token, or direct-client env vars exist.

## Gemini dependencies

**Verified:** `@google/genai`, `@google/generative-ai`, and similar Gemini Live SDKs are **not** in any `package.json`.

API voice stack uses:

- `@fastify/websocket` `^11.1.0` (`apps/api/package.json`)
- In-process `GeminiLiveAdapter` placeholder (`packages/infrastructure/src/voice/gemini-live-adapter.ts`)

## Commands

```bash
pnpm install
pnpm build:packages
pnpm test
pnpm --filter @lotiva/web build
pnpm --filter @lotiva/api typecheck
```

E2E: `apps/web/e2e/guest-staff-flow.spec.ts` documents `VOICE_ENABLED=false`.

## Non-destructive checks executed this audit

```bash
pnpm exec vitest run apps/api/src/voice-contract.test.ts packages/contracts/src/voice-events.test.ts
# → 3/3 PASS
```

## Critical baseline finding

Product docs describe Browser → Lotiva WS → Gemini Live → Lotavi → Browser.

**Implemented code does not open a Gemini Live connection, capture microphone audio, or play assistant audio.**  
Voice is a **session handshake + in-memory state machine + optional WS echo of speech_started**, gated by `VOICE_ENABLED` (default off).

See `current-voice-flow.md`.
