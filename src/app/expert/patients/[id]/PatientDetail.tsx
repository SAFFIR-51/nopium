"use client";
import { usePageValue, usePageItem } from "@/lib/page-view";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { savedTimeLabel } from "@/components/CareUI";
import { ReportView } from "@/components/reports/ReportView";
import { AssessmentForm } from "@/components/AssessmentForm";
import { AssessmentCompare, AssessmentDetail } from "@/components/AssessmentCompare";
import { assessmentSummary, sortedAssessments } from "@/lib/assessment";
import { Icon } from "@/components/Icon";
import { SessionReportForm } from "@/components/SessionReportForm";
import { SessionReportCard } from "@/components/SessionReportCard";
import { MeasureTrend } from "@/components/MeasureTrend";
import { StageSteps } from "@/components/StageSteps";
import { daysLeft, programStage, visitsInWeek } from "@/lib/program";
import { measureDef, recordMeasures } from "@/lib/measures";
import { PlaceInfo } from "@/components/PlaceInfo";
import { ContraBox } from "@/components/ContraBox";
import { useToday } from "@/lib/use-today";
import { ExpertSubHeader } from "../../ExpertShell";
import { useProviderCare } from "../../use-provider-care";

const stamp = (iso?: string) => (iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const md = (iso: string) => iso.slice(5).replace("-", ".");
const SHOW = 4;

/**
 * 담당 대상 상세: 보호자 홈과 같은 한 열 구성.
 * 요약(단계·처방·장소·지금 할 일) → 회차 보고서 → 측정값 추이 → 평가 기록 → 목표 → 메뉴.
 */
export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useProviderCare();
  const [modal, setModal] = usePageValue<"record" | "assessment" | "initial" | "final" | "report">("care");
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const today = useToday();
  const [correcting, setCorrecting] = usePageItem("record-correction", (data?.state.records ?? []).filter(r => r.patientId === id), r => r.id);
  if (!data) return null;
  const patient = data.patients.find(p => p.id === id);
  // 담당 대상이 아니면 내용을 보여주지 않습니다. (서버 구현에서는 서버에서 차단)
  if (!patient) return <div className="sg sg-work my-home my-sub-view"><section className="sg-card sg-empty"><Icon name="shield" size={28} /><p style={{ marginTop: 8 }}>담당으로 배정된 대상만 확인할 수 있어요.</p><Link href="/expert/patients">담당 대상으로 돌아가기</Link></section></div>;
  const records = data.state.records.filter(r => r.patientId === patient.id).sort((a, b) => (b.updatedAt ?? b.date).localeCompare(a.updatedAt ?? a.date));
  const confirmed = records.filter(r => r.confirmed).length;
  const shown = all ? records : records.slice(0, SHOW);
  const latestId = records.find(r => r.confirmed)?.id;
  const assessments = sortedAssessments(data.state.assessments.filter(a => a.patientId === patient.id));
  const firstAssessment = assessments.find(a => a.period === "초기 평가") ?? assessments[0];
  const lastAssessment = assessments.length > 1 ? assessments[assessments.length - 1] : undefined;
  const hasDraft = records.some(r => !r.confirmed);
  const stage = programStage(data.state, patient, today);
  // 의사 확인(처방) 전에는 회차 보고서를 쓸 수 없습니다. (의료기사법: 의사 지도 아래에서만 방문)
  const canRecord = patient.status === "진행 중" && stage === "방문 재활";
  const rx = patient.prescription;
  const left = today ? daysLeft(patient, today) : null;
  const weekVisits = today ? visitsInWeek(data.state.records, patient.id, today) : 0;
  const ended = patient.status === "종료";
  const stageAction = stage === "방문 전 평가" ? <button className="primary" onClick={() => setModal("initial")}>방문 전 평가 기록하기</button>
    : stage === "종료 평가" && !assessments.some(a => a.period === "사후 평가") ? <button className="primary" onClick={() => setModal("final")}>종료 평가 기록하기</button>
    : canRecord ? <button className="primary" onClick={() => setModal("record")}>{hasDraft ? "작성 중인 보고서 이어쓰기" : "회차 보고서 작성"}</button>
    : <button onClick={() => setModal("report")}>월간 보고서</button>;
  const notices = [
    patient.status === "승인 대기" && patient.approval?.status === "반려" && { icon: "chat" as const, text: `${patient.approval.by} 계획 보완 요청: ${patient.approval.reason}` },
    stage === "계획·의사 확인" && { icon: "shield" as const, text: "방문 전 평가를 병원에 보냈어요. 담당 의사가 처방을 확인하면 방문을 시작해요." },
    stage === "종료 평가" && assessments.some(a => a.period === "사후 평가") && { icon: "check" as const, text: "종료 평가를 저장했어요. 병원이 종료를 확인하면 프로그램이 끝나요." },
    ended && patient.closure && { icon: "check" as const, text: `${patient.closure.by} 종료 확인 · ${patient.closure.summary}` },
  ].filter(Boolean) as { icon: "chat" | "shield" | "check"; text: string }[];

  if (modal === "record") return <SessionReportForm patient={patient} author={data.ref} onClose={() => setModal(null)} />;
  if (modal === "assessment") return <AssessmentForm patient={patient} by={data.ref.name} onClose={() => setModal(null)} />;
  if (modal === "initial") return <AssessmentForm patient={patient} period="초기 평가" by={data.ref.name} onClose={() => setModal(null)} />;
  if (modal === "final") return <AssessmentForm patient={patient} period="사후 평가" by={data.ref.name} onClose={() => setModal(null)} />;
  if (modal === "report") return <ReportView patient={patient} onClose={() => setModal(null)} />;
  if (correcting) return <SessionReportForm patient={patient} author={data.ref} correcting={correcting} onClose={() => setCorrecting(null)} />;
  return <div className="sg sg-work my-home my-sub-view">
    <ExpertSubHeader title={`${patient.name} 님`} subtitle={`${patient.age}세 · ${patient.sex} · ${patient.hospital}`} back="/expert/patients" backLabel="담당 대상으로 돌아가기" />

    {notices.length > 0 && <div className="sg-notice" style={{ margin: "0 0 8px" }}>{notices.map(n => <p className="sg-notice-row" key={n.text}><Icon name={n.icon} size={15} /><span>{n.text}</span></p>)}</div>}

    <section className="sg-card">
      <div className="sg-row static"><span>
        <small className={`sg-state ${ended ? "off" : stage === "방문 재활" ? "on" : "warn"}`}>{stage}{!ended && ` · 다음 방문 ${md(patient.nextDate)} ${patient.nextTime}`}</small>
        <b className="sg-big">{patient.condition}</b>
        <small>{patient.hospital} · 방문 {patient.completed}/{patient.total}회</small>
      </span></div>
      <StageSteps stage={stage} />
      <div className="sg-rx">
        <div><small>담당 의사</small><b>{patient.doctor?.split(" ")[0] ?? "확인 전"}</b></div>
        <div><small>처방 기간</small><b>{rx ? `~${md(rx.endDate)}${left !== null && !ended ? ` · ${left >= 0 ? `${left}일 남음` : "종료"}` : ""}` : "확인 전"}</b></div>
        <div><small>이번 주 방문</small><b>{rx ? `${weekVisits} / ${rx.perWeek}회` : "-"}</b></div>
      </div>
      {rx && <p className="sg-change"><Icon name="file" size={14} />처방 범위 {rx.scope.join(" · ")}{rx.note ? ` · ${rx.note}` : ""}</p>}
      <div className="sg-divider" />
      <PlaceInfo patient={patient} full={!ended} changed={!!patient.nextPlace} />
      {patient.homeAccess && !ended && <p className="sg-caution"><Icon name="pin" size={14} />{patient.homeAccess} · 출입 비밀번호는 채팅으로만 받아요</p>}
      <p className="sg-caution"><Icon name="shield" size={14} />{patient.precautions}</p>
      {!ended && <ContraBox rx={rx} showOpinion />}
      <div className="sg-actions"><Link href={`/chat?c=care-${patient.id}`}>보호자와 채팅</Link>{stageAction}</div>
    </section>

    <h2 className="sg-title">회차 보고서 <span>{confirmed}</span></h2>
    {records.length ? <>
      {shown.map(r => <section key={r.id} className="sg-card sg-report">
        {r.confirmed && r.id !== latestId && !open.has(r.id) ? <button className="sg-row" aria-expanded="false" onClick={() => setOpen(s => new Set(s).add(r.id))}>
          <span><small className={`sg-state ${r.adverse?.occurred ? "warn" : ""}`}>{r.attendance ?? "기록"} · {md(r.date)}{r.durationMin ? ` · ${r.durationMin}분` : ""}{r.adverse?.occurred ? " · 이상 반응" : ""}{r.revisions?.length ? " · 정정됨" : ""}</small>
            <b>{r.sessionNo ? `${r.sessionNo}회차` : r.title}{r.activities?.length ? ` · ${r.activities.slice(0, 2).join("·")}` : ""}</b>
            <small className="sg-measures">{recordMeasures(r).filter(m => m.value !== null).slice(0, 3).map(m => { const d = measureDef(m.code); return <span key={m.code}>{d?.label} <b>{m.value}{d?.unit}</b></span>; })}</small></span>
          <span className="sg-right plain">펼치기<Icon name="chevron" size={14} className="down" /></span>
        </button> : r.confirmed ? <SessionReportCard record={r} /> : <div className="sg-row static"><span><small className="sg-state warn">작성 중 · 임시 저장 {savedTimeLabel(r.updatedAt)}</small><b>{r.sessionNo ? `${r.sessionNo}회차` : "새 회차"} 보고서</b><small>확정 전에는 보호자·기관에 보이지 않아요</small></span>{canRecord && <button className="sg-btn primary" onClick={() => setModal("record")}>이어서 작성</button>}</div>}
        {(r.id === latestId || open.has(r.id) || !r.confirmed) && r.revisions?.length ? <div className="revision-list">{r.revisions.map((v, i) => <div key={i}><b>{stamp(v.at)} · {v.by}</b> — {v.reason}{v.changes?.length ? <span className="rev-changes">{v.changes.map(c => <span key={c}>{c}</span>)}</span> : <><br />이전 내용: {v.content}</>}</div>)}</div> : null}
        {r.confirmed && (r.id === latestId || open.has(r.id)) && <div className="sg-report-foot"><span>{r.id === latestId ? "확정 후 고칠 때는 사유가 함께 남아요" : <button className="sg-link muted" onClick={() => setOpen(s => { const n = new Set(s); n.delete(r.id); return n; })}>접기</button>}</span><button className="sg-link" onClick={() => setCorrecting(r)}>정정</button></div>}
      </section>)}
      {records.length > SHOW && <button className="sg-more inline" onClick={() => setAll(v => !v)}>{all ? "접기" : `이전 보고서 ${records.length - SHOW}건 더 보기`}</button>}
    </> : <section className="sg-card sg-empty">{canRecord ? "첫 회차 보고서를 써 주세요." : "처방 확인 후 회차 보고서를 쓸 수 있어요."}</section>}

    <h2 className="sg-title">측정값 추이</h2>
    <section className="sg-card"><MeasureTrend records={records} /></section>

    <h2 className="sg-title">평가 기록 <span>{assessments.length}</span>{canRecord && <button className="sg-btn" style={{ marginLeft: "auto" }} onClick={() => setModal("assessment")}>중간 평가 기록</button>}</h2>
    {lastAssessment && firstAssessment && firstAssessment.id !== lastAssessment.id && <section className="sg-card" style={{ marginBottom: 8 }}><div className="sg-row static"><span><small className="sg-state">변화 비교</small><b>방문 전 → 최근 평가</b></span></div><AssessmentCompare before={firstAssessment} after={lastAssessment} /></section>}
    {assessments.length ? <section className="sg-card sg-list">{[...assessments].reverse().map(a => <div className="sg-list-static" key={a.id}><span style={{ minWidth: 0 }}>
      <b>{a.period} · {a.date}{a.by ? ` · ${a.by}` : ""}</b>
      <small>{(a.measures ?? []).filter(m => m.value !== null).map(m => `${measureDef(m.code)?.label ?? m.code} ${m.value}${measureDef(m.code)?.unit ?? ""}`).join(" · ") || (assessmentSummary(a) ? "" : "측정 항목 없음")}</small>
      <AssessmentDetail a={a} />
    </span></div>)}</section> : <section className="sg-card sg-empty">방문 전 평가를 기록해 주세요.</section>}

    <h2 className="sg-title">목표</h2>
    <section className="sg-card">
      <div className="sg-row static"><span><small className="sg-state">프로그램 목표</small><b>{patient.goal}</b></span></div>
      <div className="sg-progress"><span style={{ width: `${Math.min(100, (patient.completed / patient.total) * 100)}%` }} /></div>
      <div className="sg-progress-label"><span>진행</span><span><b>{patient.completed}</b> / {patient.total}회</span></div>
    </section>

    <section className="sg-card sg-list" style={{ marginTop: 20 }}>
      <button onClick={() => setModal("report")}><span><b>월간 진행 보고서</b><small>이번 달 회차 보고서를 모아 병원에 공유해요</small></span><Icon name="chevron" size={16} /></button>
      <Link href={`/chat?c=care-${patient.id}`}><span><b>보호자와 채팅</b><small>일정·출입 방법은 채팅으로만 주고받아요</small></span><Icon name="chevron" size={16} /></Link>
    </section>







  </div>;
}
