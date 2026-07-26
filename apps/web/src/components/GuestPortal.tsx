"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { VoiceDirectSpike } from "./VoiceDirectSpike";

type Theme = {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  assistantName: string;
  borderRadius: string;
};

type Msg = { role: "guest" | "assistant"; content: string };
type Category = { id: string; guestName: string; description?: string | null; icon?: string };
type PortalSection = { sectionKey: string; title: string; body: string; sortOrder?: number };
type Ticket = { id: string; status: string; description: string; category?: string };

const STATUS_LABEL: Record<string, string> = {
  submitted: "New",
  acknowledged: "Accepted",
  assigned: "Accepted",
  in_progress: "In progress",
  needs_info: "Waiting",
  resolved: "Completed",
  completed: "Completed",
  guest_confirmed: "Confirmed",
  reopened: "Reopened",
  cancelled: "Cancelled",
};

export function GuestPortal({ token }: { token: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [roomLabel, setRoomLabel] = useState("");
  const [tab, setTab] = useState<"home" | "info" | "requests" | "chat">("home");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [announcements, setAnnouncements] = useState<Array<{ title: string; body: string }>>([]);
  const [schedules, setSchedules] = useState<Array<{ title: string; location: string | null }>>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portalContent, setPortalContent] = useState<PortalSection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [reqDesc, setReqDesc] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmedFlash, setConfirmedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceCaps, setVoiceCaps] = useState<{
    voiceEnabled: boolean;
    directEnabled: boolean;
    diagnosticsEnabled: boolean;
    textFallbackEnabled: boolean;
  } | null>(null);
  const [voiceDirect, setVoiceDirect] = useState<{ voiceSessionId: string; mintPath: string } | null>(
    null,
  );

  async function refreshTickets() {
    const t = await api<{ items: Ticket[] }>("/api/v1/guest/tickets");
    setTickets(t.items);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const session = await api<{ roomLabel: string; theme: Theme | null }>(
          "/api/v1/guest/sessions/from-qr",
          { method: "POST", json: { token, locale: "en" } },
        );
        setRoomLabel(session.roomLabel);
        setTheme(session.theme);
        const [s, a, t, caps, cats, content] = await Promise.all([
          api<{ items: Array<{ title: string; location: string | null }> }>("/api/v1/guest/schedules"),
          api<{ items: Array<{ title: string; body: string }> }>("/api/v1/guest/announcements"),
          api<{ items: Ticket[] }>("/api/v1/guest/tickets"),
          api<{
            voiceEnabled: boolean;
            directEnabled: boolean;
            diagnosticsEnabled: boolean;
            textFallbackEnabled: boolean;
          }>("/api/v1/voice/capabilities").catch(() => null),
          api<{ items: Category[] }>("/api/v1/guest/request-categories").catch(() => ({ items: [] })),
          api<{ items: PortalSection[] }>("/api/v1/guest/portal-content").catch(() => ({ items: [] })),
        ]);
        setSchedules(s.items);
        setAnnouncements(a.items);
        setTickets(t.items);
        setCategories(cats.items);
        setPortalContent(content.items.sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)));
        if (caps) setVoiceCaps(caps);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const cssVars = useMemo(() => {
    if (!theme) return {};
    return {
      ["--lotiva-color-primary" as string]: theme.primaryColor,
      ["--lotiva-color-accent" as string]: theme.accentColor,
      ["--lotiva-color-bg" as string]: theme.backgroundColor,
      ["--lotiva-color-text" as string]: theme.textColor,
      ["--lotiva-font-display" as string]: theme.fontFamily,
      ["--lotiva-radius" as string]: theme.borderRadius,
    };
  }, [theme]);

  async function sendChat() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "guest", content: text }]);
    const res = await api<{ conversationId: string; assistantMessage: { content: string } }>(
      "/api/v1/guest/chat",
      { method: "POST", json: { message: text, conversationId } },
    );
    setConversationId(res.conversationId);
    setMessages((m) => [...m, { role: "assistant", content: res.assistantMessage.content }]);
  }

  async function prepareRequest() {
    if (!selectedCategory || !reqDesc.trim()) return;
    const res = await api<{ pendingActionId: string }>("/api/v1/guest/tickets/prepare", {
      method: "POST",
      json: {
        category: selectedCategory.guestName,
        description: reqDesc.trim(),
        department: selectedCategory.guestName,
      },
    });
    setPendingId(res.pendingActionId);
  }

  async function confirmRequest(confirmed: boolean) {
    if (!pendingId) return;
    await api("/api/v1/guest/tickets/confirm", {
      method: "POST",
      json: {
        pendingActionId: pendingId,
        confirmed,
        idempotencyKey: `web-${pendingId}-${confirmed}`,
      },
      headers: { "Idempotency-Key": `web-${pendingId}-${confirmed}` },
    });
    setPendingId(null);
    if (confirmed) {
      setConfirmedFlash(true);
      setReqDesc("");
      setSelectedCategory(null);
    }
    await refreshTickets();
  }

  async function startVoice() {
    if (voiceStarting || voiceDirect) return;
    setVoiceStarting(true);
    setVoiceStatus("connecting");
    setVoiceDirect(null);
    try {
      const res = await api<{
        voiceSessionId: string;
        event: { type: string };
        transport?: string;
        directMintPath?: string | null;
        wsPath?: string | null;
      }>("/api/v1/voice/sessions", { method: "POST", json: {} });
      setVoiceStatus(
        res.event.type === "session.ready" ? `ready (${res.transport ?? "relay"})` : res.event.type,
      );
      if (res.transport === "direct" && res.directMintPath && voiceCaps?.directEnabled) {
        setVoiceDirect({ voiceSessionId: res.voiceSessionId, mintPath: res.directMintPath });
      }
    } catch (e) {
      setVoiceStatus(`failed: ${(e as Error).message}`);
    } finally {
      setVoiceStarting(false);
    }
  }

  if (error) {
    return (
      <main className="guest-shell guest-error">
        <h1>Access unavailable</h1>
        <p>{error.includes("expired") ? "This guest access link has expired." : "Invalid or inactive QR access."}</p>
        <p className="muted">Please ask reception for a new cabin QR.</p>
        <Link href="/">Back to Lotavi</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="guest-shell">
        <p className="muted">Opening your guest portal…</p>
      </main>
    );
  }

  return (
    <main className="guest-shell" style={cssVars}>
      <header className="guest-header">
        <p className="muted">Cabin {roomLabel || "…"}</p>
        <h1>{theme?.brandName ?? "Lotavi"}</h1>
        <p className="muted">{theme?.assistantName ?? "Concierge"} is here to help.</p>
      </header>

      <nav className="guest-tabs" aria-label="Guest portal">
        {(
          [
            ["home", "Home"],
            ["info", "Info"],
            ["requests", "Requests"],
            ["chat", "Assistant"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <section className="guest-section">
          <h2>Announcements</h2>
          {announcements.length === 0 ? (
            <p className="muted">No announcements right now.</p>
          ) : (
            announcements.map((a) => (
              <article key={a.title} className="guest-card">
                <strong>{a.title}</strong>
                <p>{a.body}</p>
              </article>
            ))
          )}
          <h2>Quick requests</h2>
          <div className="guest-category-grid">
            {(categories.length ? categories : [{ id: "hk", guestName: "Housekeeping", description: "Towels & cleaning" }]).map(
              (c) => (
                <button
                  key={c.id}
                  type="button"
                  className="guest-category"
                  onClick={() => {
                    setSelectedCategory(c);
                    setTab("requests");
                  }}
                >
                  <strong>{c.guestName}</strong>
                  <span className="muted">{c.description || "Request help"}</span>
                </button>
              ),
            )}
          </div>
          <h2>Today</h2>
          {schedules.slice(0, 3).map((s) => (
            <article key={s.title} className="guest-card">
              <strong>{s.title}</strong>
              <p className="muted">{s.location}</p>
            </article>
          ))}
        </section>
      )}

      {tab === "info" && (
        <section className="guest-section">
          <h2>Essential information</h2>
          {portalContent.length === 0 ? (
            <article className="guest-card">
              <strong>Welcome</strong>
              <p>Wi‑Fi, dining hours, and spa details are available at reception.</p>
            </article>
          ) : (
            portalContent.map((section) => (
              <article key={section.sectionKey} className="guest-card">
                <strong>{section.title}</strong>
                <p>{section.body}</p>
              </article>
            ))
          )}
          <h2>Help / Contact</h2>
          <article className="guest-card">
            <p>Use Requests for cabin service, or chat with {theme?.assistantName ?? "the assistant"}.</p>
          </article>
        </section>
      )}

      {tab === "requests" && (
        <section className="guest-section">
          <h2>New request</h2>
          {!selectedCategory ? (
            <div className="guest-category-grid">
              {(categories.length ? categories : [{ id: "hk", guestName: "Housekeeping" }]).map((c) => (
                <button key={c.id} type="button" className="guest-category" onClick={() => setSelectedCategory(c)}>
                  <strong>{c.guestName}</strong>
                </button>
              ))}
            </div>
          ) : (
            <>
              <p>
                Category: <strong>{selectedCategory.guestName}</strong>{" "}
                <button type="button" className="guest-link" onClick={() => setSelectedCategory(null)}>
                  Change
                </button>
              </p>
              <textarea
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                rows={3}
                placeholder="Describe what you need…"
              />
              <div className="guest-actions">
                <button type="button" disabled={!reqDesc.trim()} onClick={() => void prepareRequest()}>
                  Review request
                </button>
              </div>
            </>
          )}

          {pendingId && (
            <article className="guest-card confirm">
              <p>Confirm sending this request to staff?</p>
              <div className="guest-actions">
                <button type="button" onClick={() => void confirmRequest(true)}>
                  Confirm
                </button>
                <button type="button" onClick={() => void confirmRequest(false)}>
                  Cancel
                </button>
              </div>
            </article>
          )}

          {confirmedFlash && (
            <article className="guest-card">
              <strong>Request sent</strong>
              <p className="muted">Staff have been notified. Track status below.</p>
            </article>
          )}

          <h2>My requests</h2>
          {tickets.length === 0 ? (
            <p className="muted">No active requests yet.</p>
          ) : (
            tickets.map((t) => (
              <article key={t.id} className="guest-card">
                <div className="guest-status">{STATUS_LABEL[t.status] ?? t.status}</div>
                <p>{t.description}</p>
                {t.category ? <p className="muted">{t.category}</p> : null}
              </article>
            ))
          )}
        </section>
      )}

      {tab === "chat" && (
        <section className="guest-section">
          {voiceCaps?.voiceEnabled ? (
            <div className="guest-actions">
              <button type="button" disabled={voiceStarting || Boolean(voiceDirect)} onClick={() => void startVoice()}>
                Start voice
              </button>
              <span className="muted">Voice: {voiceStatus}</span>
            </div>
          ) : null}
          {voiceDirect && voiceCaps?.directEnabled ? (
            <VoiceDirectSpike
              voiceSessionId={voiceDirect.voiceSessionId}
              mintPath={voiceDirect.mintPath}
              diagnosticsEnabled={Boolean(voiceCaps.diagnosticsEnabled)}
              onFallbackToText={(reason) => {
                setVoiceStatus(`fallback_text:${reason}`);
                setVoiceDirect(null);
              }}
              onStopped={() => {
                setVoiceDirect(null);
                setVoiceStatus("ended");
              }}
            />
          ) : null}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          <div className="guest-actions">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pool hours…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendChat();
              }}
            />
            <button type="button" onClick={() => void sendChat()}>
              Send
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
