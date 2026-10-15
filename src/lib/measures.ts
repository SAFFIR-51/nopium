import type { CareRecord, CareState, Measure } from "@/lib/repo";
// 회차 보고서의 측정 항목 카탈로그 (기획서 4장: 항목 코드·값·단위·방법, 미측정은 0과 구분).
// 항목은 대상에게 필요한 것만 기록하고, 모든 대상에게 일괄 적용하지 않습니다.
// 실제 항목·방법은 연계 기관의 평가 기준에 맞춰 조정합니다.

export type MeasureCode = "walk_distance" | "walk_10m" | "sts5" | "single_leg" | "pain_nrs" | "fim" | "kmbi" | "bbs" | "tug";

export type MeasureDef = {
  code: MeasureCode;
  label: string;
  unit: string;
  method: string;
  /** 값이 클수록 좋은 항목인지 (추이 표시 방향) */
  higherIsBetter: boolean;
  max?: number;
  /** 표준 평가 도구: 방문 전·종료 평가에서 재고, 회차 보고서에는 기본으로 넣지 않습니다. */
  assessOnly?: boolean;
};

export const MEASURES: MeasureDef[] = [
  { code: "walk_distance", label: "보행 거리", unit: "m", method: "실내 연속 보행, 보조 여부 함께 기록", higherIsBetter: true },
  { code: "walk_10m", label: "10m 보행 시간", unit: "초", method: "편한 속도로 10m 이동", higherIsBetter: false },
  { code: "sts5", label: "앉았다 일어서기 5회", unit: "초", method: "팔짱 끼고 의자에서 5회", higherIsBetter: false },
  { code: "single_leg", label: "한 발 서기", unit: "초", method: "지지 없이 유지(좌우 중 짧은 쪽)", higherIsBetter: true },
  { code: "pain_nrs", label: "통증 자가 보고", unit: "/10", method: "NRS 0~10", higherIsBetter: false, max: 10 },
  // 표준 평가 도구 (협력 병원 서식에 맞춰 확정)
  { code: "fim", label: "FIM 기능적 독립성", unit: "점", method: "병원에서 정한 FIM 평가 방법·점수 기준을 함께 기록", higherIsBetter: true, assessOnly: true },
  { code: "kmbi", label: "K-MBI 일상생활", unit: "점", method: "수정 바델지수 0~100", higherIsBetter: true, max: 100, assessOnly: true },
  { code: "bbs", label: "BBS 균형", unit: "점", method: "버그 균형 척도 0~56", higherIsBetter: true, max: 56, assessOnly: true },
  { code: "tug", label: "TUG 일어나 걷기", unit: "초", method: "의자에서 일어나 3m 왕복 후 앉기", higherIsBetter: false, assessOnly: true },
];
export const SESSION_MEASURES = MEASURES.filter(m => !m.assessOnly);

export const measureDef = (code: string) => MEASURES.find(m => m.code === code);

export const ACTIVITIES = ["보행", "균형", "근력", "관절 가동", "일상 동작", "이동·옮겨 앉기", "보호자 교육"];
export const ATTENDANCE = ["참여", "부분 참여", "미참여"] as const;


/** 보고서의 측정값. 예전 형식(walk·pain 문자열) 기록도 같은 모양으로 돌려줍니다. */
export function recordMeasures(r: CareRecord): Measure[] {
  if (r.measures) return r.measures;
  const num = (v: string) => (v === "" || v === undefined ? null : Number(v));
  return [{ code: "walk_distance", value: num(r.walk) }, { code: "pain_nrs", value: num(r.pain) }];
}

export function measureValue(r: CareRecord, code: string): number | null {
  const m = recordMeasures(r).find(x => x.code === code);
  return m && m.value !== null && Number.isFinite(m.value) ? m.value : null;
}

/** 항목별 추이 (오래된 → 최신). 미측정 회차는 건너뜁니다. */
export function measureSeries(records: CareRecord[], code: string) {
  return [...records].filter(r => r.confirmed).sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date, sessionNo: r.sessionNo, value: measureValue(r, code) }))
    .filter((p): p is { date: string; sessionNo: number | undefined; value: number } => p.value !== null);
}

