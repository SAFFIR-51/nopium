"use client";
import { useState } from "react";
import { measureDef, measuredCodes, measureSeries } from "@/lib/measures";
import type { CareRecord } from "@/lib/repo";
import "./measure-trend.css";

const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;

/** 쌓인 회차 보고서의 측정값 추이. 항목을 골라 회차별 막대로 봅니다. */
export function MeasureTrend({ records, empty = "회차 보고서가 쌓이면 측정값 변화를 보여드려요." }: { records: CareRecord[]; empty?: string }) {
  const codes = measuredCodes(records);
  const [code, setCode] = useState<string | null>(null);
  const active = codes.find(c => c.code === code) ?? codes[0];
  if (!active) return <p className="mt-empty">{empty}</p>;
  const series = measureSeries(records, active.code);
  const max = Math.max(...series.map(s => s.value), active.max ?? 0, 1);
  const first = series[0], last = series[series.length - 1];
  const diff = series.length > 1 ? Math.round((last.value - first.value) * 10) / 10 : 0;
  const better = diff === 0 ? null : (diff > 0) === active.higherIsBetter;
  return <div className="mt">
    <div className="mt-tabs" role="tablist" aria-label="측정 항목">{codes.map(c => <button key={c.code} role="tab" aria-selected={c.code === active.code} className={c.code === active.code ? "on" : ""} onClick={() => setCode(c.code)}>{c.label}</button>)}</div>
    <div className="mt-summary">
      <b>{last.value}{active.unit}</b>
      {series.length > 1 && <span className={better === null ? "" : better ? "good" : "bad"}>{diff > 0 ? "+" : ""}{diff}{active.unit} · 첫 기록 {md(first.date)} 대비</span>}
      <small>{active.method}{!active.higherIsBetter && " · 낮을수록 좋아요"}</small>
    </div>
    <div className="mt-chart" role="img" aria-label={`${active.label} ${series.map(s => `${md(s.date)} ${s.value}${active.unit}`).join(", ")}`}>
      {series.map((s, i) => <div key={s.date} className={`mt-bar ${i === series.length - 1 ? "last" : ""}`}><span className="mt-val">{s.value}</span><span className="mt-fill" style={{ height: `${Math.max(6, (s.value / max) * 100)}%` }} /><span className="mt-label">{s.sessionNo ? `${s.sessionNo}회` : md(s.date)}</span></div>)}
    </div>
    <p className="mt-note">확정된 회차 보고서 {records.filter(r => r.confirmed).length}건 기준 · 기록된 측정값이며 의료적 판단을 대신하지 않아요.{measureDef(active.code) && series.length < records.filter(r => r.confirmed).length && " 미측정 회차는 제외했어요."}</p>
  </div>;
}
