"use client";
import { useState } from "react";
import { PagePanel } from "@/components/CareUI";
import { Icon } from "@/components/Icon";
import { monthLabel, reportMonths } from "@/lib/report";
import { todayLocal, useCare, type Patient } from "@/lib/repo";
import { GuardianSummary } from "./GuardianSummary";
import { MonthlyReport } from "./MonthlyReport";
import { OutpatientSummary } from "./OutpatientSummary";
import { ClinicalReview } from "./ClinicalReview";
import { PlanReview } from "@/app/hospital/PlanReview";
import { latestReport } from "@/lib/workflow";
import "./report-doc.css";

type Audience = "provider" | "hospital" | "guardian";

/** 화면의 보고서만 복사해 인쇄합니다. 입력 중인 칸은 글로 바꿔서 넣어요. */
function printDoc() {
  const doc = document.querySelector(".rpt-paper-wrap .rpt-doc");
  if (!doc) return;
  const root = document.createElement("div");
  root.className = "rpt-print-root";
  const clone = doc.cloneNode(true) as HTMLElement;
  const sources = doc.querySelectorAll("textarea");
  clone.querySelectorAll("textarea").forEach((t, i) => { const div = document.createElement("div"); div.className = "rpt-print-text"; div.textContent = (sources[i] as HTMLTextAreaElement).value || "-"; t.replaceWith(div); });
  clone.querySelectorAll("button").forEach(b => { if (b.classList.contains("rpt-draft")) b.remove(); });
  root.appendChild(clone);
  document.body.appendChild(root);
  const done = () => { root.remove(); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  window.print();
  setTimeout(done, 1000);
}
type Tab = "monthly" | "outpatient" | "family" | "prescription";
const TAB_LABEL: Record<Tab, string> = { monthly: "월간 경과 보고서", outpatient: "외래 재평가", family: "보호자용 요약", prescription: "재활 처방 승인" };

/**
 * 보고서 모음. 같은 기록으로 세 가지 보고서를 만듭니다.
 * - 치료사: 월간 경과 보고서 작성(소견·계획만 입력) → 병원 공유, 외래 요약·보호자 요약 미리보기
 * - 병원: 공유된 월간 보고서 열람·담당의 확인, 외래 재평가 요약
 * - 보호자: 보호자용 요약 (+ 공유된 월간 보고서)
 * 모든 보고서는 "인쇄·PDF 저장"으로 A4 서식 그대로 뽑을 수 있어요.
 */
export function ReportView({ patient, onClose, readOnly = false, audience: given, period, reportId }: { patient: Patient; onClose: () => void; readOnly?: boolean; audience?: Audience; period?: string; reportId?: string }) {
  const state = useCare();
  const audience: Audience = given ?? (readOnly ? "hospital" : "provider");
  const months = [...new Set([...reportMonths(state.records.filter(r => r.patientId === patient.id), todayLocal()), ...state.reports.filter(r => r.patientId === patient.id).map(r => { const m = /^(\d{4})년 (\d{1,2})월$/.exec(r.period); return m ? `${m[1]}-${m[2].padStart(2, "0")}` : ""; }).filter(Boolean)])].sort().reverse();
  const initialMonth = (period && months.find(m => monthLabel(m) === period)) || months[0];
  const [month, setMonth] = useState(initialMonth);
  const [selectedId, setSelectedId] = useState(reportId ?? "");
  const [reevaluationId, setReevaluationId] = useState("");
  const selectedReport = state.reports.find(r => r.id === selectedId && r.period === monthLabel(month)) ?? latestReport(state, patient.id, monthLabel(month), audience === "hospital");
  const sharedMonthly = !!selectedReport?.shared && patient.consent;
  const tabs: Tab[] = audience === "provider" ? ["monthly", "outpatient", "family"] : audience === "hospital" ? ["monthly", "outpatient", "prescription"] : sharedMonthly ? ["family", "monthly"] : ["family"];
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const current = tabs.includes(tab) ? tab : tabs[0];
  const hospitalCannotSee = audience === "hospital" && !sharedMonthly;

  return <PagePanel title={`${patient.name} 님 보고서`} onClose={onClose} wide>
    <div className="rpt-toolbar">
      <div className="rpt-tabs" role="tablist">{tabs.map(t => <button key={t} role="tab" aria-selected={current === t} className={current === t ? "on" : ""} onClick={() => setTab(t)}>{TAB_LABEL[t]}</button>)}</div>
      <div className="rpt-tools">
        {months.length > 1 && <select value={month} onChange={e => { setMonth(e.target.value); setSelectedId(""); setReevaluationId(""); }} aria-label="보고 기간">{months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select>}
        <select aria-label="보고서 버전" value={selectedReport?.id ?? ""} onChange={e => { setSelectedId(e.target.value); setReevaluationId(""); }}>{!selectedReport && <option value="">작성 전</option>}{state.reports.filter(r => r.patientId === patient.id && r.period === monthLabel(month) && (audience !== "hospital" || r.shared)).map(r => <option key={r.id} value={r.id}>v{r.version ?? 1} · {r.shared ? r.supersededById ? "이전 제공본" : "제공본" : "작성 중"}</option>)}</select>
        {!hospitalCannotSee && <button className="rpt-print" onClick={printDoc}><Icon name="file" size={14} />인쇄·PDF 저장</button>}
      </div>
    </div>
    <div className="rpt-paper-wrap">
      {current === "monthly" && (hospitalCannotSee
        ? <p className="rpt-empty rpt-wait">{monthLabel(month)} 보고서는 NPIUM 관리자가 검토·제공하면 볼 수 있어요.</p>
        : <MonthlyReport key={`${month}-${selectedReport?.id}`} patient={patient} month={month} reportId={selectedReport?.id} mode={audience === "provider" ? "edit" : audience === "hospital" ? "hospital" : "view"} />)}
      {current === "outpatient" && !hospitalCannotSee && <><OutpatientSummary patient={selectedReport?.snapshot?.patient ?? patient} source={selectedReport?.snapshot} />{audience === "hospital" && selectedReport?.shared && <ClinicalReview key={selectedReport.id} patient={patient} reportId={selectedReport.id} onDraft={id => { setReevaluationId(id); setTab("prescription"); }} />}</>}
      {current === "prescription" && !hospitalCannotSee && <PlanReview key={reevaluationId || selectedReport?.id} patient={patient} reportId={selectedReport?.id} reevaluationId={reevaluationId || undefined} embedded onClose={() => setTab("monthly")} />}
      {hospitalCannotSee && current !== "monthly" && <p className="rpt-empty">해당 기간에 제공된 보고서와 동의 범위를 확인해 주세요.</p>}
      {current === "family" && <GuardianSummary key={month} patient={patient} month={month} />}
    </div>
  </PagePanel>;
}
