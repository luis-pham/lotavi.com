export const lotivaTokens = {
  color: {
    primary: "#0F3D2E",
    accent: "#C4A35A",
    background: "#F7F4EF",
    text: "#1A1A1A",
  },
  font: {
    display: '"Cormorant Garamond", Georgia, serif',
    body: '"Source Sans 3", "Segoe UI", sans-serif',
  },
  radius: "8px",
  space: {
    1: "4px",
    2: "8px",
    3: "16px",
    4: "24px",
    5: "40px",
  },
} as const;

export type LotivaTokens = typeof lotivaTokens;
