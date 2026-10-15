"use client";
import { useState } from "react";
import { PagePanel } from "@/components/CareUI";
import { areaMatches } from "@/lib/assignment";
import { careRepo, type CareState, type Patient } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { allProviders, providerEligibility } from "@/lib/workflow";
import { todayLocal } from "@/lib/repo";

export function MatchProposal({ state, patient, onClose }: { state: CareState; patient: Patient; onClose: () => void }) {
  const candidates = allProviders(state).filter(e => e.id !== patient.providerId).map(e => ({ e, eligibility: providerEligibility(state, e.id, todayLocal()), areaOk: areaMatches(e.area, patient.area), methodOk: e.visit.some(v => v === patient.method), load: state.patients.filter(p => p.providerId === e.id && p.status !== "종료").length }))
    .sort((a, b) => Number(b.areaOk) + Number(b.methodOk) - Number(a.areaOk) - Number(a.methodOk) || a.load - b.load);
  const [providerId, setProviderId] = useState(candidates[0]?.e.id ?? "");
  const [reason, setReason] = useState(patient.providerId ? "" : "최초 매칭");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const selected = candidates.find(c => c.e.id === providerId);
  const conflicts = state.patients.filter(p => p.id !== patient.id && p.providerId === providerId && p.status !== "종료" && p.nextDate === patient.nextDate && p.nextTime === patient.nextTime);
  return <PagePanel title={`${patient.name} · ${patient.providerId ? "담당 치료사 변경 제안" : "치료사 매칭 제안"}`} wide onClose={onClose}>
    <p className="modal-lead">{patient.hospital} · {patient.condition} · {patient.area} · {patient.method} · {patient.nextDate} {patient.nextTime}</p>
    {patient.providerId && <p className="admin-notice">현재 담당 {patient.provider}. NPIUM 최종 확정 후 담당 치료사가 교체됩니다.</p>}
    <form className="care-form" onSubmit={async e => { e.preventDefault(); if (!selected || !checked || !reason.trim() || conflicts.length) return; const ok = await careRepo.proposeAssignment(patient.id, { id: selected.e.id, name: selected.e.name }, reason, DEMO_ACCOUNTS.admin.name); if (ok) onClose(); else setError("매칭 상태가 변경되었습니다. 현재 제안을 확인한 뒤 다시 처리해 주세요."); }}>
      <fieldset className="decline-reasons pick-list"><legend>치료사 후보</legend>{candidates.map(({ e, areaOk, methodOk, load }) => <label key={e.id}><input type="radio" name="provider" checked={providerId === e.id} onChange={() => { setProviderId(e.id); setChecked(false); }} /><span><b>{e.name}</b> · {e.license} · 경력 {e.years}년 · 담당 {load}명<br /><small>{e.area} · {areaOk ? "활동 지역 일치" : "활동 지역 확인 필요"} · {methodOk ? `${patient.method} 가능` : "진행 방식 확인 필요"}</small></span></label>)}</fieldset>
      <label>매칭·변경 사유<textarea required rows={2} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {conflicts.length > 0 && <p className="admin-feedback error" role="alert">같은 날짜·시간에 {conflicts.map(p => p.name).join(", ")} 님 일정이 있습니다. 일정을 조정한 뒤 제안해 주세요.</p>}
      <label className="consent-check"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>치료사 자격·제공 범위·활동 지역과 일정을 검토했습니다.</span></label>
      <p className="admin-note">면허·보험 확인은 치료사 인증 및 등록에서 확인합니다. 담당 수는 현재 기준입니다.</p>
      {error && <p role="alert" className="admin-feedback error">{error}</p>}
      {selected && <p className="admin-note">인증 상태: {selected.eligibility}. 인증 자료·보험 유효기간과 배정 보류 상태를 먼저 확인합니다.</p>}
      <button className="btn-primary wide" disabled={!selected || !checked || !reason.trim() || conflicts.length > 0 || selected.eligibility !== "배정 가능"}>치료사에게 매칭 제안</button>
    </form>
  </PagePanel>;
}
