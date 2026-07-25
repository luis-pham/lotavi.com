export type VoiceRuntimeState = {
  session:
    | "idle"
    | "initializing"
    | "active"
    | "resuming"
    | "fallback_text"
    | "ending"
    | "ended"
    | "failed";
  connection:
    | "disconnected"
    | "connecting"
    | "connected"
    | "degraded"
    | "reconnecting"
    | "closed";
  input:
    | "unavailable"
    | "permission_required"
    | "requesting_permission"
    | "ready"
    | "capturing"
    | "speech_detected"
    | "speech_ending"
    | "muted"
    | "paused"
    | "error";
  turn:
    | "none"
    | "guest_speaking"
    | "guest_turn_finalizing"
    | "waiting_for_model"
    | "tool_requested"
    | "tool_running"
    | "tool_result_returned"
    | "assistant_streaming"
    | "assistant_turn_completed"
    | "interrupted"
    | "turn_failed";
  output:
    | "idle"
    | "buffering"
    | "playable"
    | "playing"
    | "cancelling"
    | "cancelled"
    | "draining"
    | "completed"
    | "error";
  action:
    | "none"
    | "collecting_information"
    | "preparing"
    | "confirmation_required"
    | "confirming"
    | "executing"
    | "succeeded"
    | "cancelled"
    | "expired"
    | "failed";
  revision: number;
  activeTurnId: string | null;
  activeActionId: string | null;
  serverTimestamp: string;
};

export function createInitialVoiceState(): VoiceRuntimeState {
  return {
    session: "idle",
    connection: "disconnected",
    input: "unavailable",
    turn: "none",
    output: "idle",
    action: "none",
    revision: 0,
    activeTurnId: null,
    activeActionId: null,
    serverTimestamp: new Date().toISOString(),
  };
}

export function applyRevision(
  current: VoiceRuntimeState,
  next: VoiceRuntimeState,
): VoiceRuntimeState {
  if (next.revision <= current.revision) {
    return current;
  }
  return next;
}

export function bumpRevision(state: VoiceRuntimeState, patch: Partial<VoiceRuntimeState>): VoiceRuntimeState {
  return {
    ...state,
    ...patch,
    revision: state.revision + 1,
    serverTimestamp: new Date().toISOString(),
  };
}
