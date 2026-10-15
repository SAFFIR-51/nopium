"use client";
import { Modal } from "@/components/CareUI";
import { usePageValue, usePageState } from "@/lib/page-view";
import { HospitalReview } from "./HospitalReview";
import { latestReport, reportReviewSignature } from "@/lib/workflow";
import { useState } from "react";
import { PagePanel } from "@/components/CareUI";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ALL, assessmentStatistics, adminStatistics, functionalStatistics, reportPeriod, downloadAdminCsv, type AdminFilter } from "@/lib/admin-data";
import { measureDef, recordMeasures } from "@/lib/measures";
import { careRepo, useCare } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { AdminHeading } from "../AdminShell";
import { AdminFilters, AdminStats } from "../AdminControls";
import { AdminPatientDetail } from "../AdminPatientDetail";
import { useAdminCare } from "../use-admin-care";

const number = (n: number | null) => n === null ? "—" : String(Math.round(n * 10) / 10);
function ProvideReports({ ids, month, onClose }: { ids: string[]; month: string; onClose: () => void }) {
  const state = useCare();
  const [note, setNote] = useState("");
  const [reviewed, setReviewed] = useState("");
  const [result, setResult] = useState("");
  const period = reportPeriod(month);
  const patients = state.patients.filter(p => ids.includes(p.id));
  const fingerprint = JSON.stringify({ month, patients, records: state.records.filter(r => ids.includes(r.patientId)), assessments: state.assessments.filter(a => ids.includes(a.patientId)), reports: state.reports.filter(r => ids.includes(r.patientId) && r.period === period) });
  const eligible = patients.filter(p => p.consent && state.records.some(r => r.patientId === p.id && r.confirmed && r.date.startsWith(month)) && !latestReport(state, p.id, period)?.shared);
  const submit = async () => {
    if (reviewed !== fingerprint || !note.trim()) return;
    let count = 0;
    for (const p of eligible) { if (await careRepo.provideReport(p.id, month, DEMO_ACCOUNTS.admin.name, note, reportReviewSignature(state, p.id, period))) count++; else break; }
    setResult(`${count}건을 해당 병원에 제공했습니다.${patients.length > count ? ` 이미 제공되었거나 동의·기록 조건이 달라진 ${patients.length - count}건은 추가 제공하지 않았습니다.` : ""}`);
  };
  return <PagePanel title={`${period} · 월간 리포트 병원 제공`} wide onClose={onClose}>
    <p className="admin-notice">환자별 보고서는 해당 환자의 병원에만 제공됩니다. 아래 원기록·누락과 동의 범위를 확인하면 제공 당시 내용이 보존됩니다.</p>
    {patients.map(p => { const records = state.records.filter(r => r.patientId === p.id && r.date.startsWith(month)); const report = latestReport(state, p.id, period); return <details className="admin-patient-section" key={p.id}><summary><b>{p.name} · {p.hospital}</b> · 확정 {records.filter(r => r.confirmed).length}건 · 작성 중 {records.filter(r => !r.confirmed).length}건 · {p.consent ? "공유 동의" : "미동의"}</summary><p className="admin-note">종합 소견: {report?.opinion || "치료사 작성 소견 없음 · 회차별 원기록을 제공합니다."}<br />이상 반응 {records.filter(r => r.confirmed && r.adverse?.occurred).length}건 · 초기 평가 {state.assessments.some(a => a.patientId === p.id && a.period === "초기 평가") ? "있음" : "없음"}</p>{records.filter(r => r.confirmed).map(r => <div className="admin-patient-section" key={r.id}><h3>{r.date} · {r.attendance || "참여"}</h3><p>{r.content}<br />{recordMeasures(r).map(m => `${measureDef(m.code)?.label ?? m.code}: ${m.value === null ? "미측정" : `${m.value}${measureDef(m.code)?.unit ?? ""}`}${m.note ? ` (${m.note})` : ""}`).join(" · ")}<br />다음 계획: {r.next}</p></div>)}</details>; })}
    {!result ? <form className="care-form" onSubmit={e => { e.preventDefault(); submit(); }}><label>취합·검토 내용<textarea required rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="확인한 기록 범위, 누락·미측정과 병원에 전달할 운영 사항" /></label><label className="consent-check"><input type="checkbox" checked={reviewed === fingerprint} onChange={e => setReviewed(e.target.checked ? fingerprint : "")} /><span>대상 병원·기간·원기록·작성 중 기록·미측정과 동의 범위를 검토했습니다.</span></label><p className="admin-note">확정 기록만 제공하며 임시 저장은 포함하지 않습니다. 원기록이 바뀌면 검토 확인을 다시 해야 합니다.</p><button className="btn-primary wide" disabled={reviewed !== fingerprint || !note.trim() || !eligible.length}>{eligible.length}건 검토 완료·병원 제공</button></form> : <><p className="admin-feedback" role="status">{result}</p><button className="btn-primary" onClick={onClose}>제공 결과 확인</button></>}
  </PagePanel>;
}

