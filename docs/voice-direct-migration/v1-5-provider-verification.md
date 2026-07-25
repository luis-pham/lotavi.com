# V1.5.3 — Provider protocol verification

**Documentation date:** 2026-07-26  
**Sources consulted:** [Live WebSockets API](https://ai.google.dev/api/live), [Ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens), get-started WebSocket guide  
**Status:** Documented from official docs · **real provider calls: BLOCKED** (no `GEMINI_API_KEY` in this environment)

## Decisions locked into code

| Item | Decision |
|------|----------|
| API version (constrained ephemeral) | `v1alpha` |
| Token mint endpoint | `POST https://generativelanguage.googleapis.com/v1alpha/auth_tokens` |
| Auth for mint | Server header `x-goog-api-key` (long-lived key never to browser) |
| Live WS endpoint | `…v1alpha.GenerativeService.BidiGenerateContentConstrained` |
| Browser auth | `access_token` query param (provider requirement) **or** `Authorization: Token …` |
| Default model | `gemini-2.5-flash-preview-native-audio-dialog` (`GEMINI_LIVE_MODEL`) |
| Initial client message | `{ setup: { model, generationConfig.responseModalities:["AUDIO"], inputAudioTranscription:{}, outputAudioTranscription:{} } }` — **no tools** |
| Input audio | PCM 16-bit LE, 16 kHz, mono (`audio/pcm;rate=16000`) via `realtimeInput.audio` (not deprecated `mediaChunks`) |
| Output audio | PCM typically 24 kHz from model inlineData |
| Transcription | Enabled via empty `inputAudioTranscription` / `outputAudioTranscription` objects |
| Interruption | Provider-native: default `START_OF_ACTIVITY_INTERRUPTS`; client clears playback on `serverContent.interrupted` |
| GoAway | Surface status; prepare clean disconnect |
| Session resumption | **Not enabled** in V1.5 (no `sessionResumption` in setup) |
| Token uses | `uses: 1` |
| Token expiry | `expireTime` ≤ session max; `newSessionExpireTime` ~60s |

## Restrictions proven by AuthTokens API (docs)

Supported in mint body:

- `uses`
- `expireTime` / `newSessionExpireTime`
- `liveConnectConstraints.model`
- `liveConnectConstraints.config` (response modalities, system instruction, transcription configs)

**Not claimed without runtime proof:**

- Hard guarantee that constrained token rejects every client setup override
- Exact reuse error payload after `uses: 1` exhaustion
- Quota error shape under load

## Unsupported / out of scope

- RAG / function tools in Live session
- Server media relay
- Billing-quality connection truth from browser lifecycle alone

## Implementation consequences

- Browser spike uses AudioWorklet → PCM16 → `realtimeInput.audio`
- Playback queue cleared on `interrupted`
- Mint response never logs token; `Cache-Control: no-store`
