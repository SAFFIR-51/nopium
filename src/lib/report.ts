import { compareAssessments, fallRisk, sortedAssessments } from "./assessment";
import { MEASURES, measureDef, measureValue } from "./measures";
import { placeName } from "./places";
import { protocolById } from "./protocols";
import type { Assessment, CareRecord, CareState, Patient, Report } from "./repo";
import { latestReport } from "./workflow";

/**
 * 보고서 데이터 (제안서 STEP 4 "데이터화 및 병원 리포팅": 회차별 운동 기록 · 기능 개선 수치화 · 통증 변화 추이 · 낙상 위험도 변화 · 월간 리포트 · 외래 진료 시 활용).
 * 서식 구성은 재활의료기관 방문재활 서식(계획서·기록지·관리 점검서·기능평가표)과
 * 일본 방문 리하빌리테이션 계획서(목표·방침·유의점·개선/유지/악화 판정·설명 서명)를 참고했습니다.
 * 숫자와 회차 기록은 모두 자동으로 모으고, 치료사는 "종합 소견"과 "다음 달 계획"만 씁니다.
 */
export type Judgment = "개선" | "유지" | "악화";
export const JUDGMENTS: Judgment[] = ["개선", "유지", "악화"];

/** 기능 영역 ↔ 측정 항목 */
export const DOMAINS: { key: string; label: string; codes: string[] }[] = [
  { key: "walk", label: "보행", codes: ["walk_distance", "walk_10m", "tug"] },
  { key: "balance", label: "균형", codes: ["bbs", "single_leg"] },
  { key: "strength", label: "근력·일어서기", codes: ["sts5"] },
  { key: "adl", label: "일상생활", codes: ["fim", "kmbi"] },
  { key: "pain", label: "통증", codes: ["pain_nrs"] },
];

