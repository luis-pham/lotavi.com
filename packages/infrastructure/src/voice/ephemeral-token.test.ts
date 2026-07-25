import { describe, expect, it } from "vitest";
import { buildGeminiLiveWsUrl, propertyAllowlisted } from "./ephemeral-token.js";

describe("ephemeral token helpers", () => {
  it("allowlists only exact property ids", () => {
    expect(propertyAllowlisted("a,b", "a")).toBe(true);
    expect(propertyAllowlisted("a,b", "c")).toBe(false);
    expect(propertyAllowlisted("", "a")).toBe(false);
  });

  it("builds constrained WS URL without embedding long-lived keys", () => {
    const url = buildGeminiLiveWsUrl("auth_tokens/test-ephemeral");
    expect(url).toContain("BidiGenerateContentConstrained");
    expect(url).toContain("access_token=");
    expect(url).not.toContain("AIza");
    expect(url).not.toContain("GEMINI_API_KEY");
  });
});
