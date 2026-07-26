"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ConsoleNavItem } from "@/lib/nav";

export function CommandPalette({ items, open, onClose }: { items: ConsoleNavItem[]; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [items, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;
  const go = (href: string) => { onClose(); router.push(href); };
  return (
    <>
      <div className="console-overlay" onClick={onClose} />
      <div className="console-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "Enter" && matches[0]) go(matches[0].href);
          }} placeholder="Search pages and actions…" />
        <div className="console-palette-list">
          {matches.map((item, index) => (
            <button className={`console-palette-item ${index === 0 ? "active" : ""}`} key={item.href} onClick={() => go(item.href)}>
              <span className="console-nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          {!matches.length && <div className="console-empty">No matching pages</div>}
        </div>
      </div>
    </>
  );
}
