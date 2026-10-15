"use client";
import { useToday } from "@/lib/use-today";
import { useState } from "react";
import { careRepo, useCare, type Patient } from "@/lib/repo";
import { useActor } from "@/lib/demo-session";

export function SatisfactionForm({ patient }: { patient: Patient }) {
  const state = useCare(), actor = useActor();
  const today = useToday();
  const [selectedMonth, setMonth] = useState("");
  const month = selectedMonth || today?.slice(0, 7) || "";
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  return <section className="care-panel"><h3>월별 서비스 만족도</h3><p>환자·보호자가 응답한 만족도를 5점 척도로 기록합니다.</p>
    <form className="care-form" onSubmit={async e => { e.preventDefault(); const ok = await careRepo.saveSatisfaction({ patientId: patient.id, providerId: patient.providerId || "", month, score: Number(score), maxScore: 5, note, by: actor.name }); setMessage(ok ? "만족도 응답을 기록했습니다." : "담당 치료사와 응답 내용을 확인해 주세요."); }}>
      <label>대상 월<input type="month" required value={month} onChange={e => setMonth(e.target.value)} /></label>
      <label>만족도<select required value={score} onChange={e => setScore(e.target.value)}><option value="">선택</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} / 5점</option>)}</select></label>
      <label>의견<textarea required value={note} onChange={e => setNote(e.target.value)} /></label>
      <button className="btn-primary" disabled={!patient.providerId}>응답 기록</button>{message && <p role="status">{message}</p>}
    </form>
    {state.satisfactions.filter(s => s.patientId === patient.id).map(s => <p key={s.id}>{s.month} · {s.score}/{s.maxScore}점 · {s.note} · {s.by}</p>)}
  </section>;
}
