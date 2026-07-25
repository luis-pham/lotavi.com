import type { Metadata } from "next";
import { headers } from "next/headers";
import "@lotiva/design-tokens/css";
import "./globals.css";
import { HTML_LANG, isActiveLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: {
    default: "Lotavi",
    template: "%s · Lotavi",
  },
  description: "Lotavi — Hospitality Experience & Intelligence Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || "https://lotavi.com"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const fromMiddleware = h.get("x-lotavi-locale");
  const lang = isActiveLocale(fromMiddleware) ? HTML_LANG[fromMiddleware] : "en";

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
