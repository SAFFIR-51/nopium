import { assignmentHistory, matchingStatus } from "./assignment";
import { MEASURES, measureValue, missingReports } from "./measures";
import type { CareState, Patient } from "./repo/types";
import { latestReport } from "./workflow";
import { romJoint, mmtMuscle, sortedAssessments } from "./assessment";

export type AdminFilter = { hospital: string; provider: string; month: string };
export const ALL = "전체";
export function adminPatients(state: CareState, filter: Pick<AdminFilter, "hospital" | "provider"> & { month?: string }) {
  return state.patients.filter(p => (filter.hospital === ALL || p.hospital === filter.hospital) && (filter.provider === ALL || p.providerId === filter.provider || !!filter.month && state.records.some(r => r.patientId === p.id && r.authorId === filter.provider && r.date.startsWith(filter.month!))));
}
export function organizations(state: CareState) {
  return [...new Set([...state.contracts.map(c => c.organization), ...state.patients.map(p => p.hospital)])].sort((a, b) => a.localeCompare(b, "ko"));
}
export const reportPeriod = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;
export function adminStatistics(state: CareState, filter: AdminFilter, today: string) {
  const patients = adminPatients(state, filter);
  const ids = new Set(patients.map(p => p.id));
  const records = state.records.filter(r => ids.has(r.patientId) && r.date.startsWith(filter.month) && (filter.provider === ALL || r.authorId === filter.provider));
  const confirmed = records.filter(r => r.confirmed);
  const visits = confirmed.filter(r => r.attendance !== "미참여");
  const reports = patients.flatMap(p => { const r = latestReport(state, p.id, reportPeriod(filter.month)); return r ? [r] : []; });
  const provided = patients.flatMap(p => { const r = latestReport(state, p.id, reportPeriod(filter.month), true); return r ? [r] : []; });
  const missing = missingReports(state, today).filter(p => ids.has(p.id));
  const unreviewed = confirmed.filter(r => r.adverse?.occurred && !r.adverse.reviewedBy);
  return { patients, records, confirmed, visits, reports, missing, unreviewed,
    active: patients.filter(p => p.status === "진행 중" && (filter.provider === ALL || p.providerId === filter.provider)).length,
    drafts: records.filter(r => !r.confirmed).length,
    awaiting: patients.filter(p => ["미배정", "NPIUM 확인 대기", "재배정 필요", "기존 배정 확인 필요"].includes(matchingStatus(state, p.id))).length,
    minutes: visits.reduce((n, r) => n + (r.durationMin ?? 0), 0),
    shared: provided.length,
    acknowledged: provided.filter(r => r.confirmedAt).length,
    withRecords: new Set(confirmed.map(r => r.patientId)).size,
  };
}

/** 같은 항목 코드·단위로 같은 달에 2회 이상 측정한 환자만 비교합니다. */
export function functionalStatistics(state: CareState, patients: Patient[], month: string, provider = ALL) {
  return MEASURES.map(def => {
    const pairs = patients.flatMap(p => {
      const records = state.records.filter(r => r.patientId === p.id && r.confirmed && r.attendance !== "미참여" && r.date.startsWith(month) && (provider === ALL || r.authorId === provider)).sort((a, b) => a.date.localeCompare(b.date));
      const methods = new Set(records.filter(r => measureValue(r, def.code) !== null).map(r => r.measures?.find(m => m.code === def.code)?.note?.trim() || "조건 미기록"));
      if (methods.size > 1) return [];
      const values = records.map(r => measureValue(r, def.code)).filter((v): v is number => v !== null);
      return values.length >= 2 ? [{ first: values[0], last: values[values.length - 1] }] : [];
    });
    const avg = (key: "first" | "last") => pairs.length ? pairs.reduce((n, p) => n + p[key], 0) / pairs.length : null;
    const first = avg("first"), last = avg("last");
    return { ...def, count: pairs.length, excluded: patients.length - pairs.length, first, last, diff: first !== null && last !== null ? last - first : null };
  });
}

export function assessmentStatistics(state: CareState, patients: Patient[], month: string) {
  const items = new Map<string, { label: string; unit: string; first: number[]; last: number[] }>();
  for (const p of patients) {
    const as = sortedAssessments(state.assessments.filter(a => a.patientId === p.id && a.date.slice(0, 7) <= month));
    const before = as.find(a => a.period === "초기 평가"), after = as.filter(a => a.date.startsWith(month) && a.id !== before?.id).at(-1);
    if (!before || !after) continue;
    for (const item of before.romItems ?? []) {
      const later = after.romItems?.find(v => v.code === item.code && v.side === item.side);
      if (item.deg === null || later?.deg === undefined || later.deg === null) continue;
      const key = `ROM · ${item.side} ${romJoint(item.code)?.label ?? item.code}`, row = items.get(key) ?? { label: key, unit: "°", first: [], last: [] }; row.first.push(item.deg); row.last.push(later.deg); items.set(key, row);
    }
    for (const item of before.mmtItems ?? []) {
      const later = after.mmtItems?.find(v => v.code === item.code && v.side === item.side);
      if (item.grade === null || later?.grade === undefined || later.grade === null) continue;
      const key = `근력 · ${item.side} ${mmtMuscle(item.code)?.label ?? item.code}`, row = items.get(key) ?? { label: key, unit: "등급", first: [], last: [] }; row.first.push(item.grade); row.last.push(later.grade); items.set(key, row);
    }
  }
  return [...items.values()].map(r => ({ label: r.label, unit: r.unit, count: r.first.length, total: patients.length, first: r.first.reduce((a, b) => a + b, 0) / r.first.length, last: r.last.reduce((a, b) => a + b, 0) / r.last.length }));
}
export function currentAssignment(state: CareState, patientId: string) { return assignmentHistory(state, patientId)[0]; }

export function downloadAdminCsv(rows: (string | number | null)[][], name: string) {
  const cell = (v: string | number | null) => {
    const raw = String(v ?? "");
    return `"${(/^[=+@-]/.test(raw) ? "'" + raw : raw).replaceAll('"', '""')}"`;
  };
  const blob = new Blob(["\ufeff", rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
