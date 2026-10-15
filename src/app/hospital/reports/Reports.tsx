"use client";
import { usePageItem, usePageState } from "@/lib/page-view";
import { ReportView } from "@/components/reports/ReportView";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ExpertName, PatientInfoPage } from "@/components/BusinessDetails";
import type { Patient } from "@/lib/repo";
import { HospitalHeading } from "../HospitalShell";
import { useHospitalCare } from "../use-hospital-care";

export function Reports() {
  const { state, reports } = useHospitalCare();
  const [selected, setSelected] = usePageItem("patient", state.patients, p => p.id);
  const [report, setReport] = usePageState<{ patient: Patient; period: string; id: string }>("report", id => { const r = reports.find(r => r.id === id && r.shared); const patient = state.patients.find(p => p.id === r?.patientId); return r && patient ? { patient, period: r.period, id: r.id } : null; }, r => r.id);
  const rows = reports.filter(r => state.patients.some(p => p.id === r.patientId));
  if (selected) return <PatientInfoPage patient={selected} onClose={() => setSelected(null)} />;
  if (report) return <ReportView patient={report.patient} period={report.period} reportId={report.id} readOnly onClose={() => setReport(null)} />;
  return <>
    <HospitalHeading title="공유된 보고서" subtitle="확정·공유된 보고서를 대상자의 동의 범위 내에서 열람합니다." />
    <section className="business-section"><div className="business-section-head"><h2>보고서 목록</h2><span>{rows.length}건</span></div>
      <BusinessTable caption="기관 보고서" columns={["대상자", "프로그램", "보고 기간", "담당 전문가", "공유 상태", "담당의 확인", "열람"]} empty={!rows.length ? "등록된 보고서가 없습니다." : undefined}>
        {rows.map(r => { const p = state.patients.find(x => x.id === r.patientId)!; return <tr key={r.id}><td><button className="business-name-link" onClick={() => setSelected(p)} aria-label={`${p.name} 대상자 정보`}>{p.name}</button></td><td>{p.condition}</td><td>{r.period}<small>v{r.version ?? 1}{r.supersededById ? " · 이전 제공본" : ""}</small></td><td><ExpertName id={p.providerId} name={p.provider} /></td><td><BusinessStatus>{r.shared ? "공유 완료" : "공유 대기"}</BusinessStatus></td><td>{r.confirmedAt ? <BusinessStatus>확인 완료</BusinessStatus> : r.shared ? <BusinessStatus>확인 대기</BusinessStatus> : "-"}</td><td><button className="business-action" disabled={!r.shared} onClick={() => setReport({ patient: p, period: r.period, id: r.id })}>보고서 열람</button></td></tr>; })}
      </BusinessTable>
    </section>


  </>;
}
