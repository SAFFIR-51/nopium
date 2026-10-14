"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ReportView } from "@/components/CareUI";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { ExpertName } from "@/components/BusinessDetails";
import { daysLeft, hasAssessment, programStage, STAGES, type Stage } from "@/lib/program";
import { careRepo, type CareRecord, type Patient } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { useToday } from "@/lib/use-today";
import { placeName, upcomingPlace } from "@/lib/places";
import { AssignModal } from "../admin/AssignModal";
import { assignmentHistory, assignmentStage } from "@/lib/assignment";
import { AdverseReview, ClosureReview } from "./HospitalReviews";
import { HospitalHeading } from "./HospitalShell";
import { PlanReview } from "./PlanReview";
import { useHospitalCare } from "./use-hospital-care";

/**
 * 병원 연계형: 병원이 방문재활의 주체입니다.
 * 위: 지금 확인할 일(치료사 배정 → 처방 확인 → 이상 반응 → 기간 연장 → 종료 확인 → 연계 결과)
 * 아래: 단계별 연계 대상 목록.
 */
export function HospitalPatients() {
  const { state, patients, reports } = useHospitalCare();
  const today = useToday();
  const me = DEMO_ACCOUNTS.hospital;
  const [tab, setTab] = useState<Stage | "전체">("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [assign, setAssign] = useState<Patient | null>(null);
  const [closure, setClosure] = useState<Patient | null>(null);
  const [adverse, setAdverse] = useState<{ r: CareRecord; p: Patient } | null>(null);
  const [report, setReport] = useState<Patient | null>(null);

  const stageOf = (p: Patient) => programStage(state, p, today);
  const ids = new Set(patients.map(p => p.id));
  const byId = (id: string) => patients.find(p => p.id === id)!;
  const unreviewed = state.records.filter(r => ids.has(r.patientId) && r.confirmed && r.adverse?.occurred && !r.adverse.reviewedBy);
  const ending = today ? patients.filter(p => { const d = daysLeft(p, today); return p.status === "진행 중" && d !== null && d >= 0 && d <= 14 && (p.prescription?.extendedDays ?? 0) < 30 && !hasAssessment(state, p.id, "사후 평가"); }) : [];
  const toClose = patients.filter(p => p.status === "진행 중" && hasAssessment(state, p.id, "사후 평가"));
  const openLinks = state.linkages.filter(l => ids.has(l.patientId) && l.status === "의뢰");

  type Item = { key: string; kind: string; who: Patient; text: string; owner: string; action: ReactNode };
  const items: Item[] = [
    ...patients.filter(p => stageOf(p) === "의뢰 접수").map(p => { const st = assignmentStage(state, p.id); const last = assignmentHistory(state, p.id)[0];
      return st === "응답 대기" ? { key: `as-${p.id}`, kind: "치료사 응답 대기", who: p, text: `${last?.providerName}에게 요청 · 수락하면 방문 전 평가로 넘어가요`, owner: me.name, action: <button className="business-action" onClick={() => setAssign(p)}>다른 치료사</button> }
        : { key: `as-${p.id}`, kind: st === "재배정 필요" ? "재배정 필요" : "치료사 배정 필요", who: p, text: st === "재배정 필요" ? `${last?.providerName} 거절 · ${last?.reason ?? "사유 없음"}` : `${p.area} · ${p.method} · 시작 희망 ${p.nextDate}`, owner: me.name, action: <button className="business-action primary" onClick={() => setAssign(p)}>배정하기</button> }; }),
    ...patients.filter(p => stageOf(p) === "계획·의사 확인").map(p => ({ key: `rx-${p.id}`, kind: "처방 확인 필요", who: p, text: `방문 전 평가 완료 · 치료사 ${p.provider}`, owner: "담당 의사", action: <button className="business-action primary" onClick={() => setSelected(p)}>처방 확인</button> })),
    ...unreviewed.map(r => ({ key: `ad-${r.id}`, kind: "이상 반응 확인 필요", who: byId(r.patientId), text: `${r.date} ${r.sessionNo ?? ""}회차 · ${r.adverse?.detail ?? ""}`, owner: byId(r.patientId).doctor?.split(" ")[0] ?? "담당 의사", action: <button className="business-action primary" onClick={() => setAdverse({ r, p: byId(r.patientId) })}>의사 확인</button> })),
    ...ending.map(p => ({ key: `ex-${p.id}`, kind: "처방 기간 만료 임박", who: p, text: `${p.prescription!.endDate}까지 · ${daysLeft(p, today!)}일 남음 · 방문 ${p.completed}/${p.total}회`, owner: p.doctor?.split(" ")[0] ?? "담당 의사", action: <button className="business-action" onClick={() => careRepo.extendPrescription(p.id, 30, p.doctor ?? me.doctors[0])}>30일 연장</button> })),
    ...toClose.map(p => ({ key: `cl-${p.id}`, kind: "종료 확인 필요", who: p, text: `종료 평가 완료 · 방문 ${p.completed}회`, owner: p.doctor?.split(" ")[0] ?? "담당 의사", action: <button className="business-action primary" onClick={() => setClosure(p)}>종료 확인</button> })),
    ...openLinks.map(l => ({ key: `ln-${l.id}`, kind: "연계 결과 대기", who: byId(l.patientId), text: `${l.to} · ${l.reason}`, owner: me.socialWorker.split(" ")[0], action: <Link className="business-action" href="/hospital/linkage">결과 입력</Link> })),
  ];

  const rows = patients.filter(p => (tab === "전체" || stageOf(p) === tab) && `${p.name} ${p.condition} ${p.provider}`.includes(query.trim()))
    .sort((a, b) => sort === "date" ? a.nextDate.localeCompare(b.nextDate) : sort === "stage" ? STAGES.indexOf(stageOf(a)) - STAGES.indexOf(stageOf(b)) : a.name.localeCompare(b.name, "ko"));
  const count = (s: Stage) => patients.filter(p => stageOf(p) === s).length;

  return <div className="hospital-registry">
    <HospitalHeading title="연계 대상 관리" subtitle="퇴원 환자의 방문재활을 의뢰부터 종료·지역사회 연계까지 관리합니다." action={<Link href="/request" className="btn-primary">퇴원 환자 의뢰</Link>} />
    <div className="business-summary">
      <div><small>전체 대상</small><b>{patients.length}<span>명</span></b></div>
      <div><small>방문 재활 중</small><b>{count("방문 재활")}<span>명</span></b></div>
      <div><small>확인할 일</small><b>{items.length}<span>건</span></b></div>
      <div><small>공유 보고서</small><b>{reports.filter(r => r.shared).length}<span>건</span></b></div>
    </div>

    <section className="business-section"><div className="business-section-head"><h2>지금 확인할 일</h2><span>{items.length}건</span></div>
      <BusinessTable caption="확인할 일" columns={["구분", "대상자", "내용", "담당", "처리"]} empty={!items.length ? "지금 확인할 일이 없습니다." : undefined}>
        {items.map(i => <tr key={i.key}><td><BusinessStatus>{i.kind}</BusinessStatus></td><td><button className="business-name-link" onClick={() => setSelected(i.who)}>{i.who.name}</button><small>{i.who.condition}</small></td><td className="business-wrap">{i.text}</td><td className="business-nowrap">{i.owner}</td><td>{i.action}</td></tr>)}
      </BusinessTable>
    </section>

    <section className="business-section hospital-register-sheet">
      <div className="business-toolbar"><div className="business-filter">{(["전체", ...STAGES] as const).map(t => <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>{t} <span>{t === "전체" ? patients.length : count(t)}</span></button>)}</div>
        <div className="business-controls"><input placeholder="이름·프로그램·치료사 검색" aria-label="연계 대상 검색" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="연계 대상 정렬" value={sort} onChange={e => setSort(e.target.value)}><option value="name">이름순</option><option value="stage">단계순</option><option value="date">다음 일정순</option></select></div>
      </div>
      <div className="business-section-head"><h2>연계 대상 목록</h2><span>조회 {rows.length}명 / 전체 {patients.length}명</span></div>
      <BusinessTable caption="퇴원 후 연계 대상" columns={["대상자", "프로그램", "단계", "장소", "담당 의사", "담당 치료사", "처방 기간", "회차", "관리"]} empty={!rows.length ? "조건에 맞는 연계 대상이 없습니다." : undefined}>
        {rows.map(p => { const st = stageOf(p); const left = today ? daysLeft(p, today) : null; return <tr key={p.id}>
          <td><button className="business-name-link" onClick={() => setSelected(p)} aria-label={`${p.name} 대상자 정보`}>{p.name}</button><small>{p.age}세 · {p.sex}</small></td>
          <td>{p.condition}</td>
          <td><BusinessStatus>{st}</BusinessStatus></td>
          <td className="business-nowrap">{placeName(upcomingPlace(p))}<small>{p.nextPlace ? "이번 회차만 변경" : p.area}</small></td>
          <td className="business-nowrap">{p.doctor?.split(" ")[0] ?? "-"}</td>
          <td><ExpertName id={p.providerId} name={p.provider} /></td>
          <td className="business-nowrap">{p.prescription ? <>{p.prescription.endDate}까지<small>{p.status === "진행 중" && left !== null ? `${left}일 남음 · 주 ${p.prescription.perWeek}회` : `주 ${p.prescription.perWeek}회`}</small></> : "-"}</td>
          <td className="business-session-count">{p.completed} / {p.total}</td>
          <td><div className="business-actions"><button className="business-action" onClick={() => setSelected(p)}>{st === "계획·의사 확인" ? "처방 확인" : "상세 보기"}</button>{reports.find(r => r.patientId === p.id)?.shared && <button className="business-action" onClick={() => setReport(p)}>보고서</button>}</div></td>
        </tr>; })}
      </BusinessTable>
    </section>
    {selected && <PlanReview patient={selected} onClose={() => setSelected(null)} onReport={reports.find(r => r.patientId === selected.id)?.shared ? () => { setSelected(null); setReport(selected); } : undefined} />}
    {assign && <AssignModal state={state} patient={assign} onClose={() => setAssign(null)} />}
    {closure && <ClosureReview patient={closure} onClose={() => setClosure(null)} />}
    {adverse && <AdverseReview record={adverse.r} patient={adverse.p} onClose={() => setAdverse(null)} />}
    {report && <ReportView patient={report} readOnly onClose={() => setReport(null)} />}
  </div>;
}
