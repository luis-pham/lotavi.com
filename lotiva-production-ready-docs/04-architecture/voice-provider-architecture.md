---
title: "Voice Provider Architecture"
document_id: "ARCH-005"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["voice abstraction — historical"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note.**  
> This document predates the direct Gemini browser architecture decision.  
> It describes a **server media-relay** shape that is **not** the current verified implementation and is **not** the current target media plane.  
> **Current source of truth:** [docs/voice/README.md](../../docs/voice/README.md), [docs/voice/architecture.md](../../docs/voice/architecture.md), [ADR-direct-gemini-live-browser](../../docs/architecture/adr/ADR-direct-gemini-live-browser.md).

# Voice provider architecture (historical)

```text
Browser
→ Lotavi canonical WebSocket
→ Voice Gateway
→ Voice Orchestrator
→ RealtimeVoiceProvider
→ GeminiLiveProvider
```

**Current reality (2026-07-26):** Lotavi is **not** a working Gemini media relay. `GeminiLiveAdapter` does not open a verified Live media session. Target media path is browser ↔ Gemini Live (ephemeral credential); Lotavi is the control plane. Voice remains disabled (`VOICE_ENABLED=false`).

Provider-specific SDK types must not leak outside adapter packages (still valid). OpenAI realtime provider remains a future configuration option only after contract tests — **not implemented**.
