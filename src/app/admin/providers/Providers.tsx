"use client";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ExpertName } from "@/components/BusinessDetails";
import { assignmentHistory } from "@/lib/assignment";
import { careRepo } from "@/lib/repo";
import { AdminHeading } from "../AdminShell";
import { useAdminCare } from "../use-admin-care";
import { ProviderVerification } from "./ProviderVerification";
import { allProviders, providerEligibility } from "@/lib/workflow";
import { useToday } from "@/lib/use-today";

export function Providers() {
  const { state } = useAdminCare();
  const today = useToday();
  const providers = allProviders(state);
  return <>
    <AdminHeading title="치료사 인증 및 등록" subtitle="가입 검수·확인 근거·보험 유효기간·등급과 배정 가능 상태를 관리합니다." />
    <ProviderVerification />
    <section className="business-section"><div className="business-section-head"><h2>가입 신청 검수</h2><span>검수 대기 {state.applications.filter(a => a.status === "검수 대기").length}건</span></div>
      <BusinessTable caption="가입 신청 검수" columns={["신청자", "제공 분야", "활동 지역·방식", "면허·보험", "제출 서류", "신청일", "상태", "처리"]} empty={!state.applications.length ? "새 가입 신청이 없습니다." : undefined}>
        {state.applications.map(a => <tr key={a.id}><td><b>{a.name}</b><small>{a.license} · 경력 {a.years}년</small></td><td>{a.programs.join(", ")}</td><td>{a.regions.join(", ")}<small>{a.methods.join(", ")}</small></td><td>{a.licenseNumber}<small>보험 {a.insurance}</small></td><td className="business-wrap">{a.documentName || "미등록"}</td><td className="business-nowrap">{new Date(a.createdAt).toLocaleDateString("ko-KR")}</td><td><BusinessStatus>{a.status}</BusinessStatus></td><td>{a.status === "검수 대기" ? <div className="business-actions"><button className="business-action" onClick={async () => await careRepo.reviewApplication(a.id,"반려","서류 보완 필요")}>보완 요청</button><button className="business-action primary" onClick={async () => await careRepo.reviewApplication(a.id,"승인")}>승인</button></div> : "—"}</td></tr>)}
      </BusinessTable>
    </section>
    <section className="business-section"><div className="business-section-head"><h2>활동 중인 제공자</h2><span>{providers.length}명</span></div>
      <BusinessTable caption="활동 중인 제공자" columns={["제공자", "제공 분야", "활동 지역", "진행 방식", "담당 중", "응답 대기", "거절"]}>
        {providers.map(e => { const mine = state.assignments.filter(a => a.providerId === e.id); const pending = state.patients.filter(p => { const latest = assignmentHistory(state,p.id)[0]; return p.status === "배정 대기" && latest?.providerId === e.id && latest.status === "제안"; }).length; return <tr key={e.id}><td><ExpertName id={e.id} name={e.name} /><small>{e.license} · 경력 {e.years}년 · {providerEligibility(state, e.id, today ?? "")}</small></td><td>{e.focus.join(", ")}</td><td>{e.area}</td><td>{e.visit.join(" · ")}</td><td className="business-number">{state.patients.filter(p => p.providerId === e.id && p.status !== "종료").length}명</td><td className="business-number">{pending}건</td><td className="business-number">{mine.filter(a => a.status === "거절").length}건</td></tr>; })}
      </BusinessTable>
    </section>
  </>;
}
