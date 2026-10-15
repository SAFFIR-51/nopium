"use client";
import { SatisfactionForm } from "@/components/SatisfactionForm";
import { useState } from "react";
import Link from "next/link";
import { PagePanel } from "@/components/CareUI";
import { SessionReportCard } from "@/components/SessionReportCard";
import { AssessmentCompare, AssessmentDetail } from "@/components/AssessmentCompare";
import { ContraBox } from "@/components/ContraBox";
import { MeasureTrend } from "@/components/MeasureTrend";
import { BusinessStatus } from "@/components/BusinessTable";
import { assignmentHistory, matchingStatus } from "@/lib/assignment";
import { sortedAssessments } from "@/lib/assessment";
import { useCare } from "@/lib/repo";
import { experts } from "@/lib/data";

const tabs = ["환자별 진행", "회차별 운동 기록", "초기 방문 평가", "월간 리포트 병원 제공", "병원 진료·현장 반영", "매칭 이력", "만족도"] as const;
export function AdminPatientDetail({ patientId, onClose, onMatch }: { patientId: string; onClose: () => void; onMatch?: () => void }) {
  const state = useCare();
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const p = state.patients.find(p => p.id === patientId);
  if (!p) return null;
  const records = state.records.filter(r => r.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  const assessments = sortedAssessments(state.assessments.filter(a => a.patientId === p.id));
  const reports = state.reports.filter(r => r.patientId === p.id);
  return <PagePanel title={`${p.name} · 환자별 진행`} wide onClose={onClose}>
    <p className="admin-note">{p.hospital} · {p.condition} · 담당 치료사 {p.provider || "미배정"}</p>
    <div className="admin-patient-tabs" role="tablist" aria-label="환자 데이터">{tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
    <div className="admin-patient-data" role="tabpanel" aria-label={tab}>
      {tab === "환자별 진행" && <>
        <dl className="hospital-review-grid">
          <div><dt>프로그램 상태</dt><dd>{p.status}</dd></div><div><dt>환자 매칭 통제</dt><dd>{matchingStatus(state, p.id)}</dd></div>
          <div><dt>방문 일정</dt><dd>{p.nextDate} {p.nextTime}</dd></div><div><dt>진행 회차</dt><dd>{p.completed} / {p.total}회</dd></div>
          <div><dt>환자 동의</dt><dd>{p.consent ? "정보 공유 동의" : "정보 공유 미동의"} · 방문 동의 {p.prescription?.consentChecked ? "확인" : "미확인"}</dd></div><div><dt>담당 의사</dt><dd>{p.doctor || "미지정"}</dd></div>
          <div className="full"><dt>관리 목표</dt><dd>{p.goal}</dd></div><div className="full"><dt>재활 처방 승인</dt><dd>{p.approval ? `${p.approval.status} · ${p.approval.by} · ${p.approval.at.slice(0, 10)}` : p.prescription ? "기존 처방 등록" : "병원 승인 대기"}</dd></div>
          <div className="full"><dt>처방 범위</dt><dd>{p.prescription ? `${p.prescription.startDate} ~ ${p.prescription.endDate} · 주 ${p.prescription.perWeek}회 · ${p.prescription.scope.join(" · ")}` : "병원 처방 확인 전"}</dd></div>
        </dl>
        <ContraBox rx={p.prescription} showOpinion />
        <div className="admin-row-action">{onMatch && p.status !== "종료" && <button className="btn-primary" onClick={onMatch}>환자 매칭 통제</button>}<Link className="business-action" href="/admin/analysis">데이터 분석·보고서 취합</Link></div>
        <p className="admin-note">운영 관리자는 기록과 승인 상태를 확인합니다. 재활 소견·처방 승인은 병원이, 원기록 입력·정정은 작성 치료사가 담당합니다.</p>
      </>}
      {tab === "회차별 운동 기록" && <><MeasureTrend records={records} />{records.length ? records.map(r => <section className="admin-patient-section" key={r.id}><BusinessStatus>{r.confirmed ? "확정 기록" : "작성 중 · 확인 필요"}</BusinessStatus><SessionReportCard record={r} provider={experts.find(e => e.id === r.authorId)?.name || "작성자 미등록"} />{r.revisions?.map((v, i) => <p className="admin-note" key={i}>{v.at} · {v.by} · 정정 사유: {v.reason}<br />{v.changes?.join(" · ")}<br />이전 내용: {v.snapshot?.content ?? v.content}</p>)}</section>) : <p className="admin-empty">등록된 회차 기록이 없습니다.</p>}</>}
      {tab === "초기 방문 평가" && <>{assessments.length > 1 && <AssessmentCompare before={assessments[0]} after={assessments[assessments.length - 1]} />}{assessments.length ? assessments.map(a => <section className="admin-patient-section" key={a.id}><h3>{a.period} · {a.date} · {a.by || "작성자 미등록"}</h3><AssessmentDetail a={a} /><p>ROM {a.rom || "미입력"}<br />근력 {a.strength || "미입력"}<br />보행 {a.walking || "미입력"}<br />균형 {a.balance || "미입력"}<br />ADL {a.adl || "미입력"}<br />주거 환경 {a.environment || "미입력"}</p></section>) : <p className="admin-empty">등록된 평가가 없습니다.</p>}</>}
      {tab === "월간 리포트 병원 제공" && <>{reports.length ? reports.map(r => <section className="admin-patient-section" key={r.id}><h3>{r.period} · {r.shared ? "병원 제공" : "제공 전"}</h3><p>작성: {r.writtenBy || "미작성"} · 제공: {r.providedBy || (r.shared ? "기존 공유" : "대기")} {r.providedAt?.slice(0, 10)}<br />병원 확인: {r.confirmedBy ? `${r.confirmedBy} · ${r.confirmedAt?.slice(0, 10)}` : "확인 기록 없음"}<br />검토 내용: {r.reviewNote || "등록된 검토 내용 없음"}<br />종합 소견: {r.opinion || "미작성"}</p></section>) : <p className="admin-empty">등록된 보고서가 없습니다.</p>}<Link href="/admin/analysis" className="business-action">데이터 분석에서 취합·제공</Link></>}
      {tab === "병원 진료·현장 반영" && <>
        <h3>외래 재평가 이력</h3>{state.reevaluations.filter(r => r.patientId === p.id).map(r => <section key={r.id} className="admin-patient-section"><b>{r.date} · {r.decision}</b><p>{r.opinion}<br />참고 보고서: {reports.find(v => v.id === r.reportId)?.period} v{reports.find(v => v.id === r.reportId)?.version ?? 1}<br />{r.by} · {r.at}</p></section>)}
        <h3>승인 버전별 치료사 확인·회차 반영</h3>{state.prescriptionVersions.filter(v => v.patientId === p.id).map(v => { const ack = state.prescriptionAcknowledgments.find(a => a.versionId === v.id && a.providerId === p.providerId); const applied = records.filter(r => r.confirmed && r.prescriptionVersionId === v.id); return <section key={v.id} className="admin-patient-section"><b>v{v.version} · 적용일 {v.effectiveFrom}</b><p>{v.prescription.doctorOpinion}<br />승인: {v.by} · {v.at}<br />현재 담당 치료사 확인: {ack ? `${ack.by} · ${ack.at}` : "확인 기록 없음"}<br />해당 승인으로 확정한 회차: {applied.length}건 · {applied.map(r => `${r.date} ${r.sessionNo ?? ""}회차`).join(" · ") || "회차 연결 전"}</p></section>; })}
        {!state.prescriptionVersions.some(v => v.patientId === p.id) && <p>승인 버전 등록 전입니다. 기존 처방과 병원 승인 상태를 확인해 주세요.</p>}
        <p className="admin-note">보고서 열람·담당의 확인·외래 재평가·처방 승인·치료사 확인·실제 회차 반영은 각각의 기록으로 확인합니다.</p>
      </>}
      {tab === "만족도" && <SatisfactionForm patient={p} />}
      {tab === "매칭 이력" && <>{assignmentHistory(state, p.id).map(a => <section className="admin-patient-section" key={a.id}><h3>{a.providerName} · {a.status}</h3><p>{a.respondedAt || a.createdAt} · {a.by || "기존 배정 기록"}<br />{a.adjustmentReason}{a.reason ? ` · ${a.reason}` : ""}</p></section>)}{!assignmentHistory(state, p.id).length && <p className="admin-empty">매칭 이력이 없습니다.</p>}</>}
    </div>
  </PagePanel>;
}
