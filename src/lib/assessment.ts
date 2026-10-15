import { MEASURES, measureDef } from "./measures";
import type { Assessment, Measure } from "./repo";

/**
 * 구조화된 평가 (제안서 STEP 2 초기 방문 평가: ROM·근력·보행·균형·ADL·주거 환경).
 * 글 대신 숫자·등급·체크로 받아 방문 전 ↔ 중간 ↔ 종료를 같은 기준으로 비교합니다.
 * 정상 참고값은 일반적인 성인 기준이며 의료적 판단을 대신하지 않습니다.
 */
export type Side = "좌" | "우";
export const SIDES: Side[] = ["좌", "우"];

export type RomJoint = { code: string; label: string; normal: number; higherIsBetter: boolean; hint?: string };
export const ROM_JOINTS: RomJoint[] = [
  { code: "sh_flex", label: "어깨 굽힘", normal: 180, higherIsBetter: true },
  { code: "sh_abd", label: "어깨 벌림", normal: 180, higherIsBetter: true },
  { code: "el_flex", label: "팔꿈치 굽힘", normal: 150, higherIsBetter: true },
  { code: "hip_flex", label: "엉덩관절 굽힘", normal: 120, higherIsBetter: true },
  { code: "hip_abd", label: "엉덩관절 벌림", normal: 45, higherIsBetter: true },
  { code: "knee_flex", label: "무릎 굽힘", normal: 135, higherIsBetter: true },
  { code: "knee_ext_lag", label: "무릎 덜 펴짐", normal: 0, higherIsBetter: false, hint: "다 펴지지 않는 각도 (0°가 정상)" },
  { code: "ankle_df", label: "발목 위로 젖힘", normal: 20, higherIsBetter: true },
];
export const romJoint = (code: string) => ROM_JOINTS.find(j => j.code === code);

export type MmtMuscle = { code: string; label: string };
export const MMT_MUSCLES: MmtMuscle[] = [
  { code: "sh_flex_m", label: "어깨 올리는 힘" },
  { code: "el_flex_m", label: "팔꿈치 굽히는 힘" },
  { code: "grip_m", label: "쥐는 힘" },
  { code: "hip_flex_m", label: "다리 들어 올리는 힘" },
  { code: "hip_abd_m", label: "다리 옆으로 벌리는 힘" },
  { code: "knee_ext_m", label: "무릎 펴는 힘" },
  { code: "ankle_df_m", label: "발목 들어 올리는 힘" },
];
export const mmtMuscle = (code: string) => MMT_MUSCLES.find(m => m.code === code);
/** 도수근력검사(MMT) 0~5등급 */
export const MMT_GRADES: { value: number; label: string }[] = [
  { value: 0, label: "0 · 수축 없음" },
  { value: 1, label: "1 · 수축만 보임" },
  { value: 2, label: "2 · 중력 없이 움직임" },
  { value: 3, label: "3 · 중력 이기고 움직임" },
  { value: 4, label: "4 · 약한 저항 이김" },
  { value: 5, label: "5 · 정상" },
];

/** 주거 환경 위험 요소 체크리스트 */
export const HOME_RISKS = [
  "문턱(현관·방·욕실)",
  "욕실 손잡이 없음·미끄러움",
  "계단 손잡이 없음",
  "야간 조명 없음·어두운 동선",
  "바닥 깔개·전선",
  "낮은 의자·침대·변기",
  "보행기 지나가기 좁은 동선",
];

export type RomItem = { code: string; side: Side; deg: number | null };
export type MmtItem = { code: string; side: Side; grade: number | null };

/** 낙상 위험 참고 표시: BBS 45점 이하 또는 TUG 13.5초 이상이면 "높음" (흔히 쓰는 참고 기준) */
export function fallRisk(measures?: Measure[]): { level: "높음" | "낮음" | "판단 자료 없음"; reasons: string[] } {
  const v = (code: string) => measures?.find(m => m.code === code)?.value ?? null;
  const bbs = v("bbs"), tug = v("tug");
  const reasons = [bbs !== null && bbs <= 45 && `BBS ${bbs}점 (45점 이하)`, tug !== null && tug >= 13.5 && `TUG ${tug}초 (13.5초 이상)`].filter(Boolean) as string[];
  if (reasons.length) return { level: "높음", reasons };
  if (bbs === null && tug === null) return { level: "판단 자료 없음", reasons: [] };
  return { level: "낮음", reasons: [] };
}

