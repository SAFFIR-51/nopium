"use client";
import { mutationFailed } from "@/lib/repo";
import { useHospitalAccount } from "@/lib/demo-session";
import { useState } from "react";
import { PagePanel, Modal } from "@/components/CareUI";
import { Icon } from "@/components/Icon";
import { AssessmentCompare } from "@/components/AssessmentCompare";
import { careRepo, useCare, type CareRecord, type Patient } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";

export const LINK_TARGETS = ["보건소 방문건강관리", "주민센터 통합돌봄 창구", "장기요양기관", "장애인복지관", "노인복지관"];

/** 이상 반응 기록을 담당 의사가 확인합니다. 확인 내용은 기록에 남습니다. */
export function AdverseReview({ record, patient, onClose }: { record: CareRecord; patient: Patient; onClose: () => void }) {
  const doctor = patient.doctor ?? DEMO_ACCOUNTS.hospital.doctors[0];
  const [note, setNote] = useState("");
  return <Modal title={`${patient.name} 님 이상 반응 확인`} onClose={onClose}>
    <p className="modal-lead">{record.date} · {record.sessionNo ? `${record.sessionNo}회차` : record.title} · 담당 치료사 {patient.provider}</p>
    <div className="src-adverse"><Icon name="shield" size={14} /><span><b>이상 반응</b> {record.adverse?.detail}<br /><b>조치</b> {record.adverse?.action}</span></div>
    <form className="care-form" onSubmit={async e => { e.preventDefault(); if (mutationFailed(await careRepo.reviewAdverse(record.id, doctor, note.trim() || "확인함"))) return; onClose(); }}>
      <label>의사 확인 의견<textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="예: 다음 회차 강도 유지, 어지러움 반복 시 외래 진료" /></label>
      <button className="btn-primary wide">{doctor} 확인 완료</button>
    </form>
  </Modal>;
}

/** 종료 확인: 방문 전 평가와 종료 평가를 비교하고, 필요하면 지역사회 연계를 함께 의뢰합니다. */
export function ClosureReview({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const state = useCare();
  const me = useHospitalAccount();
  const first = state.assessments.find(a => a.patientId === patient.id && a.period === "초기 평가");
  const last = state.assessments.find(a => a.patientId === patient.id && a.period === "사후 평가");
  const visits = state.records.filter(r => r.patientId === patient.id && r.confirmed && r.attendance !== "미참여").length;
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState(false);
  const [to, setTo] = useState(LINK_TARGETS[0]);
  const [reason, setReason] = useState("");
  const close = async () => {
    if (mutationFailed(await careRepo.closeProgram(patient.id, `${patient.doctor ?? me.doctors[0]} · ${me.organization}`, summary.trim() || `방문 ${visits}회 진행 후 종료`))) return;
    if (link && reason.trim()) if (mutationFailed(await careRepo.addLinkage({ patientId: patient.id, to, reason: reason.trim(), by: me.socialWorker }))) return;
    onClose();
  };
  return <PagePanel title={`${patient.name} 님 종료 확인`} wide onClose={onClose}>
    <p className="modal-lead">방문 {visits}회 · 담당 치료사 {patient.provider} · 처방 {patient.prescription ? `${patient.prescription.startDate} ~ ${patient.prescription.endDate}` : "-"}</p>
    {!last ? <p className="alert-line"><Icon name="shield" size={15} />종료 평가가 아직 없어요. 담당 치료사가 종료 평가를 기록하면 종료할 수 있어요.</p> : <>
      <AssessmentCompare before={first} after={last} />
      <form className="care-form" onSubmit={e => { e.preventDefault(); close(); }}>
        <label>종료 소견<textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="예: 실내 독립 보행 가능, 외출 시 보호자 동행 권고" /></label>
        <label className="consent-check"><input type="checkbox" checked={link} onChange={e => setLink(e.target.checked)} /><span>퇴원 후 돌봄이 더 필요해 지역사회로 연계해요 ({me.socialWorker})</span></label>
        {link && <div className="form-two"><label>연계 기관<select value={to} onChange={e => setTo(e.target.value)}>{LINK_TARGETS.map(t => <option key={t}>{t}</option>)}</select></label><label>의뢰 내용<input value={reason} onChange={e => setReason(e.target.value)} placeholder="예: 주 1회 방문건강관리, 낙상 예방 교육" /></label></div>}
        <button className="btn-primary wide" disabled={link && !reason.trim()}>종료 확인</button>
      </form>
    </>}
  </PagePanel>;
}
