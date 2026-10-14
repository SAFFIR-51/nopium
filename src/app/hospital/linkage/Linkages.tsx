"use client";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { careRepo } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { LINK_TARGETS } from "../HospitalReviews";
import { HospitalHeading } from "../HospitalShell";
import { useHospitalCare } from "../use-hospital-care";

/** 지역사회 연계: 사회복지사가 보건소·통합돌봄 창구 등에 의뢰하고 결과를 확인합니다. (시범사업 지역사회연계 단계) */
export function Linkages() {
  const { state, patients } = useHospitalCare();
  const me = DEMO_ACCOUNTS.hospital;
  const ids = new Set(patients.map(p => p.id));
  const links = state.linkages.filter(l => ids.has(l.patientId));
  const patient = (id: string) => patients.find(p => p.id === id);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [to, setTo] = useState(LINK_TARGETS[0]);
  const [reason, setReason] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  return <div className="hospital-registry">
    <HospitalHeading title="지역사회 연계" subtitle={`방문재활 이후에도 돌봄이 필요한 대상을 보건소·통합돌봄 창구로 연계하고 결과를 확인합니다. 담당 ${me.socialWorker}`} />
    <div className="business-summary">
      <div><small>전체 연계</small><b>{links.length}<span>건</span></b></div>
      <div><small>결과 대기</small><b>{links.filter(l => l.status === "의뢰").length}<span>건</span></b></div>
      <div><small>연계 완료</small><b>{links.filter(l => l.status === "연계 완료").length}<span>건</span></b></div>
      <div><small>종료 대상</small><b>{patients.filter(p => p.status === "종료").length}<span>명</span></b></div>
    </div>
    <section className="business-section"><div className="business-section-head"><h2>연계 의뢰서 작성</h2><span>{me.organization}</span></div>
      <form className="care-form" onSubmit={e => { e.preventDefault(); if (!reason.trim()) return; careRepo.addLinkage({ patientId, to, reason: reason.trim(), by: me.socialWorker }); setReason(""); }}>
        <div className="form-two"><label>대상자<select value={patientId} onChange={e => setPatientId(e.target.value)}>{patients.map(p => <option key={p.id} value={p.id}>{p.name} · {p.condition}</option>)}</select></label>
          <label>연계 기관<select value={to} onChange={e => setTo(e.target.value)}>{LINK_TARGETS.map(t => <option key={t}>{t}</option>)}</select></label></div>
        <label>의뢰 내용<input value={reason} onChange={e => setReason(e.target.value)} placeholder="예: 주 1회 방문건강관리, 욕실 손잡이 설치 지원" /></label>
        <div className="modal-actions"><span className="muted">의뢰 후 기관의 회신 결과를 아래 목록에 기록합니다.</span><div><button className="btn-primary" disabled={!reason.trim() || !patientId}>의뢰서 보내기</button></div></div>
      </form>
    </section>
    <section className="business-section"><div className="business-section-head"><h2>연계 현황</h2><span>{links.length}건</span></div>
      <BusinessTable caption="지역사회 연계 현황" columns={["대상자", "연계 기관", "의뢰 내용", "의뢰일", "상태", "결과"]} empty={!links.length ? "연계 의뢰가 없습니다." : undefined}>
        {links.map(l => { const p = patient(l.patientId); return <tr key={l.id}>
          <td>{p?.name}<small>{p?.condition}</small></td><td className="business-nowrap">{l.to}</td><td className="business-wrap">{l.reason}</td><td className="business-nowrap">{l.at.slice(0, 10)}<small>{l.by.split(" ")[0]}</small></td>
          <td><BusinessStatus>{l.status}</BusinessStatus></td>
          <td>{l.status === "연계 완료" ? <span className="business-wrap">{l.result}</span> : <div className="business-actions"><input className="business-input" value={results[l.id] ?? ""} onChange={e => setResults(r => ({ ...r, [l.id]: e.target.value }))} placeholder="회신 결과" aria-label={`${p?.name} 연계 결과`} /><button className="business-action primary" disabled={!results[l.id]?.trim()} onClick={() => careRepo.completeLinkage(l.id, results[l.id].trim())}>완료</button></div>}</td>
        </tr>; })}
      </BusinessTable>
    </section>
  </div>;
}
