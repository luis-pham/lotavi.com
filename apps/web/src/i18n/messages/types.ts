export type MarketingDictionary = {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  nav: {
    home: string;
    guestDemo: string;
    staff: string;
    admin: string;
    language: string;
    switchToVi: string;
    switchToEn: string;
  };
  hero: {
    brand: string;
    descriptor: string;
    primary: string;
    secondary: string;
    supporting: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  features: {
    heading: string;
    items: { title: string; description: string }[];
  };
  industries: {
    heading: string;
    description: string;
  };
  howItWorks: {
    heading: string;
    steps: { title: string; description: string }[];
  };
  trust: {
    heading: string;
    description: string;
  };
  footer: {
    rights: string;
    contact: string;
    product: string;
    legal: string;
  };
  a11y: {
    skipToContent: string;
    languageSwitcher: string;
    currentLanguage: string;
  };
};
