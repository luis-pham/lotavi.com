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

export function GuestPortal({ token }: { token: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [roomLabel, setRoomLabel] = useState("");
  const [tab, setTab] = useState<"home" | "chat" | "schedule" | "requests">("home");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [schedules, setSchedules] = useState<Array<{ title: string; location: string | null }>>([]);
  const [announcements, setAnnouncements] = useState<Array<{ title: string; body: string }>>([]);
  const [tickets, setTickets] = useState<Array<{ id: string; status: string; description: string }>>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reqDesc, setReqDesc] = useState("Extra towels please");
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string>("idle");
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceCaps, setVoiceCaps] = useState<{
    voiceEnabled: boolean;
    directEnabled: boolean;
    diagnosticsEnabled: boolean;
    textFallbackEnabled: boolean;
  } | null>(null);
  const [voiceDirect, setVoiceDirect] = useState<{
    voiceSessionId: string;
    mintPath: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const session = await api<{
          roomLabel: string;
          theme: Theme | null;
        }>("/api/v1/guest/sessions/from-qr", {
          method: "POST",
          json: { token, locale: "vi-VN" },
        });
        setRoomLabel(session.roomLabel);
        setTheme(session.theme);
        const [s, a, t, caps] = await Promise.all([
          api<{ items: Array<{ title: string; location: string | null }> }>("/api/v1/guest/schedules"),
          api<{ items: Array<{ title: string; body: string }> }>("/api/v1/guest/announcements"),
          api<{ items: Array<{ id: string; status: string; description: string }> }>("/api/v1/guest/tickets"),
          api<{
            voiceEnabled: boolean;
            directEnabled: boolean;
            diagnosticsEnabled: boolean;
            textFallbackEnabled: boolean;
          }>("/api/v1/voice/capabilities").catch(() => null),
        ]);
        setSchedules(s.items);
        setAnnouncements(a.items);
        setTickets(t.items);
        if (caps) setVoiceCaps(caps);
      } catch (e) {
        setError((e as Error).message);
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
    const res = await api<{
      conversationId: string;
      assistantMessage: { content: string };
    }>("/api/v1/guest/chat", {
      method: "POST",
      json: { message: text, conversationId },
    });
    setConversationId(res.conversationId);
    setMessages((m) => [...m, { role: "assistant", content: res.assistantMessage.content }]);
  }

  async function prepareRequest() {
    const res = await api<{ pendingActionId: string }>("/api/v1/guest/tickets/prepare", {
      method: "POST",
      json: { category: "housekeeping", description: reqDesc },
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
    const t = await api<{ items: Array<{ id: string; status: string; description: string }> }>(
      "/api/v1/guest/tickets",
    );
    setTickets(t.items);
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
        res.event.type === "session.ready"
          ? `ready (${res.transport ?? "relay"})`
          : res.event.type,
      );
      if (res.transport === "direct" && res.directMintPath && voiceCaps?.directEnabled) {
        setVoiceDirect({
          voiceSessionId: res.voiceSessionId,
          mintPath: res.directMintPath,
        });
      } else if (res.wsPath && typeof window !== "undefined") {
        // V0 relay: open owned WebSocket (still placeholder audio on server)
        const proto = window.location.protocol === "https:" ? "wss" : "ws";
        const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") ?? "localhost:4000";
        const ws = new WebSocket(`${proto}://${host}${res.wsPath}`);
        ws.onopen = () => setVoiceStatus("relay_ws_open");
        ws.onerror = () => setVoiceStatus("relay_ws_error");
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(String(ev.data)) as { type?: string };
            if (msg.type) setVoiceStatus(`relay:${msg.type}`);
          } catch {
            /* ignore */
          }
        };
      }
    } catch (e) {
      setVoiceStatus(`failed: ${(e as Error).message}`);
    } finally {
      setVoiceStarting(false);
    }
  }

  if (error) {
    return (
      <main className="shell">
        <h1>QR không hợp lệ</h1>
        <p>{error}</p>
        <Link href="/">Về Lotavi</Link>
      </main>
    );
  }

  return (
    <main className="shell" style={cssVars}>
      <p className="muted">Phòng {roomLabel || "…"}</p>
      <h1 style={{ fontSize: "2.6rem", margin: "4px 0 8px" }}>
        {theme?.brandName ?? "Lotavi"}
      </h1>
      <p className="muted">{theme?.assistantName ?? "Assistant"} sẵn sàng hỗ trợ bạn.</p>

      <div className="nav">
        <button type="button" onClick={() => setTab("home")}>Home</button>
        <button type="button" onClick={() => setTab("chat")}>Assistant</button>
        <button type="button" onClick={() => setTab("schedule")}>Schedule</button>
        <button type="button" onClick={() => setTab("requests")}>Requests</button>
      </div>

      {tab === "home" && (
        <section>
          <h2>Thông báo</h2>
          {announcements.map((a) => (
            <div key={a.title} className="bubble">
              <strong>{a.title}</strong>
              <p className="muted">{a.body}</p>
            </div>
          ))}
        </section>
      )}

      {tab === "chat" && (
        <section>
          {voiceCaps?.voiceEnabled ? (
            <div className="row" style={{ marginBottom: 12 }}>
              <button
                type="button"
                disabled={voiceStarting || Boolean(voiceDirect)}
                onClick={() => void startVoice()}
              >
                {voiceCaps.directEnabled ? "Start experimental voice session" : "Bắt đầu Voice"}
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
                setTab("chat");
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
          <div className="row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về hồ bơi, giờ phục vụ…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendChat();
              }}
            />
            <button type="button" onClick={() => void sendChat()}>
              Gửi
            </button>
          </div>
        </section>
      )}

      {tab === "schedule" && (
        <section>
          <h2>Lịch trình</h2>
          {schedules.map((s) => (
            <div key={s.title} className="bubble">
              <strong>{s.title}</strong>
              <p className="muted">{s.location}</p>
            </div>
          ))}
        </section>
      )}

      {tab === "requests" && (
        <section>
          <h2>Yêu cầu dịch vụ</h2>
          <textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} rows={3} />
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" onClick={() => void prepareRequest()}>
              Chuẩn bị yêu cầu
            </button>
          </div>
          {pendingId && (
            <div className="bubble" style={{ marginTop: 16 }}>
              <p>Xác nhận tạo ticket? (bắt buộc trước khi gửi nhân viên)</p>
              <div className="row">
                <button type="button" onClick={() => void confirmRequest(true)}>
                  Xác nhận
                </button>
                <button type="button" onClick={() => void confirmRequest(false)}>
                  Hủy
                </button>
              </div>
            </div>
          )}
          <h3>Yêu cầu của tôi</h3>
          {tickets.map((t) => (
            <div key={t.id} className="bubble">
              <strong>{t.status}</strong>
              <p>{t.description}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
