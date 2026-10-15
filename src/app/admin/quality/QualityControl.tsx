"use client";
import { useToday } from "@/lib/use-today";
import { useState } from "react";
import { allProviders } from "@/lib/workflow";
import { careRepo, type QualityReview } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { BusinessTable } from "@/components/BusinessTable";
import { AdminHeading } from "../AdminShell";
import { useAdminCare } from "../use-admin-care";

export function QualityControl() {
  const { state } = useAdminCare();
  const providers = allProviders(state);
  const [selectedProvider, setProviderId] = useState("");
  const providerId = selectedProvider || providers[0]?.id || "";
  const today = useToday();
  const [selectedMonth, setMonth] = useState("");
  const month = selectedMonth || today?.slice(0, 7) || "";
  const [findings, setFindings] = useState("");
  const [action, setAction] = useState<QualityReview["action"]>("활동 유지");
  const [message, setMessage] = useState("");
  const records = state.records.filter(r => r.authorId === providerId && r.date.startsWith(month));
  const scores = state.satisfactions.filter(s => s.providerId === providerId && s.month === month);
  return <div className="admin-control"><AdminHeading title="품질 통제 시스템" subtitle="월간 성과평가와 환자 만족도를 근거로 관리 조치를 남기고 신규 배정 가능 상태에 반영합니다." /><section className="admin-panel"><form className="care-form" onSubmit={async e => { e.preventDefault(); const ok = await careRepo.saveQualityReview({ providerId, month, findings, action, by: DEMO_ACCOUNTS.admin.name }); setMessage(ok ? "월간 성과평가와 관리 조치를 저장했습니다." : "대상·기간·평가 내용을 확인해 주세요."); }}><div className="form-two"><label>치료사<select value={providerId} onChange={e => setProviderId(e.target.value)}>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>평가 기간<input type="month" required value={month} onChange={e => setMonth(e.target.value)} /></label></div><p className="admin-note">확정 기록 {records.filter(r => r.confirmed).length}건 · 작성 중 {records.filter(r => !r.confirmed).length}건 · 이상 반응 미확인 {records.filter(r => r.confirmed && r.adverse?.occurred && !r.adverse.reviewedBy).length}건 · 만족도 입력 {scores.length}건</p><label>평가 근거·확인 내용<textarea required rows={3} value={findings} onChange={e => setFindings(e.target.value)} /></label><label>관리 조치<select value={action} onChange={e => setAction(e.target.value as QualityReview["action"])}>{["활동 유지", "보완 요청", "배정 보류"].map(a => <option key={a}>{a}</option>)}</select></label><p className="admin-note">배정 보류는 신규 제안·확정을 제한합니다. 진행 중인 환자의 방문을 자동 중단하지 않습니다. 보류 해제는 치료사 인증 및 등록에서 확인 근거를 남깁니다.</p><button className="btn-primary">월간 성과평가 저장</button>{message && <p role="status">{message}</p>}</form></section><section className="business-section"><h2>환자 만족도 점수 반영</h2><BusinessTable caption="만족도 근거" columns={["환자", "기간", "점수·척도", "수집 근거"]} empty={!scores.length ? "등록된 만족도 점수가 없습니다." : undefined}>{scores.map(s => <tr key={s.id}><td>{state.patients.find(p => p.id === s.patientId)?.name}</td><td>{s.month}</td><td>{s.score}/{s.maxScore}</td><td>{s.note}<small>{s.by}</small></td></tr>)}</BusinessTable><p className="admin-note">서로 다른 척도의 점수는 같은 평균으로 합치지 않습니다. 입력은 환자별 진행의 환자 만족도에서 연결합니다.</p></section><section className="business-section"><h2>월간 성과평가 이력</h2><BusinessTable caption="성과평가 이력" columns={["기간", "치료사", "근거", "조치", "담당·시점"]} empty={!state.qualityReviews.length ? "평가 이력이 없습니다." : undefined}>{state.qualityReviews.map(r => <tr key={r.id}><td>{r.month}</td><td>{providers.find(p => p.id === r.providerId)?.name}</td><td>{r.findings}</td><td>{r.action}</td><td>{r.by}<small>{r.at}</small></td></tr>)}</BusinessTable></section></div>;
}
