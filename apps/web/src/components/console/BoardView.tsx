import { StatusPill } from "./StatusPill";

export type BoardRequest = { id: string; title?: string; description?: string; status?: string; priority?: string; guestName?: string };
const columns = [
  { label: "New", statuses: ["new", "open"] },
  { label: "Accepted", statuses: ["accepted", "acknowledged"] },
  { label: "In Progress", statuses: ["in_progress", "in-progress"] },
  { label: "Waiting", statuses: ["waiting"] },
  { label: "Completed", statuses: ["completed", "resolved", "closed"] },
];

export function BoardView({ items, onOpen }: { items: BoardRequest[]; onOpen: (item: BoardRequest) => void }) {
  return <div className="console-board">{columns.map((column) => {
    const records = items.filter((item) => column.statuses.includes((item.status || "new").toLowerCase()));
    return <section className="console-board-column" key={column.label}>
      <h2 className="console-board-title"><span>{column.label}</span><span className="console-badge">{records.length}</span></h2>
      {records.map((item) => <article className="console-board-card" key={item.id} onClick={() => onOpen(item)}>
        {item.priority && <StatusPill status={item.priority} />}<h3>{item.title || item.description || `Request ${item.id.slice(0, 8)}`}</h3><p>{item.guestName || "Guest request"}</p>
      </article>)}
    </section>;
  })}</div>;
}
