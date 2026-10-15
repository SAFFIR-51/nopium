import type { CareRecord, CareState, Patient } from "@/lib/repo";

/**
 * 원문 네 단계와 세부 업무 상태를 구분합니다.
 * 아래 STAGES는 화면의 후속 업무를 고르는 세부 상태이며 임상 판단 기준이 아닙니다.
 */
export const STAGES = ["의뢰 접수", "방문 전 평가", "계획·의사 확인", "방문 재활", "종료 평가", "종료·연계"] as const;
export type Stage = (typeof STAGES)[number];

export const CARE_STAGES = ["퇴원 전 연계", "초기 방문 평가", "방문 운동 치료", "데이터화 및 병원 리포팅"] as const;
export type CareStage = (typeof CARE_STAGES)[number];
export const SERVICE_VISIT = { minMinutes: 50, maxMinutes: 60 };
export function carePhase(stage: Stage): CareStage { return stage === "의뢰 접수" || stage === "계획·의사 확인" ? CARE_STAGES[0] : stage === "방문 전 평가" ? CARE_STAGES[1] : stage === "방문 재활" ? CARE_STAGES[2] : CARE_STAGES[3]; }

export const hasAssessment = (state: CareState, patientId: string, period: string) =>
  state.assessments.some(a => a.patientId === patientId && a.period === period);

export function programStage(state: CareState, p: Patient, today?: string | null): Stage {
  if (p.status === "종료") return "종료·연계";
  if (p.status === "배정 대기") return "의뢰 접수";
  if (p.status === "승인 대기") return "계획·의사 확인";
  if (!hasAssessment(state, p.id, "초기 평가")) return "방문 전 평가";
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
    case "의뢰 접수": return { who: "NPIUM", what: "병원에서 연계한 환자의 담당 치료사를 확인·매칭해요" };
    case "방문 전 평가": return { who: "담당 치료사", what: "면담과 신체기능·주거환경 평가를 해요" };
    case "계획·의사 확인": return { who: "담당 의사", what: "평가를 보고 방문 계획과 처방을 확인해요" };
    case "방문 재활": return { who: "담당 치료사", what: "처방 범위 안에서 방문하고 회차 보고서를 써요" };
    case "종료 평가": return { who: "담당 치료사 → 병원", what: "기능을 다시 평가하고 병원이 종료를 확인해요" };
    case "종료·연계": return { who: "병원 사회복지사", what: "필요하면 보건소·통합돌봄 창구로 이어 줘요" };
  }
}
