import type { Metadata } from "next";
import "@/styles/console.css";

export const metadata: Metadata = {
  title: "Staff Workspace",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
