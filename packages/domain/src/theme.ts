export type PortalThemeDraft = {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logoUrl: string | null;
  coverUrl: string | null;
  assistantName: string;
  borderRadius: string;
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateThemeDraft(draft: PortalThemeDraft): string[] {
  const errors: string[] = [];
  if (!draft.brandName.trim()) errors.push("brandName required");
  if (!HEX.test(draft.primaryColor)) errors.push("primaryColor invalid");
  if (!HEX.test(draft.accentColor)) errors.push("accentColor invalid");
  if (!HEX.test(draft.backgroundColor)) errors.push("backgroundColor invalid");
  if (!HEX.test(draft.textColor)) errors.push("textColor invalid");
  if (!draft.assistantName.trim()) errors.push("assistantName required");
  // Brand Studio forbids arbitrary CSS/HTML/JS — only schema fields allowed.
  return errors;
}

export function defaultThemeDraft(brandName = "Lotiva"): PortalThemeDraft {
  return {
    brandName,
    primaryColor: "#0F3D2E",
    accentColor: "#C4A35A",
    backgroundColor: "#F7F4EF",
    textColor: "#1A1A1A",
    fontFamily: "Cormorant Garamond, Georgia, serif",
    logoUrl: null,
    coverUrl: null,
    assistantName: "Lotiva Assistant",
    borderRadius: "8px",
  };
}
