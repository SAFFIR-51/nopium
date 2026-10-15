"use client";
import { mutationFailed } from "@/lib/repo";
import { useHospitalAccount } from "@/lib/demo-session";
import { prescriptionSignature } from "@/lib/workflow";
import { useState } from "react";
import { PagePanel } from "@/components/CareUI";
import { ExpertName } from "@/components/BusinessDetails";
import { BusinessStatus } from "@/components/BusinessTable";
import { StageSteps } from "@/components/StageSteps";
import { ACTIVITIES, measureDef } from "@/lib/measures";
import { programStage } from "@/lib/program";
import { careRepo, todayLocal, useCare, type Patient, type Prescription } from "@/lib/repo";
import { PlacePicker } from "@/components/PlacePicker";
import { PlaceInfo } from "@/components/PlaceInfo";
import { type Place, type PlaceKind } from "@/lib/places";
import { DEPARTMENTS, PROTOCOLS, protocolById, suggestProtocol } from "@/lib/protocols";
import { ContraBox } from "@/components/ContraBox";
import { AssessmentDetail } from "@/components/AssessmentCompare";
import "@/components/protocol.css";

const when = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * 대상자 상세 + 계획·처방 확인.
 * 담당 의사가 방문 전 평가를 보고 처방(기간·주간 횟수·치료 범위·주의사항)을 정합니다.
 * 처방이 있어야 치료사가 방문하고 회차 보고서를 쓸 수 있습니다. (의료기사법: 의사의 지도 아래에서만 업무)
 */
