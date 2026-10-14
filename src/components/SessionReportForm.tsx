"use client";
import { useState } from "react";
import { Badge, Modal, savedTimeLabel } from "@/components/CareUI";
import { Icon } from "@/components/Icon";
import { ACTIVITIES, ATTENDANCE, SESSION_MEASURES as MEASURES, measureValue } from "@/lib/measures";
import { scheduleProblem } from "@/lib/program";
import { PlacePicker } from "./PlacePicker";
import { upcomingPlace, type Place } from "@/lib/places";
import { careRepo, todayLocal, useCare, type CareRecord, type Patient, type ProviderRef } from "@/lib/repo";
import "./session-report.css";

/**
 * 회차 보고서 작성 (선생님이 매 회차 작성).
 * 쌓인 보고서가 보호자 화면의 변화 추이, 월간 보고서, 기관 공유 자료가 됩니다.
 * - 측정값은 항목 코드·값·단위로 저장하고, 비워 두면 "미측정"으로 0과 구분합니다. (기획서 4장)
 * - 이상 반응은 내용과 조치를 함께 남깁니다. (기획서 3장)
 * - 확정 후에는 수정하지 않고 정정 이력으로만 바꿉니다.
 */
/** correcting을 넘기면 확정된 보고서 정정 모드: 같은 항목을 고치고 정정 사유를 남기며, 이전 내용은 이력으로 보존됩니다. */
export function SessionReportForm({ patient, onClose, author, defaultDate, correcting }: { patient: Patient; onClose: () => void; author?: ProviderRef; defaultDate?: string; correcting?: CareRecord }) {
  const state = useCare();
  const draft = correcting ?? state.records.find(r => r.patientId === patient.id && !r.confirmed);
  const last = state.records.filter(r => r.patientId === patient.id && r.confirmed && r.id !== correcting?.id && (!correcting || r.date < correcting.date)).sort((a, b) => b.date.localeCompare(a.date))[0];
  const [recordId, setRecordId] = useState<string | undefined>(draft?.id);
  const [savedAt, setSavedAt] = useState<string | undefined>(draft?.updatedAt);
  const [date, setDate] = useState(draft?.date ?? defaultDate ?? todayLocal());
  const [attendance, setAttendance] = useState<NonNullable<CareRecord["attendance"]>>(draft?.attendance ?? "참여");
  const [absenceReason, setAbsenceReason] = useState(draft?.absenceReason ?? "");
  const [duration, setDuration] = useState(draft?.durationMin ? String(draft.durationMin) : "60");
  const [activities, setActivities] = useState<string[]>(draft?.activities ?? []);
  const [content, setContent] = useState(draft?.content ?? "");
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(MEASURES.map(m => { const v = draft ? measureValue(draft, m.code) : null; return [m.code, v === null ? "" : String(v)]; })));
  const [notes, setNotes] = useState<Record<string, string>>(() => Object.fromEntries(MEASURES.map(m => [m.code, draft?.measures?.find(x => x.code === m.code)?.note ?? ""])));
  const [adverse, setAdverse] = useState(draft?.adverse?.occurred ?? false);
  const [adverseDetail, setAdverseDetail] = useState(draft?.adverse?.detail ?? "");
  const [adverseAction, setAdverseAction] = useState(draft?.adverse?.action ?? "");
  const [education, setEducation] = useState(draft?.education ?? "");
  const [next, setNext] = useState(draft?.next ?? "");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState(patient.nextTime);
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [shortReason, setShortReason] = useState("");
  const [place, setPlace] = useState<Place>(draft?.place ?? upcomingPlace(patient));

  const absent = attendance === "미참여";
  const scope = patient.prescription?.scope;
  const outOfScope = scope ? activities.filter(a => !scope.includes(a)) : [];
  const durationNum = Number(duration) || 0;
  const badValue = MEASURES.some(m => { const v = values[m.code]; if (v === "") return false; const n = Number(v); return !Number.isFinite(n) || n < 0 || (m.max !== undefined && n > m.max); });
  const errors = [
    absent && !absenceReason.trim() && "미참여 사유를 적어 주세요.",
    !absent && !content.trim() && "진행 내용을 적어 주세요.",
    !absent && badValue && "측정값을 확인해 주세요. (0 이상, 통증은 10 이하)",
    adverse && (!adverseDetail.trim() || !adverseAction.trim()) && "이상 반응 내용과 조치를 적어 주세요.",
    !next.trim() && "다음 계획을 적어 주세요.",
    !correcting && (!nextDate || !nextTime) && "다음 일정을 정해 주세요.",
    !correcting && nextDate && nextDate <= date && "다음 일정은 진행일 이후여야 해요.",
    correcting && !reason.trim() && "정정 사유를 적어 주세요.",
    !absent && outOfScope.length > 0 && `처방 범위 밖 활동이에요: ${outOfScope.join(", ")} (담당 의사에게 범위 변경을 요청해 주세요)`,
    !correcting && !absent && durationNum > 0 && durationNum < 60 && !shortReason.trim() && "60분보다 짧으면 사유를 적어 주세요.",
    patient.prescription && date < patient.prescription.startDate && `처방 시작일(${patient.prescription.startDate.slice(5).replace("-", ".")}) 전에는 방문할 수 없어요.`,
    !correcting && nextDate && scheduleProblem(patient, state.records, nextDate, date),
    !checked && "주의사항과 수행 반응 확인에 체크해 주세요.",
  ].filter(Boolean) as string[];

  const input = () => ({
    id: recordId, date, attendance, place, absenceReason: absent ? absenceReason.trim() : undefined,
    durationMin: absent ? 0 : Number(duration) || undefined,
    activities: absent ? [] : activities,
    content: absent ? `미참여 · ${absenceReason.trim()}` : `${content.trim()}${shortReason.trim() && durationNum < 60 ? `\n(짧게 진행한 사유: ${shortReason.trim()})` : ""}`,
    measures: absent ? [] : MEASURES.map(m => ({ code: m.code, value: values[m.code] === "" ? null : Number(values[m.code]), note: notes[m.code].trim() || undefined })),
    adverse: { occurred: adverse, detail: adverse ? adverseDetail.trim() : undefined, action: adverse ? adverseAction.trim() : undefined },
    education: education.trim() || undefined,
    next: next.trim(), walk: "", pain: "", nextDate, nextTime,
  });
  const save = (confirm: boolean) => {
    if (confirm && errors.length) { setTried(true); return; }
    if (correcting) {
      if (!author) return;
      const { id: _id, nextDate: _d, nextTime: _t, ...fields } = input();
      void _id; void _d; void _t;
      careRepo.correctRecord(correcting.id, fields, reason.trim(), author);
      onClose();
      return;
    }
    const id = careRepo.saveRecord(patient.id, input(), { confirm, author });
    setRecordId(id); setSavedAt(new Date().toISOString());
    if (confirm) onClose();
  };
  const toggle = (a: string) => setActivities(list => list.includes(a) ? list.filter(x => x !== a) : [...list, a]);

  return <Modal title={`${patient.name} 님 ${draft?.sessionNo ?? patient.completed + 1}회차 보고서${correcting ? " 정정" : ""}`} onClose={onClose} wide>
    {correcting && <p className="srf-correct-note"><Icon name="shield" size={15} />확정된 보고서는 덮어쓰지 않아요. 바뀐 항목과 정정 사유·작성자·시각이 이력으로 남고, 보호자·기관 화면에 &quot;정정됨&quot;으로 표시돼요.</p>}
    <div className="record-context"><Badge>{patient.status}</Badge><b>{patient.condition}</b><p><Icon name="shield" size={16} />{patient.precautions}</p></div>
    <form className="care-form srf" onSubmit={e => { e.preventDefault(); save(true); }}>
      <div className="srf-row">
        <label>진행일<input type="date" value={date} max={todayLocal()} onChange={e => setDate(e.target.value)} /></label>
        <fieldset className="srf-seg"><legend>참여 상태</legend>{ATTENDANCE.map(a => <label key={a} className={attendance === a ? "on" : ""}><input type="radio" name="att" checked={attendance === a} onChange={() => setAttendance(a)} />{a}</label>)}</fieldset>
        {!absent && <label>진행 시간<span className="srf-unit"><input type="number" min="0" max="240" value={duration} onChange={e => setDuration(e.target.value)} /><em>분</em></span></label>}
      </div>
      <div><p className="srf-scope" style={{ margin: "0 0 8px" }}>진행 장소</p><PlacePicker patient={patient} value={place} onChange={setPlace} allowed={patient.prescription?.places} name={`srf-place-${patient.id}`} /></div>
      {!absent && !correcting && durationNum > 0 && durationNum < 60 && <label>60분보다 짧은 사유<input value={shortReason} onChange={e => setShortReason(e.target.value)} placeholder="예: 피로감으로 보호자와 상의해 조기 종료" /></label>}
      {absent ? <label>미참여 사유<input value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} placeholder="예: 컨디션 저하로 보호자 요청에 따라 쉼" /></label> : <>
        <fieldset className="srf-chips"><legend>진행한 활동</legend>{ACTIVITIES.map(a => { const off = !!scope && !scope.includes(a); return <button type="button" key={a} aria-pressed={activities.includes(a)} className={`${activities.includes(a) ? "on" : ""} ${off ? "off-scope" : ""}`} title={off ? "처방 범위 밖" : undefined} onClick={() => toggle(a)}>{a}{off && <small> · 범위 밖</small>}</button>; })}</fieldset>
        {scope && <p className="srf-scope">처방 범위: {scope.join(" · ")} · {patient.doctor ?? patient.prescription?.doctor}</p>}
        <label>진행 내용과 수행 반응<textarea rows={3} value={content} onChange={e => setContent(e.target.value)} placeholder="실제 진행한 활동과 대상자의 반응을 적어 주세요." /></label>
        <fieldset className="srf-measures"><legend>측정값 <small>측정하지 않은 항목은 비워 두세요 (미측정은 0과 구분돼요)</small></legend>
          <table><thead><tr><th>항목</th><th>값</th><th>지난 회차</th><th>메모</th></tr></thead><tbody>
            {MEASURES.map(m => { const prev = last ? measureValue(last, m.code) : null; return <tr key={m.code}>
              <td><b>{m.label}</b><small>{m.method}</small></td>
              <td><span className="srf-unit"><input type="number" inputMode="decimal" step="0.1" min="0" max={m.max} value={values[m.code]} onChange={e => setValues(v => ({ ...v, [m.code]: e.target.value }))} placeholder="미측정" aria-label={`${m.label} (${m.unit})`} /><em>{m.unit}</em></span></td>
              <td className="srf-prev">{prev === null ? "–" : `${prev}${m.unit}`}</td>
              <td><input value={notes[m.code]} onChange={e => setNotes(n => ({ ...n, [m.code]: e.target.value }))} placeholder="보조 여부 등" aria-label={`${m.label} 메모`} /></td>
            </tr>; })}
          </tbody></table>
        </fieldset>
      </>}
      <fieldset className="srf-seg"><legend>이상 반응·안전 사건</legend>{[false, true].map(v => <label key={String(v)} className={adverse === v ? "on" : ""}><input type="radio" name="adv" checked={adverse === v} onChange={() => setAdverse(v)} />{v ? "있음" : "없음"}</label>)}</fieldset>
      {adverse && <div className="form-two"><label>내용<textarea rows={2} value={adverseDetail} onChange={e => setAdverseDetail(e.target.value)} placeholder="언제, 어떤 반응이 있었는지" /></label><label>조치<textarea rows={2} value={adverseAction} onChange={e => setAdverseAction(e.target.value)} placeholder="중단·휴식·연락 등 취한 조치" /></label></div>}
      {!absent && <label>보호자 교육 <span className="srf-opt">(선택)</span><input value={education} onChange={e => setEducation(e.target.value)} placeholder="예: 문턱 넘을 때 보호자 위치 안내" /></label>}
      <label>다음 계획<textarea rows={2} value={next} onChange={e => setNext(e.target.value)} placeholder="다음 회차에서 확인할 내용" /></label>
      {!correcting && <div className="form-two"><label>다음 일정<input type="date" value={nextDate} min={date} onChange={e => setNextDate(e.target.value)} /></label><label>시간<select value={nextTime} onChange={e => setNextTime(e.target.value)}>{["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(t => <option key={t}>{t}</option>)}</select></label></div>}
      {correcting && <label>정정 사유<input value={reason} onChange={e => setReason(e.target.value)} placeholder="예: 보행 거리 측정값 입력 오류" /></label>}
      <label className="consent-check"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>대상자의 주의사항과 수행 반응을 확인했습니다.</span></label>
      {tried && errors.length > 0 && <ul className="srf-errors" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
      {correcting ? <div className="modal-actions"><span className="muted">정정 이력 {correcting.revisions?.length ?? 0}건</span><div><button className="btn-ghost" type="button" onClick={onClose}>취소</button><button className="btn-primary" type="submit">정정 저장</button></div></div>
        : <div className="modal-actions"><span className="muted">{savedAt ? `임시 저장됨 · 마지막 저장 ${savedTimeLabel(savedAt)}` : "확정하면 보호자 화면과 월간 보고서에 반영돼요."}</span><div><button className="btn-ghost" type="button" onClick={() => save(false)}>임시 저장</button><button className="btn-primary" type="submit">보고서 확정</button></div></div>}
    </form>
  </Modal>;
}
