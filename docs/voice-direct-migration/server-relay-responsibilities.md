# A5 — Server “relay” responsibilities audit

> **Still accurate on media:** Lotavi is **not** a working Gemini media relay.  
> Canonical architecture: [docs/voice/architecture.md](../voice/architecture.md) (direct media target + Lotavi control plane).

## Reality check

The server is **not** a byte-forwarding media relay today. It is a **control plane** (auth, mint, session persistence, heartbeat) plus an optional ownership-gated WS message handler — **not** a verified Gemini audio path.

## Responsibility matrix

| Responsibility | Present? | Classification for direct mode |
|----------------|----------|--------------------------------|
| `VOICE_ENABLED` gate | Yes (`voice.ts`, config) | **Must remain on server** |
| Guest cookie auth on session create | Yes (POST) | **Must remain on server** |
| Guest auth on WS | **No** — only `sessionId` query | **Must be redesigned** (critical gap even for relay) |
| Tenant/property resolution for voice | Partial (tenant from cookie; property not passed to adapter) | **Must remain / redesign** |
| Prompt construction | No | **Must remain on server** (when built) |
| RAG injection into voice | No | **Must remain on server** (tool or pre-turn) |
| Tool dispatch | No | **Must remain on server** |
| Transcript capture | No | **Bridge** (client telemetry + server verify) or server if relay |
| Content filtering / output inspection before audio | No | **Must remain on server** if required; **may become unavailable** mid-utterance in pure direct audio |
| Audio recording | No | **Unavailable** in pure direct unless client uploads |
| Quota / usage | No | **Must remain on server** (mint + heartbeat) |
| Reconnect / resumption | No | **Redesign** |
| Error translation | Minimal WS `VOICE_PROTOCOL_ERROR` | **Must remain** |
| Rate limiting on voice routes | Not voice-specific (global Redis limiter exists for other routes) | **Must remain on server** |
| Concurrency leases | No | **Must remain on server** |
| Session timeout | No | **Must remain on server** |
| Audit / billing | No voice audit writes | **Must remain on server** |
| Observability metrics for voice | Generic API metrics only | **Redesign** |
| Persist `voice_sessions` table | Schema exists; **route does not insert** | **Must remain on server** |
| Forward audio to Gemini | **No** | N/A today |
| Forward Gemini audio to browser | **No** | N/A today |

## Classification legend (used above)

1. Must remain on the server  
2. Can move to the browser safely  
3. Must be redesigned as browser↔server bridge  
4. Becomes unavailable in direct mode  
5. Unknown pending provider verification  

**Browser-safe today:** none of the media stack (does not exist). UI status string only.

**Unknown / provider:** ephemeral credentials, forced disconnect, locked system instruction when media is direct.
