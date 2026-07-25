import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  gap?: number;
  style?: CSSProperties;
};

export function Stack({ children, gap = 16, style }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}
