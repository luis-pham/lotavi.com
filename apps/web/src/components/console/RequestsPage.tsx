"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { BoardView, type BoardRequest } from "./BoardView";
import { DataTable, type DataColumn } from "./DataTable";
import { ErrorState, LoadingState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { RequestDrawer } from "./RequestDrawer";
import { StatusPill } from "./StatusPill";

type RequestItem = BoardRequest & { createdAt?: string; departmentName?: string; assigneeName?: string };

export function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [selected, setSelected] = useState(new Set<string>());
  const [openId, setOpenId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams(); if (status) params.set("status", status); if (query) params.set("search", query);
      const data = await api<RequestItem[] | { items: RequestItem[] }>(`/api/v1/admin/requests?${params}`);
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [query, status]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);
  const bulkUpdate = async (nextStatus: string) => {
    try {
      await api("/api/v1/admin/requests/bulk", {
        method: "PATCH",
        json: { ids: [...selected], patch: { status: nextStatus } },
      });
      setSelected(new Set());
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const columns = useMemo<DataColumn<RequestItem>[]>(() => [
    { key: "title", label: "Request", render: (row) => <div><strong>{row.title || row.description || `#${row.id.slice(0, 8)}`}</strong><div style={{ color: "#6b7280", fontSize: 12 }}>{row.guestName || "Guest"}</div></div> },
    { key: "status", label: "Status", render: (row) => <StatusPill status={row.status} /> },
    { key: "priority", label: "Priority", render: (row) => <StatusPill status={row.priority} /> },
    { key: "departmentName", label: "Department", render: (row) => row.departmentName || "Unassigned" },
    { key: "assigneeName", label: "Assignee", render: (row) => row.assigneeName || "Unassigned" },
    { key: "createdAt", label: "Created", render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : "—" },
  ], []);
  return <>
    <PageHeader title="Requests" description="Triage, assign, and track every guest request." actions={<button className="console-button primary" onClick={() => void load()}>Refresh</button>} />
    <div className="console-toolbar">
      <input className="console-input" placeholder="Search requests…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <select className="console-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="new">New</option><option value="accepted">Accepted</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="completed">Completed</option></select>
      {selected.size > 0 && <><span className="console-badge">{selected.size} selected</span><button className="console-button" onClick={() => void bulkUpdate("accepted")}>Accept</button><button className="console-button" onClick={() => void bulkUpdate("completed")}>Complete</button></>}
      <span style={{ flex: 1 }} /><button className={`console-button ${view === "list" ? "primary" : ""}`} onClick={() => setView("list")}>List</button><button className={`console-button ${view === "board" ? "primary" : ""}`} onClick={() => setView("board")}>Board</button>
    </div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void load()} /> : view === "list" ? <DataTable rows={items} columns={columns} selected={selected} onSelect={setSelected} onRowClick={(item) => setOpenId(item.id)} /> : <BoardView items={items} onOpen={(item) => setOpenId(item.id)} />}
    <RequestDrawer requestId={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />
  </>;
}
