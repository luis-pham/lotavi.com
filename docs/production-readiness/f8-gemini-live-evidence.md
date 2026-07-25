# F8.12 — Optional Gemini Live

> Canonical voice status: [docs/voice/current-status.md](../voice/current-status.md).  
> Architecture: [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md).

## Result

```text
BLOCKED
```

No real-provider Gemini Live credentials or smoke verification in this environment. Do not treat adapter/spike unit tests as provider PASS.

## Production default

```text
VOICE_ENABLED=false
VOICE_TRANSPORT=off
DIRECT_GEMINI_ENABLED=false
```

Lotavi is not a working Gemini media relay. Voice must not block text-only pilot release.
