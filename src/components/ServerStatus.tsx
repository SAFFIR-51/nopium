"use client";
import { useSyncExternalStore } from "react";
import { serverMessage } from "@/lib/repo/server-repository";
import { DEMO_MODE } from "@/lib/session";
const subscribe = (l: () => void) => { window.addEventListener("npium-data-status", l); return () => window.removeEventListener("npium-data-status", l); };
export function ServerStatus() { const message = useSyncExternalStore(subscribe, () => serverMessage, () => ""); return !DEMO_MODE && message ? <div role="alert" style={{ position: "fixed", zIndex: 9999, bottom: 80, left: "5%", width: "90%", padding: 16, background: "#fff0ed", border: "1px solid #b64025", color: "#752b1b" }}>{message}</div> : null; }
