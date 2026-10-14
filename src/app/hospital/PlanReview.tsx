"use client";
import { useState } from "react";
import { Modal } from "@/components/CareUI";
import { ExpertName } from "@/components/BusinessDetails";
import { BusinessStatus } from "@/components/BusinessTable";
import { StageSteps } from "@/components/StageSteps";
import { ACTIVITIES, measureDef } from "@/lib/measures";
import { addDays, LIMITS, programStage } from "@/lib/program";
import { careRepo, todayLocal, useCare, type Patient } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { PlacePicker } from "@/components/PlacePicker";
import { PlaceInfo } from "@/components/PlaceInfo";
import { type Place, type PlaceKind } from "@/lib/places";

const when = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * 대상자 상세 + 계획·처방 확인.
 * 담당 의사가 방문 전 평가를 보고 처방(기간·주간 횟수·치료 범위·주의사항)을 정합니다.
 * 처방이 있어야 치료사가 방문하고 회차 보고서를 쓸 수 있습니다. (의료기사법: 의사의 지도 아래에서만 업무)
 */
export function PlanReview({ patient, onClose, onReport }: { patient: Patient; onClose: () => void; onReport?: () => void }) {
  const state = useCare();
  const me = DEMO_ACCOUNTS.hospital;
  const initial = state.assessments.find(a => a.patientId === patient.id && a.period === "초기 평가");
  const rx = patient.prescription;
  const [doctor, setDoctor] = useState(rx?.doctor ?? patient.doctor ?? me.doctors[0]);
  const [start, setStart] = useState(rx?.startDate ?? patient.nextDate ?? todayLocal());
  const [perWeek, setPerWeek] = useState(rx?.perWeek ?? LIMITS.perWeek);
  const [scope, setScope] = useState<string[]>(rx?.scope ?? ["보행", "균형", "근력", "보호자 교육"]);
  const [precautions, setPrecautions] = useState(patient.precautions);
  const [places, setPlaces] = useState<PlaceKind[]>(rx?.places ?? (patient.place?.kind === "센터" ? ["자택", "센터"] : ["자택"]));
  const [place, setPlace] = useState<Place>(patient.place ?? { kind: "자택" });
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reviewing = patient.status === "승인 대기";
  const editable = patient.status === "승인 대기" || patient.status === "진행 중";
  const stage = programStage(state, patient);
  const signer = `${doctor} · ${me.organization}`;
  const toggle = (a: string) => setScope(l => l.includes(a) ? l.filter(x => x !== a) : [...l, a]);
  const confirm = () => {
    careRepo.approvePlan(patient.id, signer, precautions, { doctor, startDate: start, endDate: rx && !reviewing ? rx.endDate : addDays(start, LIMITS.periodDays - 1), perWeek, scope, places, note: rx?.note, extendedDays: rx?.extendedDays });
    // 기본 장소는 허용한 장소 안에서만 저장합니다.
    careRepo.changePatient(patient.id, { place: places.includes(place.kind) ? place : { kind: places[0] ?? "자택" } });
    onClose();
  };
  // 버튼이 막힌 이유를 바로 보여 줍니다.
  const blocker = !patient.providerId ? "담당 치료사를 먼저 배정해 주세요."
    : !initial ? `담당 치료사(${patient.provider})의 방문 전 평가가 아직 없어요. 평가가 기록되면 처방을 확인할 수 있어요.`
    : !places.length ? "허용 장소를 1개 이상 골라 주세요."
    : !scope.length ? "치료 범위를 1개 이상 골라 주세요." : null;
  const measures = (initial?.measures ?? []).map(m => `${measureDef(m.code)?.label ?? m.code} ${m.value}${measureDef(m.code)?.unit ?? ""}`).join(" · ");
  return <Modal title={`${patient.name} · ${reviewing ? "계획·처방 확인" : "연계 대상 상세"}`} wide onClose={onClose}>
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
        <div className="full"><dt>방문 전 평가</dt><dd>{initial ? <>{initial.date}{initial.by ? ` · ${initial.by}` : ""} · {measures || "표준 점수 없음"}<br />{[initial.walking && `보행: ${initial.walking}`, initial.balance && `균형: ${initial.balance}`, initial.adl && `일상: ${initial.adl}`, initial.environment && `주거환경: ${initial.environment}`].filter(Boolean).join(" / ")}</> : "담당 치료사의 평가 전 (평가가 있어야 처방을 확인할 수 있습니다)"}</dd></div>
        {patient.closure && <div className="full"><dt>종료 확인</dt><dd>{patient.closure.by} · {when(patient.closure.at)} · {patient.closure.summary}</dd></div>}
      </dl>
      {patient.approval && <p className="hospital-review-history">{patient.approval.status === "승인" ? "처방 확인" : "보완 요청"} · {patient.approval.by} · {when(patient.approval.at)}{patient.approval.reason ? ` · 사유: ${patient.approval.reason}` : ""}</p>}
      {editable ? <form className="care-form" onSubmit={e => { e.preventDefault(); confirm(); }}>
        <div className="hospital-review-heading"><h3>방문재활 처방</h3>{rx?.extendedDays ? <BusinessStatus>{`연장 ${rx.extendedDays}일`}</BusinessStatus> : null}</div>
        <div className="form-two">
          <label>담당 의사<select value={doctor} onChange={e => setDoctor(e.target.value)}>{me.doctors.map(d => <option key={d}>{d}</option>)}</select></label>
          <label>방문 시작일<input type="date" value={start} disabled={!reviewing} onChange={e => setStart(e.target.value)} /></label>
        </div>
        <div className="form-two">
          <label>주간 방문 횟수<select value={perWeek} onChange={e => setPerWeek(Number(e.target.value))}>{[1, 2].map(n => <option key={n} value={n}>주 {n}회</option>)}</select></label>
          <label>처방 기간<input readOnly value={rx && !reviewing ? `${rx.startDate} ~ ${rx.endDate}` : `${LIMITS.periodDays}일 (~${addDays(start, LIMITS.periodDays - 1)}), 30일까지 연장 가능`} /></label>
        </div>
        <fieldset className="srf-chips"><legend>허용 장소 <small>회차마다 보호자가 이 안에서 바꿀 수 있어요</small></legend>{(["자택", "센터"] as PlaceKind[]).map(k => <button type="button" key={k} className={places.includes(k) ? "on" : ""} aria-pressed={places.includes(k)} onClick={() => setPlaces(l => l.includes(k) ? l.filter(x => x !== k) : [...l, k])}>{k === "자택" ? "자택 방문" : "제휴 센터·공간"}</button>)}</fieldset>
        {places.length > 0 && <div><p className="srf-scope" style={{ margin: "4px 0 8px" }}>기본 장소</p><PlacePicker patient={patient} value={place} onChange={setPlace} allowed={places} name={`rx-place-${patient.id}`} /></div>}
        <fieldset className="srf-chips"><legend>치료 범위</legend>{ACTIVITIES.map(a => <button type="button" key={a} className={scope.includes(a) ? "on" : ""} aria-pressed={scope.includes(a)} onClick={() => toggle(a)}>{a}</button>)}</fieldset>
        <label>소견·주의사항<textarea value={precautions} rows={3} onChange={e => setPrecautions(e.target.value)} /></label>
        {rejecting && <label>보완 요청 사유<textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="치료사가 다시 평가하거나 보완할 내용을 적어 주세요." /></label>}
        {blocker && <p className="plan-blocker" role="status">{blocker}</p>}
        <div className="modal-actions">
          {onReport ? <button type="button" className="btn-ghost" onClick={onReport}>진행 보고</button> : <span />}
          <div>
            {reviewing && (rejecting
              ? <button type="button" className="btn-ghost" disabled={!reason.trim()} onClick={() => { careRepo.rejectPlan(patient.id, signer, reason.trim()); onClose(); }}>보완 요청 보내기</button>
              : <button type="button" className="btn-ghost" onClick={() => setRejecting(true)}>보완 요청</button>)}
            <button type="submit" className="btn-primary" disabled={!!blocker}>{reviewing ? (initial ? "처방 확인하고 방문 시작" : "방문 전 평가 대기 중") : "처방 변경 저장"}</button>
          </div>
        </div>
      </form> : <div className="modal-actions">{onReport ? <button className="btn-ghost" onClick={onReport}>진행 보고</button> : <span />}<div><button className="business-action" onClick={onClose}>닫기</button></div></div>}
    </div>
  </Modal>;
}
