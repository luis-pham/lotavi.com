---
title: "Voice Provider Architecture"
document_id: "ARCH-005"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["voice abstraction"]
implemented_by: []
reviewed_by: []
---


# Voice provider architecture

```text
Browser
→ Lotiva canonical WebSocket
→ Voice Gateway
→ Voice Orchestrator
→ RealtimeVoiceProvider
→ GeminiLiveProvider
```

Phase 0 chỉ active Gemini Live.

Sau khi `OpenAIRealtimeProvider` được implement và pass contract tests, đổi provider bằng configuration assignment, không sửa frontend, RAG, ticket hoặc prompt composition.

Provider-specific SDK types chỉ tồn tại trong adapter package.
