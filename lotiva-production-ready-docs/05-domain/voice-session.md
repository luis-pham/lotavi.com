---
title: "Voice Session Domain"
document_id: "DOM-VOICE-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-26"
depends_on: []
source_of_truth_for: ["voice state machine — domain target"]
implemented_by: []
reviewed_by: []
---

> **Historical architecture note.**  
> Domain states below remain useful as a UX/runtime model. Persistence and ownership are implemented; **provider audio and barge-in are not production-verified**.  
> **Current source of truth:** [docs/voice/current-status.md](../../docs/voice/current-status.md), [docs/voice/architecture.md](../../docs/voice/architecture.md).

# Voice runtime state

```ts
type VoiceRuntimeState = {
  session: "idle" | "initializing" | "active" | "resuming" | "fallback_text" | "ending" | "ended" | "failed";
  connection: "disconnected" | "connecting" | "connected" | "degraded" | "reconnecting" | "closed";
  input: "unavailable" | "permission_required" | "requesting_permission" | "ready" | "capturing" | "speech_detected" | "speech_ending" | "muted" | "paused" | "error";
  turn: "none" | "guest_speaking" | "guest_turn_finalizing" | "waiting_for_model" | "tool_requested" | "tool_running" | "tool_result_returned" | "assistant_streaming" | "assistant_turn_completed" | "interrupted" | "turn_failed";
  output: "idle" | "buffering" | "playable" | "playing" | "cancelling" | "cancelled" | "draining" | "completed" | "error";
  action: "none" | "collecting_information" | "preparing" | "confirmation_required" | "confirming" | "executing" | "succeeded" | "cancelled" | "expired" | "failed";
};
```

Mọi state snapshot có `revision`, `activeTurnId`, `activeActionId`, `serverTimestamp`.
Browser chỉ áp dụng revision lớn hơn hiện tại.

Audio frame có `turnId`, `generation`, `sequence`. Khi barge-in tăng generation và bỏ frame cũ.

Conversation/ticket/pending action nằm trong Lotiva, không phụ thuộc provider session.
