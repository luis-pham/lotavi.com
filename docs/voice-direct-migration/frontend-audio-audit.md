# A4 — Frontend capability audit

> **Historical audit snapshot (pre V1.5 spike hardening).**  
> Browser audio **code** now exists in `VoiceDirectSpike`; real mic/provider verification remains **BLOCKED**.  
> Canonical: [docs/voice/current-status.md](../voice/current-status.md), [v1-5-audio-pipeline.md](./v1-5-audio-pipeline.md).

## File inspected

`apps/web/src/components/GuestPortal.tsx`

## Voice UI today

```ts
async function startVoice() {
  setVoiceStatus("connecting");
  const res = await api("/api/v1/voice/sessions", { method: "POST", json: {} });
  setVoiceStatus(res.event.type === "session.ready" ? "ready (canonical)" : res.event.type);
}
```

Button label: “Bắt đầu Voice”. Status string only.

## Component classification

| Capability | Status | Classification |
|------------|--------|----------------|
| Microphone permission UX | Missing | **missing** |
| MediaStream acquisition | Missing | **missing** |
| PCM / sample-rate conversion | Missing | **missing** |
| Buffering / chunking | Missing | **missing** |
| Audio playback queue | Missing | **missing** |
| Web Audio API / worklets | Missing | **missing** |
| Interruption / barge-in | Missing | **missing** |
| Echo / mute handling | Missing | **missing** |
| Connection status | Minimal string state | **reusable with modification** |
| Reconnect UI | Missing | **missing** |
| Text fallback | Text chat exists on same tab | **reusable unchanged** (separate path) |
| Mobile Safari / Chrome specifics | Not implemented | **missing** |
| Background tab behavior | Not implemented | **missing** |
| WebSocket voice client | Missing (ignores `wsPath`) | **missing** |
| Relay-specific framing (`input.audio` JSON) | Not in UI; defined on server | **relay-specific** (server protocol) |

## Assumptions currently “hidden” by VPS

**None in practice** — the VPS is not yet hiding browser audio complexity because **no audio is captured or played**.

If a real relay were completed, the VPS would hide:

- Gemini Live binary protocol
- Provider auth
- Server-side sample conversion
- Tool/RAG loop

Direct mode would force the browser to own capture, encode, playback, interrupt, and Live protocol (or a vendor JS SDK).

## Reuse from non-voice UI

- Guest cookie session + `api()` helper (`apps/web/src/lib/api.ts`) — reusable for token minting HTTP
- Text chat + Requests confirmation flow — reusable for write-tool confirmation UX
- Locale handling (guest) — separate from marketing i18n; still server-driven
