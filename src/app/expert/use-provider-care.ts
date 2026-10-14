"use client";
import { useCare, type Patient } from "@/lib/repo";
import { useCurrentProvider } from "@/lib/demo-session";

/** 현재 제공자 기준으로 걸러낸 데이터. 서버 구현에서는 같은 필터를 서버에서 적용해야 합니다. */
export function useProviderCare() {
  const state = useCare();
  const provider = useCurrentProvider();
  if (!provider) return null;
  const mine = (p: Patient) => p.providerId === provider.id;
  const declinedByMe = new Set(
    state.assignments.filter(a => a.providerId === provider.id && a.status === "거절").map(a => a.patientId),
  );
  const patients = state.patients.filter(mine);
  // 지정·제안받은 요청과, 아직 아무에게도 지정되지 않은 요청을 봅니다. 한 번 거절한 요청은 다시 보지 않습니다.
  const requests = state.patients.filter(
    p => p.status === "배정 대기" && (!p.requestedProviderId || p.requestedProviderId === provider.id) && !declinedByMe.has(p.id),
  );
  const proposedToMe = new Set(
    state.assignments.filter(a => a.providerId === provider.id && a.status === "제안").map(a => a.patientId),
  );
  const handled = state.assignments.filter(a => a.providerId === provider.id && a.status !== "제안");
  const myIds = new Set(patients.map(p => p.id));
  const drafts = state.records.filter(r => !r.confirmed && myIds.has(r.patientId));
  return { state, provider, ref: { id: provider.id, name: provider.name }, patients, requests, proposedToMe, handled, drafts };
}
