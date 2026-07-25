"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Ticket = {
  id: string;
  status: string;
  category: string;
  description: string;
  descriptionTranslated: string;
};

export default function StaffPage() {
  const [email, setEmail] = useState("staff@lotiva.vn");
  const [password, setPassword] = useState("admin123");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  async function login() {
    setError(null);
    try {
      await api("/api/v1/auth/login", { method: "POST", json: { email, password } });
      setAuthed(true);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function refresh() {
    const res = await api<{ items: Ticket[] }>("/api/v1/staff/tickets");
    setTickets(res.items);
  }

  async function setStatus(id: string, status: string) {
    await api(`/api/v1/staff/tickets/${id}/status`, {
      method: "PATCH",
      json: { status },
    });
    await refresh();
  }

  return (
    <main className="shell">
      <p className="muted">Lotavi · Staff</p>
      <h1>Ticket Inbox</h1>
      <div className="nav">
        <Link href="/">Home</Link>
        <Link href="/admin">Admin</Link>
      </div>

      {!authed ? (
        <section style={{ maxWidth: 360 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
          <div style={{ height: 8 }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
          <div style={{ height: 12 }} />
          <button type="button" onClick={() => void login()}>
            Đăng nhập
          </button>
          {error && <p>{error}</p>}
        </section>
      ) : (
        <section>
          <button type="button" onClick={() => void refresh()}>
            Refresh
          </button>
          {tickets.map((t) => (
            <div key={t.id} className="bubble" style={{ marginTop: 12 }}>
              <strong>
                {t.status} · {t.category}
              </strong>
              <p>{t.description}</p>
              <p className="muted">{t.descriptionTranslated}</p>
              <div className="row">
                <button type="button" onClick={() => void setStatus(t.id, "acknowledged")}>
                  Acknowledge
                </button>
                <button type="button" onClick={() => void setStatus(t.id, "in_progress")}>
                  In progress
                </button>
                <button type="button" onClick={() => void setStatus(t.id, "resolved")}>
                  Resolve
                </button>
              </div>
            </div>
          ))}
          {!tickets.length && <p className="muted">Chưa có ticket.</p>}
        </section>
      )}
    </main>
  );
}
