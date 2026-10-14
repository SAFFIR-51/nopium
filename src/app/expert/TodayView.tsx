"use client";
import Link from "next/link";
import { useState } from "react";
import { savedTimeLabel } from "@/components/CareUI";
import { Icon, type IconName } from "@/components/Icon";
import { SessionReportForm } from "@/components/SessionReportForm";
import { careRepo, type Patient } from "@/lib/repo";
import { useToday } from "@/lib/use-today";
import { PlaceInfo } from "@/components/PlaceInfo";
import { placeName } from "@/lib/places";
import { missingReports } from "@/lib/measures";
import { hasAssessment, programStage } from "@/lib/program";
import { threadsFor } from "@/lib/chat";
import { ExpertHeading } from "./ExpertShell";
import { useProviderCare } from "./use-provider-care";

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const weekday = (iso: string) => "일월화수목금토"[new Date(`${iso}T00:00:00`).getDay()];
const short = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;

export function TodayView() {
  const data = useProviderCare();
  const [record, setRecord] = useState<{ patient: Patient; date?: string } | null>(null);
  const today = useToday();
  if (!data) return null;
  if (!today) return <ExpertHeading title={`반가워요, ${data.provider.name} 선생님`} subtitle="오늘 일정을 불러오고 있어요." />;
  const weekEnd = addDays(today, 6);
  const active = data.patients.filter(p => p.status !== "종료");
  const byTime = (a: Patient, b: Patient) => (a.nextDate + a.nextTime).localeCompare(b.nextDate + b.nextTime);
  const todays = active.filter(p => p.nextDate === today).sort(byTime);
  const week = active.filter(p => p.nextDate > today && p.nextDate <= weekEnd).sort(byTime);
  const patientName = (id: string) => data.patients.find(p => p.id === id)?.name ?? "";
  const myIds = new Set(data.patients.map(p => p.id));
  const missing = missingReports(data.state, today, id => myIds.has(id));
  const reports = data.state.records.filter(r => r.confirmed && myIds.has(r.patientId)).length;
  const myRequests = data.state.scheduleRequests.filter(r => r.status === "요청" && myIds.has(r.patientId));
  // 수락하면 일정이 바뀌고(저장소에서 처리), 보호자 대화방에도 결과를 남깁니다.
  const respond = (id: string, patientId: string, status: "확정" | "조정 필요", text: string) => {
    careRepo.respondSchedule(id, status, text);
    careRepo.sendMessage(`care-${patientId}`, { key: data.ref.id, name: data.ref.name }, `[${status === "확정" ? "일정 확정" : "일정 조정 필요"}] ${text}`);
  };

  const monthKey = today.slice(0, 7);
  const monthReports = data.state.records.filter(r => r.confirmed && myIds.has(r.patientId) && r.date.startsWith(monthKey)).length;
  const upcoming = [...todays, ...week];
  const dayLabel = (iso: string) => iso === today ? "오늘" : iso === addDays(today, 1) ? "내일" : `${short(iso)} (${weekday(iso)})`;
  // 단계별로 치료사가 해야 하는 평가 (방문 전 평가 → 의사 확인, 종료 평가 → 병원 종료 확인)
  const needInitial = data.patients.filter(p => programStage(data.state, p, today) === "방문 전 평가");
  const needFinal = data.patients.filter(p => programStage(data.state, p, today) === "종료 평가" && !hasAssessment(data.state, p.id, "사후 평가"));
  const tasks = missing.length + myRequests.length + data.requests.length + data.drafts.length + needInitial.length + needFinal.length;

  const menu = [
    { title: "업무", items: [
      { href: "/expert/requests", title: "배정 요청", sub: data.requests.length ? `새 요청 ${data.requests.length}건` : "새 요청 없음" },
      { href: "/expert/schedule", title: "일정표", sub: "한 달 방문 일정과 진행한 회차" },
      { href: "/expert/patients", title: "담당 대상", sub: `진행 중 ${data.patients.filter(p => p.status === "진행 중").length}명 · 전체 ${data.patients.length}명` },
    ] },
    { title: "문의", items: [
      { href: `/chat?c=support-${data.provider.id}`, title: "NOPIUM 운영팀", sub: "정산·계정·이용 문의" },
    ] },
    { title: "설정", items: [
      { href: "/expert/profile", title: "내 자격·프로필", sub: `${data.provider.license} · 활동 지역 ${data.provider.area}` },
      { href: `/experts/${data.provider.id}`, title: "공개 프로필 보기", sub: "보호자·병원에 보이는 소개" },
    ] },
  ];
  const unread = threadsFor(data.state, "provider").reduce((n, t) => n + (t.unread ?? 0), 0);
  const quick: { href: string; icon: IconName; title: string; badge?: number }[] = [
    { href: "/expert/requests", icon: "chat", title: "배정 요청", badge: data.requests.length },
    { href: "/expert/patients", icon: "user", title: "담당 대상", badge: data.drafts.length },
    { href: "/chat", icon: "chat", title: "채팅", badge: unread },
    { href: "/expert/schedule", icon: "calendar", title: "일정표" },
  ];
  // 에어비앤비 호스트 Today 순서: 지금 처리할 일 → 다가오는 회차 → 쌓인 기록. 숨고형 한 열 목록.
  return <div className="sg sg-work my-home">
    <h1 className="sg-h1">내 관리</h1>
    <section className="sg-profile">
      <div><b>{data.provider.name} 선생님</b><small>{data.provider.license}{data.provider.hospital ? ` · ${data.provider.hospital}` : ""} · 담당 {active.length}명</small></div>
    </section>
    <nav className="sg-quick-menu" aria-label="바로가기">
      {quick.map(q => <Link key={q.title} href={q.href}><span className="sg-qicon"><Icon name={q.icon} size={20} />{q.badge ? <em>{q.badge}</em> : null}</span>{q.title}</Link>)}
    </nav>

    <h2 className="sg-title">지금 처리할 일 {tasks > 0 && <span>{tasks}</span>}</h2>
    {tasks === 0 ? <section className="sg-card sg-empty">처리할 일이 없어요. 수고하셨어요.</section> : <>
      {missing.map(p => <section className="sg-card" key={`m-${p.id}`}><div className="sg-row static">
        <span><small className="sg-state warn">보고서 미작성 · {dayLabel(p.nextDate)} {p.nextTime}</small><b>{p.name} 님 회차 보고서</b><small>{p.condition} · {p.method}</small></span>
        <button className="sg-btn primary" onClick={() => setRecord({ patient: p, date: p.nextDate })}>작성하기</button>
      </div></section>)}
      {myRequests.map(r => { const p = data.patients.find(x => x.id === r.patientId)!; return <section className="sg-card" key={r.id}>
        <div className="sg-row static"><span><small className="sg-state on">보호자 요청 · {r.kind === "변경" ? "일정 변경" : "참여 어려움"}</small>
          <b>{p.name} 님 {r.kind === "변경" ? (r.date === p.nextDate && r.time === p.nextTime ? <>{short(p.nextDate)} {p.nextTime} · 장소만 변경</> : <>{short(p.nextDate)} {p.nextTime} → {r.date ? short(r.date) : ""} {r.time}</>) : `${short(p.nextDate)} ${p.nextTime} 회차`}</b><small>{r.by} · {r.reason}{r.place ? ` · 장소 ${placeName(r.place)}(이번 회차만)` : ""}</small></span></div>
        <div className="sg-actions"><button onClick={() => respond(r.id, r.patientId, "조정 필요", "가능한 시간을 채팅으로 안내드릴게요.")}>다른 시간 제안</button><button className="primary" onClick={() => respond(r.id, r.patientId, "확정", r.kind === "변경" ? `${r.date?.slice(5).replace("-", ".")} ${r.time}${r.place ? ` · ${placeName(r.place)}` : ""}로 확정했어요.` : "이번 회차는 쉬고 다음 일정을 안내드릴게요.")}>{r.kind === "변경" ? "수락하기" : "확인하기"}</button></div>
      </section>; })}
      {[...needInitial.map(p => ({ p, kind: "방문 전 평가", text: "평가를 마치면 담당 의사가 계획을 확인해요" })), ...needFinal.map(p => ({ p, kind: "종료 평가", text: "다시 평가해 방문 전과 비교해요" }))].map(({ p, kind, text }) => <section className="sg-card" key={`${kind}-${p.id}`}><Link className="sg-row" href={`/expert/patients/${p.id}`}>
        <span><small className="sg-state warn">{kind} 필요</small><b>{p.name} 님 · {p.condition}</b><small>{text}</small></span>
        <span className="sg-right">평가하기<Icon name="chevron" size={14} /></span>
      </Link></section>)}
      {data.requests.map(p => <section className="sg-card" key={`a-${p.id}`}><Link className="sg-row" href="/expert/requests">
        <span><small className="sg-state on">배정 요청</small><b>{p.name} 님 · {p.condition}</b><small>{p.area} · {p.method} · 희망 {short(p.nextDate)} {p.nextTime}</small></span>
        <span className="sg-right">확인<Icon name="chevron" size={14} /></span>
      </Link></section>)}
      {data.drafts.map(r => <section className="sg-card" key={`d-${r.id}`}><Link className="sg-row" href={`/expert/patients/${r.patientId}`}>
        <span><small className="sg-state">임시 저장 · {savedTimeLabel(r.updatedAt) || r.date}</small><b>{patientName(r.patientId)} 님 · {r.title}</b><small>확정해야 보호자에게 보여요</small></span>
        <span className="sg-right">이어서 쓰기<Icon name="chevron" size={14} /></span>
      </Link></section>)}
    </>}

    <h2 className="sg-title">다가오는 회차</h2>
    <p className="sg-sub">오늘부터 {short(weekEnd)}까지</p>
    {upcoming.length ? upcoming.map(p => <section className="sg-card" key={p.id}>
      <Link className="sg-row" href={`/expert/patients/${p.id}`}>
        <span><small className={`sg-state ${p.nextDate === today ? "on" : ""}`}>{dayLabel(p.nextDate)} · {p.method}</small><b className="sg-big">{p.nextTime} {p.name} 님</b><small>{p.condition} · {p.area}</small></span>
        <span className="sg-right">대상 정보<Icon name="chevron" size={14} /></span>
      </Link>
      <div className="sg-divider" />
      <PlaceInfo patient={p} changed={!!p.nextPlace} />
      <p className="sg-caution"><Icon name="shield" size={14} />{p.precautions}</p>
      <div className="sg-actions"><Link href={`/chat?c=care-${p.id}`}>보호자와 채팅</Link><button className={p.nextDate === today ? "primary" : ""} disabled={programStage(data.state, p, today) !== "방문 재활"} onClick={() => setRecord({ patient: p })}>보고서 쓰기</button></div>
    </section>) : <section className="sg-card sg-empty">이번 주 남은 회차가 없어요.</section>}

    <h2 className="sg-title">쌓인 기록</h2>
    <section className="sg-card"><div className="sg-stats">
      <div><small>이번 달 보고서</small><b>{monthReports}<em>건</em></b></div>
      <div><small>전체 보고서</small><b>{reports}<em>건</em></b></div>
      <div><small>담당 대상</small><b>{active.length}<em>명</em></b></div>
    </div>
    <p className="sg-highlight">{monthReports ? `이번 달 보고서 ${monthReports}건이 보호자 화면과 월간 보고서에 반영됐어요.` : "보고서를 쓰면 보호자 화면과 월간 보고서에 바로 반영돼요."}</p></section>

    {menu.map(g => <div key={g.title}>
      <h2 className="sg-title">{g.title}</h2>
      <section className="sg-card sg-list">{g.items.map(i => <Link key={i.title} href={i.href}><span><b>{i.title}</b><small>{i.sub}</small></span><Icon name="chevron" size={16} /></Link>)}</section>
    </div>)}
    <p className="sg-foot">처방·진료 관련 판단은 담당 의사에게, 이용·정산 문의는 NOPIUM 운영팀으로 해 주세요.</p>

    {record && <SessionReportForm patient={record.patient} defaultDate={record.date} author={data.ref} onClose={() => setRecord(null)} />}
  </div>;
}
