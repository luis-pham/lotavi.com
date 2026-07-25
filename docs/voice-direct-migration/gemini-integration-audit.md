# A3 — Current Gemini integration

> **Historical audit snapshot.** Canonical voice docs: [docs/voice/README.md](../voice/README.md). Ephemeral mint code exists post-audit; **runtime provider smoke still BLOCKED**.

## Verified facts

| Topic | Finding |
|-------|---------|
| SDK / protocol | **None wired.** Comment references `@google/genai` Live; dependency absent |
| Dependency version | N/A — not in lockfile/package manifests |
| Model identifier | **Not configured** in code |
| API version | **Not configured** |
| Session type | In-memory `Map<string, VoiceRuntimeState>` only |
| Auth method | Process env `GEMINI_API_KEY` read in adapter constructor |
| API-key location | Server env only (good); never sent to browser in current code |
| BYOK / per-tenant key | **Not implemented** |
| System instructions | **Not constructed** for voice |
| Tool declarations | **Not declared** for voice |
| Response modality | N/A |
| Input/output transcription | Canonical event types exist; **not produced** by adapter |
| Session resumption / GoAway | **Not implemented** |
| Max session / retry / error mapping | **Not implemented** (only connect/send/close stubs) |

## Adapter behavior (`GeminiLiveAdapter`)

File: `packages/infrastructure/src/voice/gemini-live-adapter.ts`

- `VOICE_ENABLED=false` → `connect` throws `{ code: "VOICE_DISABLED" }`
- Enabled + no key + prod/staging → `VOICE_PROVIDER_MISCONFIGURED`
- Enabled + no key + development → `fallback_text` / `degraded` (explicit non-prod path)
- Enabled + key → marks `active`/`connected` **without network call**

`isLiveProviderBound()` = `voiceEnabled && apiKey` — **does not prove** a Live socket exists.

## Ephemeral tokens / browser Live

**Cannot verify from repository.** No minting API, no Google auth client, no docs in-repo describing ephemeral Live credentials.

### Unanswered provider questions (must verify externally)

1. Does current Gemini Live product support short-lived browser credentials that never expose the long-lived API key?
2. Can system instructions and tool declarations be locked server-side when media is browser↔Gemini?
3. Can the server force-terminate an in-progress browser Live session?
4. Are tool calls executable only via server round-trip, or can the client forge results?
5. What are GoAway / max duration / resumption handle semantics for browser sessions?

## Port interface

`packages/application/src/ports.ts` → `VoiceProviderPort`:

```ts
connect(sessionId, config): Promise<void>
sendAudio(sessionId, chunk: Buffer): Promise<void>
close(sessionId): Promise<void>
```

No `mintEphemeralToken`, `handleToolCall`, or `onProviderEvent` methods exist yet.
