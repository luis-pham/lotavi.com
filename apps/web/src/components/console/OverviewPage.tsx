"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ErrorState, LoadingState } from "./EmptyState";
import { PageHeader } from "./PageHeader";

type Overview = { openRequests?: number; urgentRequests?: number; overdueRequests?: number; unassignedRequests?: number; guests?: number; cabins?: number; staffOnShift?: number; completedToday?: number };

export function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setError(null); try { setData(await api<Overview>("/api/v1/admin/overview")); } catch (err) { setError((err as Error).message); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <>
    <PageHeader title="Overview" description="A live view of operations across the property." actions={<button className="console-button" onClick={() => void load()}>Refresh</button>} />
    {!data && !error && <LoadingState />}{error && <ErrorState message={error} retry={() => void load()} />}
    {data && <><div className="console-grid">{[
      ["Open requests", data.openRequests ?? 0, ""], ["Urgent", data.urgentRequests ?? 0, "priority=urgent"], ["Overdue", data.overdueRequests ?? 0, "overdue=true"], ["Unassigned", data.unassignedRequests ?? 0, "assignee=unassigned"],
    ].map(([label, value, filter]) => <Link className="console-stat" href={`/admin/requests${filter ? `?${filter}` : ""}`} key={label}><div className="console-stat-label">{label}</div><div className="console-stat-value">{value}</div><div style={{ color: "#3154d5", marginTop: 8, fontSize: 12 }}>View requests →</div></Link>)}</div>
      <h2 style={{ margin: "24px 0 10px", fontSize: 16 }}>Today at a glance</h2><div className="console-grid">{[["Guests", data.guests], ["Cabins", data.cabins], ["Staff on shift", data.staffOnShift], ["Completed today", data.completedToday]].map(([label, value]) => <div className="console-stat" key={label}><div className="console-stat-label">{label}</div><div className="console-stat-value">{value ?? 0}</div></div>)}</div>
    </>}
  </>;
}
