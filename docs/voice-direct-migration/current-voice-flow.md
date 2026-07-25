# A2 — Current voice flow map (code-traced)

> **Historical audit snapshot.** Prefer [docs/voice/current-status.md](../voice/current-status.md) and [docs/voice/architecture.md](../voice/architecture.md). V0/V1/V1.5 added ownership, mint, and spike code after this map; provider smoke remains **BLOCKED**.

## Summary (verified)

There is **no end-to-end media path** today.

What exists:

1. Guest UI button calls HTTP `POST /api/v1/voice/sessions`.
2. API validates guest cookie, creates conversation, calls `GeminiLiveAdapter.connect`.
3. Adapter stores **in-memory** runtime state; with API key it marks `connected` **without** provider I/O.
4. Response includes `wsPath`, but **GuestPortal never opens the WebSocket**.
5. WS handler can accept `input.audio` base64 and call `sendAudio`, which **discards audio bytes** and only bumps state.

## Exact sequence (as implemented)

```mermaid
sequenceDiagram
  participant G as GuestPortal.startVoice
  participant API as POST /api/v1/voice/sessions
  participant AD as GeminiLiveAdapter.connect
  participant MEM as Adapter sessions Map

  G->>API: POST json {} (guest cookie)
  API->>API: require VOICE_ENABLED; unsign guest cookie
  API->>API: conversations.getOrCreate(sessionId, tenantId)
  API->>AD: connect(voiceSessionId, { conversationId })
  alt voice disabled
    AD-->>API: throw VOICE_DISABLED
  else no GEMINI_API_KEY (dev)
    AD->>MEM: state fallback_text / degraded
  else GEMINI_API_KEY present
    AD->>MEM: state active / connected<br/>(NO Gemini WS opened)
  end
  API-->>G: voiceSessionId, event session.ready, wsPath
  Note over G: Does NOT connect WebSocket<br/>Does NOT getUserMedia
```

### Optional path (implemented server-side, unused by current UI)

```mermaid
sequenceDiagram
  participant B as Browser (hypothetical)
  participant WS as GET /api/v1/voice/ws
  participant AD as GeminiLiveAdapter.sendAudio

  B->>WS: websocket ?sessionId=
  WS-->>B: JSON session.ready
  B->>WS: JSON { type: input.audio, audioBase64 }
  WS->>AD: sendAudio(sessionId, Buffer)
  Note over AD: _chunk ignored; state → speech_detected
  WS-->>B: JSON input.speech_started
  Note over WS,B: No assistant.audio.delta ever sent
```

## Step → file / symbol

| Step | Status | File / symbol |
|------|--------|----------------|
| Voice button | Implemented | `apps/web/src/components/GuestPortal.tsx` → `startVoice()` |
| Microphone permission | **Missing** | no `getUserMedia` |
| MediaStream / worklet / PCM | **Missing** | — |
| Browser→Lotavi WS client | **Missing** | UI never uses `wsPath` |
| Create voice session HTTP | Implemented | `apps/api/src/routes/voice.ts` → `registerVoiceRoutes` POST |
| Guest cookie auth | Partial | POST unsigns cookie; WS **does not** re-auth guest |
| Conversation link | Partial | `getOrCreate` only; no `voice_sessions` DB row insert |
| Gemini client creation | **Placeholder** | `GeminiLiveAdapter.connect` comment: “When @google/genai Live is wired…” |
| Input audio forward to Gemini | **Not implemented** | `sendAudio` ignores `_chunk` |
| Output audio / playback | **Missing** | no `assistant.audio.delta` emission |
| Interruption / barge-in | Domain states only | `packages/domain/src/voice-state.ts` (`interrupted`) unused by adapter |
| Disconnect / cleanup | Partial | `close()` + WS `session.close`; in-memory only |
| Timeout / GoAway / resume | **Missing** | — |

## Divergence from product docs

| Doc claim | Code reality |
|-----------|--------------|
| `ARCH-005` Browser → canonical WS → GeminiLiveProvider | WS route exists; Gemini Live not wired; UI not connected |
| `AI-004` open/close Gemini Live WebSocket | Not present |
| Production readiness “adapter incomplete” | Confirmed |
