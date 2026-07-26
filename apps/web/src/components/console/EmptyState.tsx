export function EmptyState({ title = "Nothing here yet", description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return <div className="console-empty"><h3>{title}</h3>{description && <div>{description}</div>}{action && <div style={{ marginTop: 12 }}>{action}</div>}</div>;
}

export function LoadingState() {
  return <div className="console-card console-skeleton-row">{[1, 2, 3, 4, 5].map((item) => <div className="console-skeleton" key={item} style={{ width: `${88 - item * 5}%` }} />)}</div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="console-card console-error"><h3>Could not load this view</h3><div>{message}</div>{retry && <button className="console-button" style={{ marginTop: 12 }} onClick={retry}>Try again</button>}</div>;
}
