"use client";
import { useSyncExternalStore } from "react";
import { DEMO_MODE, demoProvider, type Role } from "./session";

/**
 * 체험 모드의 "로그인한 역할". 브라우저에만 저장되며 실제 인증이 아닙니다.
 * 인증 연결 후에는 서버 세션의 역할로 교체하고, src/proxy.ts에서 역할별 경로를 막습니다.
 */
const KEY = "nopium-demo-role";
const roles: Role[] = ["guest", "patient", "provider", "hospital", "admin"];
const listeners = new Set<() => void>();

function read(): Role {
  if (!DEMO_MODE) return "guest";
  try {
    const v = localStorage.getItem(KEY) as Role | null;
    return v && roles.includes(v) ? v : "guest";
  } catch {
    return "guest";
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** 현재 역할. 사전 렌더링 중에는 null(아직 모름)을 돌려줍니다. */
export function useRole(): Role | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function setDemoRole(role: Role) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    /* 저장소를 쓸 수 없으면 이번 화면에서만 유지됩니다. */
  }
  listeners.forEach(l => l());
}

/** 현재 로그인한 제공자. 체험 모드에서는 예시 제공자를 돌려줍니다. */
export function useCurrentProvider() {
  return DEMO_MODE ? demoProvider() : null;
}
