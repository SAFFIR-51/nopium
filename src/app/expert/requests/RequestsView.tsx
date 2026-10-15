"use client";
import { Modal } from "@/components/CareUI";
import { mutationFailed } from "@/lib/repo";
import { useState } from "react";
import { areaMatches } from "@/lib/assignment";
import { careRepo } from "@/lib/repo";
import { ExpertSubHeader } from "../ExpertShell";
import { useProviderCare } from "../use-provider-care";

const reasons = ["희망 일정에 진행할 수 없어요", "활동 지역 밖이에요", "제공 범위(프로그램 유형)와 맞지 않아요", "기타"];
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

/** NPIUM 매칭 제안을 수락·거절하고, 최종 확정 후 담당 대상에 연결합니다. */
export function RequestsView() {
  const data = useProviderCare();
  const [declining, setDeclining] = useState<(NonNullable<ReturnType<typeof useProviderCare>>["requests"])[number] | null>(null);
  const [reason, setReason] = useState(reasons[0]);
  const [detail, setDetail] = useState("");
  if (!data) return null;
  const patientName = (id: string) => data.state.patients.find(p => p.id === id)?.name ?? "삭제된 대상";
  const decline = async () => {
    if (!declining) return;
    if (mutationFailed(await careRepo.declineAssignment(declining.id, data.ref, reason === "기타" ? detail.trim() || "기타" : reason))) return;
    setDeclining(null); setDetail(""); setReason(reasons[0]);
  };


  return <div className="sg sg-work my-home my-sub-view">
    <ExpertSubHeader title="배정 요청" subtitle="제공 범위와 일정을 확인하고 수락하거나, 사유를 남기고 거절해 주세요." />

    <h2 className="sg-title" style={{ marginTop: 0 }}>새 요청 <span>{data.requests.length}</span></h2>
    {data.requests.length ? data.requests.map(p => {
      const areaOk = areaMatches(data.provider.area, p.area);
      const methodOk = data.provider.visit.some(v => v === p.method);
      return <section className="sg-card" key={p.id}>
        <div className="sg-row static"><span>
          <small className="sg-state on">{p.hospital} · NPIUM 매칭 제안</small>
          <b>{p.name} 님 <small style={{ display: "inline" }}>{p.age}세 · {p.sex}</small></b>
          <small>{p.condition}</small>
        </span></div>
        <div className="sg-divider" />
        <dl className="sg-facts">
          <div><dt>목표</dt><dd>{p.goal}</dd></div>
          <div><dt>지역</dt><dd>{p.area}{!areaOk && <span className="sg-adverse"> · 활동 지역 확인 필요</span>}</dd></div>
          <div><dt>방식·희망</dt><dd>{p.method}{!methodOk && <span className="sg-adverse"> · 제공 방식 확인 필요</span>} · {p.nextDate.slice(5).replace("-", ".")} {p.nextTime}</dd></div>
          <div><dt>주의</dt><dd>{p.precautions}</dd></div>
        </dl>
        <div className="sg-actions"><button onClick={() => setDeclining(p)}>거절</button><button className="primary" onClick={async () => await careRepo.acceptAssignment(p.id, data.ref)}>수락</button></div>
      </section>;
    }) : <section className="sg-card sg-empty">모든 요청을 확인했어요. 수락 후 NPIUM이 최종 매칭을 확정하면 담당 대상에 연결됩니다.</section>}

    <h2 className="sg-title">처리한 요청</h2>
    <p className="sg-sub">수락·거절 이력은 NPIUM이 확인합니다. 수락과 최종 매칭 확정은 별도로 기록됩니다.</p>
    {data.handled.length ? <section className="sg-card sg-list">{data.handled.map(a => <div className="sg-list-static" key={a.id}>
      <span style={{ flex: 1, minWidth: 0 }}><b>{patientName(a.patientId)} 님</b><small>{when(a.respondedAt)}{a.reason ? ` · 사유: ${a.reason}` : ""}</small></span>
      <em className={`sg-badge ${a.status === "거절" ? "off" : ""}`}>{a.status}</em>
    </div>)}</section> : <section className="sg-card sg-empty">처리한 요청이 없어요.</section>}



    {declining && <Modal title={`${declining.name} 님 요청 거절`} onClose={() => setDeclining(null)}>
      <p className="modal-lead">거절 사유는 NPIUM이 매칭을 조정할 때 참고합니다.</p>
      <form className="care-form" onSubmit={e => { e.preventDefault(); decline(); }}>
        <fieldset className="decline-reasons"><legend className="sr">거절 사유</legend>
          {reasons.map(r => <label key={r}><input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />{r}</label>)}
        </fieldset>
        {reason === "기타" && <label>상세 사유<textarea rows={2} required value={detail} onChange={e => setDetail(e.target.value)} placeholder="병원이 확인할 수 있게 적어 주세요." /></label>}
        <div className="modal-actions"><span className="muted">거절 후에는 이 요청이 목록에서 사라집니다.</span><div><button type="button" className="btn-ghost" onClick={() => setDeclining(null)}>취소</button><button type="submit" className="btn-primary">거절하기</button></div></div>
      </form>
    </Modal>}
</div>;
}
