"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CommandPalette } from "./CommandPalette";
import type { ConsoleNavItem } from "@/lib/nav";

export function ConsoleShell({ role, userName, nav, pathname, children }: {
  role: "admin" | "staff"; userName: string; nav: ConsoleNavItem[]; pathname: string; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem("lotiva-console-collapsed") === "1"); }, []);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((value) => !value); }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  const toggle = () => setCollapsed((value) => {
    localStorage.setItem("lotiva-console-collapsed", value ? "0" : "1");
    return !value;
  });
  return (
    <div className={`console-app ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="console-sidebar">
        <div className="console-brand"><span className="console-brand-mark">L</span><span className="console-brand-label">Lotiva <span style={{ color: "#737985", fontWeight: 500 }}>· {role === "admin" ? "Admin" : "Staff"}</span></span></div>
        <nav className="console-nav">
          {nav.map((item) => (
            <div key={item.href}>
              {item.group && <div className="console-nav-group">{item.group}</div>}
              <Link href={item.href} className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""} title={item.label}>
                <span className="console-nav-icon">{item.icon}</span><span className="console-nav-label">{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>
        <button className="console-collapse" onClick={toggle}><span className="console-nav-icon">{collapsed ? "›" : "‹"}</span> <span className="console-collapse-label">Collapse sidebar</span></button>
      </aside>
      <main className="console-main">
        <header className="console-topbar">
          <button className="console-command-hint" onClick={() => setPaletteOpen(true)}><span>Search or jump to…</span><span className="console-kbd">⌘K</span></button>
          <button className="console-notification" aria-label="Notifications">◉</button>
          <div className="console-user"><span className="console-avatar">{userName.charAt(0).toUpperCase()}</span><span>{userName}</span></div>
        </header>
        <div className="console-workspace">{children}</div>
      </main>
      <CommandPalette items={nav} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
