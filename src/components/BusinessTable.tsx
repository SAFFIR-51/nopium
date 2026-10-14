import type { ReactNode } from "react";

export function BusinessTable({ columns, children, empty, caption }: { columns: string[]; children: ReactNode; empty?: string; caption: string }) {
  return <div className="business-table-scroll" tabIndex={0} role="region" aria-label={`${caption} 표`}><table className="business-table">
    <caption className="business-sr-only">{caption}</caption>
    <thead><tr>{columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
    <tbody>{empty ? <tr><td colSpan={columns.length} className="business-empty">{empty}</td></tr> : children}</tbody>
  </table></div>;
}

export function BusinessStatus({ children }: { children: string }) {
  const tone = /누락|반려|재배정|보완|이상 반응|만료/.test(children) ? "attention" : /대기|필요|접수|평가|확인/.test(children) ? "waiting" : /진행|승인|공유|확정|방문 재활|완료/.test(children) ? "active" : "neutral";
  return <span className={`business-status ${tone}`}>{children}</span>;
}
