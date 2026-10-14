"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal, ReportView } from "@/components/CareUI";
import { Icon, type IconName } from "@/components/Icon";
import { threadsFor } from "@/lib/chat";
import { measureDef, measureHighlight, recordMeasures } from "@/lib/measures";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { useToday } from "@/lib/use-today";
import { guides } from "./care-content";
import { dday, md, weekday } from "./my-utils";
import { StageSteps } from "@/components/StageSteps";
import { programStage } from "@/lib/program";
import { placeName, upcomingPlace } from "@/lib/places";
import { PatientSwitch } from "./PatientShell";
import { usePatientCare } from "./use-patient-care";
import "./my-home-type.css";

// 내 관리 홈 = 요약과 길 안내만. 자세한 일은 각 메뉴(일정·회차 보고서·신청 현황·정보 공유)에서 합니다.
// 참고: 숨고 마이페이지(프로필 + 메뉴 목록), 토스 홈(가장 중요한 카드 하나 + 바로가기), 애플 건강(한 문장 요약).
// NOPIUM은 이어주는 서비스라 일상 관리(운동·컨디션 기록)는 넣지 않습니다.

type MenuItem = { href?: string; onClick?: () => void; icon?: IconName; title: string; sub?: string; badge?: string | number; alert?: boolean };

