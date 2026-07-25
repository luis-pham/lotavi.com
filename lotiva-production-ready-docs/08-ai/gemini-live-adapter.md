---
title: "Gemini Live Adapter"
document_id: "AI-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["Gemini adapter — historical target shape"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note.**  
> This document predates the direct Gemini browser architecture decision.  
> **Current source of truth:** [docs/voice/README.md](../../docs/voice/README.md), [ADR-direct-gemini-live-browser](../../docs/architecture/adr/ADR-direct-gemini-live-browser.md).

# GeminiLiveProvider (planned adapter responsibilities — not a verified media relay)

**Current reality:** `packages/infrastructure/src/voice/gemini-live-adapter.ts` is a **placeholder / control-plane-shaped** adapter. It does **not** currently open a real Gemini Live media session or relay guest microphone audio. Direct browser↔Gemini capability code lives separately behind flags; provider smoke is **BLOCKED**.

Historical intended responsibilities (relay-era / future optional relay):
- open/close Gemini Live WebSocket;
- map canonical config to Gemini setup;
- map Gemini messages to canonical events;
- map canonical tools to function declarations;
- map tool result back;
- normalize errors, usage, transcript, audio;
- support interrupt/cancellation and session resumption.

Gemini SDK types must not leak outside the adapter. Voice RAG/write tools are **not implemented**. Session resumption is **not** a production-supported feature today.
