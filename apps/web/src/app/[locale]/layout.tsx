import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ACTIVE_LOCALES,
  HREFLANG,
  HTML_LANG,
  OG_LOCALE,
  getPublicWebUrl,
  isActiveLocale,
  type ActiveLocale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return ACTIVE_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isActiveLocale(raw)) return {};
  const locale = raw as ActiveLocale;
  const t = getDictionary(locale);
  const base = getPublicWebUrl();
  const canonical = `${base}/${locale}/`;

  const languages: Record<string, string> = {
    "x-default": `${base}/en/`,
  };
  for (const l of ACTIVE_LOCALES) {
    languages[HREFLANG[l]] = `${base}/${l}/`;
  }

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      url: canonical,
      locale: OG_LOCALE[locale],
      alternateLocale: ACTIVE_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      siteName: "Lotavi",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isActiveLocale(locale)) notFound();

  return (
    <div lang={HTML_LANG[locale]} data-locale={locale}>
      {children}
    </div>
  );
}
