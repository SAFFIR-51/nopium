"use client";
import { useSyncExternalStore } from "react";
import { DEMO_MODE } from "./session";
import type { Account } from "./account";
let account: Account | null = null, loaded = false, pending = false;
const listeners = new Set<() => void>();
export function getAccount() { return account; }
export async function refreshSession() {
  if (pending || DEMO_MODE) return; pending = true;
  const before = JSON.stringify(account);
  try { const r = await fetch("/api/session", { cache: "no-store" }); account = r.ok ? (await r.json()).account : null; } catch { account = null; }
  finally { loaded = true; pending = false; listeners.forEach(l => l()); if (before !== JSON.stringify(account)) window.dispatchEvent(new Event("npium-session")); }
}
function subscribe(l: () => void) { listeners.add(l); if (!loaded) void refreshSession(); window.addEventListener("focus", refreshSession); return () => { listeners.delete(l); window.removeEventListener("focus", refreshSession); }; }
export function useAccount() { return useSyncExternalStore(subscribe, () => loaded ? account : undefined, () => undefined); }
export async function logout() { await fetch("/api/session", { method: "DELETE" }); await refreshSession(); }
