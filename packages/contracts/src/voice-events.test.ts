import { describe, expect, it } from "vitest";
import { CanonicalVoiceEventSchema } from "./voice-events.js";

describe("CanonicalVoiceEventSchema", () => {
  it("accepts session.ready", () => {
    const parsed = CanonicalVoiceEventSchema.parse({
      type: "session.ready",
      sessionId: "018f0000-0000-7000-8000-000000000001",
      revision: 1,
      payload: {},
      serverTimestamp: new Date().toISOString(),
    });
    expect(parsed.type).toBe("session.ready");
  });
});
