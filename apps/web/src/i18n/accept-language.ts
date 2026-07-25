import { ACTIVE_LOCALES, type ActiveLocale, isActiveLocale } from "./config";

type WeightedTag = { tag: string; q: number };

/**
 * Parse Accept-Language with quality weights (RFC 7231).
 * Returns active locales in preference order.
 */
export function parseAcceptLanguage(header: string | null | undefined): ActiveLocale[] {
  if (!header?.trim()) return [];

  const parts = header.split(",");
  const weighted: WeightedTag[] = [];

  for (const part of parts) {
    const [rawTag, ...params] = part.trim().split(";");
    if (!rawTag) continue;
    let q = 1;
    for (const p of params) {
      const [k, v] = p.trim().split("=");
      if (k === "q" && v != null) {
        const n = Number(v);
        if (Number.isFinite(n)) q = n;
      }
    }
    if (q <= 0) continue;
    weighted.push({ tag: rawTag.trim().toLowerCase(), q });
  }

  weighted.sort((a, b) => b.q - a.q);

  const seen = new Set<ActiveLocale>();
  const ordered: ActiveLocale[] = [];

  for (const { tag } of weighted) {
    const primary = tag.split("-")[0] ?? tag;
    if (isActiveLocale(primary) && !seen.has(primary)) {
      seen.add(primary);
      ordered.push(primary);
    }
  }

  // Preserve only active; ignore inactive future primaries here
  return ordered.filter((l) => (ACTIVE_LOCALES as readonly string[]).includes(l));
}

export function bestBrowserLocale(header: string | null | undefined): ActiveLocale | null {
  return parseAcceptLanguage(header)[0] ?? null;
}
