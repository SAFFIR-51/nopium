"use client";
import Link from "next/link";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { careRepo, type InquiryMeta } from "@/lib/repo";
import { AdminHeading } from "../AdminShell";
import { useAdminCare } from "../use-admin-care";

const CATEGORIES = ["일반", "이용 방법", "정산", "일정·배정", "기록·보고서", "계정·권한", "불편 신고"];
const STATUSES: InquiryMeta["status"][] = ["접수", "처리 중", "완료"];
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");

/** 문의 관리: 보호자·병원·치료사의 운영팀 문의방을 티켓처럼 분류·배정·처리합니다. 답변은 채팅에서 합니다. */
export function Inquiries() {
  const { inquiries } = useAdminCare();
  const [tab, setTab] = useState<InquiryMeta["status"] | "전체">("전체");
  const [kind, setKind] = useState("전체");
  const rows = inquiries.filter(i => (tab === "전체" || i.meta.status === tab) && (kind === "전체" || i.kind === kind));
  return <>
    <AdminHeading title="문의 관리" subtitle="운영팀 문의방에 들어온 문의를 분류하고 담당자를 정해 처리합니다. 답변은 채팅에서 바로 할 수 있어요." />
    <div className="business-summary">{STATUSES.map(s => <div key={s}><small>{s}</small><b>{inquiries.filter(i => i.meta.status === s).length}<span>건</span></b></div>)}<div><small>읽지 않은 메시지</small><b>{inquiries.reduce((n, i) => n + i.unread, 0)}<span>건</span></b></div></div>
    <section className="business-section">
      <div className="business-toolbar"><div className="business-filter">{(["전체", ...STATUSES] as const).map(s => <button key={s} aria-pressed={tab === s} onClick={() => setTab(s)}>{s} <span>{s === "전체" ? inquiries.length : inquiries.filter(i => i.meta.status === s).length}</span></button>)}</div>
        <div className="business-controls"><select aria-label="문의자 구분" value={kind} onChange={e => setKind(e.target.value)}>{["전체", "보호자", "병원", "치료사"].map(k => <option key={k}>{k}</option>)}</select></div></div>
      <div className="business-section-head"><h2>문의 목록</h2><span>{rows.length}건</span></div>
      <BusinessTable caption="문의 목록" columns={["문의자", "구분", "분류", "최근 내용", "최근 시각", "담당자", "상태", "처리"]} empty={!rows.length ? "문의가 없습니다." : undefined}>
        {rows.map(i => <tr key={i.id}>
          <td className="business-nowrap"><b>{i.who}</b>{i.unread > 0 && <small>새 메시지 {i.unread}</small>}</td>
          <td>{i.kind}</td>
          <td><select aria-label="분류" value={i.meta.category} onChange={e => careRepo.setInquiry(i.id, { category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></td>
          <td className="business-wrap">{i.last?.fromAdmin ? "↳ 답변: " : ""}{i.last?.text.slice(0, 60)}</td>
          <td className="business-nowrap">{when(i.last?.at)}</td>
          <td><input className="business-input" aria-label="담당자" defaultValue={i.meta.assignee ?? ""} placeholder="담당자" onBlur={e => e.target.value !== (i.meta.assignee ?? "") && careRepo.setInquiry(i.id, { assignee: e.target.value })} /></td>
          <td><BusinessStatus>{i.meta.status === "완료" ? "처리 완료" : i.meta.status === "접수" ? "접수 대기" : "처리 중"}</BusinessStatus></td>
          <td><div className="business-actions"><Link className="business-action primary" href={`/chat?c=${i.id}`} onClick={() => i.meta.status === "접수" && careRepo.setInquiry(i.id, { status: "처리 중" })}>답변하기</Link>
            {i.meta.status !== "완료" ? <button className="business-action" onClick={() => careRepo.setInquiry(i.id, { status: "완료" })}>완료</button> : <button className="business-action" onClick={() => careRepo.setInquiry(i.id, { status: "처리 중" })}>다시 열기</button>}</div></td>
        </tr>)}
      </BusinessTable>
    </section>
  </>;
}
