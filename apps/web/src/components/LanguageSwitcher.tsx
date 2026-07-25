"use client";

import Link from "next/link";
import {
  ACTIVE_LOCALES,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  type ActiveLocale,
} from "@/i18n/config";
import { trackLocaleEvent } from "@/i18n/analytics";
import { switchLocalePath } from "@/i18n/routes";

type Props = {
  locale: ActiveLocale;
  pathname: string;
  labels: { vi: string; en: string; aria: string; current: string };
};

function setLocaleCookie(locale: ActiveLocale) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    `${LOCALE_COOKIE_NAME}=${locale}`,
    "Path=/",
    `Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function LanguageSwitcher({ locale, pathname, labels }: Props) {
  return (
    <nav className="lang-switcher" aria-label={labels.aria}>
      <span className="sr-only">{labels.current}</span>
      <ul>
        {ACTIVE_LOCALES.map((code) => {
          const href = switchLocalePath(pathname, code);
          const active = code === locale;
          const label = code === "vi" ? labels.vi : labels.en;
          return (
            <li key={code}>
              {active ? (
                <span aria-current="true" className="lang-active">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  hrefLang={code === "vi" ? "vi-VN" : "en"}
                  onClick={() => {
                    setLocaleCookie(code);
                    trackLocaleEvent("locale_manually_changed", {
                      from_locale: locale,
                      to_locale: code,
                      resolution_source: "manual",
                    });
                  }}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
