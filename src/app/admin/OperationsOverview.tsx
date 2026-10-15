"use client";
import { Modal } from "@/components/CareUI";
import { mutationFailed } from "@/lib/repo";
import { DEMO_MODE } from "@/lib/session";
import Link from "next/link";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ALL, adminStatistics, organizations, type AdminFilter } from "@/lib/admin-data";
import { matchingStatus } from "@/lib/assignment";
import { allProviders } from "@/lib/workflow";
import { won } from "@/lib/billing";
import { careRepo } from "@/lib/repo";
import { AdminHeading } from "./AdminShell";
import { AdminFilters, AdminStats } from "./AdminControls";
import { useAdminCare } from "./use-admin-care";

export function OperationsOverview() {
  const { state, today, unpaid, toInvoice, openInquiries, applications, ending } = useAdminCare();
  const [filters, setFilters] = useState<AdminFilter>({ hospital: ALL, provider: ALL, month: "" });
  const [reset, setReset] = useState(false);
  const filter = { ...filters, month: filters.month || today?.slice(0, 7) || state.records[0]?.date.slice(0, 7) || "2026-10" };
  const data = adminStatistics(state, filter, today || "");
  const ids = new Set(data.patients.map(p => p.id));
  const due = toInvoice.filter(b => filter.hospital === ALL || b.org === filter.hospital);
  const debt = unpaid.filter(b => filter.hospital === ALL || b.org === filter.hospital);
  const tasks = [
    ...data.patients.filter(p => ["미배정", "NPIUM 확인 대기", "재배정 필요", "기존 배정 확인 필요"].includes(matchingStatus(state, p.id))).map(p => ({ id: `match-${p.id}`, kind: matchingStatus(state, p.id), name: `${p.name} · ${p.hospital}`, text: p.provider ? `현재 담당 ${p.provider} · 매칭 이력 확인` : `${p.area} · ${p.nextDate} ${p.nextTime}`, href: `/admin/assignments?patient=${p.id}`, action: "매칭 확인" })),
    ...data.missing.map(p => ({ id: `missing-${p.id}`, kind: "기록 누락·미확정", name: `${p.name} · ${p.hospital}`, text: `${p.nextDate} 회차 · 담당 ${p.provider}`, href: `/admin/progress?patient=${p.id}`, action: "원기록 확인" })),
    ...data.unreviewed.map(r => ({ id: r.id, kind: "이상 반응 미확인", name: data.patients.find(p => p.id === r.patientId)?.name || "", text: `${r.date} · 병원 확인 전`, href: `/admin/progress?patient=${r.patientId}`, action: "처리 상태 확인" })),
    ...ending.filter(p => ids.has(p.id)).map(p => ({ id: `end-${p.id}`, kind: "처방 만료 임박", name: p.name, text: `${p.prescription?.endDate}까지 · 사후 평가 확인`, href: `/admin/progress?patient=${p.id}`, action: "진행 확인" })),
  ];
  const stages = [
    { label: "퇴원 전 연계", count: data.patients.filter(p => p.status === "배정 대기").length },
    { label: "초기 방문 평가", count: data.patients.filter(p => p.status === "승인 대기").length },
    { label: "방문 운동 치료", count: data.active },
    { label: "데이터화 및 병원 리포팅", count: data.shared },
  ];

  return <div className="admin-control">
    <AdminHeading title="운영 현황" subtitle="병원·환자·치료사 데이터를 살펴보고 매칭·기록·보고·정산 업무를 연결합니다." action={DEMO_MODE ? <button className="btn-ghost" onClick={() => setReset(true)}>체험 데이터 초기화</button> : undefined} />
    <AdminFilters state={state} filter={filter} onChange={setFilters} />
    <AdminStats items={[
      { label: "관리 환자", value: data.patients.length, unit: "명", note: "선택 병원·치료사의 현재 환자" }, { label: "방문 운동 치료 진행 중", value: data.active, unit: "명" }, { label: "매칭 확인·조정 필요", value: data.awaiting, unit: "명" }, { label: "선택 기간 실제 방문", value: data.visits.length, unit: "회", note: `${filter.month} 확정 기록 · 미참여 제외` },
      { label: "기록 누락·미확정", value: data.missing.length, unit: "명", note: "지난 예정일 기준 · 현재 조치 대상" }, { label: "이상 반응 미확인", value: data.unreviewed.length, unit: "건", note: "선택 기간 확정 기록" }, { label: "병원 제공 리포트", value: data.shared, unit: "건", note: `병원 확인 ${data.acknowledged}건` }, { label: "작성 중 회차 기록", value: data.drafts, unit: "건" },
    ]} />
    <div className="admin-two-col"><section className="admin-panel"><div className="business-section-head"><h2>환자 진행과 병원 리포팅</h2><Link className="business-name-link" href="/admin/progress">환자별 데이터</Link></div><div className="admin-stage-list">{stages.map(s => <div className="admin-stage-row" key={s.label}><span>{s.label}</span><div><i style={{ width: `${s.count / Math.max(1, data.patients.length) * 100}%` }} /></div><b>{s.count}</b></div>)}</div><p className="admin-note">앞 세 항목은 현재 환자 수, 리포팅은 선택 기간 제공 건수입니다. 방문과 리포팅은 함께 진행될 수 있습니다.</p></section>
      <section className="admin-panel"><h2>함께 확인할 운영 업무</h2><div className="admin-stage-list"><Link href="/admin/billing">수익 정산 · 청구 필요 {due.length}건 · 미수금 {won(debt.reduce((n, b) => n + b.total, 0))}</Link><Link href="/admin/providers">치료사 인증 및 등록 · 검수 대기 {applications.length}건</Link><Link href="/admin/inquiries">문의 관리 · 미처리 {openInquiries.length}건</Link><Link href="/admin/analysis">데이터 분석 · 기록 있는 환자 {data.withRecords}/{data.patients.length}명</Link></div><p className="admin-note">정산은 병원 기준 전체 기간, 문의·검수는 전체 운영 기준입니다.</p></section></div>
    <section className="business-section"><div className="business-section-head"><h2>확인·조정할 업무</h2><span>{tasks.length}건</span></div><BusinessTable caption="운영 조치 대상" columns={["구분", "환자·병원", "확인할 내용", "처리"]} empty={!tasks.length ? "현재 조건에서 확인할 운영 문제가 없습니다." : undefined}>{tasks.map(t => <tr key={t.id}><td><BusinessStatus>{t.kind}</BusinessStatus></td><td>{t.name}</td><td>{t.text}</td><td><Link className="business-action primary" href={t.href}>{t.action}</Link></td></tr>)}</BusinessTable></section>
    <section className="business-section"><div className="business-section-head"><h2>병원별 운영 통계</h2><span>{filter.month} 기록 · 병원 이름을 누르면 필터 적용</span></div><BusinessTable caption="병원별 운영 통계" columns={["병원", "전체 환자", "진행 중", "매칭 확인", "실제 방문", "기록 누락", "병원 제공·확인"]}>
      {organizations(state).filter(h => filter.hospital === ALL || h === filter.hospital).map(h => { const d = adminStatistics(state, { ...filter, hospital: h }, today || ""); return <tr key={h}><td><button className="business-name-link" onClick={() => setFilters({ ...filter, hospital: h })}>{h}</button></td><td>{d.patients.length}명</td><td>{d.active}명</td><td>{d.awaiting}명</td><td>{d.visits.length}회</td><td>{d.missing.length}명</td><td>{d.shared}건 · 확인 {d.acknowledged}건</td></tr>; })}
    </BusinessTable></section>
    <section className="business-section"><div className="business-section-head"><h2>치료사별 수행·기록 통계</h2><span>이전 회차는 당시 작성자 기준</span></div><BusinessTable caption="치료사별 수행 통계" columns={["치료사", "현재 담당", "실제 방문", "작성 중", "이상 반응 미확인", "데이터"]}>
      {allProviders(state).filter(e => filter.provider === ALL || e.id === filter.provider).map(e => { const recs = state.records.filter(r => ids.has(r.patientId) && r.authorId === e.id && r.date.startsWith(filter.month)); return <tr key={e.id}><td><button className="business-name-link" onClick={() => setFilters({ ...filter, provider: e.id })}>{e.name}</button><small>{e.license}</small></td><td>{data.patients.filter(p => p.providerId === e.id && p.status !== "종료").length}명</td><td>{recs.filter(r => r.confirmed && r.attendance !== "미참여").length}회</td><td>{recs.filter(r => !r.confirmed).length}건</td><td>{recs.filter(r => r.confirmed && r.adverse?.occurred && !r.adverse.reviewedBy).length}건</td><td><Link className="business-action" href="/admin/progress">환자별 기록</Link></td></tr>; })}
    </BusinessTable></section>


    {reset && <Modal title="체험 데이터를 초기화할까요?" onClose={() => setReset(false)}><p className="modal-lead">이 브라우저에서 추가한 신청·매칭·기록이 기본 예시로 돌아갑니다.</p><button className="btn-primary wide" onClick={async () => { if (mutationFailed(await careRepo.reset())) return; setReset(false); }}>예시 데이터로 초기화</button></Modal>}
</div>;
}
