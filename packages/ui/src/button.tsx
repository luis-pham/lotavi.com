import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export function Button({ children, variant = "primary", style, ...rest }: Props) {
  const base: React.CSSProperties = {
    fontFamily: "var(--lotiva-font-body)",
    borderRadius: "var(--lotiva-radius)",
    padding: "10px 18px",
    border: "none",
    cursor: rest.disabled ? "not-allowed" : "pointer",
    opacity: rest.disabled ? 0.6 : 1,
    background:
      variant === "primary" ? "var(--lotiva-color-primary)" : "transparent",
    color: variant === "primary" ? "#fff" : "var(--lotiva-color-text)",
    ...style,
  };
  return (
    <button type="button" style={base} {...rest}>
      {children}
    </button>
  );
}