export function MyOverview() {
  const { state, patients, patient } = usePatientCare();
  const today = useToday();
  const me = DEMO_ACCOUNTS.patient;
  const [modal, setModal] = useState<"report" | null>(null);
  const [guide, setGuide] = useState<(typeof guides)[number] | null>(null);

  const head = <div className="sg-profile">
    <div><b>{me.name} 님</b><small>{me.relation} · 관리 대상 {patients.length}명</small></div>
  </div>;

  if (!patient) return <div className="sg my-home"><h1 className="sg-h1">내 관리</h1>{head}
    <section className="sg-card sg-empty">연결된 관리 대상이 없어요. 프로그램을 신청하면 일정과 보고서를 이곳에서 볼 수 있어요.</section></div>;

  // 보호자에게는 확정된 보고서만 보입니다.
  const records = state.records.filter(r => r.patientId === patient.id && r.confirmed).sort((a, b) => b.date.localeCompare(a.date));
  const latest = records[0];
  const started = patient.status === "진행 중" || patient.status === "종료";
  const preparing = patients.filter(p => p.status === "배정 대기" || p.status === "승인 대기");
  const shared = state.reports.find(r => r.patientId === patient.id)?.shared;
  const request = state.scheduleRequests.find(r => r.patientId === patient.id);
  const careThread = threadsFor(state, "patient").find(t => t.id === `care-${patient.id}`);
  const highlight = measureHighlight(records);
  const stage = programStage(state, patient, today);
  const links = state.linkages.filter(l => l.patientId === patient.id);

  // 확인할 일: 상대가 답한 것·새 메시지만 (에어비앤비 Today의 "지금 할 일")
  const notices: { text: string; href: string; label: string }[] = [];
  if (request?.status === "조정 필요") notices.push({ text: "요청한 일정에 조정이 필요해요.", href: "/my/schedule", label: "확인하기" });
  if (request?.status === "확정" && request.respondedAt) notices.push({ text: `${request.kind === "변경" ? "일정 변경" : "참여 어려움"} 요청이 확인됐어요.`, href: "/my/schedule", label: "일정 보기" });
  for (const l of links) notices.push({ text: l.status === "연계 완료" ? `${l.to} 연계가 완료됐어요.` : `${l.to}로 연계를 요청했어요.`, href: "/my/requests", label: "보기" });
  if (patient.closure) notices.push({ text: "방문재활이 종료됐어요. 종료 소견을 확인해 보세요.", href: "/my/requests", label: "보기" });
  if (careThread?.unread) notices.push({ text: `${patient.provider} 선생님의 새 메시지 ${careThread.unread}건`, href: `/chat?c=${careThread.id}`, label: "확인하기" });

  const quick: MenuItem[] = [
    { href: "/my/schedule", icon: "calendar", title: "일정" },
    { href: "/my/records", icon: "file", title: "회차 보고서" },
    { href: `/chat?c=care-${patient.id}`, icon: "chat", title: "채팅", badge: careThread?.unread || undefined },
    { href: "/my/requests", icon: "clock", title: "진행 단계", badge: preparing.length || undefined },
  ];
  const groups: { title: string; items: MenuItem[] }[] = [
    { title: "프로그램", items: [
      { href: "/my/schedule", title: "일정·변경 요청", sub: started ? `다음 방문 ${md(patient.nextDate)} ${patient.nextTime}` : "선생님 연결 후 확인할 수 있어요" },
      { href: "/my/records", title: "회차 보고서·변화", sub: `확정된 보고서 ${records.length}건` },
      { onClick: () => setModal("report"), title: "월간 진행 보고서", sub: shared ? "병원에 공유됐어요" : "이번 달 보고서 요약", badge: records.length ? undefined : "준비 중" },
      { href: "/my/requests", title: "진행 단계·처방", sub: patient.prescription ? `${patient.doctor?.split(" ")[0]} 의사 · ~${md(patient.prescription.endDate)} · 주 ${patient.prescription.perWeek}회` : stage },
    ] },
    { title: "문의", items: [
      ...(patient.providerId ? [{ href: `/chat?c=care-${patient.id}`, title: `${patient.provider} 선생님`, sub: "프로그램·일정 문의", badge: careThread?.unread || undefined, alert: true }] : []),
      { href: `/chat?c=support-${me.id}`, title: "NOPIUM 운영팀", sub: "배정·이용 문의" },
    ] },
    { title: "보호자 안내", items: guides.map(g => ({ onClick: () => setGuide(g), title: g.title, sub: g.summary })) },
    { title: "설정", items: [{ href: "/my/sharing", title: "정보 공유·보호자 연결", sub: "공유 범위와 기관 동의" }] },
  ];

  const row = (m: MenuItem) => {
    const body = <><span><b>{m.title}</b>{m.sub && <small>{m.sub}</small>}</span><span className="sg-row-end">{m.badge !== undefined && <em className={`sg-badge ${m.alert ? "alert" : ""}`}>{m.badge}</em>}<Icon name="chevron" size={14} /></span></>;
    return m.href ? <Link key={m.title} href={m.href}>{body}</Link> : <button key={m.title} onClick={m.onClick}>{body}</button>;
  };

  return <div className="sg my-home">
    <h1 className="sg-h1">내 관리</h1>
    {head}
    <PatientSwitch />

    {notices.length > 0 && <div className="sg-notice" role="status">{notices.map(n => <div key={n.text} className="sg-notice-row"><Icon name="bell" size={16} /><span>{n.text}</span><Link href={n.href}>{n.label}<Icon name="chevron" size={13} /></Link></div>)}</div>}

    {/* 가장 중요한 카드 하나: 다음 방문 */}
    <section className="sg-card sg-feature">
      {patient.status === "종료" ? <Link className="sg-row" href="/my/requests">
        <span><small className="sg-state">종료 · {patient.closure?.at.slice(0, 10).replaceAll("-", ".")}</small><b>방문재활이 끝났어요</b><small>{patient.closure?.summary ?? "종료 소견을 확인해 보세요"}</small></span>
        <span className="sg-right">종료 소견<Icon name="chevron" size={14} /></span>
      </Link> : started && patient.providerId ? <Link className="sg-row" href="/my/schedule">
        <span><small className="sg-state on">다음 방문 · {dday(today, patient.nextDate)}</small><b className="sg-big">{md(patient.nextDate)} ({weekday(patient.nextDate)}) {patient.nextTime}</b><small>{placeName(upcomingPlace(patient))}{patient.nextPlace ? "(이번 회차만)" : ""} · {patient.provider} 선생님{request?.status === "요청" ? " · 변경 요청 확인 중" : ""}</small></span>
        <span className="sg-right">일정<Icon name="chevron" size={14} /></span>
      </Link> : <Link className="sg-row" href="/my/requests">
        <span><small className="sg-state warn">{patient.status}</small><b>{stage === "의뢰 접수" ? "병원이 담당 치료사를 정하고 있어요" : stage === "방문 전 평가" ? "치료사가 방문 전 평가를 준비하고 있어요" : "담당 의사가 방문 계획을 확인하고 있어요"}</b><small>{patient.condition}</small></span>
        <span className="sg-right">진행 단계<Icon name="chevron" size={14} /></span>
      </Link>}
      <StageSteps stage={stage} compact />
      {started && <p className="sg-progress-label" style={{ marginTop: 12 }}><span>{patient.doctor ? `${patient.doctor.split(" ")[0]} 의사 처방 · ${patient.prescription ? `~${md(patient.prescription.endDate)}` : ""}` : patient.condition}</span><b>방문 {patient.completed} / {patient.total}회</b></p>}
    </section>

    <nav className="sg-quick-menu" aria-label="바로가기">
      {quick.map(q => <Link key={q.title} href={q.href!}><span className="sg-qicon"><Icon name={q.icon!} size={20} />{q.badge ? <em>{q.badge}</em> : null}</span>{q.title}</Link>)}
    </nav>

    {latest && <>
      <h2 className="sg-title">최근 보고서</h2>
      <section className="sg-card">
        <Link className="sg-row" href={`/my/records#${latest.id}`}>
          <span><small className="sg-state">{latest.attendance ?? "참여"} · {latest.date.replaceAll("-", ".")}</small><b>{latest.sessionNo ? `${latest.sessionNo}회차` : latest.title}{latest.activities?.length ? ` · ${latest.activities.slice(0, 2).join("·")}` : ""}</b></span>
          <span className="sg-right">보고서<Icon name="chevron" size={14} /></span>
        </Link>
        <div className="sg-divider" />
        <p className="sg-measures">{recordMeasures(latest).filter(m => m.value !== null).slice(0, 3).map(m => { const d = measureDef(m.code); return <span key={m.code}>{d?.label} <b>{m.value}{d?.unit}</b></span>; })}</p>
        {highlight && <p className="sg-highlight">{highlight}</p>}
      </section>
    </>}

    {groups.map(g => g.items.length > 0 && <div key={g.title}>
      <h2 className="sg-title">{g.title}</h2>
      <section className="sg-card sg-list">{g.items.map(row)}</section>
    </div>)}
    {patient.hospital !== "직접 이용 신청" && <p className="sg-foot">진료·처방 관련 문의는 {patient.hospital}로 해 주세요.</p>}

    {modal === "report" && <ReportView patient={patient} readOnly onClose={() => setModal(null)} />}
    {guide && <Modal title={guide.title} onClose={() => setGuide(null)}><ul className="my-prep">{guide.body.map(b => <li key={b}><Icon name="check" size={15} />{b}</li>)}</ul><p className="form-hint">일반적인 안내예요. 대상자에게 맞는 방법은 담당 선생님께 확인해 주세요.</p></Modal>}
  </div>;
}
