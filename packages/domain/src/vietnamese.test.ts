import { describe, expect, it } from "vitest";
import { expandSearchTerms, normalizeSearchText, stripVietnameseDiacritics } from "./vietnamese.js";

describe("vietnamese normalization", () => {
  it("strips diacritics", () => {
    expect(stripVietnameseDiacritics("Hồ bơi")).toBe("Ho boi");
    expect(normalizeSearchText("Hồ bơi ở đâu?")).toBe("ho boi o dau");
  });

  it("expands pool synonyms", () => {
    const terms = expandSearchTerms("ho boi");
    expect(terms.some((t) => t.includes("pool") || t.includes("be boi"))).toBe(true);
  });
});
