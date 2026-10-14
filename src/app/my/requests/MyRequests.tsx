"use client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StageSteps } from "@/components/StageSteps";
import { programStage, stageTodo } from "@/lib/program";
import { useToday } from "@/lib/use-today";
import { PlaceInfo } from "@/components/PlaceInfo";
import { MySubHeader } from "../PatientShell";
import { selectPatient, usePatientCare } from "../use-patient-care";
import "../my-home-type.css";

/** 프로그램 진행 단계: 퇴원 병원이 주체인 6단계 중 지금 어디인지, 누가 무엇을 하고 있는지. */
export function MyRequests() {
  const { state, patients } = usePatientCare();
  const today = useToday();
  return <div className="sg my-home my-sub-view">
    <MySubHeader title="진행 단계" subtitle="퇴원한 병원이 프로그램을 맡고, 담당 의사의 처방 안에서 치료사가 방문해요" />
    {patients.length ? patients.map(p => {
      const stage = programStage(state, p, today);
      const todo = stageTodo(stage);
      const links = state.linkages.filter(l => l.patientId === p.id);
      return <section className="sg-card" key={p.id}>
        <div className="sg-row static"><span><small className="sg-state on">{stage}</small><b>{p.name} 님 · {p.condition}</b><small>{p.hospital}{p.doctor ? ` · 담당 의사 ${p.doctor.split(" ")[0]}` : ""}{p.provider ? ` · 치료사 ${p.provider}` : ""}</small></span></div>
        <div style={{ marginTop: 16 }}><StageSteps stage={stage} /></div>
        {stage === "계획·의사 확인" && p.approval?.status === "반려" && <p className="sg-change warn">담당 의사가 계획 보완을 요청했어요. 치료사가 다시 확인하고 있어요.</p>}
        {p.prescription && <div className="sg-rx"><div><small>처방 기간</small><b>{p.prescription.startDate.slice(5).replace("-", ".")} ~ {p.prescription.endDate.slice(5).replace("-", ".")}</b></div><div><small>방문</small><b>주 {p.prescription.perWeek}회 · {p.completed}/{p.total}회</b></div><div><small>치료 범위</small><b>{p.prescription.scope.slice(0, 3).join("·")}{p.prescription.scope.length > 3 ? " 외" : ""}</b></div></div>}
        {p.status !== "종료" && <PlaceInfo patient={p} place={p.place} map={false} />}
        {p.closure && <p className="sg-change"><Icon name="check" size={14} />{p.closure.summary}</p>}
        {links.map(l => <p className="sg-change" key={l.id}><Icon name="link" size={14} />{l.to} 연계 {l.status === "연계 완료" ? `완료 · ${l.result}` : "요청됨 · 기관에서 연락드릴 거예요"}</p>)}
        {(stage === "방문 재활" || stage === "종료 평가") && <><div className="sg-divider" /><Link className="sg-link" href="/my/schedule" onClick={() => selectPatient(p.id)}>일정 보기</Link></>}
        <p className="sr">{todo.who} {todo.what}</p>
      </section>;
    }) : <section className="sg-card sg-empty">연결된 프로그램이 없어요. 퇴원 병원에 방문재활 연계를 요청해 보세요.</section>}
    <p className="sg-foot">진료·처방 관련 문의는 퇴원한 병원으로, 이용 문의는 NOPIUM 운영팀으로 해 주세요.</p>
  </div>;
}
