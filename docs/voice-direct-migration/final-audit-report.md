# Voice direct-migration — final audit report

> **Historical audit (pre V0/V1/V1.5 implementation).**  
> Post-audit work added safety foundation, ephemeral mint, and a staging/dev spike.  
> **Canonical status:** [docs/voice/current-status.md](../voice/current-status.md) · **V1.5 report:** [v1-5-final-verification-report.md](./v1-5-final-verification-report.md) (**BLOCKED** for provider/device).  
> **ADR:** [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md).

## FINAL AUDIT CLASSIFICATION

```text
INSUFFICIENT EVIDENCE
```

At audit time: **there was no working Gemini Live media relay to migrate**, and ephemeral/browser Live provider capabilities were unverified. That media-relay absence remains true. Capability code now exists; real provider smoke is still **BLOCKED**. Keep voice disabled by default.

---

## Repository baseline

- Root: Lotavi pnpm monorepo  
- Commit: `9f95914616bf481b3612c5f9c06731026a097e49`  
- Voice tests run: **3/3 PASS**  
- No `@google/*` Gemini SDK dependency  

## Current architecture summary

**Documented intent:** Browser → Lotavi WS → Gemini Live → Lotavi → Browser  

**Implemented:** HTTP session create + in-memory state machine + optional JSON WS that acknowledges audio without calling Gemini; **UI never opens WS or captures mic**.

## Exact media flow

See `current-voice-flow.md`. Media path ends at `sendAudio(_chunk)` discarding bytes.

## Gemini integration findings

Placeholder adapter; env key gate only; no model/tools/transcripts/GoAway/resume. Ephemeral tokens: **unknown**.

## Reusable components

- Canonical event schemas + runtime state types  
- Text chat RAG + ticket confirmation (not voice-wired)  
- Config fail-fast for `VOICE_ENABLED`  
- Frontend audio: **none**

## Relay-only responsibilities

N/A as media relay. Control-plane duties that must stay server-side when voice is built: authz, RAG tools, ticket writes, quota, audit, key custody.

## RAG and grounding

Voice: none. Text: hybrid SQL + thresholds. Direct mode must expose RAG as **server tool**, not client prompt stuffing.

## Tool and confirmation

Voice tools: none. Future writes must reuse explicit confirmation + idempotency.

## Session/reconnect

Memory Map only; `voice_sessions` table unused; WS unauthenticated by guest ownership.

## Transcript/audio

Not collected for voice. No product requirement for raw audio replay found in code.

## Security findings

Highest current gap: **voice WebSocket lacks guest ownership check**. Direct mode adds token theft, CSP, tool forgery — all unmitigated because features absent.

## Quota/BYOK

Not implemented. Single global key. Client usage must not bill.

## Observability

No voice-specific metrics pipeline.

## Network/browser

Caddy can proxy `/api/*` WS; browser/Safari matrix untested (no audio).

## Provider capability uncertainties

Listed in `gemini-integration-audit.md` (ephemeral credentials, forced terminate, locked instructions/tools, GoAway).

## Migration risk scores

See `migration-feasibility.md` (total risk **9/10**; provider support **1/10**).

## Recommended target architecture

Control plane on Lotavi; media direct **only after** provider verification; optional relay retained; text unchanged. Details: `target-architecture.md`.

## Incremental phases

Phase 0 safety (WS auth + DB) → abstraction → mint → direct audio → RAG tools → write tools → telemetry → pilot → retire relay decision. Details: `incremental-migration-plan.md`.

## Required tests

`test-matrix.md`.

## External blockers

1. Real Gemini Live integration (or formal decision to build)  
2. Provider docs/SDK proof of ephemeral browser Live  
3. Staging credentials + device lab (Green Ruby)  
4. Product decision: transcript/audio retention  

## Files inspected (primary)

- `packages/infrastructure/src/voice/gemini-live-adapter.ts`
- `apps/api/src/routes/voice.ts`
- `apps/api/src/voice-contract.test.ts`
- `apps/web/src/components/GuestPortal.tsx`
- `packages/contracts/src/voice-events.ts`
- `packages/domain/src/voice-state.ts`
- `packages/application/src/ports.ts`
- `packages/application/src/use-cases/chat.ts`
- `packages/infrastructure/src/db/schema.ts` (`voiceSessions`)
- `packages/contracts/src/config.ts`
- `docs/production-readiness/voice-reliability.md`
- `lotiva-production-ready-docs/04-architecture/voice-provider-architecture.md`
- `lotiva-production-ready-docs/08-ai/gemini-live-adapter.md`
- `lotiva-production-ready-docs/adr/ADR-0003-gemini-live.md`
- `apps/api/package.json`

## Commands executed

```bash
git rev-parse HEAD
pnpm exec vitest run apps/api/src/voice-contract.test.ts packages/contracts/src/voice-events.test.ts
```

## Documentation created

All under `docs/voice-direct-migration/` (this file + A1–A16 set).

## No source code changed confirmation

**Confirmed:** this audit added documentation only under `docs/voice-direct-migration/`. No production application source, schema, config, or dependency changes were made for implementation of direct Gemini or relay completion.
