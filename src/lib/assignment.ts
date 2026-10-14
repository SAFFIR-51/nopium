import type { Assignment, CareState } from "@/lib/repo";

/** 한 대상의 배정 이력(최신순). */
export function assignmentHistory(state: CareState, patientId: string): Assignment[] {
  return state.assignments
    .filter(a => a.patientId === patientId)
    .sort((a, b) => (b.respondedAt ?? b.createdAt).localeCompare(a.respondedAt ?? a.createdAt));
}

/** 배정 대기 중인 대상의 현재 배정 단계. */
export function assignmentStage(state: CareState, patientId: string): "미배정" | "응답 대기" | "재배정 필요" | null {
  const patient = state.patients.find(p => p.id === patientId);
  if (!patient || patient.status !== "배정 대기") return null;
  const latest = assignmentHistory(state, patientId)[0];
  if (!latest) return "미배정";
  if (latest.status === "제안") return "응답 대기";
  if (latest.status === "거절") return "재배정 필요";
  return "미배정";
}

/** 이 대상을 거절한 제공자 id. 같은 제공자에게 다시 제안하지 않도록 씁니다. */
export function declinedProviderIds(state: CareState, patientId: string): Set<string> {
  return new Set(state.assignments.filter(a => a.patientId === patientId && a.status === "거절").map(a => a.providerId));
}

/** 제공자 활동 지역이 대상 지역을 포함하는지. 예: "서울 송파·강동" ↔ "서울 강동구", "서울 전역" ↔ 서울 모든 구. */
export function areaMatches(providerArea: string, patientArea: string): boolean {
  const [city, ...rest] = providerArea.split(" ");
  const districts = (rest.length ? rest.join(" ") : city).split("·").map(s => s.trim()).filter(Boolean);
  if (districts.includes("전역")) return patientArea.startsWith(city);
  return districts.some(d => patientArea.includes(d));
}
