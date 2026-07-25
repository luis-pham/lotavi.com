"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [email, setEmail] = useState("admin@lotiva.vn");
  const [password, setPassword] = useState("admin123");
  const [authed, setAuthed] = useState(false);
  const [home, setHome] = useState<{
    openTickets: number;
    knowledgeDocs: number;
    seedQrPath: string;
  } | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null);
  const [brandName, setBrandName] = useState("Lotiva Demo Hotel");
  const [primaryColor, setPrimaryColor] = useState("#0F3D2E");
  const [draftVersionId, setDraftVersionId] = useState<string | null>(null);
  const [kbTitle, setKbTitle] = useState("Spa hours");
  const [kbContent, setKbContent] = useState("Spa mở cửa 9:00–21:00.");
  const [message, setMessage] = useState<string | null>(null);

  async function login() {
    await api("/api/v1/auth/login", { method: "POST", json: { email, password } });
    setAuthed(true);
    const h = await api<typeof home>("/api/v1/admin/home");
    setHome(h);
    setAnalytics(await api("/api/v1/admin/analytics"));
  }

  async function saveDraft() {
    const res = await api<{ versionId: string }>("/api/v1/admin/brand/draft", {
      method: "PUT",
      json: {
        brandName,
        primaryColor,
        accentColor: "#C4A35A",
        backgroundColor: "#F7F4EF",
        textColor: "#1A1A1A",
        fontFamily: "Cormorant Garamond, Georgia, serif",
        logoUrl: null,
        coverUrl: null,
        assistantName: "Concierge",
        borderRadius: "8px",
      },
    });
    setDraftVersionId(res.versionId);
    setMessage(`Draft saved: ${res.versionId}`);
  }

  async function publish() {
    if (!draftVersionId) return;
    await api("/api/v1/admin/brand/publish", {
      method: "POST",
      json: { versionId: draftVersionId },
    });
    setMessage("Theme published (immutable version)");
  }

  async function addKnowledge() {
    await api("/api/v1/admin/knowledge", {
      method: "POST",
      json: { title: kbTitle, content: kbContent },
    });
    setMessage("Knowledge published");
    setHome(await api("/api/v1/admin/home"));
  }

  return (
    <main className="shell">
      <p className="muted">Lotavi · Admin Console</p>
      <h1>Property Admin</h1>
      <div className="nav">
        <Link href="/">Home</Link>
        <Link href="/staff">Staff</Link>
        {home?.seedQrPath ? <Link href={home.seedQrPath}>Guest QR</Link> : null}
      </div>

      {!authed ? (
        <section style={{ maxWidth: 360 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ height: 8 }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ height: 12 }} />
          <button type="button" onClick={() => void login()}>
            Đăng nhập
          </button>
        </section>
      ) : (
        <section>
          {message && <p className="bubble">{message}</p>}
          <h2>Overview</h2>
          <p className="muted">
            Open tickets: {home?.openTickets ?? 0} · Knowledge docs: {home?.knowledgeDocs ?? 0}
          </p>
          {analytics && (
            <p className="muted">
              Sessions {analytics.guestSessions} · Conversations {analytics.conversations} · Tickets{" "}
              {analytics.tickets}
            </p>
          )}

          <h2>Brand Studio</h2>
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          <div style={{ height: 8 }} />
          <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" onClick={() => void saveDraft()}>
              Save draft
            </button>
            <button type="button" onClick={() => void publish()} disabled={!draftVersionId}>
              Publish
            </button>
          </div>

          <h2 style={{ marginTop: 32 }}>Knowledge</h2>
          <input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} />
          <div style={{ height: 8 }} />
          <textarea rows={3} value={kbContent} onChange={(e) => setKbContent(e.target.value)} />
          <div style={{ height: 12 }} />
          <button type="button" onClick={() => void addKnowledge()}>
            Publish knowledge
          </button>
        </section>
      )}
    </main>
  );
}
