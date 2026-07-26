"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lotiva.vn");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try { await api("/api/v1/auth/login", { method: "POST", json: { email, password } }); localStorage.setItem("lotiva-admin-authed", "1"); router.push("/admin/overview"); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return <main className="console-login"><form className="console-login-card" onSubmit={login}>
    <div className="console-brand-mark">L</div><h1>Admin console</h1><p>Sign in to manage property operations.</p>
    <label>Email<input className="console-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
    <label>Password<input className="console-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    {error && <div className="console-error" style={{ padding: "12px 0 0" }}>{error}</div>}
    <button className="console-button primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
  </form></main>;
}
