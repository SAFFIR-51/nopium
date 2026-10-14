"use client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ExpertSubHeader } from "../ExpertShell";
import { useProviderCare } from "../use-provider-care";

// 기획서 3장 제공자 관리: 면허·경력, 보험, 교육 이수와 수행 가능한 프로그램 유형.
// 실제 서류 확인은 운영자 검토 단계와 연결되며, 지금은 예시 상태입니다.
const credentials = [
  { title: "면허 확인", text: "면허 번호와 발급 기관 확인", status: "확인 완료" },
  { title: "경력 확인", text: "재직·경력 증빙 검토", status: "확인 완료" },
  { title: "배상책임보험", text: "보험 가입 증빙과 유효 기간", status: "갱신 예정" },
  { title: "기록·안전 교육", text: "회차 기록, 이상 반응 대응 교육 이수", status: "이수" },
];

export function ProfileView() {
  const data = useProviderCare();
  if (!data) return null;
  const p = data.provider;
  return <div className="sg sg-work my-home my-sub-view">
    <ExpertSubHeader title="내 자격·프로필" subtitle="병원은 자격 확인 상태와 제공 범위를 보고 배정해요." action={<Link className="sg-head-link" href={`/experts/${p.id}`}>공개 프로필<Icon name="chevron" size={14} /></Link>} />
    <section className="sg-profile">
      <span className="sg-profile-avatar">{p.name.slice(0, 1)}</span>
      <div><b>{p.name} 선생님</b><small>{p.license} · 경력 {p.years}년{p.hospital ? ` · ${p.hospital}` : ""}</small></div>
    </section>

    <h2 className="sg-title">자격과 교육</h2>
    <p className="sg-sub">서류 변경은 운영팀 검토 후 반영돼요</p>
    <section className="sg-card sg-list">{credentials.map(c => <div className="sg-list-static" key={c.title}>
      <span style={{ flex: 1, minWidth: 0 }}><b>{c.title}</b><small>{c.text}</small></span>
      <em className={`sg-badge ${c.status === "갱신 예정" ? "warn" : ""}`}>{c.status}</em>
    </div>)}</section>

    <h2 className="sg-title">제공 범위</h2>
    <section className="sg-card"><dl className="sg-facts">
      <div><dt>제공 분야</dt><dd>{p.focus.join(" · ")}</dd></div>
      <div><dt>진행 방식</dt><dd>{p.visit.join(" · ")}</dd></div>
      <div><dt>활동 지역</dt><dd>{p.area}</dd></div>
      <div><dt>가능 시간</dt><dd>{p.slots}</dd></div>
      {p.hospital && <div><dt>연계 기관</dt><dd>{p.hospital}</dd></div>}
    </dl></section>
    <Link className="sg-more" href={`/chat?c=support-${p.id}`}>제공 범위 변경 문의</Link>
  </div>;
}
