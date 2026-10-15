"use client";
import { emptyState } from "./empty";
import { createRepository } from "./engine";
import type { CareRepository } from "./types";
export type ClientRepository = { [K in keyof CareRepository]: K extends "getSnapshot" | "getServerSnapshot" | "subscribe" ? CareRepository[K] : CareRepository[K] extends (...args: infer A) => infer R ? (...args: A) => R | Promise<R> : never };
let state = emptyState, revision = -1, generation = 0, fetching = false;
const listeners = new Set<() => void>();
let queue = Promise.resolve();
export let serverMessage = "";
function emit(message = "") { serverMessage = message; listeners.forEach(l => l()); if (typeof window !== "undefined") window.dispatchEvent(new Event("npium-data-status")); }
async function refresh() {
  if (fetching) return; fetching = true; const current = generation;
  try { const r = await fetch("/api/care", { cache: "no-store" }); if (current !== generation) return; if (r.status === 401) { state = emptyState; revision = -1; emit(); return; } if (!r.ok) throw new Error(); const d = await r.json(); if (current === generation && (d.revision !== revision || JSON.stringify(d.state) !== JSON.stringify(state))) { state = d.state; revision = d.revision; emit(); } } catch { emit("서버에 연결하지 못했습니다. 저장 상태를 확인해 주세요."); } finally { fetching = false; if (current !== generation) void refresh(); }
}
let timer: ReturnType<typeof setInterval> | undefined;
function reset() { generation++; revision = -1; state = emptyState; emit(); void refresh(); }
function subscribe(l: () => void) {
  listeners.add(l);
  if (listeners.size === 1) { void refresh(); timer = setInterval(refresh, 5000); window.addEventListener("npium-session", reset); }
  return () => { listeners.delete(l); if (!listeners.size) { clearInterval(timer); window.removeEventListener("npium-session", reset); } };
}
const dummy = createRepository(() => emptyState, () => {});
export const serverRepository = new Proxy(dummy, {
  get(target, key: keyof CareRepository) {
    if (key === "getSnapshot") return () => state;
    if (key === "getServerSnapshot") return () => emptyState;
    if (key === "subscribe") return subscribe;
    return (...args: unknown[]) => {
      const current = generation;
      const task = queue.then(async () => {
        if (current !== generation) return false;
        if (key === "submitApplication") { const r = await fetch("/api/provider-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args[0]) }); const d = await r.json(); if (!r.ok) { emit(d.error); return ""; } return d.result; }
        if (revision < 0) await refresh();
        const r = await fetch("/api/care", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: key, args, revision }) });
        const data = await r.json();
        if (current !== generation) return false;
        if (data.state) { state = data.state; revision = data.revision; }
        if (!r.ok) { emit(data.error || "저장하지 못했습니다."); return key === "saveRecord" || key === "savePrescriptionDraft" || key === "saveReevaluation" ? "" : false; }
        emit(data.changed === false && data.result !== true ? "변경 사항이 저장되지 않았습니다. 현재 상태를 다시 확인해 주세요." : "");
        return data.changed === false && data.result !== true ? false : data.result;
      }).catch(() => { emit("서버에 연결하지 못해 저장하지 않았습니다. 다시 시도해 주세요."); return key === "saveRecord" || key === "savePrescriptionDraft" || key === "saveReevaluation" ? "" : false; });
      queue = task.then(() => {}); return task;
    };
  },
}) as ClientRepository;
