"use client";
import { mutationFailed } from "@/lib/repo";
import { useState } from "react";
import { PagePanel } from "./CareUI";
import { Icon } from "./Icon";
import { MEASURES } from "@/lib/measures";
import { protocolById } from "@/lib/protocols";
import { HOME_RISKS, MMT_GRADES, MMT_MUSCLES, ROM_JOINTS, SIDES, fallRisk, mmtMuscle, romJoint, sortedAssessments, type Side } from "@/lib/assessment";
import { careRepo, todayLocal, useCare, type Patient } from "@/lib/repo";
import "./assessment.css";

type Period = "초기 평가" | "중간 평가" | "사후 평가";
const key = (code: string, side: Side) => `${code}|${side}`;
const unique = (list: string[]) => [...new Set(list)];

/**
 * 방문 전(초기)·중간·종료(사후) 평가.
 * 표준 점수 + 관절 가동범위(좌우 각도) + 근력(MMT 0~5등급) + 주거 환경 체크를 구조화해 저장합니다.
 * 진료과 프로토콜이 있으면 핵심 지표와 기본 관절·근육을 먼저 보여 줍니다.
 */
export function AssessmentForm({ patient, onClose, period: fixed, by }: { patient: Patient; onClose: () => void; period?: Period; by?: string }) {
  const state = useCare();
  const protocol = protocolById(patient.prescription?.protocolId);
  const previous = sortedAssessments(state.assessments.filter(a => a.patientId === patient.id)).pop();
  const focus = new Set<string>(protocol?.focusMeasures ?? []);
  const [period, setPeriod] = useState<Period>(fixed ?? "중간 평가");
  const [scores, setScores] = useState<Record<string, string>>({});
  // 기본으로 펼칠 관절·근육: 프로토콜 기본값 + 지난 평가에서 잰 항목
  const [joints, setJoints] = useState<string[]>(() => unique([...(protocol?.romJoints ?? []), ...(previous?.romItems ?? []).map(i => i.code)]));
  const [muscles, setMuscles] = useState<string[]>(() => unique([...(protocol?.mmtMuscles ?? []), ...(previous?.mmtItems ?? []).map(i => i.code)]));
  const [rom, setRom] = useState<Record<string, string>>({});
  const [mmt, setMmt] = useState<Record<string, string>>({});
  const [risks, setRisks] = useState<string[]>(previous?.homeRisks ?? []);
  const [notes, setNotes] = useState({ walking: "", balance: "", adl: "", environment: "" });
  const [tried, setTried] = useState(false);

  const orderedMeasures = [...MEASURES.filter(m => focus.has(m.code)), ...MEASURES.filter(m => !focus.has(m.code))];
  const num = (v: string) => (v === "" ? null : Number(v));
  const measures = MEASURES.map(m => ({ code: m.code, value: num(scores[m.code] ?? "") })).filter(m => m.value !== null);
  const risk = fallRisk(measures);
  const prevMeasure = (code: string) => previous?.measures?.find(m => m.code === code)?.value ?? null;
  const prevRom = (code: string, side: Side) => previous?.romItems?.find(i => i.code === code && i.side === side)?.deg ?? null;
  const prevMmt = (code: string, side: Side) => previous?.mmtItems?.find(i => i.code === code && i.side === side)?.grade ?? null;
  const focusDone = [...focus].filter(c => (scores[c] ?? "") !== "").length;

  const badScore = MEASURES.some(m => { const v = scores[m.code] ?? ""; if (v === "") return false; const n = Number(v); return !Number.isFinite(n) || n < 0 || (m.max !== undefined && n > m.max); });
  const badRom = Object.values(rom).some(v => v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 200));
  const romItems = joints.flatMap(code => SIDES.map(side => ({ code, side, deg: num(rom[key(code, side)] ?? "") }))).filter(i => i.deg !== null);
  const mmtItems = muscles.flatMap(code => SIDES.map(side => ({ code, side, grade: num(mmt[key(code, side)] ?? "") }))).filter(i => i.grade !== null);
  const empty = !measures.length && !romItems.length && !mmtItems.length;
  const errors = [
    badScore && "표준 점수를 확인해 주세요. (0 이상, 최대 점수 이하)",
    badRom && "관절 각도는 0~200° 사이로 적어 주세요.",
    empty && "표준 점수·관절 가동범위·근력 중 하나 이상 적어 주세요.",
  ].filter(Boolean) as string[];

  const save = async () => {
    if (errors.length) { setTried(true); return; }
    if (mutationFailed(await careRepo.addAssessment({
      patientId: patient.id, period, date: todayLocal(), by,
      measures, romItems, mmtItems, homeRisks: risks,
      walking: notes.walking.trim(), balance: notes.balance.trim(), adl: notes.adl.trim(), environment: notes.environment.trim(),
      rom: "", strength: "",
    }))) return;
    onClose();
  };
  const addable = <T extends { code: string; label: string }>(all: T[], chosen: string[]) => all.filter(x => !chosen.includes(x.code));

  return <PagePanel title={`${patient.name} 님 ${period === "초기 평가" ? "방문 전 평가" : period === "사후 평가" ? "종료 평가" : "중간 평가"}`} onClose={onClose} wide>
    <p className="modal-lead">{period === "초기 평가" ? "신체 기능과 주거 환경을 평가해요. 담당 의사가 이 평가를 보고 방문 계획을 확인해요." : period === "사후 평가" ? "방문 전과 같은 항목을 다시 재서 비교해요. 저장하면 병원이 종료를 확인할 수 있어요." : "진행 중 기능을 점검해요. 지난 평가와 같은 항목을 재면 변화가 바로 비교돼요."}</p>
    <form className="care-form asf" onSubmit={e => { e.preventDefault(); save(); }}>
      {!fixed && <label>평가 시점<select value={period} onChange={e => setPeriod(e.target.value as Period)}>{(["초기 평가", "중간 평가", "사후 평가"] as Period[]).map(t => <option key={t}>{t}</option>)}</select></label>}
      {protocol && <p className="asf-protocol"><Icon name="file" size={14} />{protocol.dept} · {protocol.label} 프로토콜 · 핵심 지표 <b>{focusDone}/{focus.size}</b> 입력</p>}

      <fieldset className="srf-measures"><legend>표준 점수 <small>측정하지 않은 항목은 비워 두세요 · ★ 프로토콜 핵심 지표</small></legend>
        <table><thead><tr><th>항목</th><th>값</th><th>지난 평가</th></tr></thead><tbody>
          {orderedMeasures.map(m => { const p = prevMeasure(m.code); return <tr key={m.code} className={focus.has(m.code) ? "asf-focus" : undefined}>
            <td><b>{focus.has(m.code) && <span className="asf-star" aria-label="핵심 지표">★ </span>}{m.label}</b><small>{m.method}</small></td>
            <td><span className="srf-unit"><input type="number" inputMode="decimal" step="0.1" min="0" max={m.max} value={scores[m.code] ?? ""} onChange={e => setScores(v => ({ ...v, [m.code]: e.target.value }))} placeholder="미측정" aria-label={`${m.label} (${m.unit})`} /><em>{m.unit}</em></span></td>
            <td className="srf-prev">{p === null ? "–" : `${p}${m.unit}`}</td>
          </tr>; })}
        </tbody></table>
      </fieldset>
      <p className={`asf-risk ${risk.level === "높음" ? "high" : ""}`}>낙상 위험 참고: <b>{risk.level}</b>{risk.reasons.length ? ` · ${risk.reasons.join(", ")}` : ""} <small>(BBS 45점 이하 또는 TUG 13.5초 이상이면 &quot;높음&quot;으로 표시해요. 참고용이에요.)</small></p>

      <fieldset className="srf-measures"><legend>관절 가동범위 <small>좌우 각도(°) · 비우면 미측정</small></legend>
        {joints.length > 0 && <table className="asf-grid"><thead><tr><th>관절</th><th>좌</th><th>우</th><th>정상 참고</th></tr></thead><tbody>
          {joints.map(code => { const j = romJoint(code); if (!j) return null; return <tr key={code}>
            <td><b>{j.label}</b>{j.hint && <small>{j.hint}</small>}<button type="button" className="asf-remove" onClick={() => setJoints(l => l.filter(x => x !== code))} aria-label={`${j.label} 빼기`}>빼기</button></td>
            {SIDES.map(side => { const p = prevRom(code, side); return <td key={side}><span className="srf-unit"><input type="number" inputMode="decimal" min="0" max="200" value={rom[key(code, side)] ?? ""} onChange={e => setRom(v => ({ ...v, [key(code, side)]: e.target.value }))} placeholder="–" aria-label={`${side} ${j.label} 각도`} /><em>°</em></span>{p !== null && <small className="asf-prev">지난 {p}°</small>}</td>; })}
            <td className="srf-prev">{j.normal}°</td>
          </tr>; })}
        </tbody></table>}
        {addable(ROM_JOINTS, joints).length > 0 && <select className="asf-add" value="" onChange={e => e.target.value && setJoints(l => [...l, e.target.value])} aria-label="관절 추가"><option value="">+ 관절 추가</option>{addable(ROM_JOINTS, joints).map(j => <option key={j.code} value={j.code}>{j.label}</option>)}</select>}
      </fieldset>

      <fieldset className="srf-measures"><legend>근력 (도수근력검사) <small>0~5등급 · 비우면 미측정</small></legend>
        {muscles.length > 0 && <table className="asf-grid"><thead><tr><th>근력</th><th>좌</th><th>우</th></tr></thead><tbody>
          {muscles.map(code => { const mm = mmtMuscle(code); if (!mm) return null; return <tr key={code}>
            <td><b>{mm.label}</b><button type="button" className="asf-remove" onClick={() => setMuscles(l => l.filter(x => x !== code))} aria-label={`${mm.label} 빼기`}>빼기</button></td>
            {SIDES.map(side => { const p = prevMmt(code, side); return <td key={side}><select value={mmt[key(code, side)] ?? ""} onChange={e => setMmt(v => ({ ...v, [key(code, side)]: e.target.value }))} aria-label={`${side} ${mm.label} 등급`}><option value="">미측정</option>{MMT_GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select>{p !== null && <small className="asf-prev">지난 {p}등급</small>}</td>; })}
          </tr>; })}
        </tbody></table>}
        {addable(MMT_MUSCLES, muscles).length > 0 && <select className="asf-add" value="" onChange={e => e.target.value && setMuscles(l => [...l, e.target.value])} aria-label="근력 항목 추가"><option value="">+ 근력 항목 추가</option>{addable(MMT_MUSCLES, muscles).map(m => <option key={m.code} value={m.code}>{m.label}</option>)}</select>}
      </fieldset>

      <fieldset className="srf-chips"><legend>주거 환경 위험 요소 <small>해당하는 것을 모두 골라 주세요</small></legend>
        {HOME_RISKS.map(r => <button type="button" key={r} className={risks.includes(r) ? "on" : ""} aria-pressed={risks.includes(r)} onClick={() => setRisks(l => l.includes(r) ? l.filter(x => x !== r) : [...l, r])}>{r}</button>)}
      </fieldset>

      <div className="form-two">
        <label>보행 관찰 <span className="srf-opt">(선택)</span><textarea rows={2} value={notes.walking} onChange={e => setNotes(v => ({ ...v, walking: e.target.value }))} placeholder="보조기구·보호자 동행 여부" /></label>
        <label>균형 관찰 <span className="srf-opt">(선택)</span><textarea rows={2} value={notes.balance} onChange={e => setNotes(v => ({ ...v, balance: e.target.value }))} placeholder="방향 전환·지지 여부" /></label>
        <label>일상생활 동작 <span className="srf-opt">(선택)</span><textarea rows={2} value={notes.adl} onChange={e => setNotes(v => ({ ...v, adl: e.target.value }))} placeholder="도움이 필요한 동작" /></label>
        <label>주거 환경 메모 <span className="srf-opt">(선택)</span><textarea rows={2} value={notes.environment} onChange={e => setNotes(v => ({ ...v, environment: e.target.value }))} placeholder="예: 거실-화장실 문턱 3cm" /></label>
      </div>
      {tried && errors.length > 0 && <ul className="srf-errors" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
      <button type="submit" className="btn-primary wide">{period === "초기 평가" ? "평가 저장하고 의사 확인 요청" : period === "사후 평가" ? "종료 평가 저장" : "평가 저장"}</button>
    </form>
  </PagePanel>;
}
