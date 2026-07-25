import { describe, expect, it } from "vitest";
import { CanonicalVoiceEventSchema } from "@lotiva/contracts";
import { GeminiLiveAdapter } from "@lotiva/infrastructure";

describe("voice provider contract", () => {
  it("emits canonical session.ready without leaking SDK types", async () => {
    process.env.NODE_ENV = "development";
    const adapter = new GeminiLiveAdapter(undefined, true);
    const sessionId = "018f0000-0000-7000-8000-000000000099";
    await adapter.connect(sessionId, {});
    const event = adapter.toCanonicalReady(sessionId);
    const parsed = CanonicalVoiceEventSchema.parse(event);
    expect(parsed.type).toBe("session.ready");
    expect(JSON.stringify(parsed)).not.toContain("GoogleGenAI");
  });

  it("refuses connect when voice disabled", async () => {
    const adapter = new GeminiLiveAdapter("fake-key", false);
    await expect(adapter.connect("s1", {})).rejects.toMatchObject({ code: "VOICE_DISABLED" });
  });
});
