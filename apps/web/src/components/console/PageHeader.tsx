export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="console-page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="console-actions">{actions}</div>}</header>;
}
