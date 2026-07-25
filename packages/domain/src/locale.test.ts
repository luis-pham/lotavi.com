import { describe, expect, it } from "vitest";
import { resolveGuestLocale } from "./locale.js";

describe("resolveGuestLocale", () => {
  it("prefers explicit guest selection over browser and property", () => {
    expect(
      resolveGuestLocale({
        guestSelected: "en-US",
        accessContextLocale: "vi-VN",
        browserLocale: "zh-CN",
        propertyDefault: "vi-VN",
      }),
    ).toBe("en-US");
  });

  it("uses access context before browser", () => {
    expect(
      resolveGuestLocale({
        browserLocale: "en-US",
        accessContextLocale: "vi-VN",
        propertyDefault: "ko-KR",
      }),
    ).toBe("vi-VN");
  });

  it("falls back to English", () => {
    expect(resolveGuestLocale({})).toBe("en-US");
  });

  it("maps bare language tags", () => {
    expect(resolveGuestLocale({ browserLocale: "vi" })).toBe("vi-VN");
  });
});
