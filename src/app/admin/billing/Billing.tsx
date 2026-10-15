"use client";
import { usePageValue } from "@/lib/page-view";
import { mutationFailed } from "@/lib/repo";
import { useActor } from "@/lib/demo-session";
import { PagePanel } from "@/components/CareUI";
import { useState } from "react";
import { BusinessTable, BusinessStatus } from "@/components/BusinessTable";
import { VAT, won } from "@/lib/billing";
import { careRepo, todayLocal, type Contract } from "@/lib/repo";
import { AdminHeading } from "../AdminShell";
import { useAdminCare } from "../use-admin-care";

/** 정산·수수료: 기관별 계약 조건 → 월별 이용료(확정 방문 회차 기준) → 청구·입금 상태. 금액은 체험용 가정값입니다. */
export function Billing() {
  const actor = useActor();
  const [adjusting, setAdjusting] = usePageValue("billing-adjustment");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const { state, bills, unpaid } = useAdminCare();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Contract>>({});
  const [org, setOrg] = useState("전체");
  const rows = bills.filter(b => org === "전체" || b.org === org);
  const sum = (f: (b: typeof bills[number]) => boolean) => bills.filter(f).reduce((n, b) => n + b.total, 0);
  if (adjusting) return <PagePanel title="청구 이력·금액 조정" onClose={() => setAdjusting("")}><p>발행 당시 회차·계약·금액은 보존됩니다. 추가·환급 금액은 원 단위(세금 포함)로 사유와 함께 기록합니다.</p><p>발행 기준 회차: {state.billing[adjusting]?.snapshot?.recordIds.join(", ")}</p>{state.billing[adjusting]?.adjustments?.map(a => <p key={a.id}>{won(a.amount)} · {a.reason} · {a.by} · {a.at}</p>)}<form className="care-form" onSubmit={async e => { e.preventDefault(); setMessage(await careRepo.adjustBilling(adjusting, Number(amount), reason, actor.name) ? "조정 내역을 추가했습니다." : "금액과 사유를 확인해 주세요."); }}><label>조정 금액<input type="number" step="1" required value={amount} onChange={e => setAmount(e.target.value)} /></label><label>조정 사유<textarea required value={reason} onChange={e => setReason(e.target.value)} /></label><button className="btn-primary">조정 기록</button>{message && <p role="status">{message}</p>}</form></PagePanel>;
  return <>
    <AdminHeading title="정산·수수료" subtitle={`병원 이용료는 확정된 방문 회차(미참여 제외) × 회차당 단가 또는 월 정액으로 계산하고, 부가세 ${VAT * 100}%를 더해 청구합니다.`} />
    <div className="business-summary">
      <div><small>청구 예정 (이번 달)</small><b>{sum(b => b.current).toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>청구 필요 (지난달 이전)</small><b>{sum(b => !b.current && b.status === "청구 전").toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>미수금</small><b>{unpaid.reduce((n, b) => n + b.total, 0).toLocaleString("ko-KR")}<span>원</span></b></div>
      <div><small>입금 완료</small><b>{sum(b => b.status === "입금 완료").toLocaleString("ko-KR")}<span>원</span></b></div>
    </div>

    <details className="business-section"><summary>기관 계약 등록</summary><form className="care-form" onSubmit={async e => { e.preventDefault(); const form = e.currentTarget, f = new FormData(form); if (mutationFailed(await careRepo.setContract(String(f.get("organization")), { model: f.get("model") as Contract["model"], unitFee: Number(f.get("unitFee")), monthlyFee: Number(f.get("monthlyFee")), since: String(f.get("since")), manager: String(f.get("manager")) }))) return; form.reset(); }}><label>병원명<input name="organization" required /></label><label>과금 방식<select name="model"><option>회차당</option><option>월 정액</option></select></label><label>회차당 단가<input name="unitFee" type="number" min="0" required defaultValue={0} /></label><label>월 정액<input name="monthlyFee" type="number" min="0" required defaultValue={0} /></label><label>계약 시작일<input name="since" type="date" required /></label><label>담당자<input name="manager" required /></label><button className="btn-primary">계약 등록</button></form></details>
    <section className="business-section"><div className="business-section-head"><h2>기관 계약</h2><span>{state.contracts.length}곳</span></div>
      <BusinessTable caption="기관 계약" columns={["기관", "과금 방식", "단가", "계약 시작", "담당자", "관리"]}>
        {state.contracts.map(c => editing === c.organization ? <tr key={c.organization}>
          <td><b>{c.organization}</b></td>
          <td><select aria-label="과금 방식" value={draft.model ?? c.model} onChange={e => setDraft(d => ({ ...d, model: e.target.value as Contract["model"] }))}><option>회차당</option><option>월 정액</option></select></td>
          <td><input className="business-input" type="number" min="0" step="1000" aria-label="단가" value={(draft.model ?? c.model) === "회차당" ? draft.unitFee ?? c.unitFee : draft.monthlyFee ?? c.monthlyFee} onChange={e => setDraft(d => ((d.model ?? c.model) === "회차당" ? { ...d, unitFee: Number(e.target.value) } : { ...d, monthlyFee: Number(e.target.value) }))} /></td>
          <td className="business-nowrap">{c.since}</td><td>{c.manager}</td>
          <td><div className="business-actions"><button className="business-action primary" onClick={async () => { if (mutationFailed(await careRepo.setContract(c.organization, draft))) return; setEditing(null); setDraft({}); }}>저장</button><button className="business-action" onClick={() => { setEditing(null); setDraft({}); }}>취소</button></div></td>
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
          <td className="business-number"><b>{won(b.total)}</b>{b.adjustmentTotal !== 0 && <small>명시적 조정 {won(b.adjustmentTotal)}</small>}{b.changed && <small>청구 후 원자료 변경 · 검토 필요</small>}</td>
          <td><BusinessStatus>{b.current && b.status === "청구 전" ? "집계 중" : b.status}</BusinessStatus></td>
          <td className="business-nowrap">{b.issuedAt ?? "-"}<small>{b.paidAt ? `입금 ${b.paidAt}` : ""}</small></td>
          <td>{b.status === "청구 전" ? <button className="business-action primary" disabled={b.current || b.total === 0} onClick={async () => await careRepo.setBilling(b.key, { status: "청구 완료", issuedAt: todayLocal() })}>청구하기</button>
            : b.status === "청구 완료" ? <button className="business-action primary" onClick={async () => await careRepo.setBilling(b.key, { status: "입금 완료", paidAt: todayLocal() })}>입금 확인</button> : "—"}{b.snapshot && <button className="business-action" onClick={() => { setAdjusting(b.key); setAmount(""); setReason(""); setMessage(""); }}>청구 이력·조정</button>}</td>
        </tr>)}
      </BusinessTable>
      <p className="business-result">이번 달은 집계 중이라 다음 달에 청구할 수 있어요. 세금계산서 발행·입금 연동은 실제 서비스에서 회계 시스템과 연결합니다.</p>
    </section>

  </>;
}
