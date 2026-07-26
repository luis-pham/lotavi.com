"use client";

import { usePathname } from "next/navigation";
import { ConsoleShell } from "./ConsoleShell";
import { ADMIN_NAV, STAFF_NAV } from "@/lib/nav";

export function ConsoleLayout({ role, children }: { role: "admin" | "staff"; children: React.ReactNode }) {
  const pathname = usePathname();
  return <ConsoleShell role={role} userName={role === "admin" ? "Property Admin" : "Staff Member"} nav={role === "admin" ? ADMIN_NAV : STAFF_NAV} pathname={pathname}>{children}</ConsoleShell>;
}
