# Voice reliability

> **Canonical voice status:** [docs/voice/current-status.md](../voice/current-status.md)  
> **Architecture ADR:** [docs/architecture/adr/ADR-direct-gemini-live-browser.md](../architecture/adr/ADR-direct-gemini-live-browser.md)

## Status: BLOCKED for production enablement

| Item | Reality |
|------|---------|
| Defaults | `VOICE_ENABLED=false`, `VOICE_TRANSPORT=off`, `DIRECT_GEMINI_ENABLED=false` |
| Safety foundation | Implemented (auth, ownership, persistence, concurrency) |
| Server media relay | **Not a working Gemini media relay** |
| `GeminiLiveAdapter` | Placeholder / control-plane-shaped — **not** a verified Live media session |
| Direct browser spike | Code exists; real provider smoke **BLOCKED** |
| Device matrix | NOT STARTED |
| Green Ruby network | BLOCKED |
| Voice RAG / write tools / tickets | Not implemented |
| Text fallback | Available; keep as operational path |

## Required before enabling in pilot / production

See [docs/voice/production-gates.md](../voice/production-gates.md). At minimum:

1. Real Gemini Live smoke (mint, connect, audio in/out, interrupt, clean stop)  
2. Desktop Chrome + Android Chrome + iPhone Safari  
3. Security gates (ownership, allowlist, no tools, prod forbid direct)  
4. Explicit ops sign-off  

Until then: keep voice off in staging/production.
