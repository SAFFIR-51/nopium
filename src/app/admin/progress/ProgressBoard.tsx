"use client";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ExpertName, PatientInfoModal } from "@/components/BusinessDetails";
import { daysLeft, programStage, STAGES, type Stage } from "@/lib/program";
import type { Patient } from "@/lib/repo";
import { upcomingPlace } from "@/lib/places";
import { AdminHeading } from "../AdminShell";
import { useAdminCare } from "../use-admin-care";

/** 진행 현황(읽기 전용): 기관·단계·처방 기간·회차·이슈. 배정과 처방은 병원이, 기록은 치료사가 합니다. */
export function ProgressBoard() {
  const { state, today, missing, unreviewed } = useAdminCare();
  const [org, setOrg] = useState("전체");
  const [tab, setTab] = useState<Stage | "전체">("전체");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const orgs = ["전체", ...Array.from(new Set(state.patients.map(p => p.hospital)))];
  const stageOf = (p: Patient) => programStage(state, p, today);
  const lastReport = (id: string) => state.records.filter(r => r.patientId === id && r.confirmed).map(r => r.date).sort().at(-1);
  const issues = (p: Patient) => [
    missing.some(m => m.id === p.id) && "기록 누락",
    unreviewed.some(r => r.patientId === p.id) && "이상 반응 미확인",
    today && p.status === "진행 중" && (daysLeft(p, today) ?? 99) <= 14 && "처방 만료 임박",
  ].filter(Boolean) as string[];
  const base = state.patients.filter(p => org === "전체" || p.hospital === org);
  const rows = base.filter(p => (tab === "전체" || stageOf(p) === tab) && `${p.name} ${p.provider} ${p.hospital}`.includes(query.trim()));
  return <>
    <AdminHeading title="진행 현황" subtitle="전체 기관의 방문재활 진행 상태를 확인합니다. 배정·처방은 병원이, 회차 기록은 치료사가 관리합니다." />
    <div className="business-summary">{STAGES.slice(0, 4).map(s => <div key={s}><small>{s}</small><b>{base.filter(p => stageOf(p) === s).length}<span>명</span></b></div>)}</div>
    <section className="business-section hospital-register-sheet">
      <div className="business-toolbar"><div className="business-filter">{(["전체", ...STAGES] as const).map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t} <span>{t === "전체" ? base.length : base.filter(p => stageOf(p) === t).length}</span></button>)}</div>
        <div className="business-controls"><select aria-label="기관" value={org} onChange={e => setOrg(e.target.value)}>{orgs.map(o => <option key={o}>{o}</option>)}</select><input aria-label="진행 현황 검색" placeholder="대상자·치료사·기관 검색" value={query} onChange={e => setQuery(e.target.value)} /></div></div>
      <div className="business-section-head"><h2>대상별 진행</h2><span>조회 {rows.length}명</span></div>
      <BusinessTable caption="대상별 진행 현황" columns={["대상자", "연계 기관", "단계", "장소", "담당 의사", "담당 치료사", "처방 기간", "회차", "최근 보고서", "이슈"]} empty={!rows.length ? "조건에 맞는 대상이 없습니다." : undefined}>
        {rows.map(p => { const left = today ? daysLeft(p, today) : null; const is = issues(p); return <tr key={p.id}>
          <td><button className="business-name-link" onClick={() => setSelected(p)} aria-label={`${p.name} 대상자 정보`}>{p.name}</button></td>
          <td className="business-nowrap">{p.hospital}</td>
          <td><BusinessStatus>{stageOf(p)}</BusinessStatus></td>
          <td className="business-nowrap">{upcomingPlace(p).kind === "자택" ? "자택 방문" : "센터"}<small>{p.area}</small></td>
          <td className="business-nowrap">{p.doctor?.split(" ")[0] ?? "-"}</td>
          <td><ExpertName id={p.providerId} name={p.provider} /></td>
          <td className="business-nowrap">{p.prescription ? <>{p.prescription.endDate}<small>{p.status === "진행 중" && left !== null ? `${left}일 남음` : ""}</small></> : "-"}</td>
          <td className="business-session-count">{p.completed} / {p.total}</td>
          <td className="business-nowrap">{lastReport(p.id) ?? "-"}</td>
          <td>{is.length ? <div className="business-actions">{is.map(x => <BusinessStatus key={x}>{x}</BusinessStatus>)}</div> : "—"}</td>
        </tr>; })}
      </BusinessTable>
    </section>
    {selected && <PatientInfoModal patient={selected} onClose={() => setSelected(null)} />}
  </>;
}
