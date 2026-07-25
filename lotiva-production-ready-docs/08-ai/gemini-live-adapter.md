---
title: "Gemini Live Adapter"
document_id: "AI-004"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["Gemini adapter"]
implemented_by: []
reviewed_by: []
---


# GeminiLiveProvider

Responsibilities:
- open/close Gemini Live WebSocket;
- map canonical config to Gemini setup;
- map Gemini messages to canonical events;
- map canonical tools to function declarations;
- map tool result back;
- normalize errors, usage, transcript, audio;
- support interrupt/cancellation and session resumption.

Gemini SDK types không được leak ra ngoài adapter.
