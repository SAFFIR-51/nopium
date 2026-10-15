"use client";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { visiblePatients } from "@/lib/access";
import { useCare } from "@/lib/repo";
import { useRole } from "@/lib/demo-session";

// 보호자가 여러 대상을 관리할 때 현재 선택한 대상을 화면 사이에서 유지합니다. (기획서 2장)
const KEY = "npium-demo-selected-patient";
const listeners = new Set<() => void>();
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function selectPatient(id: string) {
  try { localStorage.setItem(KEY, id); } catch { /* 이번 화면에서만 유지 */ }
  listeners.forEach(l => l());
}

export function usePatientCare() {
  const state = useCare();
  const role = useRole();
  const subject = useSearchParams().get("subject");
  const selectedId = useSyncExternalStore(subscribe, read, () => null);
  const patients = visiblePatients(state, role);
  const patient = subject ? patients.find(p => p.id === subject) ?? null : patients.find(p => p.id === selectedId) ?? patients[0] ?? null;
  return { state, patients, patient };
}

