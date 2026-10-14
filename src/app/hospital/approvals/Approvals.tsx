"use client";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ExpertName } from "@/components/BusinessDetails";
import type { Patient } from "@/lib/repo";
import { hasAssessment } from "@/lib/program";
import { HospitalHeading } from "../HospitalShell";
import { PlanReview } from "../PlanReview";
import { useHospitalCare } from "../use-hospital-care";

export function Approvals() {
  const { state, approvals } = useHospitalCare();
  const [selected, setSelected] = useState<Patient | null>(null);
  return <>
    <HospitalHeading title="처방 확인" subtitle="담당 치료사의 방문 전 평가를 보고 담당 의사가 기간·주간 횟수·치료 범위를 정합니다." />
    <section className="business-section"><div className="business-section-head"><h2>검토 대상</h2><span>{approvals.length}건</span></div>
      <BusinessTable caption="처방 확인 목록" columns={["대상자", "프로그램·목표", "담당 전문가", "시작 희망일", "주의사항", "상태", "관리"]} empty={!approvals.length ? "확인할 처방이 없습니다." : undefined}>
        {approvals.map(p => <tr key={p.id}><td><button className="business-name-link" onClick={() => setSelected(p)} aria-label={`${p.name} 대상자 정보`}>{p.name}</button><small>{p.age}세 · {p.sex}</small></td><td>{p.condition}<small>{p.goal}</small></td><td><ExpertName id={p.providerId} name={p.provider} /><small>{p.method} · {p.total}회</small></td><td className="business-nowrap">{p.nextDate}<small>{p.nextTime}</small></td><td className="business-wrap">{p.precautions}</td><td><BusinessStatus>{p.approval?.status === "반려" ? "보완 요청" : hasAssessment(state, p.id, "초기 평가") ? "처방 확인 필요" : "방문 전 평가 대기"}</BusinessStatus>{p.approval?.status === "반려" && <small>{p.approval.reason}</small>}</td><td><button className={`business-action ${hasAssessment(state, p.id, "초기 평가") ? "primary" : ""}`} onClick={() => setSelected(p)}>처방 확인</button></td></tr>)}
      </BusinessTable>
    </section>
    {selected && <PlanReview patient={selected} onClose={() => setSelected(null)} />}
  </>;
}
