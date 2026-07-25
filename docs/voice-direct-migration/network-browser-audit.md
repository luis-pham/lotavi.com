# A13 — Network and browser compatibility

## Current infra assumptions

| Topic | Finding |
|-------|---------|
| Reverse proxy WS | Caddy proxies to web/api; voice WS is on API (`/api/v1/voice/ws`) — must be routed to API in compose (local Caddy `@api` includes `/api/*`) |
| Timeouts | No voice-specific long-lived timeout tuning documented |
| Binary frames | Current protocol is **JSON text** with base64 audio (inefficient; unused by UI) |
| Client↔VPS latency | Relevant only if relay completed |
| VPS↔Gemini latency | **N/A** (no Gemini socket) |
| Mobile mic / Safari autoplay | **Unimplemented** — unknown in this codebase |
| Bluetooth / background / captive portal | Unimplemented |

## Direct mode: improves vs regresses

| Aspect | Likely change (inference) |
|--------|---------------------------|
| Media latency | May improve (one fewer hop) — **unverified** |
| VPS bandwidth/CPU | Improves (no media relay) |
| Auth/control plane | Still needs Lotavi HTTPS |
| Safari / autoplay | **Regresses visibility** — problems hit guest directly |
| CSP / connect-src | Must allow Gemini origin |
| Unstable Wi-Fi / Starlink | Reconnect logic must live in browser SDK |

## Green Ruby pilot — required real-device tests

1. Chrome Android on property Wi-Fi — mic + playback + interrupt  
2. Safari iPhone — mic permission, autoplay, background tab  
3. Desktop Chrome — baseline  
4. Revoked QR mid-session  
5. Airplane mode blip / reconnect  
6. Text fallback when `VOICE_ENABLED=false` or mint fails  
7. Concurrent two guests same room QR  

(None runnable as voice E2E today — voice stack incomplete.)
