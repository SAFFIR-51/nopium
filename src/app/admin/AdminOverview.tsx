"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Modal } from "@/components/CareUI";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { won } from "@/lib/billing";
import { careRepo } from "@/lib/repo";
import { AdminHeading } from "./AdminShell";
import { useAdminCare } from "./use-admin-care";

/** 운영 현황(ERP 대시보드): 돈(청구·미수) → 문의 → 진행 이슈 → 검수. 담당 배정은 병원이 하므로 운영팀은 지연만 확인합니다. */
export function AdminOverview() {
  const { state, today, bills, toInvoice, unpaid, openInquiries, missing, unreviewed, ending, waitingAssign, applications } = useAdminCare();
  const [reset, setReset] = useState(false);
  const month = today?.slice(0, 7) ?? "";
  const thisMonth = bills.filter(b => b.period === month);
  const monthVisits = thisMonth.reduce((n, b) => n + b.visits, 0);
  const monthTotal = thisMonth.reduce((n, b) => n + b.total, 0);
  const unpaidTotal = unpaid.reduce((n, b) => n + b.total, 0);
  const active = state.patients.filter(p => p.status === "진행 중").length;

  type Row = { key: string; kind: string; target: string; text: string; action: ReactNode };
  const rows: Row[] = [
    ...toInvoice.map(b => ({ key: `iv-${b.key}`, kind: "청구 필요", target: b.org, text: `${b.period} · 방문 ${b.visits}회 · ${won(b.total)} (부가세 포함)`, action: <Link className="business-action primary" href="/admin/billing">청구하기</Link> })),
    ...unpaid.map(b => ({ key: `up-${b.key}`, kind: "입금 대기", target: b.org, text: `${b.period} · ${won(b.total)} · 청구 ${b.issuedAt ?? ""}`, action: <Link className="business-action" href="/admin/billing">입금 확인</Link> })),
    ...openInquiries.map(i => ({ key: `iq-${i.id}`, kind: i.meta.status === "접수" ? "문의 접수" : "문의 처리 중", target: `${i.who} (${i.kind})`, text: `[${i.meta.category}] ${i.last?.text.slice(0, 48) ?? ""}`, action: <Link className="business-action primary" href="/admin/inquiries">처리하기</Link> })),
    ...missing.map(p => ({ key: `ms-${p.id}`, kind: "기록 누락", target: p.hospital, text: `${p.name} 님 · 치료사 ${p.provider} · ${p.nextDate} 회차 보고서 없음`, action: <Link className="business-action" href={`/chat?c=support-${p.providerId}`}>치료사 문의</Link> })),
    ...unreviewed.map(r => { const p = state.patients.find(x => x.id === r.patientId)!; return { key: `ad-${r.id}`, kind: "이상 반응 미확인", target: p.hospital, text: `${p.name} 님 · ${r.date} 기록 · 담당 의사 확인 전`, action: <Link className="business-action" href="/chat?c=support-demo-hospital">병원 문의</Link> }; }),
    ...waitingAssign.map(p => ({ key: `wa-${p.id}`, kind: "치료사 배정 대기", target: p.hospital, text: `${p.name} 님 · 병원에서 배정 중 · 시작 희망 ${p.nextDate}`, action: <Link className="business-action" href="/chat?c=support-demo-hospital">병원 문의</Link> })),
    ...applications.map(a => ({ key: `ap-${a.id}`, kind: "치료사 검수", target: a.name, text: `${a.license} · 가입 신청 검수 대기`, action: <Link className="business-action primary" href="/admin/providers">검수하기</Link> })),
  ];

  const orgs = state.contracts.map(c => {
    const pts = state.patients.filter(p => p.hospital === c.organization);
    const cur = thisMonth.find(b => b.org === c.organization);
    return { c, active: pts.filter(p => p.status === "진행 중").length, total: pts.length, visits: cur?.visits ?? 0, amount: cur?.total ?? 0 };
  });

  return <div className="hospital-registry admin-erp">
    <AdminHeading title="운영 현황" subtitle="병원 연계형 운영: 담당 배정은 병원이 하고, NOPIUM 운영팀은 수수료·진행 현황·문의를 관리합니다." action={<button className="btn-ghost" onClick={() => setReset(true)}>체험 데이터 초기화</button>} />
    <div className="business-summary">
      <div><small>방문재활 진행 중</small><b>{active}<span>명</span></b></div>
      <div><small>이번 달 방문 회차</small><b>{monthVisits}<span>회</span></b></div>
      <div><small>이번 달 예상 이용료</small><b>{monthTotal.toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>미수금</small><b>{unpaidTotal.toLocaleString("ko-KR")}<span>원</span></b></div>
    </div>

    <section className="business-section"><div className="business-section-head"><h2>처리할 업무</h2><span>{rows.length}건</span></div>
      <BusinessTable caption="처리할 업무" columns={["구분", "대상", "내용", "처리"]} empty={!rows.length ? "처리할 업무가 없습니다." : undefined}>
        {rows.map(r => <tr key={r.key}><td><BusinessStatus>{r.kind}</BusinessStatus></td><td className="business-nowrap">{r.target}</td><td className="business-wrap">{r.text}</td><td>{r.action}</td></tr>)}
      </BusinessTable>
    </section>

    <section className="business-section"><div className="business-section-head"><h2>기관별 현황</h2><span>{month} 기준</span></div>
      <BusinessTable caption="기관별 현황" columns={["기관", "계약", "진행 중", "전체 대상", "이번 달 회차", "이번 달 이용료", "곧 끝나는 처방"]} empty={!orgs.length ? "계약 기관이 없습니다." : undefined}>
        {orgs.map(o => <tr key={o.c.organization}><td><b>{o.c.organization}</b><small>담당 {o.c.manager}</small></td><td className="business-nowrap">{o.c.model === "회차당" ? `회차당 ${won(o.c.unitFee)}` : `월 ${won(o.c.monthlyFee)}`}</td><td className="business-number">{o.active}명</td><td className="business-number">{o.total}명</td><td className="business-number">{o.visits}회</td><td className="business-number">{won(o.amount)}</td><td className="business-number">{ending.filter(p => p.hospital === o.c.organization).length}명</td></tr>)}
      </BusinessTable>
    </section>
    {reset && <Modal title="체험 데이터를 초기화할까요?" onClose={() => setReset(false)}><p className="modal-lead">이 브라우저에서 추가한 신청과 기록이 기본 예시로 돌아갑니다.</p><button className="btn-primary wide" onClick={() => { careRepo.reset(); setReset(false); }}>예시 데이터로 초기화</button></Modal>}
  </div>;
}
