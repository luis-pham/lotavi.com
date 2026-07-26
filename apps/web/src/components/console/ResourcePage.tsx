"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { DataTable, type DataColumn } from "./DataTable";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { StatusPill } from "./StatusPill";

type Resource = Record<string, unknown> & { id: string; name?: string; title?: string; status?: string; email?: string; description?: string; updatedAt?: string };

export function ResourcePage({ title, description, endpoint, singular, readOnly = false }: {
  title: string; description: string; endpoint: string; singular?: string; readOnly?: boolean;
}) {
  const label = singular || title.replace(/s$/, "");
  const [rows, setRows] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Resource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await api<Resource[] | { items?: Resource[]; data?: Resource[] }>(endpoint);
      setRows(Array.isArray(data) ? data : data.items || data.data || []);
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const openForm = (row?: Resource) => { setEditing(row || null); setName(row?.name || row?.title || ""); setDescriptionValue(row?.description || ""); setFormOpen(true); };
  const save = async () => {
    try {
      await api(editing ? `${endpoint}/${editing.id}` : endpoint, { method: editing ? "PATCH" : "POST", json: { name, title: name, description: descriptionValue } });
      setFormOpen(false); await load();
    } catch (err) { setError((err as Error).message); }
  };
  const remove = async (row: Resource) => {
    if (!window.confirm(`Delete ${row.name || row.title || label}?`)) return;
    try { await api(`${endpoint}/${row.id}`, { method: "DELETE" }); await load(); } catch (err) { setError((err as Error).message); }
  };
  const columns: DataColumn<Resource>[] = [
    { key: "name", label, render: (row) => <strong>{row.name || row.title || row.email || `#${row.id.slice(0, 8)}`}</strong> },
    { key: "description", label: "Details", render: (row) => row.description || row.email || String(row.type || row.department || "—") },
    { key: "status", label: "Status", render: (row) => <StatusPill status={row.status || (row.active === false ? "inactive" : "active")} /> },
    { key: "updatedAt", label: "Updated", render: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—" },
    ...(!readOnly ? [{ key: "actions", label: "", render: (row: Resource) => <div className="console-actions" onClick={(event) => event.stopPropagation()}><button className="console-button" onClick={() => openForm(row)}>Edit</button><button className="console-button danger" onClick={() => void remove(row)}>Delete</button></div> }] : []),
  ];
  return <>
    <PageHeader title={title} description={description} actions={!readOnly && <button className="console-button primary" onClick={() => openForm()}>New {label}</button>} />
    <div className="console-toolbar"><input className="console-input" placeholder={`Search ${title.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /><button className="console-button" onClick={() => void load()}>Refresh</button></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void load()} /> : visible.length ? <DataTable rows={visible} columns={columns} /> : <div className="console-card"><EmptyState title={`No ${title.toLowerCase()} found`} description={query ? "Try a different search." : `Create the first ${label.toLowerCase()} to get started.`} /></div>}
    {formOpen && <><div className="console-overlay" onClick={() => setFormOpen(false)} /><aside className="console-drawer"><header className="console-drawer-header"><div><span className="console-badge">{editing ? "Edit" : "New"}</span><h2>{editing ? `Edit ${label}` : `Create ${label}`}</h2></div><button className="console-button" onClick={() => setFormOpen(false)}>Close</button></header><div className="console-drawer-body"><div className="console-form-grid"><label>Name<input className="console-input" value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label><label style={{ gridColumn: "1 / -1" }}>Description<textarea className="console-textarea" rows={5} value={descriptionValue} onChange={(event) => setDescriptionValue(event.target.value)} /></label></div></div><footer className="console-drawer-footer"><button className="console-button primary" disabled={!name.trim()} onClick={() => void save()}>Save {label}</button></footer></aside></>}
  </>;
}
