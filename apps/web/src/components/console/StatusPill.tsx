export function StatusPill({ status }: { status?: string | null }) {
  const value = status || "unknown";
  return <span className={`console-status status-${value.toLowerCase().replaceAll(" ", "-")}`}>{value.replaceAll("_", " ")}</span>;
}
