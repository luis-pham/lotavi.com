"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ErrorState, LoadingState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { RequestDrawer } from "./RequestDrawer";
import { StatusPill } from "./StatusPill";

type WorkItem = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueAt?: string | null;
  createdAt?: string;
  guestName?: string;
  escalated?: boolean;
  assigneeId?: string | null;
};

const sections = [
  { key: "urgent", label: "Urgent" },
  { key: "dueNow", label: "Due now" },
  { key: "next", label: "Next" },
  { key: "waiting", label: "Waiting" },
  { key: "completedToday", label: "Completed today" },
] as const;

function bucketize(items: WorkItem[]): Record<string, WorkItem[]> {
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result: Record<string, WorkItem[]> = {
    urgent: [],
    dueNow: [],
    next: [],
    waiting: [],
    completedToday: [],
  };
  for (const item of items) {
    const status = item.status ?? "";
    if (["resolved", "completed", "guest_confirmed"].includes(status)) {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      if (created >= startOfDay.getTime()) result.completedToday.push(item);
      continue;
    }
    if (status === "needs_info") {
      result.waiting.push(item);
      continue;
    }
    if (item.escalated || item.priority === "urgent" || item.priority === "high") {
      result.urgent.push(item);
      continue;
    }
    if (item.dueAt && new Date(item.dueAt).getTime() <= now + 60 * 60 * 1000) {
      result.dueNow.push(item);
      continue;
    }
    result.next.push(item);
  }
  return result;
}

export function MyWorkPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, queue] = await Promise.all([
        api<{ items: WorkItem[] }>("/api/v1/staff/my-work"),
        api<{ items: WorkItem[] }>("/api/v1/staff/department-queue"),
      ]);
      const byId = new Map<string, WorkItem>();
      for (const item of [...(queue.items || []), ...(mine.items || [])]) {
        byId.set(item.id, item);
      }
      setItems([...byId.values()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const data = useMemo(() => bucketize(items), [items]);

  const action = async (id: string, status: string) => {
    try {
      if (status === "escalated") {
        await api(`/api/v1/staff/tickets/${id}/status`, {
          method: "PATCH",
          json: { escalate: true },
        });
      } else {
        await api(`/api/v1/staff/tickets/${id}/status`, {
          method: "PATCH",
          json: { status },
        });
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        title="My work"
        description="Prioritized work for your current shift."
        actions={
          <button className="console-button" type="button" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} retry={() => void load()} />
      ) : (
        <div className="console-section-list">
          {sections.map((section) => {
            const sectionItems = data[section.key] || [];
            return (
              <section key={section.key}>
                <h2 className="console-section-heading">
                  {section.label}
                  <span className="console-badge">{sectionItems.length}</span>
                </h2>
                <div className="console-card">
                  {sectionItems.length ? (
                    sectionItems.map((item) => (
                      <div
                        className="console-card-body"
                        style={{ borderBottom: "1px solid #eef0f2" }}
                        key={item.id}
                        onClick={() => setOpenId(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setOpenId(item.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <strong>
                              {item.title || item.description || `Request #${item.id.slice(0, 8)}`}
                            </strong>
                            <div style={{ color: "#6b7280", fontSize: 12 }}>
                              {item.guestName || "Guest"} ·{" "}
                              {item.dueAt
                                ? new Date(item.dueAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "No due time"}
                            </div>
                          </div>
                          <StatusPill status={item.priority || item.status} />
                        </div>
                        <div
                          className="console-actions"
                          style={{ marginTop: 10 }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button className="console-button" type="button" onClick={() => void action(item.id, "accepted")}>
                            Accept
                          </button>
                          <button
                            className="console-button primary"
                            type="button"
                            onClick={() => void action(item.id, "in_progress")}
                          >
                            Start
                          </button>
                          <button className="console-button" type="button" onClick={() => void action(item.id, "waiting")}>
                            Waiting
                          </button>
                          <button className="console-button" type="button" onClick={() => void action(item.id, "completed")}>
                            Complete
                          </button>
                          <button
                            className="console-button danger"
                            type="button"
                            onClick={() => void action(item.id, "escalated")}
                          >
                            Escalate
                          </button>
                          <button className="console-button" type="button" onClick={() => setOpenId(item.id)}>
                            Add note
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="console-empty">No work in this section.</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <RequestDrawer
        requestId={openId}
        basePath="/api/v1/staff/tickets"
        onClose={() => setOpenId(null)}
        onChanged={() => void load()}
      />
    </>
  );
}