export function PlanReview({ patient, onClose, onReport, reportId, reevaluationId, embedded = false }: { patient: Patient; onClose: () => void; onReport?: () => void; reportId?: string; reevaluationId?: string; embedded?: boolean }) {
  const state = useCare();
  const [baseSignature] = useState(() => prescriptionSignature(patient, state));
  const me = useHospitalAccount();
  const initial = state.assessments.find(a => a.patientId === patient.id && a.period === "초기 평가");
  const rx = patient.prescription;
  const re = state.reevaluations.find(r => r.id === reevaluationId) ?? state.reevaluations.find(r => r.patientId === patient.id && r.reportId === reportId);
  const [doctor, setDoctor] = useState(rx?.doctor ?? patient.doctor ?? me.doctors[0]);
  const [start, setStart] = useState(rx?.startDate ?? patient.nextDate ?? todayLocal());
  const [perWeek, setPerWeek] = useState(rx?.perWeek ?? 1);
  const [end, setEnd] = useState(rx?.endDate ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(todayLocal());
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [scope, setScope] = useState<string[]>(rx?.scope ?? ["보행", "균형", "근력", "보호자 교육"]);
  const [precautions, setPrecautions] = useState(patient.precautions);
  const [places, setPlaces] = useState<PlaceKind[]>(rx?.places ?? (patient.place?.kind === "센터" ? ["자택", "센터"] : ["자택"]));
  const [place, setPlace] = useState<Place>(patient.place ?? { kind: "자택" });
  // 진료과 프로토콜: 처방이 없으면 진단명으로 어울리는 것을 먼저 골라 둡니다.
  const suggested = rx ? undefined : suggestProtocol(patient.condition);
  const [protocolId, setProtocolId] = useState(rx?.protocolId ?? suggested?.id ?? "");
  const [contras, setContras] = useState<string[]>(re?.contraindications ?? rx?.contraindications ?? suggested?.contraindications.map(c => c.text) ?? []);
  const [customContra, setCustomContra] = useState("");
  const [extraContras, setExtraContras] = useState<string[]>(() => (rx?.contraindications ?? []).filter(c => !protocolById(rx?.protocolId)?.contraindications.some(x => x.text === c)));
  const [cautions, setCautions] = useState((re?.cautions ?? rx?.cautions ?? suggested?.cautions ?? []).join("\n"));
  const [opinion, setOpinion] = useState(re?.opinion ?? rx?.doctorOpinion ?? "");
  const [consentChecked, setConsentChecked] = useState(rx?.consentChecked ?? false);
  const protocol = protocolById(protocolId);
  const pickProtocol = (id: string) => {
    const p = protocolById(id);
    setProtocolId(id);
    setContras([...(p?.contraindications.map(c => c.text) ?? []), ...extraContras]);
    setCautions((p?.cautions ?? []).join("\n"));
  };
  const contraOptions = [...(protocol?.contraindications.map(c => c.text) ?? []), ...extraContras];
  const toggleContra = (c: string) => setContras(l => l.includes(c) ? l.filter(x => x !== c) : [...l, c]);
  const addContra = () => {
    const c = customContra.trim();
    if (!c || contraOptions.includes(c)) return;
    setExtraContras(l => [...l, c]); setContras(l => [...l, c]); setCustomContra("");
  };
  const measured = new Set((initial?.measures ?? []).filter(m => m.value !== null).map(m => m.code));
  const missingFocus = (protocol?.focusMeasures ?? []).filter(c => !measured.has(c));
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reviewing = patient.status === "승인 대기";
  const editable = patient.status === "승인 대기" || patient.status === "진행 중";
  const stage = programStage(state, patient);
  const signer = `${doctor} · ${me.organization}`;
  const toggle = (a: string) => setScope(l => l.includes(a) ? l.filter(x => x !== a) : [...l, a]);
  const prescription = (): Prescription => ({ doctor, startDate: start, endDate: end, perWeek, scope, places, note: rx?.note, extendedDays: rx?.extendedDays, protocolId: protocolId || undefined, contraindications: contras, cautions: cautions.split("\n").map(c => c.trim()).filter(Boolean), doctorOpinion: opinion.trim(), consentChecked });
  const activeDraft = state.prescriptionDrafts.find(d => d.id === selectedDraftId) ?? state.prescriptionDrafts.find(d => d.patientId === patient.id && d.status === "작성 중");
  const matchesDraft = activeDraft && JSON.stringify(activeDraft.prescription) === JSON.stringify(prescription()) && activeDraft.precautions === precautions && activeDraft.effectiveFrom === effectiveFrom;
  const confirm = async () => {
    const id = await careRepo.savePrescriptionDraft({ patientId: patient.id, prescription: prescription(), precautions, effectiveFrom, by: signer, reportId: re?.reportId ?? reportId, reevaluationId: re?.id }, baseSignature);
    setSelectedDraftId(id); setApprovalChecked(false); setFeedback(id ? "변경안을 저장했습니다. 현재 승인 내용과 비교한 뒤 승인해 주세요." : "날짜·처방 범위·동의 항목을 확인해 주세요.");
  };
  // 버튼이 막힌 이유를 바로 보여 줍니다.
  const blocker = !patient.providerId ? "담당 치료사를 먼저 배정해 주세요."
    : !end || end < start ? "병원에서 확인한 처방 종료일을 입력해 주세요."
    : effectiveFrom < start || effectiveFrom > end ? "적용일은 처방 기간 안에서 정해 주세요."
    : !places.length ? "허용 장소를 1개 이상 골라 주세요."
    : !scope.length ? "치료 범위를 1개 이상 골라 주세요."
    : !opinion.trim() ? "주치의 재활 소견을 적어 주세요. 치료사가 방문 전에 확인해요."
    : !consentChecked ? "방문재활 동의서를 받았는지 확인해 주세요." : null;
  const measures = (initial?.measures ?? []).map(m => `${measureDef(m.code)?.label ?? m.code} ${m.value}${measureDef(m.code)?.unit ?? ""}`).join(" · ");
  const content = <>
    <div className="hospital-review">
      <StageSteps stage={stage} compact />
      <div className="hospital-review-heading" style={{ marginTop: 16 }}><h3>대상자 및 프로그램 정보</h3><BusinessStatus>{stage}</BusinessStatus></div>
      <dl className="hospital-review-grid">
        <div><dt>대상자</dt><dd>{patient.name} · {patient.age}세 · {patient.sex}</dd></div>
        <div><dt>연계 기관</dt><dd>{patient.hospital}</dd></div>
        <div><dt>프로그램</dt><dd>{patient.condition}</dd></div>
        <div><dt>담당 치료사</dt><dd><ExpertName id={patient.providerId} name={patient.provider} /></dd></div>
        <div className="full"><dt>기본 장소</dt><dd><PlaceInfo patient={patient} place={patient.place} />{patient.homeAccess && patient.place?.kind !== "센터" ? <small> {patient.homeAccess}</small> : null}</dd></div>
        <div><dt>진행 회차</dt><dd>{patient.completed} / {patient.total}회</dd></div>
        <div><dt>다음 일정</dt><dd>{patient.nextDate} {patient.nextTime}</dd></div>
        <div><dt>정보 공유</dt><dd>{patient.consent ? "동의" : "미동의"}</dd></div>
        <div className="full"><dt>프로그램 목표</dt><dd>{patient.goal}</dd></div>
        <div className="full"><dt>방문 전 평가</dt><dd>{initial ? <>{initial.date}{initial.by ? ` · ${initial.by}` : ""} · {measures || "표준 점수 없음"}<AssessmentDetail a={initial} /></> : "초기 방문 평가 전 · 퇴원 전 처방을 승인한 뒤 평가 결과를 추가 검토합니다."}</dd></div>
        {patient.closure && <div className="full"><dt>종료 확인</dt><dd>{patient.closure.by} · {when(patient.closure.at)} · {patient.closure.summary}</dd></div>}
      </dl>
      {patient.approval && <p className="hospital-review-history">{patient.approval.status === "승인" ? "처방 확인" : "보완 요청"} · {patient.approval.by} · {when(patient.approval.at)}{patient.approval.reason ? ` · 사유: ${patient.approval.reason}` : ""}</p>}
      {editable ? <form className="care-form" onSubmit={e => { e.preventDefault(); confirm(); }}>
        <div className="hospital-review-heading"><h3>방문재활 처방</h3>{rx?.extendedDays ? <BusinessStatus>{`연장 ${rx.extendedDays}일`}</BusinessStatus> : null}</div>
        <div className="form-two">
          <label>담당 의사<select value={doctor} onChange={e => setDoctor(e.target.value)}>{me.doctors.map(d => <option key={d}>{d}</option>)}</select></label>
          <label>방문 시작일<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        </div>
        <div className="form-two">
          <label>주간 방문 횟수<select value={perWeek} onChange={e => setPerWeek(Number(e.target.value))}>{[1, 2, 3].map(n => <option key={n} value={n}>주 {n}회</option>)}</select></label>
          <label>처방 종료일<input required type="date" min={start} value={end} onChange={e => setEnd(e.target.value)} /></label>
        </div>
        <label>변경 적용일<input type="date" min={start} max={end} value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} /></label>
        {re && <p className="admin-note">외래 재평가 {re.date} · {re.decision} · 참고 보고서 {re.reportId}</p>}
        <fieldset className="srf-chips"><legend>허용 장소 <small>회차마다 보호자가 이 안에서 바꿀 수 있어요</small></legend>{(["자택", "센터"] as PlaceKind[]).map(k => <button type="button" key={k} className={places.includes(k) ? "on" : ""} aria-pressed={places.includes(k)} onClick={() => setPlaces(l => l.includes(k) ? l.filter(x => x !== k) : [...l, k])}>{k === "자택" ? "자택 방문" : "제휴 센터·공간"}</button>)}</fieldset>
        {places.length > 0 && <div><p className="srf-scope" style={{ margin: "4px 0 8px" }}>기본 장소</p><PlacePicker patient={patient} value={place} onChange={setPlace} allowed={places} name={`rx-place-${patient.id}`} /></div>}
        <fieldset className="srf-chips"><legend>치료 범위</legend>{ACTIVITIES.map(a => <button type="button" key={a} className={scope.includes(a) ? "on" : ""} aria-pressed={scope.includes(a)} onClick={() => toggle(a)}>{a}</button>)}</fieldset>
        <div className="hospital-review-heading" style={{ marginTop: 8 }}><h3>진료과 프로토콜 · 금기 운동</h3>{protocol ? <BusinessStatus>{protocol.dept}</BusinessStatus> : null}</div>
        <label>프로토콜<select className="protocol-select" value={protocolId} onChange={e => pickProtocol(e.target.value)}>
          <option value="">선택 안 함 (금기·주의사항을 직접 입력)</option>
          {DEPARTMENTS.map(d => <optgroup key={d} label={d}>{PROTOCOLS.filter(p => p.dept === d).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup>)}
        </select></label>
        {protocol && <p className="protocol-note">핵심 평가 지표 <b>{protocol.focusMeasures.map(c => measureDef(c)?.label ?? c).join(" · ")}</b> · 리포트 중점 <b>{protocol.reportFocus}</b>{initial && missingFocus.length > 0 && <><br /><span className="missing">방문 전 평가에서 아직 안 잰 지표: {missingFocus.map(c => measureDef(c)?.label ?? c).join(" · ")}</span></>}</p>}
        {suggested && protocolId === suggested.id && !rx && <p className="protocol-note">진단명({patient.condition})에 맞춰 골라 뒀어요. 병원 기준에 맞게 바꿔 주세요.</p>}
        <fieldset className="srf-chips contra-chips"><legend>하지 말아야 할 운동 <small>빨간색이 적용돼요. 치료사가 보고서에서 관련 활동을 고르면 경고해요</small></legend>
          {contraOptions.map(c => <button type="button" key={c} className={contras.includes(c) ? "on" : ""} aria-pressed={contras.includes(c)} onClick={() => toggleContra(c)}>{c}</button>)}
          <div className="contra-add"><input value={customContra} onChange={e => setCustomContra(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addContra(); } }} placeholder="직접 추가 (예: 수술 부위 마사지)" aria-label="금기 운동 직접 추가" /><button type="button" disabled={!customContra.trim()} onClick={addContra}>추가</button></div>
        </fieldset>
        <label>주의사항 <small className="srf-opt">한 줄에 하나씩</small><textarea value={cautions} rows={3} onChange={e => setCautions(e.target.value)} placeholder="예: 운동 전 혈압 확인" /></label>
        <label>주치의 재활 소견<textarea value={opinion} rows={2} onChange={e => setOpinion(e.target.value)} placeholder="예: 좌측 편마비, 실내 보행은 보조하에 가능" /></label>
        <label>기타 참고 <small className="srf-opt">치료사·보호자 화면 위쪽에 보여요</small><textarea value={precautions} rows={2} onChange={e => setPrecautions(e.target.value)} /></label>
        <label className="consent-check"><input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} /><span>대상자(또는 보호자)에게 방문재활 동의서를 받았습니다.</span></label>
        {rejecting && <label>보완 요청 사유<textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="치료사가 다시 평가하거나 보완할 내용을 적어 주세요." /></label>}
        {blocker && <p className="plan-blocker" role="status">{blocker}</p>}
        <div className="modal-actions">
          {onReport ? <button type="button" className="btn-ghost" onClick={onReport}>진행 보고</button> : <span />}
          <div>
            {reviewing && (rejecting
              ? <button type="button" className="btn-ghost" disabled={!reason.trim()} onClick={async () => { if (mutationFailed(await careRepo.rejectPlan(patient.id, signer, reason.trim()))) return; onClose(); }}>보완 요청 보내기</button>
              : <button type="button" className="btn-ghost" onClick={() => setRejecting(true)}>보완 요청</button>)}
            <button type="submit" className="btn-primary" disabled={!!blocker}>변경안 저장</button>
          </div>
        </div>
      </form> : <><ContraBox rx={rx} showOpinion /><div className="modal-actions">{onReport ? <button className="btn-ghost" onClick={onReport}>진행 보고</button> : <span />}<div><button className="business-action" onClick={onClose}>닫기</button></div></div></>}
      {activeDraft && activeDraft.status === "작성 중" && <section className="admin-panel"><h3>기존 승인 내용과 저장한 변경안</h3><p className="admin-note">기존: {rx?.doctorOpinion || "최초 승인"}<br />변경안: {activeDraft.prescription.doctorOpinion}<br />기존 범위: {rx?.scope.join(" · ") || "없음"}<br />변경 범위: {activeDraft.prescription.scope.join(" · ")}<br />적용일: {activeDraft.effectiveFrom}</p><label className="consent-check"><input type="checkbox" checked={approvalChecked} onChange={e => setApprovalChecked(e.target.checked)} /><span>저장한 변경 내용·적용일·참고 자료를 확인했습니다.</span></label><button className="btn-primary" disabled={!approvalChecked || !matchesDraft || !!blocker} onClick={async () => { const ok = await careRepo.approvePrescriptionDraft(activeDraft.id, activeDraft.revision, signer); if (ok) { if (mutationFailed(await careRepo.changePatient(patient.id, { place: places.includes(place.kind) ? place : { kind: places[0] ?? "자택" } }))) return; onClose(); } else setFeedback("기존 승인 내용이 바뀌었습니다. 변경안을 다시 저장하고 확인해 주세요."); }}>재활 처방 승인</button>{!matchesDraft && <p className="admin-note">현재 입력을 변경안으로 다시 저장해야 승인할 수 있습니다.</p>}</section>}
      {feedback && <p role="status" className="admin-feedback">{feedback}</p>}
      <details className="admin-patient-section"><summary>승인 이력</summary>{state.prescriptionVersions.filter(v => v.patientId === patient.id).map(v => <p key={v.id}>v{v.version} · 적용 {v.effectiveFrom} · {v.by}<br />{v.prescription.doctorOpinion}</p>)}</details>
    </div>
  </>;
  return embedded ? content : <PagePanel title={`${patient.name} · 재활 처방 승인`} wide onClose={onClose}>{content}</PagePanel>;
}
