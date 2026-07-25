import {
  COUNTRY_LOCALE_FALLBACK,
  DEFAULT_LOCALE,
  FUTURE_COUNTRY_LOCALE,
  TRUSTED_COUNTRY_HEADERS,
  type ActiveLocale,
  isActiveLocale,
  isKnownLocale,
} from "./config";
import { bestBrowserLocale } from "./accept-language";

export type LocaleResolutionSource =
  | "cookie"
  | "url"
  | "browser"
  | "country"
  | "fallback"
  | "manual";

export type LocaleResolutionInput = {
  cookieLocale?: string | null;
  urlLocale?: string | null;
  acceptLanguage?: string | null;
  /** Raw header map (lowercased keys preferred) */
  headers?: Headers | Record<string, string | null | undefined>;
  /**
   * When true, URL locale wins for rendering (explicit path).
   * Cookie still wins for root `/` redirects when present.
   */
  preferUrlForExplicitPath?: boolean;
};

export type LocaleResolutionResult = {
  locale: ActiveLocale;
  source: LocaleResolutionSource;
};

function readHeader(
  headers: LocaleResolutionInput["headers"],
  name: string,
): string | null {
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const map = headers as Record<string, string | null | undefined>;
  return map[name] ?? map[name.toLowerCase()] ?? null;
}

/**
 * Read country from trusted infrastructure headers only.
 * Ignores XX / T1 / empty Cloudflare placeholders.
 */
export function readTrustedCountry(
  headers: LocaleResolutionInput["headers"],
): string | null {
  for (const key of TRUSTED_COUNTRY_HEADERS) {
    const raw = readHeader(headers, key)?.trim().toUpperCase();
    if (!raw) continue;
    if (raw === "XX" || raw === "T1" || raw === "ZZ") continue;
    if (/^[A-Z]{2}$/.test(raw)) return raw;
  }
  return null;
}

export function countryToLocale(country: string | null): ActiveLocale | null {
  if (!country) return null;
  const active = COUNTRY_LOCALE_FALLBACK[country];
  if (active) return active;
  const future = FUTURE_COUNTRY_LOCALE[country];
  // Future mapping exists but locale not active → do not use; caller falls through to en
  if (future) return null;
  return null;
}

/**
 * Priority for root `/` redirect (and similar auto-detection):
 * 1. cookie
 * 2. url (if present)
 * 3. Accept-Language
 * 4. trusted country
 * 5. English
 *
 * Explicit locale paths must NOT call this to override the path —
 * use `resolveExplicitPathLocale` instead.
 */
export function resolveLocale(input: LocaleResolutionInput): LocaleResolutionResult {
  if (isActiveLocale(input.cookieLocale)) {
    return { locale: input.cookieLocale, source: "cookie" };
  }
  // Invalid cookie ignored

  if (isActiveLocale(input.urlLocale)) {
    return { locale: input.urlLocale, source: "url" };
  }

  // Known but inactive future locale in URL → English
  if (input.urlLocale && isKnownLocale(input.urlLocale) && !isActiveLocale(input.urlLocale)) {
    return { locale: DEFAULT_LOCALE, source: "fallback" };
  }

  const browser = bestBrowserLocale(input.acceptLanguage ?? null);
  if (browser) {
    return { locale: browser, source: "browser" };
  }

  const country = readTrustedCountry(input.headers);
  const fromCountry = countryToLocale(country);
  if (fromCountry) {
    return { locale: fromCountry, source: "country" };
  }

  return { locale: DEFAULT_LOCALE, source: "fallback" };
}

/** Explicit `/vi/` or `/en/` path — never overridden by cookie/browser/country. */
export function resolveExplicitPathLocale(urlLocale: string): LocaleResolutionResult | null {
  if (isActiveLocale(urlLocale)) {
    return { locale: urlLocale, source: "url" };
  }
  return null;
}
