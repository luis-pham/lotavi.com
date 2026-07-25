import Link from "next/link";
import type { ActiveLocale } from "@/i18n/config";
import type { MarketingDictionary } from "@/i18n/messages/types";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  locale: ActiveLocale;
  dictionary: MarketingDictionary;
  guestQrPath?: string;
};

export function MarketingLanding({ locale, dictionary: t, guestQrPath }: Props) {
  return (
    <main className="shell" id="main">
      <a className="sr-only-focusable" href="#main-content">
        {t.a11y.skipToContent}
      </a>

      <header className="marketing-header">
        <div className="marketing-brand-row">
          <p className="muted">lotavi.com</p>
          <LanguageSwitcher
            locale={locale}
            pathname={`/${locale}/`}
            labels={{
              vi: t.nav.switchToVi,
              en: t.nav.switchToEn,
              aria: t.a11y.languageSwitcher,
              current: t.a11y.currentLanguage,
            }}
          />
        </div>
        <nav className="nav" aria-label={t.nav.home}>
          {guestQrPath ? <Link href={guestQrPath}>{t.nav.guestDemo}</Link> : null}
          <Link href="/staff">{t.nav.staff}</Link>
          <Link href="/admin">{t.nav.admin}</Link>
        </nav>
      </header>

      <section id="main-content" className="hero card-free">
        <p className="muted">{t.hero.descriptor}</p>
        <h1 style={{ fontSize: "clamp(2.8rem, 8vw, 4.5rem)", margin: "8px 0 12px" }}>
          {t.hero.brand}
        </h1>
        <p
          style={{
            fontFamily: "var(--lotiva-font-display)",
            fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
            margin: "0 0 8px",
          }}
        >
          {t.hero.primary}
        </p>
        <p className="muted" style={{ marginBottom: 12 }}>
          {t.hero.secondary}
        </p>
        <p style={{ maxWidth: 540, fontSize: "1.1rem", lineHeight: 1.55 }}>{t.hero.supporting}</p>
        <div className="nav">
          <Link href={`/${locale}/#how`}>{t.hero.ctaPrimary}</Link>
          <Link href="/staff">{t.hero.ctaSecondary}</Link>
        </div>
      </section>

      <section className="card-free" aria-labelledby="features-heading">
        <h2 id="features-heading">{t.features.heading}</h2>
        <ul className="feature-list">
          {t.features.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-free" aria-labelledby="industries-heading">
        <h2 id="industries-heading">{t.industries.heading}</h2>
        <p style={{ maxWidth: 560 }}>{t.industries.description}</p>
      </section>

      <section className="card-free" id="how" aria-labelledby="how-heading">
        <h2 id="how-heading">{t.howItWorks.heading}</h2>
        <ol className="feature-list">
          {t.howItWorks.steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p className="muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card-free" aria-labelledby="trust-heading">
        <h2 id="trust-heading">{t.trust.heading}</h2>
        <p style={{ maxWidth: 560 }}>{t.trust.description}</p>
      </section>

      <footer className="marketing-footer muted">
        <p>
          {t.footer.product} · {t.footer.contact} · {t.footer.legal}
        </p>
        <p>{t.footer.rights}</p>
      </footer>
    </main>
  );
}
