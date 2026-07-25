import { z } from "zod";

/** Canonical voice events — provider-agnostic (Lotiva WebSocket). */
export const CanonicalVoiceEventTypeSchema = z.enum([
  "session.ready",
  "state.snapshot",
  "input.speech_started",
  "input.transcript.delta",
  "input.transcript.completed",
  "assistant.audio.delta",
  "assistant.transcript.delta",
  "assistant.turn.completed",
  "action.confirmation_required",
  "tool.call",
  "tool.result",
  "connection.reconnecting",
  "session.error",
  "session.ended",
]);

export type CanonicalVoiceEventType = z.infer<typeof CanonicalVoiceEventTypeSchema>;

export const CanonicalVoiceEventSchema = z.object({
  type: CanonicalVoiceEventTypeSchema,
  sessionId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  turnId: z.string().uuid().optional(),
  generation: z.number().int().nonnegative().optional(),
  payload: z.record(z.unknown()).default({}),
  serverTimestamp: z.string().datetime(),
});

export type CanonicalVoiceEvent = z.infer<typeof CanonicalVoiceEventSchema>;
