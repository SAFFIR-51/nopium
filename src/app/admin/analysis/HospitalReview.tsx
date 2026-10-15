"use client";
import { useState } from "react";
import { careRepo, useCare } from "@/lib/repo";
import { useActor } from "@/lib/demo-session";
export function HospitalReview({ hospital, month }: { hospital: string; month: string }) {
  const state = useCare(), actor = useActor();
  const [findings, setFindings] = useState(""), [action, setAction] = useState(""), [followUp, setFollowUp] = useState(""), [message, setMessage] = useState("");
  return <section className="business-section"><h2>병원별 운영 검토·후속 조치</h2><p>{hospital} · {month} · 재연계, 보고 확인, 외래 재평가와 처방 반영 현황을 검토합니다.</p>
    <form className="care-form" onSubmit={async e => { e.preventDefault(); setMessage(await careRepo.saveHospitalReview({ hospital, month, findings, action, followUp, by: actor.name }) ? "운영 검토를 기록했습니다." : "입력 내용을 확인해 주세요."); }}>
      <label>검토 결과<textarea required value={findings} onChange={e => setFindings(e.target.value)} /></label><label>실행할 조치<textarea required value={action} onChange={e => setAction(e.target.value)} /></label><label>담당·후속 확인 일정<input required value={followUp} onChange={e => setFollowUp(e.target.value)} /></label><button className="btn-primary">검토 기록</button>{message && <p role="status">{message}</p>}
    </form>{state.hospitalReviews.filter(r => r.hospital === hospital && r.month === month).map(r => <p key={r.id}>{r.findings}<br />조치: {r.action}<br />후속: {r.followUp} · {r.by} · {r.at}</p>)}
  </section>;
}
