import { notFound } from "next/navigation";
import { MarketingLanding } from "@/components/MarketingLanding";
import { isActiveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { API_URL } from "@/lib/api";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isActiveLocale(locale)) notFound();

  let seed: { guestQrPath?: string } = {};
  try {
    const res = await fetch(`${API_URL}/api/v1/meta/seed`, { cache: "no-store" });
    if (res.ok) seed = await res.json();
  } catch {
    seed = {};
  }

  return (
    <MarketingLanding
      locale={locale}
      dictionary={getDictionary(locale)}
      guestQrPath={seed.guestQrPath}
    />
  );
}
