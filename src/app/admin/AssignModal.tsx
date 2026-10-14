"use client";
import { useState } from "react";
import { Badge, Modal } from "@/components/CareUI";
import { areaMatches, assignmentHistory, declinedProviderIds } from "@/lib/assignment";
import { experts } from "@/lib/data";
import { careRepo, type CareState, type Patient } from "@/lib/repo";

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

/** 배정 제안. 거절한 제공자는 제외하고, 활동 지역·방식·현재 담당 수를 함께 보여줍니다. */
export function AssignModal({ state, patient, onClose }: { state: CareState; patient: Patient; onClose: () => void }) {
  const declined = declinedProviderIds(state, patient.id);
  const candidates = experts.filter(e => !declined.has(e.id)).map(e => ({
    e,
    areaOk: areaMatches(e.area, patient.area),
    methodOk: e.visit.some(v => v === patient.method),
    load: state.patients.filter(p => p.providerId === e.id && p.status !== "종료").length,
  })).sort((a, b) => Number(b.areaOk) + Number(b.methodOk) - Number(a.areaOk) - Number(a.methodOk) || a.load - b.load);
  const [providerId, setProviderId] = useState(patient.requestedProviderId && !declined.has(patient.requestedProviderId) ? patient.requestedProviderId : candidates[0]?.e.id ?? "");
  const history = assignmentHistory(state, patient.id);
  return <Modal title={`${patient.name} 님 담당 치료사 배정`} onClose={onClose} wide>
    <p className="modal-lead">{patient.condition} · {patient.area} · {patient.method} · 희망 {patient.nextDate} {patient.nextTime}</p>
    {history.length > 0 && <div className="history-list" style={{ marginBottom: 16 }}>{history.map(a => <div key={a.id}><div><b>{a.providerName}</b><p>{when(a.respondedAt ?? a.createdAt)}{a.reason ? ` · 사유: ${a.reason}` : ""}</p></div><Badge>{a.status}</Badge></div>)}</div>}
    <form className="care-form" onSubmit={e => { e.preventDefault(); const x = experts.find(v => v.id === providerId); if (x) careRepo.proposeAssignment(patient.id, { id: x.id, name: x.name }); onClose(); }}>
      <fieldset className="decline-reasons pick-list"><legend className="sr">담당 전문가 후보</legend>
        {candidates.map(({ e, areaOk, methodOk, load }) => <label key={e.id}><input type="radio" name="provider" checked={providerId === e.id} onChange={() => setProviderId(e.id)} /><span><b>{e.name}</b> · {e.license} · {e.area} · 담당 {load}명<br /><small className="muted">{areaOk ? "활동 지역 일치" : "활동 지역 확인 필요"} · {methodOk ? `${patient.method} 가능` : `${patient.method} 미제공`}{patient.requestedProviderId === e.id ? " · 신청자 희망" : ""}</small></span></label>)}
      </fieldset>
      {!candidates.length && <p className="form-hint">제안할 수 있는 제공자가 없어요.</p>}
      <p className="form-hint">제안하면 치료사의 배정 요청에 표시되고, 치료사가 수락하면 방문 전 평가로 넘어가요.</p>
      <button className="btn-primary wide" disabled={!providerId}>배정 요청 보내기</button>
    </form>
  </Modal>;
}
