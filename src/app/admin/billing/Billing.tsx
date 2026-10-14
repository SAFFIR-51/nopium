"use client";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { VAT, won } from "@/lib/billing";
import { careRepo, todayLocal, type Contract } from "@/lib/repo";
import { AdminHeading } from "../AdminShell";
import { useAdminCare } from "../use-admin-care";

/** 정산·수수료: 기관별 계약 조건 → 월별 이용료(확정 방문 회차 기준) → 청구·입금 상태. 금액은 체험용 가정값입니다. */
export function Billing() {
  const { state, bills, unpaid } = useAdminCare();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Contract>>({});
  const [org, setOrg] = useState("전체");
  const rows = bills.filter(b => org === "전체" || b.org === org);
  const sum = (f: (b: typeof bills[number]) => boolean) => bills.filter(f).reduce((n, b) => n + b.total, 0);
  return <>
    <AdminHeading title="정산·수수료" subtitle={`병원 이용료는 확정된 방문 회차(미참여 제외) × 회차당 단가 또는 월 정액으로 계산하고, 부가세 ${VAT * 100}%를 더해 청구합니다.`} />
    <div className="business-summary">
      <div><small>청구 예정 (이번 달)</small><b>{sum(b => b.current).toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>청구 필요 (지난달 이전)</small><b>{sum(b => !b.current && b.status === "청구 전").toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>미수금</small><b>{unpaid.reduce((n, b) => n + b.total, 0).toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>입금 완료</small><b>{sum(b => b.status === "입금 완료").toLocaleString("ko-KR")}<span>원</span></b></div>
    </div>

    <section className="business-section"><div className="business-section-head"><h2>기관 계약</h2><span>{state.contracts.length}곳</span></div>
      <BusinessTable caption="기관 계약" columns={["기관", "과금 방식", "단가", "계약 시작", "담당자", "관리"]}>
        {state.contracts.map(c => editing === c.organization ? <tr key={c.organization}>
          <td><b>{c.organization}</b></td>
          <td><select aria-label="과금 방식" value={draft.model ?? c.model} onChange={e => setDraft(d => ({ ...d, model: e.target.value as Contract["model"] }))}><option>회차당</option><option>월 정액</option></select></td>
          <td><input className="business-input" type="number" min="0" step="1000" aria-label="단가" value={(draft.model ?? c.model) === "회차당" ? draft.unitFee ?? c.unitFee : draft.monthlyFee ?? c.monthlyFee} onChange={e => setDraft(d => ((d.model ?? c.model) === "회차당" ? { ...d, unitFee: Number(e.target.value) } : { ...d, monthlyFee: Number(e.target.value) }))} /></td>
          <td className="business-nowrap">{c.since}</td><td>{c.manager}</td>
          <td><div className="business-actions"><button className="business-action primary" onClick={() => { careRepo.setContract(c.organization, draft); setEditing(null); setDraft({}); }}>저장</button><button className="business-action" onClick={() => { setEditing(null); setDraft({}); }}>취소</button></div></td>
        </tr> : <tr key={c.organization}>
          <td><b>{c.organization}</b></td><td>{c.model}</td><td className="business-number">{c.model === "회차당" ? `${won(c.unitFee)} / 회` : `${won(c.monthlyFee)} / 월`}</td><td className="business-nowrap">{c.since}</td><td>{c.manager}</td>
          <td><button className="business-action" onClick={() => { setEditing(c.organization); setDraft({}); }}>조건 변경</button></td>
        </tr>)}
      </BusinessTable>
    </section>

    <section className="business-section">
      <div className="business-toolbar"><div className="business-filter">{["전체", ...state.contracts.map(c => c.organization)].map(o => <button key={o} aria-pressed={org === o} onClick={() => setOrg(o)}>{o}</button>)}</div></div>
      <div className="business-section-head"><h2>월별 청구</h2><span>{rows.length}건</span></div>
      <BusinessTable caption="월별 청구" columns={["기간", "기관", "확정 회차", "공급가", "부가세", "합계", "상태", "청구·입금일", "처리"]} empty={!rows.length ? "청구 내역이 없습니다." : undefined}>
        {rows.map(b => <tr key={b.key}>
          <td className="business-nowrap">{b.period}{b.current && <small>진행 중</small>}</td>
          <td className="business-nowrap">{b.org}</td>
          <td className="business-number">{b.contract.model === "회차당" ? `${b.visits}회` : "월 정액"}</td>
          <td className="business-number">{won(b.supply)}</td>
          <td className="business-number">{won(b.vat)}</td>
          <td className="business-number"><b>{won(b.total)}</b></td>
          <td><BusinessStatus>{b.current && b.status === "청구 전" ? "집계 중" : b.status}</BusinessStatus></td>
          <td className="business-nowrap">{b.issuedAt ?? "-"}<small>{b.paidAt ? `입금 ${b.paidAt}` : ""}</small></td>
          <td>{b.status === "청구 전" ? <button className="business-action primary" disabled={b.current || b.total === 0} onClick={() => careRepo.setBilling(b.key, { status: "청구 완료", issuedAt: todayLocal() })}>청구하기</button>
            : b.status === "청구 완료" ? <button className="business-action primary" onClick={() => careRepo.setBilling(b.key, { status: "입금 완료", paidAt: todayLocal() })}>입금 확인</button> : "—"}</td>
        </tr>)}
      </BusinessTable>
      <p className="business-result">이번 달은 집계 중이라 다음 달에 청구할 수 있어요. 세금계산서 발행·입금 연동은 실제 서비스에서 회계 시스템과 연결합니다.</p>
    </section>
  </>;
}
