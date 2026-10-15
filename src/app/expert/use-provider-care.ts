"use client";
import { useCare, type Patient } from "@/lib/repo";
import { useCurrentProvider } from "@/lib/demo-session";

/** 현재 제공자 기준으로 걸러낸 데이터. 서버 구현에서는 같은 필터를 서버에서 적용해야 합니다. */
export function useProviderCare() {
  const state = useCare();
  const provider = useCurrentProvider();
  if (!provider) return null;
  const mine = (p: Patient) => p.providerId === provider.id;
  const patients = state.patients.filter(mine);
  // 응답한 요청은 새 요청에서 제외하고, 현재 유효한 매칭 제안만 표시합니다.
  const requests = state.patients.filter(p => {
    const latest = state.assignments.find(a => a.patientId === p.id);
    return p.status !== "종료" && latest?.status === "제안" && latest.providerId === provider.id;
  });
  const proposedToMe = new Set(
    state.assignments.filter(a => a.providerId === provider.id && a.status === "제안").map(a => a.patientId),
  );
  const handled = state.assignments.filter(a => a.providerId === provider.id && a.status !== "제안");
  const myIds = new Set(patients.map(p => p.id));
  const drafts = state.records.filter(r => !r.confirmed && myIds.has(r.patientId));
  return { state, provider, ref: { id: provider.id, name: provider.name }, patients, requests, proposedToMe, handled, drafts };
}
