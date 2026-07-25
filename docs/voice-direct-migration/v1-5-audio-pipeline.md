# V1.5.4 / V1.5.5 — Audio pipeline

## Capture path

```text
User gesture (Start)
→ getUserMedia({ audio: mono, echoCancellation, noiseSuppression })
→ AudioContext(sampleRate=16000)
→ AudioWorklet (LotaviPcmProcessor)  [ScriptProcessor silent-gain fallback]
→ Float32 → PCM16 LE
→ base64
→ WebSocket realtimeInput.audio { mimeType: audio/pcm;rate=16000, data }
```

## Playback path

```text
Gemini serverContent.modelTurn.parts[].inlineData (audio/*)
→ base64 → PCM16 LE @ 24 kHz
→ AudioBuffer queue (bounded, max 48 chunks)
→ single AudioContext(24000) sequential BufferSource
→ destination
```

## Resource cleanup

On Stop / fail / unmount / pagehide:

- stop MediaStream tracks
- disconnect worklet/source
- close capture + playback AudioContexts
- clear playback queue + stop current source
- close Gemini WebSocket
- POST session end

## Interruption

- **Provider-native** barge-in (default activity handling)
- **Client-managed** queue clear on `serverContent.interrupted`
- Mute only mutes mic send; does not fake interruption PASS

## Status

| Item | Status |
|------|--------|
| Implementation | implemented |
| Unit tests | partial (helpers only) |
| Real mic verification | **NOT STARTED / BLOCKED** |
| Latency measurements | instrumented in UI; **no real samples** |