export const monthLabel = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5, 7))}월`;
export const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;
const round = (n: number) => Math.round(n * 10) / 10;

/** 그 달에 처방상 계획된 방문 횟수 (주간 횟수 × 처방 기간과 겹치는 주) */
function plannedVisits(patient: Patient, month: string) {
  const rx = patient.prescription;
  if (!rx) return null;
  const first = new Date(`${month}-01T00:00:00`);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const from = new Date(Math.max(first.getTime(), new Date(`${rx.startDate}T00:00:00`).getTime()));
  const to = new Date(Math.min(last.getTime(), new Date(`${rx.endDate}T00:00:00`).getTime()));
  if (to < from) return 0;
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  return Math.round((days / 7) * rx.perWeek);
}

export type TrendRow = { code: string; label: string; unit: string; baseline: number | null; first: number | null; last: number | null; diff: number | null; good: boolean | null; series: number[] };

export function buildMonthly(state: CareState, patient: Patient, month: string) {
  const all = state.records.filter(r => r.patientId === patient.id && r.confirmed).sort((a, b) => a.date.localeCompare(b.date));
  const recs = all.filter(r => r.date.startsWith(month));
  const assessments = sortedAssessments(state.assessments.filter(a => a.patientId === patient.id && a.date.slice(0, 7) <= month));
  const baseline = assessments.find(a => a.period === "초기 평가");
  const latestAssessment = assessments.length > 1 ? assessments[assessments.length - 1] : undefined;
  const count = (a: string) => recs.filter(r => (r.attendance ?? "참여") === a).length;
  const done = count("참여") + count("부분 참여");
  const minutes = recs.reduce((n, r) => n + (r.durationMin ?? 0), 0);
  const planned = plannedVisits(patient, month);
  const places = [...new Set(recs.map(r => (r.place ? placeName(r.place) : "자택 방문")))];

  // 측정값 추이: 방문 전 평가 → 이 달 첫 기록 → 이 달 마지막 기록
  const baseValue = (code: string) => baseline?.measures?.find(m => m.code === code)?.value ?? null;
  const trends: TrendRow[] = MEASURES.map(m => {
    const series = recs.map(r => measureValue(r, m.code)).filter((v): v is number => v !== null);
    const base = baseValue(m.code);
    if (!series.length && base === null) return null;
    const first = series[0] ?? null, last = series[series.length - 1] ?? null;
    const from = base ?? first;
    const diff = from !== null && last !== null ? round(last - from) : null;
    return { code: m.code, label: m.label, unit: m.unit, baseline: base, first, last, diff, good: diff === null || diff === 0 ? null : m.higherIsBetter ? diff > 0 : diff < 0, series: base !== null ? [base, ...series] : series };
  }).filter(Boolean) as TrendRow[];

  // 영역별 자동 판정 (치료사가 바꿀 수 있음)
  const autoJudgments: Record<string, Judgment> = {};
  for (const d of DOMAINS) {
    const rows = trends.filter(t => d.codes.includes(t.code) && t.diff !== null);
    if (!rows.length) continue;
    const up = rows.filter(r => r.good === true).length, down = rows.filter(r => r.good === false).length;
    autoJudgments[d.key] = up > down ? "개선" : down > up ? "악화" : "유지";
  }

  const contraTotal = recs.filter(r => r.attendance !== "미참여" && r.contraChecked !== undefined).length;
  const contraOk = recs.filter(r => r.contraChecked === true).length;
  const adverse = recs.filter(r => r.adverse?.occurred);
  const education = recs.filter(r => r.education).map(r => ({ date: r.date, text: r.education as string }));
  const absences = recs.filter(r => r.attendance === "미참여").map(r => ({ date: r.date, reason: r.absenceReason ?? "" }));
  const risk = { before: fallRisk(baseline?.measures), after: fallRisk(latestAssessment?.measures ?? baseline?.measures) };
  return { month, period: monthLabel(month), recs, all, done, planned, minutes, places, absences, trends, autoJudgments, contraTotal, contraOk, adverse, education, baseline, latestAssessment, risk, protocol: protocolById(patient.prescription?.protocolId) };
}
export type MonthlyData = ReturnType<typeof buildMonthly>;

/** 보고서가 있는 달 목록 (최근 순). 기록이 없으면 이번 달 하나. */
export function reportMonths(records: CareRecord[], today: string) {
  const months = [...new Set(records.filter(r => r.confirmed).map(r => r.date.slice(0, 7)))].sort().reverse();
  return months.length ? months : [today.slice(0, 7)];
}

const fmt = (v: number | null, unit: string) => (v === null ? "미측정" : `${v}${unit === "/10" ? "점" : unit}`);

/** 종합 소견 자동 초안: 숫자로 확인된 사실만 문장으로 씁니다. 치료사가 고쳐서 확정합니다. */
export function draftOpinion(patient: Patient, d: MonthlyData) {
  const lines: string[] = [];
  lines.push(`${d.period} 방문 ${d.done}회${d.planned ? `(계획 ${d.planned}회)` : ""}, 총 ${d.minutes}분 진행했습니다.`);
  const line = (t: TrendRow) => `${t.label} ${fmt(t.baseline ?? t.first, t.unit)}${t.baseline !== null ? "(방문 전)" : ""} → ${fmt(t.last, t.unit)}`;
  const good = d.trends.filter(t => t.good === true).slice(0, 3).map(line);
  const bad = d.trends.filter(t => t.good === false).slice(0, 2).map(line);
  if (good.length) lines.push(`${good.join(", ")}로 좋아졌습니다.`);
  if (bad.length) lines.push(`${bad.join(", ")}은(는) 지켜볼 필요가 있습니다.`);
  if (d.adverse.length) lines.push(`이상 반응 ${d.adverse.length}건이 있었고 기록된 조치를 했습니다.`);
  else lines.push("기록된 이상 반응은 없었습니다.");
  if (d.contraTotal) lines.push(`병원이 정한 금기 운동은 ${d.contraOk}/${d.contraTotal}회 확인했습니다.`);
  return lines.join(" ");
}

export function draftPlan(d: MonthlyData) {
  const last = d.recs[d.recs.length - 1];
  return last?.next ?? "";
}

/** 외래 진료 때 의사가 확인할 것 (자동) */
export function outpatientFlags(patient: Patient, state: CareState, compareRows: ReturnType<typeof compareAssessments>) {
  const recs = state.records.filter(r => r.patientId === patient.id && r.confirmed);
  const flags: string[] = [];
  const unreviewed = recs.filter(r => r.adverse?.occurred && !r.adverse.reviewedAt);
  if (unreviewed.length) flags.push(`확인 전 이상 반응 ${unreviewed.length}건`);
  const worse = compareRows.filter(r => r.tone === "bad").map(r => r.label);
  if (worse.length) flags.push(`나빠진 항목: ${worse.slice(0, 3).join(", ")}`);
  const pain = recs.sort((a, b) => a.date.localeCompare(b.date)).map(r => measureValue(r, "pain_nrs")).filter((v): v is number => v !== null);
  if (pain.length >= 2 && pain[pain.length - 1] > pain[0]) flags.push(`통증 자가 보고 ${pain[0]} → ${pain[pain.length - 1]}점으로 올라감`);
  const rx = patient.prescription;
  if (rx) {
    const left = Math.round((new Date(`${rx.endDate}T00:00:00`).getTime() - Date.now()) / 86400000);
    if (left <= 14 && left >= 0) flags.push(`처방 종료 ${left}일 전 (연장 또는 종료 평가 결정)`);
  }
  if (recs.some(r => r.contraChecked === false)) flags.push("금기 운동 확인이 안 된 회차가 있음");
  return flags;
}

export const reportFor = (state: CareState, patientId: string, period: string): Report | undefined =>
  latestReport(state, patientId, period) ?? state.reports.find(r => r.patientId === patientId && !r.period);

export const valueLabel = (code: string, v: number | null) => { const d = measureDef(code); return v === null ? "미측정" : `${v}${d?.unit ?? ""}`; };
export type { Assessment };
