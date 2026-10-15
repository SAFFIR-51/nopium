import { compareAssessments, fallRisk, mmtMuscle, romJoint, type CompareRow } from "@/lib/assessment";
import type { Assessment } from "@/lib/repo";
import "./assessment.css";

const label = (p: string) => (p === "초기 평가" ? "방문 전" : p === "사후 평가" ? "종료" : "중간");

/** 두 평가를 같은 항목끼리 비교하는 표 (치료사 대상 상세, 병원 종료 확인, 리포트에서 같이 씀) */
export function AssessmentCompare({ before, after, only }: { before?: Assessment; after?: Assessment; only?: (row: CompareRow) => boolean }) {
  const all = compareAssessments(before, after);
  const rows = only ? all.filter(only) : all;
  const hidden = all.length - rows.length;
  if (!rows.length) return <p className="asf-empty">비교할 측정값이 없어요.</p>;
  const groups = ["표준 점수", "관절 가동범위", "근력"] as const;
  const rb = fallRisk(before?.measures), ra = fallRisk(after?.measures);
  return <div className="asc">
    <table className="report-table asc-table"><thead><tr><th>항목</th><th>{before ? `${label(before.period)} ${before.date.slice(5).replace("-", ".")}` : "이전"}</th><th>{after ? `${label(after.period)} ${after.date.slice(5).replace("-", ".")}` : "최근"}</th><th>변화</th></tr></thead>
      <tbody>{groups.map(g => { const list = rows.filter(r => r.group === g); if (!list.length) return null; return [
        <tr key={g} className="asc-group"><td colSpan={4}>{g}</td></tr>,
        ...list.map(r => <tr key={r.key}><td>{r.label}</td><td>{r.before}</td><td>{r.after}</td><td className={r.tone}>{r.diff}</td></tr>),
      ]; })}</tbody>
    </table>
    {hidden > 0 && <p className="asc-hidden">변화가 없거나 한쪽만 잰 항목 {hidden}개는 생략했어요.</p>}
    {(rb.level !== "판단 자료 없음" || ra.level !== "판단 자료 없음") && <p className="asc-risk">낙상 위험 참고 <b>{rb.level}</b> → <b className={ra.level === "높음" ? "bad" : ra.level === "낮음" && rb.level === "높음" ? "good" : ""}>{ra.level}</b></p>}
  </div>;
}

/** 평가 한 건을 항목별로 보여 주는 작은 카드 (목록용) */
export function AssessmentDetail({ a }: { a: Assessment }) {
  const rom = (a.romItems ?? []).filter(i => i.deg !== null);
  const mmt = (a.mmtItems ?? []).filter(i => i.grade !== null);
  const risk = fallRisk(a.measures);
  return <div className="asd">
    {rom.length > 0 && <p><span>관절 가동범위</span>{rom.map(i => `${i.side} ${romJoint(i.code)?.label ?? i.code} ${i.deg}°`).join(" · ")}</p>}
    {mmt.length > 0 && <p><span>근력</span>{mmt.map(i => `${i.side} ${mmtMuscle(i.code)?.label ?? i.code} ${i.grade}등급`).join(" · ")}</p>}
    {risk.level !== "판단 자료 없음" && <p><span>낙상 위험 참고</span><b className={risk.level === "높음" ? "bad" : ""}>{risk.level}</b></p>}
    {(a.homeRisks?.length ?? 0) > 0 && <p><span>주거 환경</span>{a.homeRisks!.join(" · ")}{a.environment ? ` · ${a.environment}` : ""}</p>}
    {!a.homeRisks?.length && a.environment && <p><span>주거 환경</span>{a.environment}</p>}
    {[a.walking && `보행: ${a.walking}`, a.balance && `균형: ${a.balance}`, a.adl && `일상: ${a.adl}`, a.rom && `ROM: ${a.rom}`, a.strength && `근력: ${a.strength}`].filter(Boolean).length > 0 && <p><span>관찰</span>{[a.walking && `보행: ${a.walking}`, a.balance && `균형: ${a.balance}`, a.adl && `일상: ${a.adl}`, a.rom && `ROM: ${a.rom}`, a.strength && `근력: ${a.strength}`].filter(Boolean).join(" / ")}</p>}
  </div>;
}
