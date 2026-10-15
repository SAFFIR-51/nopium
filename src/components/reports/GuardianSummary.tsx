"use client";
import { upcomingPlace, placeName } from "@/lib/places";
import { buildMonthly, md, reportFor } from "@/lib/report";
import { useCare, type Patient } from "@/lib/repo";
import { DocHead, Section } from "./ReportParts";

const u = (unit: string) => (unit === "/10" ? "점" : unit);

/**
 * 보호자용 월간 요약: 같은 데이터를 쉬운 말로. 전문 용어·판정 표현 없이 "얼마나 만났는지 · 무엇이 좋아졌는지 · 집에서 할 일 · 다음 방문".
 */
export function GuardianSummary({ patient, month }: { patient: Patient; month: string }) {
  const state = useCare();
  const d = buildMonthly(state, patient, month);
  const report = reportFor(state, patient.id, d.period);
  const better = d.trends.filter(t => t.good === true).slice(0, 3);
  const watch = d.trends.filter(t => t.good === false).slice(0, 2);
  const last = d.recs[d.recs.length - 1];
  const rx = patient.prescription;
  return <article className="rpt-doc rpt-family">
    <DocHead kind="FAMILY REPORT" title={`${patient.name} 님의 ${Number(month.slice(5, 7))}월 이야기`} subtitle={`담당 ${patient.provider || "-"} 선생님 · ${patient.hospital}`} meta={[["만난 횟수", `${d.done}번`], ["함께한 시간", `${d.minutes}분`], ["쉰 날", `${d.absences.length}번`], ["다음 방문", patient.status === "진행 중" ? `${md(patient.nextDate)} ${patient.nextTime}` : "-"]]} />
    <Section title="이번 달 좋아진 점">
      {better.length ? <ul className="rpt-family-list good">{better.map(t => <li key={t.code}><b>{t.label}</b> {t.baseline ?? t.first}{u(t.unit)} → <b>{t.last}{u(t.unit)}</b>{t.unit === "초" ? " (더 빨라졌어요)" : ""}</li>)}</ul> : <p className="rpt-empty">비교할 기록이 아직 적어요. 기록이 쌓이면 보여 드릴게요.</p>}
    </Section>
    {watch.length > 0 && <Section title="함께 지켜볼 점"><ul className="rpt-family-list">{watch.map(t => <li key={t.code}><b>{t.label}</b> {t.baseline ?? t.first}{u(t.unit)} → {t.last}{u(t.unit)}</li>)}</ul></Section>}
    <Section title="선생님 한마디">
      <p className="rpt-quote">{report?.shared && report.opinion ? report.opinion : last?.content ?? "이번 달 기록이 아직 없어요."}</p>
    </Section>
    {d.education.length > 0 && <Section title="집에서 이렇게 도와주세요"><ul className="rpt-family-list">{d.education.map(e => <li key={e.date + e.text}>{e.text}</li>)}</ul></Section>}
    {(rx?.cautions?.length || rx?.contraindications?.length) ? <Section title="꼭 지켜 주세요"><ul className="rpt-family-list caution">{[...(rx?.contraindications ?? []).map(c => `${c} — 하지 않기`), ...(rx?.cautions ?? [])].map(c => <li key={c}>{c}</li>)}</ul></Section> : null}
    {patient.status === "진행 중" && <Section title="다음 방문"><p className="rpt-next"><b>{md(patient.nextDate)} {patient.nextTime}</b> · {placeName(upcomingPlace(patient))}{(report?.shared && report.plan) || last?.next ? <><br />{report?.shared && report.plan ? report.plan : last?.next}</> : null}</p></Section>}
    <p className="rpt-foot">회차마다 선생님이 남긴 기록을 모은 요약이에요. 궁금한 점은 채팅으로 물어봐 주세요.</p>
  </article>;
}
