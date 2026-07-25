import type { MetadataRoute } from "next";
import { getPublicWebUrl, isStagingHost } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  const host =
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_SITE_HOST ||
    new URL(getPublicWebUrl()).host;

  if (isStagingHost(host) || process.env.NEXT_PUBLIC_SITE_ENV === "staging") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  const base = getPublicWebUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/vi/", "/en/"],
      disallow: ["/g/", "/staff", "/admin", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
