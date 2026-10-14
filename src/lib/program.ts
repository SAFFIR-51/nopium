import type { CareRecord, CareState, Patient } from "@/lib/repo";

/**
 * 병원 연계형 방문재활의 6단계 (재활의료기관 퇴원환자 방문재활 시범사업 흐름 기준).
 * 퇴원 계획 → 방문 전 평가 → 계획·의사 확인 → 회차 방문 → 종료 재평가 → 종료·지역사회 연계.
 * 물리치료사는 의료기사법상 의사의 지도 아래에서만 방문하므로, 의사 확인 전에는 회차 보고서를 쓸 수 없습니다.
 */
export const STAGES = ["의뢰 접수", "방문 전 평가", "계획·의사 확인", "방문 재활", "종료 평가", "종료·연계"] as const;
export type Stage = (typeof STAGES)[number];

/** 시범사업 기준 한도 */
export const LIMITS = { periodDays: 90, maxExtendDays: 30, perWeek: 2, minMinutes: 60 };

export const hasAssessment = (state: CareState, patientId: string, period: string) =>
  state.assessments.some(a => a.patientId === patientId && a.period === period);

export function programStage(state: CareState, p: Patient, today?: string | null): Stage {
  if (p.status === "종료") return "종료·연계";
  if (p.status === "배정 대기") return "의뢰 접수";
  if (p.status === "승인 대기") return hasAssessment(state, p.id, "초기 평가") ? "계획·의사 확인" : "방문 전 평가";
  // 진행 중: 사후 평가가 있거나, 회차를 다 채웠거나, 처방 기간이 끝났으면 종료 평가 단계
  const ended = !!(today && p.prescription && today > p.prescription.endDate);
  if (hasAssessment(state, p.id, "사후 평가") || p.completed >= p.total || ended) return "종료 평가";
  return "방문 재활";
}
export const stageIndex = (s: Stage) => STAGES.indexOf(s);

const day = (iso: string) => new Date(`${iso}T00:00:00`).getTime() / 864e5;
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const daysLeft = (p: Patient, today: string) => (p.prescription ? Math.round(day(p.prescription.endDate) - day(today)) : null);

/** 월요일 시작 주 */
const weekStart = (iso: string) => { const d = new Date(`${iso}T00:00:00`); const w = (d.getDay() + 6) % 7; return addDays(iso, -w); };
/** 그 주에 이미 진행(확정)한 회차 수. 미참여는 세지 않습니다. */
export function visitsInWeek(records: CareRecord[], patientId: string, iso: string, exceptId?: string) {
  const ws = weekStart(iso), we = addDays(ws, 6);
  return records.filter(r => r.patientId === patientId && r.confirmed && r.id !== exceptId && r.attendance !== "미참여" && r.date >= ws && r.date <= we).length;
}

/** 다음 일정이 처방 범위 안인지 검사합니다. 문제가 없으면 null. */
export function scheduleProblem(p: Patient, records: CareRecord[], nextDate: string, thisRecordDate?: string): string | null {
  const rx = p.prescription;
  if (!rx || !nextDate) return null;
  if (nextDate > rx.endDate) return `처방 기간(${rx.endDate.slice(5).replace("-", ".")}까지)을 넘어요. 병원에 기간 연장을 요청해 주세요.`;
  const sameWeekNow = thisRecordDate && weekStart(thisRecordDate) === weekStart(nextDate) ? 1 : 0;
  if (visitsInWeek(records, p.id, nextDate) + sameWeekNow >= rx.perWeek) return `그 주에는 이미 주 ${rx.perWeek}회를 채워요. 다음 주로 잡아 주세요.`;
  return null;
}

/** 단계마다 지금 누가 무엇을 해야 하는지 (화면 안내 문구) */
export function stageTodo(stage: Stage): { who: string; what: string } {
  switch (stage) {
    case "의뢰 접수": return { who: "병원", what: "담당 치료사를 배정해요" };
    case "방문 전 평가": return { who: "담당 치료사", what: "면담과 신체기능·주거환경 평가를 해요" };
    case "계획·의사 확인": return { who: "담당 의사", what: "평가를 보고 방문 계획과 처방을 확인해요" };
    case "방문 재활": return { who: "담당 치료사", what: "처방 범위 안에서 방문하고 회차 보고서를 써요" };
    case "종료 평가": return { who: "담당 치료사 → 병원", what: "기능을 다시 평가하고 병원이 종료를 확인해요" };
    case "종료·연계": return { who: "병원 사회복지사", what: "필요하면 보건소·통합돌봄 창구로 이어 줘요" };
  }
}