export function DataAnalysis() {
  const { state, today } = useAdminCare();
  const [filters, setFilters] = useState<AdminFilter>({ hospital: ALL, provider: ALL, month: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [patientId, setPatientId] = usePageValue("patient");
  const [correction, setCorrection] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [providing, setProvide] = usePageState<{ ids: string[]; month: string }>("report-provision", value => { const [month, list] = value.split("/"); return /^\d{4}-\d{2}$/.test(month) && list ? { month, ids: list.split(",") } : null; }, value => `${value.month}/${value.ids.join(",")}`);
  const setProviding = (ids: string[] | null) => setProvide(ids ? { ids, month: filter.month } : null);
  const filter = { ...filters, month: filters.month || today?.slice(0, 7) || state.records[0]?.date.slice(0, 7) || "2026-10" };
  const data = adminStatistics(state, filter, today || "");
  const functional = functionalStatistics(state, data.patients, filter.month, filter.provider);
  const period = reportPeriod(filter.month);
  const eligible = data.patients.filter(p => p.consent && data.confirmed.some(r => r.patientId === p.id) && !latestReport(state, p.id, period)?.shared);
  const selectedIds = selected.filter(id => eligible.some(p => p.id === id));
  const exportData = () => downloadAdminCsv([["기간", "병원", "현재 담당 치료사", "환자", "확정 기록", "미참여 제외 방문", "작성 중", "병원 제공", "병원 확인"], ...data.patients.map(p => { const recs = data.records.filter(r => r.patientId === p.id); const report = data.reports.find(r => r.patientId === p.id); return [period, p.hospital, p.provider, p.name, recs.filter(r => r.confirmed).length, recs.filter(r => r.confirmed && r.attendance !== "미참여").length, recs.filter(r => !r.confirmed).length, report?.shared ? "제공" : "미제공", report?.confirmedAt ? "확인" : "기록 없음"]; })], `NPIUM_데이터분석_${filter.month}.csv`);
  if (providing) return <ProvideReports ids={providing.ids} month={providing.month} onClose={() => { setProviding(null); setSelected([]); }} />;

  if (patientId) return <AdminPatientDetail patientId={patientId} onClose={() => setPatientId("")} />;
  return <div className="admin-control">
    <AdminHeading title="데이터 분석" subtitle="회차별 운동 기록·기능 변화·누락을 검토하고 월간 리포트를 취합해 해당 병원에 제공합니다." action={<button className="btn-ghost" onClick={exportData}>현재 조회 통계 CSV</button>} />
    <AdminFilters state={state} filter={filter} onChange={f => { setFilters(f); setSelected([]); }} />
    <AdminStats items={[{ label: "조회 대상", value: data.patients.length, unit: "명", note: `확정 기록 있는 환자 ${data.withRecords}명` }, { label: "선택 기간 확정 기록", value: data.confirmed.length, unit: "건", note: `실제 방문 ${data.visits.length}회 · ${data.minutes}분` }, { label: "작성 중 기록", value: data.drafts, unit: "건" }, { label: "병원 제공·확인", value: `${data.shared} / ${data.acknowledged}`, unit: "건", note: "환자별 최근 제공본 / 해당 제공본의 병원 확인" }]} />
    <section className="business-section"><div className="business-section-head"><h2>기능 개선 수치화·통증 변화 추이</h2><span>같은 달 같은 항목을 2회 이상 측정한 환자 기준</span></div><BusinessTable caption="기능 변화 집계" columns={["측정 항목", "비교 가능", "비교 제외", "첫 측정 평균", "최근 측정 평균", "평균 변화"]}>{functional.map(f => <tr key={f.code}><td>{f.label}<small>{f.method}</small></td><td>{f.count} / {data.patients.length}명</td><td>{f.excluded}명</td><td>{number(f.first)}{f.first !== null && f.unit}</td><td>{number(f.last)}{f.last !== null && f.unit}</td><td>{f.diff === null ? "비교 자료 없음" : `${f.diff > 0 ? "+" : ""}${number(f.diff)}${f.unit}`}</td></tr>)}</BusinessTable><p className="admin-note">단일 측정·미측정은 비교에서 제외합니다. 보조 여부 등 측정 조건은 원기록에서 검토해야 합니다. ROM·근력·균형·ADL·낙상 위험 관련 평가와 주거 환경은 환자 이름을 눌러 확인합니다.</p></section>
    <section className="business-section"><div className="business-section-head"><h2>월간 리포트 병원 제공</h2><span>{period} · 기록 없는 환자도 표시</span><button className="business-action" onClick={() => setSelected(selectedIds.length === eligible.length ? [] : eligible.map(p => p.id))}>{selectedIds.length && selectedIds.length === eligible.length ? "선택 해제" : "제공 가능 대상 전체 선택"}</button><button className="business-action primary" disabled={!selectedIds.length} onClick={() => setProviding(selectedIds)}>선택 {selectedIds.length}명 취합·제공 검토</button></div>
      <BusinessTable caption="보고서 취합 대상" columns={["선택", "환자·병원", "확정·작성 중", "이상 반응", "동의", "보고서·소견", "병원 확인", "원기록"]} empty={!data.patients.length ? "조건에 맞는 환자가 없습니다." : undefined}>{data.patients.map(p => { const recs = data.records.filter(r => r.patientId === p.id); const r = data.reports.find(r => r.patientId === p.id); const provided = latestReport(state, p.id, period, true); const can = eligible.some(e => e.id === p.id); return <tr key={p.id}><td><input type="checkbox" aria-label={`${p.name} 보고서 선택`} disabled={!can} checked={selectedIds.includes(p.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} /></td><td><button className="business-name-link" onClick={() => setPatientId(p.id)}>{p.name}</button><small>{p.hospital} · {p.provider || "미배정"}</small></td><td>{recs.filter(r => r.confirmed).length} / {recs.filter(r => !r.confirmed).length}건</td><td>{recs.filter(r => r.confirmed && r.adverse?.occurred).length}건</td><td>{p.consent ? "동의" : "미동의 · 제공 제외"}</td><td><BusinessStatus>{r?.shared ? "병원 제공" : can ? "제공 검토 가능" : "제공 조건 확인"}</BusinessStatus><small>v{r?.version ?? 1}</small>{provided && !r?.shared && <small>이전 제공본 v{provided.version ?? 1} · {provided.confirmedBy ? "병원 확인 기록 있음" : "병원 확인 대기"} · 정정본 재검토 중</small>}<small>{r?.opinion ? "치료사 소견 작성" : "치료사 소견 미작성"}</small>{r?.providedBy && <small>{r.providedBy} · {r.providedAt?.slice(0, 10)} · 제공본 보존</small>}</td><td>{r?.confirmedBy || (r?.shared ? "확인 대기" : "제공 전")}</td><td><button className="business-action" onClick={() => setPatientId(p.id)}>데이터 확인</button>{r?.shared && <button className="business-action" onClick={() => { setCorrection(r.id); setCorrectionReason(""); }}>정정본 작성</button>}</td></tr>; })}</BusinessTable>
    </section>
    <section className="business-section"><h2>초기 평가 대비 ROM·근력 변화</h2><p>초기 평가와 선택 월의 후속 평가가 모두 있는 동일 관절·근육·좌우만 비교합니다. 미측정·단일 평가는 제외합니다.</p><BusinessTable caption="평가 변화" columns={["항목", "비교 가능 / 대상", "초기 평균", "후속 평균"]}>{assessmentStatistics(state, data.patients, filter.month).map(r => <tr key={r.label}><td>{r.label}</td><td>{r.count} / {r.total}명</td><td>{number(r.first)}{r.unit}</td><td>{number(r.last)}{r.unit}</td></tr>)}</BusinessTable></section>
    {filter.hospital !== ALL && <HospitalReview key={filter.hospital + filter.month} hospital={filter.hospital} month={filter.month} />}




    {correction && <Modal title="보고서 정정본 작성" onClose={() => setCorrection("")}><p>기존 제공본과 병원의 확인·재평가·승인 이력은 보존됩니다. 새 버전의 원기록을 다시 검토해 제공합니다.</p><form className="care-form" onSubmit={async e => { e.preventDefault(); if (await careRepo.reviseReport(correction, correctionReason, DEMO_ACCOUNTS.admin.name)) setCorrection(""); }}><label>정정 사유<textarea required value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} /></label><button className="btn-primary">정정본 생성</button></form></Modal>}
</div>;
}
