"use client";
import { AssessmentCompare } from "@/components/AssessmentCompare";
import { sortedAssessments, compareAssessments, fallRisk } from "@/lib/assessment";
import { measureDef, measureSeries } from "@/lib/measures";
import { protocolById } from "@/lib/protocols";
import { md, outpatientFlags } from "@/lib/report";
import { todayLocal, useCare, type Patient, type Report } from "@/lib/repo";
import { DocHead, InfoTable, Section, Spark } from "./ReportParts";

const day = (iso?: string) => (iso ? iso.slice(0, 10).replaceAll("-", ".") : "");

/**
 * 외래 재평가 요약 (A4 1장, 담당의용). 제안서 STEP 4 "외래 진료 시 활용".
 * 입력 없이 평가·회차 기록에서 자동으로 만듭니다: 핵심 지표 전후 비교 → 외래에서 확인할 것 → 경과 → 치료사 제언.
 */
export function OutpatientSummary({ patient, source }: { patient: Patient; source?: Report["snapshot"] }) {
  const liveState = useCare();
  const state = source ? { ...liveState, records: source.records, assessments: source.assessments } : liveState;
  const today = todayLocal();
  const rx = patient.prescription;
  const protocol = protocolById(rx?.protocolId);
  const assessments = sortedAssessments(state.assessments.filter(a => a.patientId === patient.id));
  const baseline = assessments.find(a => a.period === "초기 평가") ?? assessments[0];
  const latest = assessments.length > 1 ? assessments[assessments.length - 1] : undefined;
  const rows = compareAssessments(baseline, latest);
  const flags = outpatientFlags(patient, state, rows);
  const recs = state.records.filter(r => r.patientId === patient.id && r.confirmed).sort((a, b) => a.date.localeCompare(b.date));
  const visits = recs.filter(r => r.attendance !== "미참여").length;
  const adverse = recs.filter(r => r.adverse?.occurred).length;
  const contraTotal = recs.filter(r => r.contraChecked !== undefined).length, contraOk = recs.filter(r => r.contraChecked).length;
  const left = rx ? Math.round((new Date(`${rx.endDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000) : null;
  const focus = protocol?.focusMeasures ?? [];
  const report = [...state.reports].filter(r => r.patientId === patient.id && r.opinion).sort((a, b) => (b.writtenAt ?? "").localeCompare(a.writtenAt ?? ""))[0];
  const risk = fallRisk((latest ?? baseline)?.measures);

  return <article className="rpt-doc rpt-one">
    <DocHead kind="OUTPATIENT RE-EVALUATION" title="외래 재평가 요약" subtitle="외래 진료 전에 한 장으로 보는 방문재활 경과" meta={[["기준일", day(today)], ["처방 기간", rx ? `${day(rx.startDate)} ~ ${day(rx.endDate)}` : "-"], ["남은 기간", left === null ? "-" : left >= 0 ? `${left}일` : "종료"], ["방문", `${visits}회 / ${patient.total}회`]]} />
    <InfoTable rows={[
      ["대상자", `${patient.name} (${patient.age}세 · ${patient.sex})`, "진단·프로그램", patient.condition],
      ["프로토콜", protocol ? `${protocol.dept} · ${protocol.label}` : "지정 안 함", "담당 치료사", patient.provider || "-"],
    ]} />

    <Section no={1} title="외래에서 확인할 것" note="자동 확인">
      {flags.length ? <ul className="rpt-flags">{flags.map(f => <li key={f}>{f}</li>)}</ul> : <p className="rpt-ok">특별히 확인할 사항이 없습니다.</p>}
    </Section>

    <Section no={2} title="기능 변화" note={latest ? `${baseline?.period} ${day(baseline?.date)} → ${latest.period} ${day(latest.date)}` : "평가 1회 · 회차 기록 추이"}>
      {latest ? <AssessmentCompare before={baseline} after={latest} only={r => r.group === "표준 점수" ? r.diff !== "-" || (focus as string[]).includes(r.key) : r.tone !== ""} /> : <table className="rpt-table"><thead><tr><th>항목</th><th>방문 전</th><th>최근 회차</th><th>추이</th></tr></thead><tbody>
        {(focus.length ? focus : ["walk_10m", "tug", "pain_nrs"]).map(code => { const def = measureDef(code); const series = measureSeries(recs, code).map(p => p.value); const base = baseline?.measures?.find(m => m.code === code)?.value ?? null; if (!def || (base === null && !series.length)) return null; return <tr key={code}>
          <td>{def.label}</td><td>{base ?? "–"}{base !== null && def.unit}</td><td>{series.length ? `${series[series.length - 1]}${def.unit}` : "–"}</td><td><Spark values={base !== null ? [base, ...series] : series} higherIsBetter={def.higherIsBetter} /></td>
        </tr>; })}
      </tbody></table>}
      {!latest && <p className="rpt-note">낙상 위험 참고(BBS·TUG 기준): <b>{risk.level}</b>{risk.reasons.length ? ` · ${risk.reasons.join(", ")}` : ""}</p>}
    </Section>

    <Section no={3} title="방문 경과">
      <div className="rpt-stats">
        <div><small>누적 방문</small><b>{visits}<em>회</em></b><span>{recs[0] ? `${md(recs[0].date)} ~ ${md(recs[recs.length - 1].date)}` : "기록 전"}</span></div>
        <div><small>이상 반응</small><b>{adverse}<em>건</em></b></div>
        <div><small>금기 확인</small><b>{contraTotal ? `${contraOk}/${contraTotal}` : "-"}</b></div>
        <div><small>주간 처방</small><b>{rx ? `주 ${rx.perWeek}` : "-"}<em>회</em></b></div>
      </div>
    </Section>

    <Section no={4} title="치료사 제언">
      <InfoTable rows={[["최근 소견", report?.opinion ?? recs[recs.length - 1]?.content ?? "-"], ["다음 계획", report?.plan || recs[recs.length - 1]?.next || "-"]]} />
    </Section>

    <p className="rpt-signline"><span>작성 · NPIUM 자동 요약 (담당 치료사 {patient.provider || "-"}, {day(today)})</span><span>확인 · 담당의 {patient.doctor ?? rx?.doctor ?? ""} <i>(서명)</i></span></p>
    <p className="rpt-foot">평가·회차 기록에서 자동으로 만든 요약이며 의료적 판단을 대신하지 않습니다.</p>
  </article>;
}
