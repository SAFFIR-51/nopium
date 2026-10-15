"use client";
import { Modal } from "@/components/CareUI";
import { usePageValue } from "@/lib/page-view";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { matchingStatus } from "@/lib/assignment";
import { ALL, adminPatients, currentAssignment } from "@/lib/admin-data";
import { careRepo } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { AdminHeading } from "../AdminShell";
import { AdminPatientDetail } from "../AdminPatientDetail";
import { MatchProposal } from "../MatchProposal";
import { AdminStats } from "../AdminControls";
import { useAdminCare } from "../use-admin-care";

export function Assignments({ initialPatientId = "" }: { initialPatientId?: string }) {
  const { state } = useAdminCare();
  const [tab, setTab] = useState("전체");
  const [query, setQuery] = useState("");
  const [hospital, setHospital] = useState(ALL);
  const [selected, setSelected] = usePageValue("patient", initialPatientId);
  const [assignId, setAssignId] = usePageValue("match");
  const [operation, setOperation] = useState<{ patientId: string; assignmentId: string; kind: "확정" | "취소" } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const base = adminPatients(state, { hospital, provider: ALL });
  const statuses = ["전체", "미배정", "치료사 응답 대기", "NPIUM 확인 대기", "재배정 필요", "매칭 확정", "기존 배정 확인 필요"];
  const rows = base.filter(p => (tab === "전체" || matchingStatus(state, p.id) === tab) && `${p.name} ${p.hospital} ${p.provider}`.includes(query.trim()));
  const assigning = state.patients.find(p => p.id === assignId);
  const target = operation && state.patients.find(p => p.id === operation.patientId);
  const action = operation && state.assignments.find(a => a.id === operation.assignmentId);
  const run = async () => {
    if (!operation) return;
    const ok = operation.kind === "확정" ? await careRepo.finalizeAssignment(operation.patientId, operation.assignmentId, DEMO_ACCOUNTS.admin.name) : await careRepo.cancelAssignment(operation.patientId, operation.assignmentId, DEMO_ACCOUNTS.admin.name, reason);
    if (!ok) { setError("상태나 일정이 변경되어 처리하지 않았습니다. 최신 매칭과 일정을 확인해 주세요."); return; }
    setMessage(operation.kind === "확정" ? "NPIUM 최종 매칭을 확정했습니다. 담당 치료사와 병원 화면에 반영됩니다." : "제안을 취소했습니다. 기존 담당 치료사는 유지됩니다."); setOperation(null);
  };
  if (selected) return <AdminPatientDetail patientId={selected} onClose={() => setSelected("")} onMatch={() => { setSelected(""); setAssignId(selected || ""); }} />;
  if (assigning) return <MatchProposal state={state} patient={assigning} onClose={() => setAssignId("")} />;

  return <div className="admin-control">
    <AdminHeading title="환자 매칭 통제" subtitle="제안·응답·최종 확정을 관리하고, 담당 치료사 변경 사유와 처리 이력을 확인합니다." />
    <AdminStats items={[{ label: "미배정", value: base.filter(p => matchingStatus(state, p.id) === "미배정").length, unit: "명" }, { label: "치료사 응답 대기", value: base.filter(p => matchingStatus(state, p.id) === "치료사 응답 대기").length, unit: "명" }, { label: "NPIUM 확인 대기", value: base.filter(p => ["NPIUM 확인 대기", "기존 배정 확인 필요"].includes(matchingStatus(state, p.id))).length, unit: "명" }, { label: "매칭 확정", value: base.filter(p => matchingStatus(state, p.id) === "매칭 확정").length, unit: "명" }]} />
    {message && <p className="admin-feedback" role="status">{message}</p>}
    <div className="business-toolbar"><div className="business-controls"><select aria-label="매칭 병원" value={hospital} onChange={e => setHospital(e.target.value)}><option>{ALL}</option>{[...new Set(state.patients.map(p => p.hospital))].map(h => <option key={h}>{h}</option>)}</select><select aria-label="매칭 상태" value={tab} onChange={e => setTab(e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select><input aria-label="매칭 검색" value={query} placeholder="환자·병원·담당 치료사 검색" onChange={e => setQuery(e.target.value)} /></div><span className="admin-note">현재 {rows.length}명</span></div>
    <BusinessTable caption="환자 매칭 통제" columns={["환자·병원", "현재 담당", "제안 치료사", "매칭 상태", "다음 일정", "처리"]} empty={!rows.length ? "조건에 맞는 환자가 없습니다." : undefined}>
      {rows.map(p => { const a = currentAssignment(state, p.id); const status = matchingStatus(state, p.id); const pending = a && ["제안", "수락"].includes(a.status); return <tr key={p.id}><td><button className="business-name-link" onClick={() => setSelected(p.id)}>{p.name}</button><small>{p.hospital} · {p.condition}</small></td><td>{p.provider || "미배정"}</td><td>{a && pending ? a.providerName : "-"}<small>{a?.adjustmentReason}</small></td><td><BusinessStatus>{status}</BusinessStatus><small>{a?.by}</small></td><td>{p.nextDate}<small>{p.nextTime} · {p.area}</small></td><td><div className="business-actions">{p.status !== "종료" && <>{a?.status === "수락" && <button className="business-action primary" onClick={() => { setError(""); setOperation({ patientId: p.id, assignmentId: a.id, kind: "확정" }); }}>최종 매칭 확정</button>}{!pending && <button className="business-action primary" onClick={() => setAssignId(p.id)}>{p.providerId ? "변경 제안" : "매칭 제안"}</button>}{pending && <button className="business-action" onClick={() => { setError(""); setReason(""); setOperation({ patientId: p.id, assignmentId: a.id, kind: "취소" }); }}>제안 취소</button>}</>}<button className="business-action" onClick={() => setSelected(p.id)}>데이터·이력</button></div></td></tr>; })}
    </BusinessTable>
    <p className="admin-note">치료사 수락 후 최종 확정합니다. 기존 배정은 현재 담당과 이력을 확인해 확정할 수 있습니다. 처방 승인은 병원이 담당합니다.</p>




    {operation && target && <Modal title={`${target.name} · ${operation.kind === "확정" ? "최종 매칭 확정" : "매칭 제안 취소"}`} onClose={() => setOperation(null)}><p className="modal-lead">현재 담당 {target.provider || "미배정"} → {action?.providerName}<br />{operation.kind === "확정" ? "수락한 치료사와 현재 일정·매칭 내용을 확인한 뒤 확정합니다." : "제안을 취소하며 기존 담당과 처방은 유지됩니다."}</p><form className="care-form" onSubmit={e => { e.preventDefault(); run(); }}>{operation.kind === "취소" && <label>취소 사유<textarea required value={reason} onChange={e => setReason(e.target.value)} /></label>}{error && <p role="alert" className="admin-feedback error">{error}</p>}<button className="btn-primary wide" disabled={operation.kind === "취소" && !reason.trim()}>{operation.kind === "확정" ? "확인하고 최종 확정" : "사유를 남기고 취소"}</button></form></Modal>}
</div>;
}
