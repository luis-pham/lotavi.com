import type { ActiveLocale } from "./config";
import { en } from "./messages/en";
import { vi } from "./messages/vi";
import type { MarketingDictionary } from "./messages/types";

const dictionaries: Record<ActiveLocale, MarketingDictionary> = { en, vi };

export function getDictionary(locale: ActiveLocale): MarketingDictionary {
  return dictionaries[locale];
}
