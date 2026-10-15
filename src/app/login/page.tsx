"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { refreshSession } from "@/lib/auth-client";
import { DEMO_MODE, ROLE_INFO } from "@/lib/session";
import type { Account } from "@/lib/account";
export default function Login() {
  const router = useRouter(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <section className="wrap care-panel" style={{ maxWidth: 520, margin: "40px auto" }}><h1>계정 로그인</h1>{DEMO_MODE ? <p>현재는 체험 모드입니다. 헤더에서 역할을 선택해 주세요.</p> : <form className="care-form" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setError(""); try { const r = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: f.get("username"), password: f.get("password") }) }); const d = await r.json(); if (!r.ok) { setError(d.error); return; } await refreshSession(); router.push(ROLE_INFO[(d.account as Account).role].home); } catch { setError("서버에 연결하지 못했습니다."); } finally { setBusy(false); } }}><label>계정 ID<input name="username" required autoComplete="username" /></label><label>비밀번호<input name="password" type="password" required autoComplete="current-password" /></label><button className="btn-primary" disabled={busy}>{busy ? "확인 중…" : "로그인"}</button>{error && <p role="alert">{error}</p>}</form>}</section>;
}
