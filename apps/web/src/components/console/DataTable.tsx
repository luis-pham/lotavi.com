import { EmptyState } from "./EmptyState";

export type DataColumn<T> = { key: string; label: string; render?: (row: T) => React.ReactNode };

export function DataTable<T extends { id: string }>({ columns, rows, selected, onSelect, onRowClick }: {
  columns: DataColumn<T>[]; rows: T[]; selected?: Set<string>; onSelect?: (ids: Set<string>) => void; onRowClick?: (row: T) => void;
}) {
  if (!rows.length) return <div className="console-card"><EmptyState description="Records will appear here when available." /></div>;
  const toggle = (id: string) => { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); onSelect?.(next); };
  return <div className="console-table-wrap"><table className="console-table"><thead><tr>
    {onSelect && <th><input type="checkbox" aria-label="Select all" checked={selected?.size === rows.length} onChange={() => onSelect(selected?.size === rows.length ? new Set() : new Set(rows.map((row) => row.id)))} /></th>}
    {columns.map((column) => <th key={column.key}>{column.label}</th>)}
  </tr></thead><tbody>{rows.map((row) => <tr key={row.id} onClick={() => onRowClick?.(row)}>
    {onSelect && <td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${row.id}`} checked={selected?.has(row.id) || false} onChange={() => toggle(row.id)} /></td>}
    {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}</td>)}
  </tr>)}</tbody></table></div>;
}
