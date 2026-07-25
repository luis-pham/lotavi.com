import { describe, expect, it } from "vitest";
import { localizedPath, stripLocalePrefix, switchLocalePath } from "./routes";

describe("locale routes", () => {
  it("strips locale prefix", () => {
    expect(stripLocalePrefix("/vi/")).toEqual({ locale: "vi", rest: "/" });
    expect(stripLocalePrefix("/en/hotel-solution")).toEqual({
      locale: "en",
      rest: "/hotel-solution",
    });
  });

  it("maps hotel solution slugs", () => {
    expect(switchLocalePath("/vi/giai-phap-khach-san", "en")).toBe("/en/hotel-solution/");
    expect(switchLocalePath("/en/hotel-solution", "vi")).toBe("/vi/giai-phap-khach-san/");
  });

  it("homepage switch", () => {
    expect(switchLocalePath("/vi/", "en")).toBe("/en/");
    expect(switchLocalePath("/en/", "vi")).toBe("/vi/");
  });

  it("unknown slug falls back to locale homepage", () => {
    expect(localizedPath("en", "/unknown-page")).toBe("/en/");
  });
});
