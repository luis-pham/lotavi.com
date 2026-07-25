---
title: "Guest Portal Theme Schema"
document_id: "DS-030"
version: "1.0.0"
status: "approved"
owners: ["Product", "Engineering", "Design"]
last_updated: "2026-07-25"
depends_on: []
source_of_truth_for: ["white-label schema"]
implemented_by: []
reviewed_by: []
---


# Guest portal theme

```ts
type GuestPortalTheme = {
  identity: {
    brandName: string;
    logoLightKey?: string;
    logoDarkKey?: string;
    faviconKey?: string;
  };
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
  };
  typography: {
    preset: "modern" | "friendly" | "premium" | "minimal";
  };
  shape: {
    radius: "subtle" | "rounded" | "soft";
    elevation: "flat" | "subtle";
  };
  cover: {
    mobileImageKey?: string;
    desktopImageKey?: string;
    focalX: number;
    focalY: number;
    overlay: number;
  };
  assistant: {
    name: string;
    avatarKey?: string;
  };
  layout: {
    sections: Array<{
      key: string;
      enabled: boolean;
      order: number;
    }>;
  };
  footer: {
    text?: string;
    showPoweredBy: boolean;
  };
};
```

Không có custom CSS, HTML hoặc JS.
