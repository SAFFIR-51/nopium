"use client";
import { useState } from "react";
import { ReportView } from "@/components/CareUI";
import { Icon } from "@/components/Icon";
import { MeasureTrend } from "@/components/MeasureTrend";
import { SessionReportCard } from "@/components/SessionReportCard";
import { measureHighlight } from "@/lib/measures";
import { MySubHeader, PatientSwitch } from "../PatientShell";
import { usePatientCare } from "../use-patient-care";
import "../my-home-type.css";

/** 회차 보고서: 변화 요약 → 월간 보고서 → 회차별 보고서. 선생님이 확정한 보고서만 보입니다. */
export function MyRecords() {
  const { state, patient } = usePatientCare();
  const [report, setReport] = useState(false);
  if (!patient) return <div className="sg my-home my-sub-view"><MySubHeader title="회차 보고서" subtitle="연결된 관리 대상이 없어요." /></div>;
  const records = state.records.filter(r => r.patientId === patient.id && r.confirmed).sort((a, b) => b.date.localeCompare(a.date));
  const shared = state.reports.find(r => r.patientId === patient.id)?.shared;
  const highlight = measureHighlight(records);
  return <div className="sg my-home my-sub-view">
    <MySubHeader title="회차 보고서" subtitle="매 회차 선생님이 작성한 보고서예요" />
    <PatientSwitch />
    {records.length ? <>
      <h2 className="sg-title">변화</h2>
      <section className="sg-card" id="trend">{highlight && <p className="sg-highlight top">{highlight}</p>}<MeasureTrend records={records} /></section>
      <section className="sg-card" id="report"><button className="sg-row" onClick={() => setReport(true)}>
        <span><small className={`sg-state ${shared ? "on" : ""}`}>{shared ? "병원 공유됨" : "확인 가능"}</small><b>월간 진행 보고서</b><small>이번 달 회차 보고서를 모아 정리했어요</small></span>
        <span className="sg-right">보기<Icon name="chevron" size={14} /></span>
      </button></section>
      <h2 className="sg-title">회차별 보고서 <span>{records.length}</span></h2>
      {records.map(r => <section className="sg-card sg-report" id={r.id} key={r.id}><SessionReportCard record={r} provider={patient.provider} /></section>)}
    </> : <section className="sg-card sg-empty">회차가 진행되면 선생님이 남긴 보고서가 이곳에 쌓여요.</section>}
    {report && <ReportView patient={patient} readOnly onClose={() => setReport(false)} />}
  </div>;
}
