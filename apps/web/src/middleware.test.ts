import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { LOCALE_COOKIE_NAME } from "./i18n/config";

function req(
  path: string,
  init?: {
    acceptLanguage?: string;
    cookie?: string;
    country?: string;
    host?: string;
  },
) {
  const headers = new Headers();
  if (init?.acceptLanguage) headers.set("accept-language", init.acceptLanguage);
  if (init?.cookie) headers.set("cookie", init.cookie);
  if (init?.country) headers.set("cf-ipcountry", init.country);
  headers.set("host", init?.host ?? "lotavi.com");
  return new NextRequest(new URL(path, "https://lotavi.com"), { headers });
}

describe("marketing locale middleware", () => {
  it("redirects / temporarily to vi for browser vi", () => {
    const res = middleware(req("/", { acceptLanguage: "vi-VN,vi;q=0.9" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://lotavi.com/vi/");
    expect(res.headers.get("vary")).toBe("Accept-Language");
  });

  it("redirects / to en for browser en", () => {
    const res = middleware(req("/", { acceptLanguage: "en-US" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://lotavi.com/en/");
  });

  it("cookie overrides browser and country", () => {
    const res = middleware(
      req("/", {
        acceptLanguage: "vi-VN",
        country: "VN",
        cookie: `${LOCALE_COOKIE_NAME}=en`,
      }),
    );
    expect(res.headers.get("location")).toBe("https://lotavi.com/en/");
  });

  it("does not redirect /vi/ based on English browser", () => {
    const res = middleware(req("/vi/", { acceptLanguage: "en-US" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not redirect /en/ based on VN country", () => {
    const res = middleware(req("/en/", { country: "VN", acceptLanguage: "vi" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passthrough guest routes", () => {
    const res = middleware(req("/g/opaque-token", { acceptLanguage: "fr" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects inactive future locale to en", () => {
    const res = middleware(req("/th/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://lotavi.com/en/");
  });

  it("sets locale cookie on explicit path", () => {
    const res = middleware(req("/vi/"));
    const cookie = res.cookies.get(LOCALE_COOKIE_NAME);
    expect(cookie?.value).toBe("vi");
  });
});
