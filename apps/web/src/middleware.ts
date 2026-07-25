import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  FUTURE_LOCALES,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  isActiveLocale,
} from "@/i18n/config";
import { resolveLocale } from "@/i18n/resolve-locale";

const PASSTHROUGH_PREFIXES = [
  "/_next",
  "/api",
  "/g/",
  "/staff",
  "/admin",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
];

function shouldPassthrough(pathname: string): boolean {
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  return PASSTHROUGH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`) || pathname.startsWith(p),
  );
}

function localeCookieOptions(request: NextRequest) {
  const secure =
    request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  return {
    path: "/",
    sameSite: "lax" as const,
    secure,
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldPassthrough(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  const origin = request.nextUrl.origin;

  // Inactive future locale paths → English homepage (not indexed as incomplete)
  if ((FUTURE_LOCALES as readonly string[]).includes(first)) {
    return NextResponse.redirect(`${origin}/${DEFAULT_LOCALE}/`, 307);
  }

  // Explicit active locale path — do not redirect by browser/country/IP
  if (isActiveLocale(first)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-lotavi-locale", first);
    // Persist explicit path as preference (URL intent)
    if (pathname === `/${first}`) {
      const redirect = NextResponse.redirect(`${origin}/${first}/`, 308);
      redirect.cookies.set(LOCALE_COOKIE_NAME, first, localeCookieOptions(request));
      return redirect;
    }
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_COOKIE_NAME, first, localeCookieOptions(request));
    return response;
  }

  // Root `/` — temporary personalized locale redirect
  if (pathname === "/" || pathname === "") {
    const resolved = resolveLocale({
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      acceptLanguage: request.headers.get("accept-language"),
      headers: request.headers,
    });
    const response = NextResponse.redirect(`${origin}/${resolved.locale}/`, 307);
    response.headers.set("Vary", "Accept-Language");
    response.cookies.set(LOCALE_COOKIE_NAME, resolved.locale, localeCookieOptions(request));
    response.headers.set("x-lotavi-locale-source", resolved.source);
    return response;
  }

  // Unknown non-locale marketing path → locale homepage (do not invent pages)
  const resolved = resolveLocale({
    cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    headers: request.headers,
  });
  return NextResponse.redirect(`${origin}/${resolved.locale}/`, 307);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets with extensions.
     */
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
