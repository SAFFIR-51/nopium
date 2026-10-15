"use client";
import { useState } from "react";
import { careRepo, todayLocal, useCare, type Patient, type Reevaluation } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";

export function ClinicalReview({ patient, reportId, onDraft }: { patient: Patient; reportId: string; onDraft: (reevaluationId: string) => void }) {
  const state = useCare();
  const [date, setDate] = useState(todayLocal());
  const [opinion, setOpinion] = useState("");
  const [contras, setContras] = useState((patient.prescription?.contraindications ?? []).join("\n"));
  const [cautions, setCautions] = useState((patient.prescription?.cautions ?? []).join("\n"));
  const [decision, setDecision] = useState<Reevaluation["decision"]>("기존 승인 유지");
  const [message, setMessage] = useState("");
  const records = state.reevaluations.filter(r => r.patientId === patient.id && r.reportId === reportId);
  return <section className="admin-panel"><h3>외래 재평가 기록</h3><p className="admin-note">참고 제공본 {reportId}. 저장과 처방 승인은 별도입니다.</p><form className="care-form" onSubmit={async e => { e.preventDefault(); const id = await careRepo.saveReevaluation({ patientId: patient.id, reportId, date, opinion, contraindications: contras.split("\n").map(s => s.trim()).filter(Boolean), cautions: cautions.split("\n").map(s => s.trim()).filter(Boolean), decision, by: `${patient.doctor ?? DEMO_ACCOUNTS.hospital.doctors[0]} · ${patient.hospital}` }); setMessage(id ? "외래 재평가 기록을 저장했습니다." : "평가일·소견·참고 보고서를 확인해 주세요."); }}>
    <label>외래 재평가일<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label><label>주치의 재활 소견<textarea required rows={3} value={opinion} onChange={e => setOpinion(e.target.value)} /></label><label>금기 운동<textarea rows={2} value={contras} onChange={e => setContras(e.target.value)} /></label><label>주의사항<textarea rows={2} value={cautions} onChange={e => setCautions(e.target.value)} /></label><label>검토 결과<select value={decision} onChange={e => setDecision(e.target.value as Reevaluation["decision"])}>{["기존 승인 유지", "변경안 검토", "추가 확인 필요"].map(s => <option key={s}>{s}</option>)}</select></label><button className="btn-primary">외래 재평가 기록 저장</button></form>{message && <p role="status" className="admin-feedback">{message}</p>}
    {records.map(r => <div className="admin-patient-section" key={r.id}><b>{r.date} · {r.decision}</b><p>{r.opinion}</p>{r.decision === "변경안 검토" && <button className="business-action primary" onClick={() => onDraft(r.id)}>재활 처방 변경안 작성</button>}</div>)}
  </section>;
}
