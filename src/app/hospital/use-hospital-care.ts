"use client";
import { visiblePatients } from "@/lib/access";
import { useCare } from "@/lib/repo";
import { useRole } from "@/lib/demo-session";

/** 소속 기관의 연계 대상만 봅니다. 다른 기관의 대상은 같은 사람이어도 보이지 않습니다. */
export function useHospitalCare() {
  const state = useCare();
  const patients = visiblePatients(state, useRole() === "hospital" ? "hospital" : null);
  // 정보 공유 동의를 끈 대상의 보고서는 기관 화면에서 보이지 않습니다. (기획서 5장 공유 회수)
  const ids = new Set(patients.filter(p => p.consent).map(p => p.id));
  const reports = state.reports.filter(r => ids.has(r.patientId));
  return { state, patients, reports, approvals: patients.filter(p => p.status === "승인 대기") };
}