export type CompareRow = { key: string; group: "표준 점수" | "관절 가동범위" | "근력"; label: string; before: string; after: string; diff: string; tone: "good" | "bad" | "" };

const round = (n: number) => Math.round(n * 10) / 10;
const signed = (n: number, unit: string) => `${n > 0 ? "+" : ""}${n}${unit}`;

/** 두 평가를 같은 항목끼리 비교합니다. 한쪽만 잰 항목은 "미측정"으로 둡니다. */
export function compareAssessments(before: Assessment | undefined, after: Assessment | undefined): CompareRow[] {
  const rows: CompareRow[] = [];
  const mv = (a: Assessment | undefined, code: string) => a?.measures?.find(m => m.code === code)?.value ?? null;
  for (const m of MEASURES) {
    const a = mv(before, m.code), b = mv(after, m.code);
    if (a === null && b === null) continue;
    const d = a !== null && b !== null ? round(b - a) : null;
    rows.push({ key: m.code, group: "표준 점수", label: m.label, before: a === null ? "미측정" : `${a}${m.unit}`, after: b === null ? "미측정" : `${b}${m.unit}`, diff: d === null ? "-" : signed(d, m.unit), tone: d ? ((m.higherIsBetter ? d > 0 : d < 0) ? "good" : "bad") : "" });
  }
  const pairs = <T extends { code: string; side: Side }>(x?: T[], y?: T[]) => {
    const keys = new Map<string, { code: string; side: Side }>();
    [...(x ?? []), ...(y ?? [])].forEach(i => keys.set(`${i.code}|${i.side}`, { code: i.code, side: i.side }));
    return [...keys.values()];
  };
  for (const { code, side } of pairs(before?.romItems, after?.romItems)) {
    const j = romJoint(code); if (!j) continue;
    const a = before?.romItems?.find(i => i.code === code && i.side === side)?.deg ?? null;
    const b = after?.romItems?.find(i => i.code === code && i.side === side)?.deg ?? null;
    if (a === null && b === null) continue;
    const d = a !== null && b !== null ? round(b - a) : null;
    rows.push({ key: `rom-${code}-${side}`, group: "관절 가동범위", label: `${side} ${j.label}`, before: a === null ? "미측정" : `${a}°`, after: b === null ? "미측정" : `${b}°`, diff: d === null ? "-" : signed(d, "°"), tone: d ? ((j.higherIsBetter ? d > 0 : d < 0) ? "good" : "bad") : "" });
  }
  for (const { code, side } of pairs(before?.mmtItems, after?.mmtItems)) {
    const mm = mmtMuscle(code); if (!mm) continue;
    const a = before?.mmtItems?.find(i => i.code === code && i.side === side)?.grade ?? null;
    const b = after?.mmtItems?.find(i => i.code === code && i.side === side)?.grade ?? null;
    if (a === null && b === null) continue;
    const d = a !== null && b !== null ? b - a : null;
    rows.push({ key: `mmt-${code}-${side}`, group: "근력", label: `${side} ${mm.label}`, before: a === null ? "미측정" : `${a}등급`, after: b === null ? "미측정" : `${b}등급`, diff: d === null ? "-" : signed(d, "등급"), tone: d ? (d > 0 ? "good" : "bad") : "" });
  }
  return rows;
}

/** 한 줄 요약 (목록·병원 화면용) */
export function assessmentSummary(a: Assessment): string {
  const parts = [
    ...(a.measures ?? []).filter(m => m.value !== null).map(m => `${measureDef(m.code)?.label ?? m.code} ${m.value}${measureDef(m.code)?.unit ?? ""}`),
    ...(a.romItems ?? []).filter(i => i.deg !== null).map(i => `${i.side} ${romJoint(i.code)?.label ?? i.code} ${i.deg}°`),
    ...(a.mmtItems ?? []).filter(i => i.grade !== null).map(i => `${i.side} ${mmtMuscle(i.code)?.label ?? i.code} ${i.grade}등급`),
  ];
  return parts.join(" · ");
}

/** 날짜순 정렬된 대상의 평가 (방문 전 → 중간 → 종료) */
export function sortedAssessments(list: Assessment[]) {
  const order = { "초기 평가": 0, "중간 평가": 1, "사후 평가": 2 } as Record<string, number>;
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || (order[a.period] ?? 1) - (order[b.period] ?? 1));
}