/** 기록에 실제로 값이 있는 항목만 */
export function measuredCodes(records: CareRecord[]) {
  return MEASURES.filter(m => records.some(r => measureValue(r, m.code) !== null));
}

/** 진행된 회차인데 보고서가 없는 대상 (기획서 2장: 운영 화면은 기록 누락을 먼저 보여줍니다) */
export function missingReports(state: CareState, today: string, filter?: (patientId: string) => boolean) {
  return state.patients.filter(p => p.status === "진행 중" && p.nextDate < today && (!filter || filter(p.id))
    && !state.records.some(r => r.patientId === p.id && r.date === p.nextDate && r.confirmed));
}

const fmt = (code: string, v: number | null) => { const d = measureDef(code); return v === null ? "미측정" : `${v}${d?.unit ?? ""}`; };
/** 정정 전후 비교. 보호자·기관이 무엇이 바뀌었는지 알 수 있게 항목별로 남깁니다. */
export function describeChanges(prev: CareRecord, next: CareRecord): string[] {
  const out: string[] = [];
  if (prev.date !== next.date) out.push(`진행일 ${prev.date} → ${next.date}`);
  if ((prev.attendance ?? "참여") !== (next.attendance ?? "참여")) out.push(`참여 상태 ${prev.attendance ?? "참여"} → ${next.attendance ?? "참여"}`);
  if ((prev.durationMin ?? 0) !== (next.durationMin ?? 0)) out.push(`진행 시간 ${prev.durationMin ?? 0}분 → ${next.durationMin ?? 0}분`);
  if ((prev.activities ?? []).join() !== (next.activities ?? []).join()) out.push("진행한 활동");
  if (prev.content !== next.content) out.push("진행 내용");
  for (const m of MEASURES) { const a = measureValue(prev, m.code), b = measureValue(next, m.code); if (a !== b) out.push(`${m.label} ${fmt(m.code, a)} → ${fmt(m.code, b)}`); }
  const adv = (r: CareRecord) => (r.adverse?.occurred ? `${r.adverse.detail}|${r.adverse.action}` : "");
  if (adv(prev) !== adv(next)) out.push(next.adverse?.occurred ? (prev.adverse?.occurred ? "이상 반응 내용" : "이상 반응 추가") : "이상 반응 삭제");
  if ((prev.education ?? "") !== (next.education ?? "")) out.push("보호자 안내");
  if (prev.next !== next.next) out.push("다음 계획");
  return out;
}

/** 애플 건강 "하이라이트"처럼 변화를 한 문장으로. 좋아진 항목을 먼저 고릅니다. 의료적 판단 표현은 쓰지 않습니다. */
export function measureHighlight(records: CareRecord[]): string | null {
  const lines = MEASURES.map(m => {
    const s = measureSeries(records, m.code);
    if (s.length < 2) return null;
    const diff = Math.round((s[s.length - 1].value - s[0].value) * 10) / 10;
    if (!diff) return null;
    const good = m.higherIsBetter ? diff > 0 : diff < 0;
    const amount = `${Math.abs(diff)}${m.unit === "/10" ? "점" : m.unit}`;
    const verb = m.unit === "초" ? (diff < 0 ? "줄었어요" : "늘었어요") : (diff > 0 ? (m.code === "pain_nrs" ? "높아졌어요" : "늘었어요") : (m.code === "pain_nrs" ? "낮아졌어요" : "줄었어요"));
    const subject: Record<string, string> = { walk_distance: "보행 거리가", walk_10m: "10m 보행 시간이", sts5: "앉았다 일어서기 5회 시간이", single_leg: "한 발 서기 시간이", pain_nrs: "통증 자가 보고가", kmbi: "K-MBI 점수가", bbs: "BBS 점수가", tug: "TUG 시간이" };
    return { good, text: `${subject[m.code] ?? `${m.label}이`} 첫 기록보다 ${amount} ${verb}` };
  }).filter((x): x is { good: boolean; text: string } => !!x);
  return (lines.find(l => l.good) ?? lines[0])?.text ?? null;
}
