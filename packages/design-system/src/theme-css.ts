import type { ThemeTokens } from "@lotiva/contracts";

export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
  return {
    "--lotiva-color-primary": theme.primaryColor,
    "--lotiva-color-accent": theme.accentColor,
    "--lotiva-color-bg": theme.backgroundColor,
    "--lotiva-color-text": theme.textColor,
    "--lotiva-font-display": theme.fontFamily,
    "--lotiva-radius": theme.borderRadius,
  };
}
