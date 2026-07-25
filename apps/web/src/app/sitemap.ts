import type { MetadataRoute } from "next";
import { ACTIVE_LOCALES, HREFLANG, getPublicWebUrl } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicWebUrl();
  const languages: Record<string, string> = {
    "x-default": `${base}/en/`,
  };
  for (const locale of ACTIVE_LOCALES) {
    languages[HREFLANG[locale]] = `${base}/${locale}/`;
  }

  return ACTIVE_LOCALES.map((locale) => ({
    url: `${base}/${locale}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages,
    },
  }));
}
