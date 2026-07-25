import type { CanonicalVoiceEvent } from "@lotiva/contracts";
import { bumpRevision, createInitialVoiceState, type VoiceRuntimeState } from "@lotiva/domain";
import type { VoiceProviderPort } from "@lotiva/application";

/**
 * Gemini Live adapter boundary.
 * Provider SDK types stay inside this module; outbound events are canonical only.
 *
 * Real provider streaming requires GEMINI_API_KEY + VOICE_ENABLED=true.
 * Without credentials, connect() throws in production-like mode when voice is enabled;
 * when voice is disabled, connect() rejects with VOICE_DISABLED.
 */
export class GeminiLiveAdapter implements VoiceProviderPort {
  private sessions = new Map<string, VoiceRuntimeState>();

  constructor(
    private readonly apiKey: string | undefined = process.env.GEMINI_API_KEY,
    private readonly voiceEnabled = process.env.VOICE_ENABLED === "true",
  ) {}

  async connect(sessionId: string, _config: Record<string, unknown>): Promise<void> {
    if (!this.voiceEnabled) {
      throw Object.assign(new Error("Voice is disabled"), { code: "VOICE_DISABLED" });
    }

    let state = createInitialVoiceState();
    state = bumpRevision(state, {
      session: "initializing",
      connection: "connecting",
    });

    if (!this.apiKey) {
      const nodeEnv = process.env.NODE_ENV ?? "development";
      if (nodeEnv === "production" || nodeEnv === "staging") {
        throw Object.assign(new Error("GEMINI_API_KEY required when VOICE_ENABLED"), {
          code: "VOICE_PROVIDER_MISCONFIGURED",
        });
      }
      // Explicit development degraded mode — not silent production fallback
      state = bumpRevision(state, {
        session: "fallback_text",
        connection: "degraded",
        input: "ready",
      });
      this.sessions.set(sessionId, state);
      return;
    }

    // Provider session establishment placeholder for Live API handshake.
    // When @google/genai Live is wired, open the session here and map events.
    state = bumpRevision(state, {
      session: "active",
      connection: "connected",
      input: "ready",
    });
    this.sessions.set(sessionId, state);
  }

  async sendAudio(sessionId: string, _chunk: Buffer): Promise<void> {
    const current = this.sessions.get(sessionId);
    if (!current) throw new Error("Voice session not found");
    if (current.session === "fallback_text") {
      return;
    }
    const next = bumpRevision(current, {
      input: "speech_detected",
      turn: "guest_speaking",
    });
    this.sessions.set(sessionId, next);
  }

  async close(sessionId: string): Promise<void> {
    const current = this.sessions.get(sessionId) ?? createInitialVoiceState();
    this.sessions.set(
      sessionId,
      bumpRevision(current, { session: "ended", connection: "closed" }),
    );
  }

  getState(sessionId: string): VoiceRuntimeState | null {
    return this.sessions.get(sessionId) ?? null;
  }

  isLiveProviderBound(): boolean {
    return Boolean(this.voiceEnabled && this.apiKey);
  }

  toCanonicalReady(sessionId: string): CanonicalVoiceEvent {
    const state = this.sessions.get(sessionId) ?? createInitialVoiceState();
    return {
      type: "session.ready",
      sessionId,
      revision: state.revision,
      payload: {
        runtime: state,
        provider: this.isLiveProviderBound() ? "gemini_live" : "dev_fallback_text",
        voiceEnabled: this.voiceEnabled,
      },
      serverTimestamp: new Date().toISOString(),
    };
  }
}
