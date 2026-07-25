import { describe, expect, it } from "vitest";
import { parseAcceptLanguage, bestBrowserLocale } from "./accept-language";
import {
  countryToLocale,
  readTrustedCountry,
  resolveExplicitPathLocale,
  resolveLocale,
} from "./resolve-locale";

describe("parseAcceptLanguage", () => {
  it("prefers vi from weighted vi-VN list", () => {
    expect(bestBrowserLocale("vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("vi");
  });

  it("prefers en when en has higher weight", () => {
    expect(bestBrowserLocale("en-US,en;q=0.9,vi;q=0.7")).toBe("en");
  });

  it("falls through unsupported fr to empty (caller uses fallback)", () => {
    expect(parseAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toEqual(["en"]);
  });

  it("respects quality weights over order", () => {
    expect(bestBrowserLocale("en;q=0.2,vi;q=0.9")).toBe("vi");
  });
});

describe("resolveLocale", () => {
  it("saved vi wins", () => {
    expect(resolveLocale({ cookieLocale: "vi", acceptLanguage: "en-US" }).locale).toBe("vi");
    expect(resolveLocale({ cookieLocale: "vi" }).source).toBe("cookie");
  });

  it("saved en wins over VN country", () => {
    const r = resolveLocale({
      cookieLocale: "en",
      headers: { "cf-ipcountry": "VN" },
      acceptLanguage: "vi-VN",
    });
    expect(r).toEqual({ locale: "en", source: "cookie" });
  });

  it("URL vi when no cookie", () => {
    expect(resolveLocale({ urlLocale: "vi" })).toEqual({ locale: "vi", source: "url" });
  });

  it("URL en when no cookie", () => {
    expect(resolveLocale({ urlLocale: "en" })).toEqual({ locale: "en", source: "url" });
  });

  it("browser vi-VN", () => {
    expect(resolveLocale({ acceptLanguage: "vi-VN,vi;q=0.9" }).source).toBe("browser");
    expect(resolveLocale({ acceptLanguage: "vi-VN" }).locale).toBe("vi");
  });

  it("browser en-US", () => {
    expect(resolveLocale({ acceptLanguage: "en-US,en;q=0.9" }).locale).toBe("en");
  });

  it("unsupported browser + VN country → vi", () => {
    const r = resolveLocale({
      acceptLanguage: "fr-FR,fr;q=0.9",
      headers: { "cf-ipcountry": "VN" },
    });
    // fr list includes en at q=0.8 in brief example; here pure fr → country
    expect(r).toEqual({ locale: "vi", source: "country" });
  });

  it("unsupported browser + unsupported country → en", () => {
    expect(
      resolveLocale({
        acceptLanguage: "fr-FR",
        headers: { "cf-ipcountry": "DE" },
      }),
    ).toEqual({ locale: "en", source: "fallback" });
  });

  it("no signals → en", () => {
    expect(resolveLocale({})).toEqual({ locale: "en", source: "fallback" });
  });

  it("inactive future locale falls back to en", () => {
    expect(resolveLocale({ urlLocale: "th" })).toEqual({ locale: "en", source: "fallback" });
  });

  it("invalid cookie ignored", () => {
    expect(
      resolveLocale({ cookieLocale: "zz", acceptLanguage: "vi" }),
    ).toEqual({ locale: "vi", source: "browser" });
  });

  it("browser vi wins over US country", () => {
    expect(
      resolveLocale({
        acceptLanguage: "vi",
        headers: { "x-vercel-ip-country": "US" },
      }),
    ).toEqual({ locale: "vi", source: "browser" });
  });

  it("browser en wins over VN country", () => {
    expect(
      resolveLocale({
        acceptLanguage: "en-US",
        headers: { "cf-ipcountry": "VN" },
      }),
    ).toEqual({ locale: "en", source: "browser" });
  });

  it("TH country with inactive Thai → en", () => {
    expect(
      resolveLocale({
        acceptLanguage: "th-TH",
        headers: { "cf-ipcountry": "TH" },
      }),
    ).toEqual({ locale: "en", source: "fallback" });
  });
});

describe("resolveExplicitPathLocale", () => {
  it("keeps vi", () => {
    expect(resolveExplicitPathLocale("vi")).toEqual({ locale: "vi", source: "url" });
  });

  it("keeps en", () => {
    expect(resolveExplicitPathLocale("en")).toEqual({ locale: "en", source: "url" });
  });

  it("rejects inactive", () => {
    expect(resolveExplicitPathLocale("th")).toBeNull();
  });
});

describe("trusted country headers", () => {
  it("reads CF-IPCountry", () => {
    expect(readTrustedCountry({ "cf-ipcountry": "VN" })).toBe("VN");
  });

  it("ignores XX placeholder", () => {
    expect(readTrustedCountry({ "cf-ipcountry": "XX" })).toBeNull();
  });

  it("does not invent from arbitrary headers", () => {
    expect(readTrustedCountry({ "x-forwarded-country": "VN" })).toBeNull();
  });

  it("maps VN → vi only among active", () => {
    expect(countryToLocale("VN")).toBe("vi");
    expect(countryToLocale("TH")).toBeNull();
  });
});
