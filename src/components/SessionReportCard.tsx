"use client";
import { Icon } from "@/components/Icon";
import { measureDef, recordMeasures } from "@/lib/measures";
import type { CareRecord } from "@/lib/repo";
import { placeName } from "@/lib/places";
import "./session-report.css";

const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;

/** 회차 보고서 읽기 화면 (보호자·선생님·기관 공통). */
export function SessionReportCard({ record, provider }: { record: CareRecord; provider?: string }) {
  const measures = recordMeasures(record);
  const measured = measures.filter(m => m.value !== null);
  const unmeasured = measures.filter(m => m.value === null).map(m => measureDef(m.code)?.label ?? m.code);
  return <article className="src">
    <header className="src-head">
      <div><b>{record.sessionNo ? `${record.sessionNo}회차` : record.title}</b><span>{md(record.date)}{provider ? ` · ${provider} 선생님` : ""}</span></div>
      <div className="src-tags">{record.attendance && <em className={`src-att ${record.attendance === "참여" ? "ok" : record.attendance === "미참여" ? "no" : "part"}`}>{record.attendance}</em>}{!!record.durationMin && <em>{record.durationMin}분</em>}{record.place && <em>{placeName(record.place)}</em>}{record.revisions?.length ? <em>정정 {record.revisions.length}회</em> : null}</div>
    </header>
    {record.activities?.length ? <p className="src-acts">{record.activities.map(a => <span key={a}>{a}</span>)}</p> : null}
    <p className="src-content">{record.content}</p>
    {measured.length > 0 && <table className="src-measures"><tbody>{measured.map(m => { const d = measureDef(m.code); return <tr key={m.code}><th>{d?.label ?? m.code}</th><td><b>{m.value}{d?.unit}</b>{m.note && <small>{m.note}</small>}</td></tr>; })}</tbody></table>}
    {unmeasured.length > 0 && record.attendance !== "미참여" && <p className="src-muted">미측정: {unmeasured.join(", ")}</p>}
    {record.adverse?.occurred && <p className="src-adverse"><Icon name="shield" size={14} /><span><b>이상 반응</b> {record.adverse.detail}<br /><b>조치</b> {record.adverse.action}</span></p>}
    {record.education && <p className="src-line"><b>보호자 안내</b>{record.education}</p>}
    <p className="src-line"><b>다음 계획</b>{record.next}</p>
    {record.revisions?.[0] && <p className="src-revised"><Icon name="file" size={13} /><span><b>정정됨</b> {md(record.revisions[0].at.slice(0, 10))} · {record.revisions[0].reason}{record.revisions[0].changes?.length ? ` (${record.revisions[0].changes.join(", ")})` : ""}</span></p>}
  </article>;
}
