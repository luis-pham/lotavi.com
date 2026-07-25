import type { ActiveLocale } from "./config";
import type { LocaleResolutionSource } from "./resolve-locale";

export type LocaleAnalyticsEvent = "locale_auto_resolved" | "locale_manually_changed";

export type LocaleAnalyticsProps = {
  from_locale?: ActiveLocale | null;
  to_locale: ActiveLocale;
  resolution_source: LocaleResolutionSource;
};

/**
 * Lightweight analytics hook — no IP / raw Accept-Language.
 * Integrates with a real collector when available.
 */
export function trackLocaleEvent(event: LocaleAnalyticsEvent, props: LocaleAnalyticsProps): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as Window & {
      lotaviAnalytics?: { track: (e: string, p: Record<string, unknown>) => void };
    };
    w.lotaviAnalytics?.track(event, { ...props });
  } catch {
    /* ignore */
  }
}
