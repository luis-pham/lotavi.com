import type { MarketingDictionary } from "./types";

export const en: MarketingDictionary = {
  meta: {
    title: "Lotavi — Hospitality Experience & Intelligence Platform",
    description:
      "Every guest, understood. Scan. Speak. Served. Lotavi helps hotels and cruises deliver faster guest service through QR, chat, and staff workflows.",
    ogTitle: "Lotavi — Every guest, understood.",
    ogDescription:
      "Hospitality Experience & Intelligence Platform for hotels and cruises. Scan. Speak. Served.",
  },
  nav: {
    home: "Home",
    guestDemo: "Open Guest Portal (demo QR)",
    staff: "Staff Workspace",
    admin: "Admin Console",
    language: "Language",
    switchToVi: "Tiếng Việt",
    switchToEn: "English",
  },
  hero: {
    brand: "Lotavi",
    descriptor: "Hospitality Experience & Intelligence Platform",
    primary: "Every guest, understood.",
    secondary: "Scan. Speak. Served.",
    supporting:
      "QR guest portal with grounded answers and staff service workflows for hotels and cruises.",
    ctaPrimary: "See how it works",
    ctaSecondary: "Staff Workspace",
  },
  features: {
    heading: "Built for guest service operations",
    items: [
      {
        title: "QR guest access",
        description: "Guests scan once and reach the right property experience instantly.",
      },
      {
        title: "Grounded answers",
        description: "Approved property knowledge powers clear, property-safe responses.",
      },
      {
        title: "Staff workflows",
        description: "Confirmed requests become tickets with realtime staff visibility.",
      },
    ],
  },
  industries: {
    heading: "For hotels and cruises",
    description:
      "Designed for hospitality operators who need reliable guest communication across rooms, decks, and shifts.",
  },
  howItWorks: {
    heading: "How it works",
    steps: [
      { title: "Scan", description: "Guest opens the property portal from a room QR code." },
      { title: "Speak or type", description: "Ask questions or start a service request." },
      { title: "Served", description: "Staff receive confirmed tickets and update status in realtime." },
    ],
  },
  trust: {
    heading: "Secure by design",
    description:
      "Tenant isolation, explicit confirmation before tickets, and production controls that refuse unsafe configuration.",
  },
  footer: {
    rights: "Lotavi. All rights reserved.",
    contact: "Contact",
    product: "Product",
    legal: "Legal",
  },
  a11y: {
    skipToContent: "Skip to content",
    languageSwitcher: "Choose language",
    currentLanguage: "Current language: English",
  },
};
