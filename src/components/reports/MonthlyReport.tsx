"use client";
import { mutationFailed } from "@/lib/repo";
import { useHospitalAccount } from "@/lib/demo-session";
import { useState } from "react";
import { placeName } from "@/lib/places";
import { DOMAINS, buildMonthly, draftOpinion, draftPlan, md, monthLabel, reportFor, type Judgment } from "@/lib/report";
import { measureDef, recordMeasures } from "@/lib/measures";
import { careRepo, todayLocal, useCare, type Patient } from "@/lib/repo";
import { DEMO_MODE } from "@/lib/session";
import { DocHead, InfoTable, JudgmentMarks, Section, SignRow, Spark } from "./ReportParts";

const day = (iso?: string) => (iso ? iso.slice(0, 10).replaceAll("-", ".") : "");

/**
 * 방문재활 월간 경과 보고서 (병원 제출용).
 * 자동: 대상자·처방 정보, 방문 현황, 기능 변화표·추이, 영역별 판정, 회차별 기록, 안전·금기 준수, 보호자 교육.
 * 치료사 입력: 종합 소견, 다음 달 계획 (자동 초안 버튼), 판정 바꾸기.
 */
export function MonthlyReport({ patient: livePatient, month, mode, reportId }: { patient: Patient; month: string; mode: "edit" | "hospital" | "view"; reportId?: string }) {
  const liveState = useCare();
  const saved = liveState.reports.find(r => r.id === reportId) ?? reportFor(liveState, livePatient.id, monthLabel(month));
  const patient = saved?.snapshot?.patient ?? livePatient;
  const state = saved?.snapshot ? { ...liveState, records: saved.snapshot.records, assessments: saved.snapshot.assessments } : liveState;
  const d = buildMonthly(state, patient, month);
  const locked = !!saved?.shared;
  const editing = mode === "edit" && !locked;
  const [opinion, setOpinion] = useState(saved?.opinion ?? "");
  const [plan, setPlan] = useState(saved?.plan ?? "");
  const [judgments, setJudgments] = useState<Record<string, Judgment>>(saved?.judgments ?? {});
  const [tried, setTried] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const rx = patient.prescription;
  const judged = (key: string) => judgments[key] ?? d.autoJudgments[key];
  const rate = d.planned ? Math.round((d.done / d.planned) * 100) : null;
  const status = saved?.confirmedAt ? "담당의 확인" : locked ? "병원 공유됨" : saved?.writtenAt ? "작성 중 (임시 저장)" : "작성 전";
  const me = useHospitalAccount();
  const doctor = patient.doctor ?? rx?.doctor ?? me.doctors[0];
  const canShare = patient.consent && d.recs.length > 0;
  const save = async (share: boolean) => {
    if (share && !opinion.trim()) { setTried(true); return; }
    if (mutationFailed(await careRepo.saveReport(patient.id, d.period, { opinion: opinion.trim(), plan: plan.trim(), judgments, writtenBy: patient.provider }, share && DEMO_MODE))) return;
    setSavedNote(share && DEMO_MODE ? "확정하고 병원에 공유했어요." : "저장했어요. NPIUM 관리자가 원기록을 취합·검토해 병원에 제공합니다.");
  };
  const fill = () => { setOpinion(draftOpinion(patient, d)); if (!plan.trim()) setPlan(draftPlan(d)); };

  return <>
    <article className="rpt-doc">
      <DocHead kind="MONTHLY REHAB REPORT" title="방문재활 월간 경과 보고서" subtitle={`${patient.hospital} 제출용 · v${saved?.version ?? 1}${saved?.supersededById ? " · 이전 제공본" : ""}`} meta={[["문서번호", saved?.id || `NP-${month.replace("-", "")}-${patient.id.toUpperCase()}`], ["보고 기간", d.period], ["작성일", day(saved?.writtenAt) || day(todayLocal())], ["상태", status]]} />
      {saved?.correctionReason && <p className="rpt-note">정정 사유: {saved.correctionReason} · 이전 제공본 {saved.supersedesId}</p>}
      <InfoTable rows={[
        ["대상자", `${patient.name} (${patient.age}세 · ${patient.sex})`, "진단·프로그램", patient.condition],
        ["프로토콜", d.protocol ? `${d.protocol.dept} · ${d.protocol.label}` : "지정 안 함", "담당의", doctor],
        ["담당 치료사", patient.provider || "-", "처방 기간", rx ? `${day(rx.startDate)} ~ ${day(rx.endDate)} · 주 ${rx.perWeek}회` : "-"],
        ["방문 장소", d.places.join(", ") || (patient.place ? placeName(patient.place) : "-"), "진행 회차", `누적 ${patient.completed} / ${patient.total}회`],
        ["프로그램 목표", patient.goal],
      ]} />

      <Section no={1} title="방문 현황">
        <div className="rpt-stats">
          <div><small>실시</small><b>{d.done}<em>회</em></b>{d.planned !== null && <span>계획 {d.planned}회{rate !== null ? ` · 이행 ${rate}%` : ""}</span>}</div>
          <div><small>부분 참여</small><b>{d.recs.filter(r => r.attendance === "부분 참여").length}<em>회</em></b></div>
          <div><small>미참여</small><b>{d.absences.length}<em>회</em></b>{d.absences[0] && <span>{d.absences.map(a => `${md(a.date)} ${a.reason}`).join(", ")}</span>}</div>
          <div><small>총 진행 시간</small><b>{d.minutes}<em>분</em></b>{d.done > 0 && <span>회당 평균 {Math.round(d.minutes / d.done)}분</span>}</div>
        </div>
      </Section>

      <Section no={2} title="기능 변화" note={d.baseline ? `방문 전 평가 ${day(d.baseline.date)} 기준` : "이 달 첫 기록 기준"}>
        {d.trends.length ? <table className="rpt-table"><thead><tr><th>항목</th><th>방문 전</th><th>이달 첫 기록</th><th>이달 최근</th><th>변화</th><th>추이</th></tr></thead><tbody>
          {d.trends.map(t => { const def = measureDef(t.code); const u = t.unit === "/10" ? "점" : t.unit; return <tr key={t.code}>
            <td>{t.label}</td><td>{t.baseline ?? "–"}{t.baseline !== null && u}</td><td>{t.first ?? "–"}{t.first !== null && u}</td><td><b>{t.last ?? "–"}{t.last !== null && u}</b></td>
            <td className={t.good === null ? "" : t.good ? "good" : "bad"}>{t.diff === null ? "–" : `${t.diff > 0 ? "+" : ""}${t.diff}${u}`}</td>
            <td><Spark values={t.series} higherIsBetter={!!def?.higherIsBetter} /></td>
          </tr>; })}
        </tbody></table> : <p className="rpt-empty">이 달 측정값이 없습니다.</p>}
        <table className="rpt-table rpt-judge-table"><thead><tr><th>영역</th><th>근거 지표</th><th>판정 {editing && <small>눌러서 바꿀 수 있어요</small>}</th></tr></thead><tbody>
          {DOMAINS.filter(dm => d.autoJudgments[dm.key] || judgments[dm.key]).map(dm => <tr key={dm.key}>
            <td>{dm.label}</td>
            <td>{d.trends.filter(t => dm.codes.includes(t.code) && t.diff !== null).map(t => t.label).join(", ")}</td>
            <td><JudgmentMarks value={judged(dm.key)} auto={d.autoJudgments[dm.key]} onPick={editing ? j => setJudgments(v => ({ ...v, [dm.key]: j })) : undefined} /></td>
          </tr>)}
        </tbody></table>
        {d.risk.before.level !== "판단 자료 없음" && <p className="rpt-note">낙상 위험 참고(BBS·TUG 기준): <b>{d.risk.before.level}</b>{d.latestAssessment ? <> → <b>{d.risk.after.level}</b> ({d.latestAssessment.period} {day(d.latestAssessment.date)})</> : null}</p>}
      </Section>

      <Section no={3} title="회차별 운동 기록">
        {d.recs.length ? <table className="rpt-table rpt-sessions"><thead><tr><th>회차</th><th>날짜</th><th>시간</th><th>장소</th><th>진행 활동</th><th>주요 측정</th><th>특이사항</th></tr></thead><tbody>
          {d.recs.map(r => <tr key={r.id}>
            <td>{r.sessionNo ?? "-"}</td><td>{md(r.date)}</td><td>{r.attendance === "미참여" ? "-" : `${r.durationMin ?? 0}분`}</td><td>{placeName(r.place ?? patient.place)}</td>
            <td>{r.attendance === "미참여" ? "미참여" : (r.activities ?? []).join(", ") || "-"}</td>
            <td>{recordMeasures(r).filter(m => m.value !== null).slice(0, 3).map(m => `${measureDef(m.code)?.label ?? m.code} ${m.value}${measureDef(m.code)?.unit ?? ""}`).join(" · ") || "-"}</td>
            <td className={r.adverse?.occurred ? "bad" : ""}>{[r.adverse?.occurred && `이상 반응: ${r.adverse.detail}`, r.attendance === "미참여" && r.absenceReason, r.attendance === "부분 참여" && "부분 참여", r.revisions?.length && "정정됨"].filter(Boolean).join(" · ") || "-"}</td>
          </tr>)}
        </tbody></table> : <p className="rpt-empty">확정된 회차 기록이 없습니다.</p>}
      </Section>

      <Section no={4} title="안전 관리">
        <InfoTable rows={[
          ["이상 반응", d.adverse.length ? d.adverse.map(r => `${md(r.date)} ${r.adverse?.detail} → ${r.adverse?.action}${r.adverse?.reviewedBy ? ` (확인: ${r.adverse.reviewedBy})` : ""}`).join(" / ") : "없음"],
          ["금기 운동 확인", d.contraTotal ? `${d.contraOk} / ${d.contraTotal}회 확인${d.contraOk < d.contraTotal ? " · 확인 안 된 회차 있음" : ""}` : rx?.contraindications?.length ? "이 달 기록 없음" : "지정된 금기 없음"],
          ["병원 주의사항", (rx?.cautions?.length ? rx.cautions.join(" · ") : patient.precautions) || "-"],
        ]} />
      </Section>

      {d.education.length > 0 && <Section no={5} title="보호자 교육">
        <ul className="rpt-list">{d.education.map(e => <li key={e.date + e.text}><b>{md(e.date)}</b> {e.text}</li>)}</ul>
      </Section>}

      <Section no={d.education.length ? 6 : 5} title="종합 소견 및 다음 달 계획" note={editing ? "치료사가 쓰는 부분이에요" : undefined}>
        {editing ? <div className="rpt-edit">
          <div className="rpt-edit-head"><span>종합 소견</span><button type="button" className="rpt-draft" onClick={fill}>기록으로 초안 채우기</button></div>
          <textarea rows={4} value={opinion} onChange={e => setOpinion(e.target.value)} placeholder="이번 달 변화와 반응을 적어 주세요. '기록으로 초안 채우기'를 누르면 숫자로 확인된 내용이 문장으로 들어가요." aria-label="종합 소견" />
          {tried && !opinion.trim() && <p className="rpt-error">종합 소견을 적어 주세요.</p>}
          <div className="rpt-edit-head"><span>다음 달 계획</span></div>
          <textarea rows={3} value={plan} onChange={e => setPlan(e.target.value)} placeholder="다음 달 목표·중점 활동" aria-label="다음 달 계획" />
        </div> : <InfoTable rows={[["종합 소견", saved?.opinion || <span className="rpt-empty">작성 전</span>], ["다음 달 계획", saved?.plan || "-"]]} />}
      </Section>

      <SignRow cells={[
        { role: "작성 · 담당 치료사", name: saved?.writtenBy ?? patient.provider, date: day(saved?.sharedAt ?? saved?.writtenAt), stamp: locked ? "작성" : undefined },
        { role: "확인 · 담당의", name: saved?.confirmedBy ?? doctor, date: day(saved?.confirmedAt), stamp: saved?.confirmedAt ? "확인" : undefined },
      ]} />
      <p className="rpt-foot">이 보고서는 회차 보고서에 기록된 값을 모은 것이며 의료적 판단을 대신하지 않습니다. 원본 회차 기록과 정정 이력은 NPIUM에 보관됩니다.</p>
    </article>

    <div className="rpt-actions">
      <span className={locked ? "shared-label" : "muted"}>{savedNote || (locked ? `병원 공유 ${day(saved?.sharedAt)}${saved?.confirmedAt ? ` · 담당의 확인 ${day(saved.confirmedAt)}` : ""}` : !patient.consent ? "정보 공유 동의가 없어 병원에 공유할 수 없어요" : "확정하면 병원 화면에서 볼 수 있어요")}</span>
      <div>
        {editing && <><button className="btn-ghost" onClick={() => save(false)}>임시 저장</button><button className="btn-primary" disabled={!canShare} onClick={() => save(true)}>확정하고 병원에 공유</button></>}
        {mode === "hospital" && locked && saved && !saved.confirmedAt && <button className="btn-primary" onClick={async () => await careRepo.confirmReportVersion(saved.id, `${doctor} · ${me.organization}`)}>담당의 확인</button>}
      </div>
    </div>
  </>;
}
