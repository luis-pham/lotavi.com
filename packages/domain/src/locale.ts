export const SUPPORTED_LOCALES = ["vi-VN", "en-US", "zh-CN", "ko-KR", "ja-JP"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Canonical guest UI locale resolution.
 * Priority: explicit guest selection → access context → browser → property default → en-US
 */
export function resolveGuestLocale(input: {
  guestSelected?: string | null;
  accessContextLocale?: string | null;
  browserLocale?: string | null;
  propertyDefault?: string | null;
}): SupportedLocale {
  const candidates = [
    input.guestSelected,
    input.accessContextLocale,
    input.browserLocale,
    input.propertyDefault,
    "en-US",
  ];
  for (const c of candidates) {
    if (!c) continue;
    const normalized = normalizeLocaleTag(c);
    if (isSupportedLocale(normalized)) return normalized;
    const base = normalized.split("-")[0];
    const mapped = SUPPORTED_LOCALES.find((l) => l.startsWith(`${base}-`));
    if (mapped) return mapped;
  }
  return "en-US";
}

export function normalizeLocaleTag(tag: string): string {
  const parts = tag.trim().replace("_", "-").split("-");
  if (parts.length === 1) return parts[0]!.toLowerCase();
  return `${parts[0]!.toLowerCase()}-${parts[1]!.toUpperCase()}`;
}
