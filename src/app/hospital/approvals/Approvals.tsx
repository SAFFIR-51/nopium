"use client";
import { usePageItem } from "@/lib/page-view";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ExpertName } from "@/components/BusinessDetails";
import { hasAssessment } from "@/lib/program";
import { HospitalHeading } from "../HospitalShell";
import { PlanReview } from "../PlanReview";
import { useHospitalCare } from "../use-hospital-care";

export function Approvals() {
  const { state, approvals } = useHospitalCare();
  const [selected, setSelected] = usePageItem("prescription", approvals, p => p.id);
  if (selected) return <PlanReview patient={selected} onClose={() => setSelected(null)} />;
  return <>
    <HospitalHeading title="처방 확인" subtitle="퇴원 전 재활 소견과 동의를 확인하고 기간·주간 횟수·치료 범위를 승인합니다. 초기 방문 평가와 외래 재평가를 참고해 변경안을 승인할 수 있습니다." />
    <section className="business-section"><div className="business-section-head"><h2>검토 대상</h2><span>{approvals.length}건</span></div>
      <BusinessTable caption="처방 확인 목록" columns={["대상자", "프로그램·목표", "담당 전문가", "시작 희망일", "주의사항", "상태", "관리"]} empty={!approvals.length ? "확인할 처방이 없습니다." : undefined}>
        {approvals.map(p => <tr key={p.id}><td><button className="business-name-link" onClick={() => setSelected(p)} aria-label={`${p.name} 대상자 정보`}>{p.name}</button><small>{p.age}세 · {p.sex}</small></td><td>{p.condition}<small>{p.goal}</small></td><td><ExpertName id={p.providerId} name={p.provider} /><small>{p.method} · {p.total}회</small></td><td className="business-nowrap">{p.nextDate}<small>{p.nextTime}</small></td><td className="business-wrap">{p.precautions}</td><td><BusinessStatus>{p.approval?.status === "반려" ? "보완 요청" : hasAssessment(state, p.id, "초기 평가") ? "처방 확인 필요" : "초기 처방 승인 검토"}</BusinessStatus>{p.approval?.status === "반려" && <small>{p.approval.reason}</small>}</td><td><button className={`business-action ${hasAssessment(state, p.id, "초기 평가") ? "primary" : ""}`} onClick={() => setSelected(p)}>처방 확인</button></td></tr>)}
      </BusinessTable>
    </section>

  </>;
}
