/** Marketing locale architecture for lotavi.com */

export const BRAND = "Lotavi" as const;

export const ACTIVE_LOCALES = ["vi", "en"] as const;
export type ActiveLocale = (typeof ACTIVE_LOCALES)[number];

/** Prepared but not publicly routed until translations exist */
export const FUTURE_LOCALES = ["th", "id", "ko", "ja", "fr"] as const;
export type FutureLocale = (typeof FUTURE_LOCALES)[number];

export type LocaleCode = ActiveLocale | FutureLocale;

export const DEFAULT_LOCALE: ActiveLocale = "en";

export const LOCALE_COOKIE_NAME =
  process.env.LOCALE_COOKIE_NAME?.trim() || "lotavi_locale";

export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 365 days

export const HTML_LANG: Record<ActiveLocale, string> = {
  vi: "vi",
  en: "en",
};

export const HREFLANG: Record<ActiveLocale, string> = {
  vi: "vi-VN",
  en: "en",
};

export const OG_LOCALE: Record<ActiveLocale, string> = {
  vi: "vi_VN",
  en: "en_US",
};

/** Active country → locale fallback (only when browser match fails) */
export const COUNTRY_LOCALE_FALLBACK: Record<string, ActiveLocale> = {
  VN: "vi",
};

/** Future country mappings — used only after locale is active */
export const FUTURE_COUNTRY_LOCALE: Record<string, FutureLocale> = {
  TH: "th",
  ID: "id",
  KR: "ko",
  JP: "ja",
};

export const TRUSTED_COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
] as const;

export function isActiveLocale(value: string | null | undefined): value is ActiveLocale {
  return !!value && (ACTIVE_LOCALES as readonly string[]).includes(value);
}

export function isKnownLocale(value: string | null | undefined): value is LocaleCode {
  if (!value) return false;
  return (
    (ACTIVE_LOCALES as readonly string[]).includes(value) ||
    (FUTURE_LOCALES as readonly string[]).includes(value)
  );
}

export function getPublicWebUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_WEB_URL?.trim() ||
    process.env.PUBLIC_WEB_URL?.trim() ||
    "https://lotavi.com";
  return raw.replace(/\/$/, "");
}

export function isStagingHost(host: string | null | undefined): boolean {
  if (process.env.NEXT_PUBLIC_SITE_ENV === "staging") return true;
  if (!host) return false;
  const h = host.toLowerCase();
  return h.startsWith("staging.") || h.includes("staging.lotavi.");
}
