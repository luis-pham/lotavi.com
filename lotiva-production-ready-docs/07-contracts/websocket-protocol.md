---
title: "WebSocket Protocol"
document_id: "API-002"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["canonical websocket — historical/planned"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note.**  
> This protocol describes a **Lotavi-mediated voice media WebSocket**. That is **not** the current target media plane and is **not** a verified working Gemini audio relay.  
> **Current source of truth:** [docs/voice/architecture.md](../../docs/voice/architecture.md), [ADR-direct-gemini-live-browser](../../docs/architecture/adr/ADR-direct-gemini-live-browser.md).

# Client messages (planned / historical relay shape)
session.start, session.resume, audio.append, text.submit, assistant.interrupt, tool.confirm, session.end, connection.ping.

# Server messages (planned / historical relay shape)
session.ready, state.snapshot, input.speech_started, input.transcript.delta, input.transcript.completed, assistant.audio.delta, assistant.transcript.delta, action.confirmation_required, connection.reconnecting, session.error, session.ended.

Mọi message có protocolVersion, sessionId, messageId, timestamp.

**Current reality:** Target realtime audio uses browser ↔ Gemini Live directly. Lotavi voice WS (when transport=relay) is an ownership-gated control channel, not a proven Gemini media relay. Voice remains disabled by default.
