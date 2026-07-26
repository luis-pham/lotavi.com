"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ErrorState, LoadingState } from "./EmptyState";
import { StatusPill } from "./StatusPill";

type RequestDetail = Record<string, unknown> & {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  guestName?: string;
  cabin?: string;
  notes?: Array<{ id?: string; body?: string; text?: string; createdAt?: string }>;
};

export function RequestDrawer({
  requestId,
  basePath = "/api/v1/admin/requests",
  onClose,
  onChanged,
}: {
  requestId: string | null;
  basePath?: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const isStaff = basePath.includes("/staff/");

  const load = async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await api<RequestDetail>(`${basePath}/${requestId}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDetail(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, basePath]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!requestId) return null;

  const update = async (status: string) => {
    try {
      if (isStaff) {
        await api(`${basePath}/${requestId}/status`, { method: "PATCH", json: { status } });
      } else {
        await api(`${basePath}/${requestId}`, { method: "PATCH", json: { status } });
      }
      await load();
      onChanged?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await api(`${basePath}/${requestId}/notes`, { method: "POST", json: { body: note } });
      setNote("");
      await load();
      onChanged?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <div className="console-overlay" onClick={onClose} />
      <aside className="console-drawer" aria-label="Request detail" role="dialog" aria-modal="true">
        <header className="console-drawer-header">
          <div>
            <StatusPill status={detail?.status} />
            <h2>{detail?.title || detail?.description || `Request ${requestId.slice(0, 8)}`}</h2>
          </div>
          <button className="console-button" type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="console-drawer-body">
          {loading && <LoadingState />}
          {error && <ErrorState message={error} retry={() => void load()} />}
          {detail && (
            <>
              <section className="console-section">
                <h3>Request</h3>
                <p>{detail.description || "No description provided."}</p>
                <dl className="console-detail-grid">
                  <dt>Priority</dt>
                  <dd>
                    <StatusPill status={detail.priority as string} />
                  </dd>
                  <dt>Guest</dt>
                  <dd>{detail.guestName || "—"}</dd>
                  <dt>Cabin</dt>
                  <dd>{String(detail.cabin || detail.roomLabel || "—")}</dd>
                  <dt>Created</dt>
                  <dd>{String(detail.createdAt || "—")}</dd>
                </dl>
              </section>
              <section className="console-section">
                <h3>Assignment</h3>
                <dl className="console-detail-grid">
                  <dt>Department</dt>
                  <dd>{String(detail.departmentName || detail.department || "Unassigned")}</dd>
                  <dt>Assignee</dt>
                  <dd>{String(detail.assigneeName || detail.assigneeId || "Unassigned")}</dd>
                  <dt>Due</dt>
                  <dd>{String(detail.dueAt || "—")}</dd>
                  <dt>Source</dt>
                  <dd>{String(detail.source || "—")}</dd>
                </dl>
              </section>
              <section className="console-section">
                <h3>Internal notes</h3>
                {(detail.notes || []).map((item, index) => (
                  <div className="console-card-body" key={item.id || index}>
                    {item.body || item.text}
                    <div style={{ color: "#6b7280", fontSize: 12 }}>{item.createdAt || ""}</div>
                  </div>
                ))}
                <textarea
                  className="console-textarea"
                  style={{ width: "100%" }}
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a note for the team…"
                />
                <button className="console-button" style={{ marginTop: 8 }} type="button" onClick={() => void addNote()}>
                  Add note
                </button>
              </section>
            </>
          )}
        </div>
        <footer className="console-drawer-footer">
          <button className="console-button" type="button" onClick={() => void update("accepted")}>
            Accept
          </button>
          <button className="console-button primary" type="button" onClick={() => void update("in_progress")}>
            Start work
          </button>
          <button className="console-button" type="button" onClick={() => void update("waiting")}>
            Set waiting
          </button>
          <button className="console-button" type="button" onClick={() => void update("completed")}>
            Complete
          </button>
        </footer>
      </aside>
    </>
  );
}
