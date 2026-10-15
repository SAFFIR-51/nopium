import type { ReactNode } from "react";
import type { Judgment } from "@/lib/report";

/** 보고서 공통 조각: 서식 머리, 정보 표, 번호 붙은 절, 판정 체크, 작은 추이 그래프, 서명란 */
export function DocHead({ kind, title, subtitle, meta }: { kind: string; title: string; subtitle?: string; meta: [string, string][] }) {
  return <header className="rpt-head">
    <div className="rpt-brand"><b>NPIUM</b><span>{kind}</span></div>
    <h3>{title}</h3>
    {subtitle && <p className="rpt-sub">{subtitle}</p>}
    <dl className="rpt-meta">{meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
  </header>;
}

export function InfoTable({ rows }: { rows: [string, ReactNode, string?, ReactNode?][] }) {
  return <table className="rpt-info"><tbody>{rows.map(([k1, v1, k2, v2], i) => <tr key={i}>
    <th>{k1}</th><td colSpan={k2 ? 1 : 3}>{v1}</td>
    {k2 && <><th>{k2}</th><td>{v2}</td></>}
  </tr>)}</tbody></table>;
}

export function Section({ no, title, note, children }: { no?: number; title: string; note?: string; children: ReactNode }) {
  return <section className="rpt-sec"><h4>{no ? <span className="rpt-no">{no}</span> : null}{title}{note && <small>{note}</small>}</h4>{children}</section>;
}

/** ■개선 □유지 □악화 형태의 판정 (서식 느낌). onPick이 있으면 눌러서 바꿀 수 있어요. */
export function JudgmentMarks({ value, auto, onPick }: { value?: Judgment; auto?: Judgment; onPick?: (j: Judgment) => void }) {
  return <span className="rpt-judge">{(["개선", "유지", "악화"] as Judgment[]).map(j => {
    const on = value === j;
    const cls = `rpt-mark ${on ? `on ${j === "개선" ? "good" : j === "악화" ? "bad" : ""}` : ""}`;
    return onPick ? <button type="button" key={j} className={cls} aria-pressed={on} onClick={() => onPick(j)}>{on ? "■" : "□"} {j}</button> : <span key={j} className={cls}>{on ? "■" : "□"} {j}</span>;
  })}{auto && value && auto !== value && <small className="rpt-auto">자동 판정 {auto}</small>}</span>;
}

/** 작은 추이 그래프 (인쇄해도 보이도록 SVG) */
export function Spark({ values, higherIsBetter }: { values: number[]; higherIsBetter: boolean }) {
  if (values.length < 2) return <span className="rpt-spark-empty">–</span>;
  const w = 72, h = 22, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (w - 4) + 2},${h - 2 - ((v - min) / span) * (h - 4)}`).join(" ");
  const last = values[values.length - 1], first = values[0];
  const good = last === first ? null : higherIsBetter ? last > first : last < first;
  const [lx, ly] = pts.split(" ").pop()!.split(",");
  return <svg className={`rpt-spark ${good === null ? "" : good ? "good" : "bad"}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><polyline points={pts} fill="none" strokeWidth="1.5" /><circle cx={lx} cy={ly} r="2.2" /></svg>;
}

export function SignRow({ cells }: { cells: { role: string; name?: string; date?: string; stamp?: string }[] }) {
  return <div className="rpt-sign">{cells.map(c => <div key={c.role}>
    <span>{c.role}</span>
    <b>{c.name ?? " "}</b>
    <em>{c.date ?? " "}</em>
    {c.stamp ? <i className="rpt-stamp">{c.stamp}</i> : <i className="rpt-stamp empty">(서명)</i>}
  </div>)}</div>;
}
