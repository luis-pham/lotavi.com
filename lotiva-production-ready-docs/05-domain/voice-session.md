---
title: "Voice Session Domain"
document_id: "DOM-VOICE-001"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["voice state machine"]
implemented_by: []
reviewed_by: []
---


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
