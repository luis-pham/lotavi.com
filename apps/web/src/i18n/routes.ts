import type { ActiveLocale } from "./config";

/**
 * Explicit slug mapping between locales.
 * Keys are path segments after the locale prefix (no leading slash).
 * Empty string = homepage.
 */
const ROUTE_MAP: Record<string, Record<ActiveLocale, string>> = {
  "": { vi: "", en: "" },
  "giai-phap-khach-san": { vi: "giai-phap-khach-san", en: "hotel-solution" },
  "hotel-solution": { vi: "giai-phap-khach-san", en: "hotel-solution" },
};

export function stripLocalePrefix(pathname: string): { locale: string | null; rest: string } {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = clean.split("/").filter(Boolean);
  const maybeLocale = segments[0] ?? null;
  if (!maybeLocale) return { locale: null, rest: "/" };
  const restSegments = segments.slice(1);
  const rest = restSegments.length ? `/${restSegments.join("/")}` : "/";
  return { locale: maybeLocale, rest };
}

export function localizedPath(locale: ActiveLocale, restPath: string): string {
  const rest = restPath === "/" ? "" : restPath.replace(/^\//, "").replace(/\/$/, "");
  const mapped = ROUTE_MAP[rest]?.[locale];
  if (mapped === undefined && rest !== "") {
    // No equivalent → locale homepage
    return `/${locale}/`;
  }
  const slug = mapped ?? rest;
  return slug ? `/${locale}/${slug}/` : `/${locale}/`;
}

export function switchLocalePath(currentPathname: string, targetLocale: ActiveLocale): string {
  const { rest } = stripLocalePrefix(currentPathname);
  const key = rest === "/" ? "" : rest.replace(/^\//, "").replace(/\/$/, "");
  return localizedPath(targetLocale, key ? `/${key}` : "/");
}
