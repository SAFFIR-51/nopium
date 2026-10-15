import type { BillingSnapshot, CareState, Contract } from "@/lib/repo/types";

/**
 * NPIUM 이용 수수료 (병원 연계형).
 * 회차당: 그 달에 확정된 방문 회차(미참여 제외) × 단가. 월 정액: 계약 금액.
 * 부가세 10%는 별도. 금액은 체험용 가정값이며 실제 계약 조건으로 바꿔야 합니다.
 */
export const VAT = 0.1;
export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const billingKey = (org: string, period: string) => `${org}|${period}`;

export function visitsFor(state: CareState, org: string, period: string) {
  const ids = new Set(state.patients.filter(p => p.hospital === org).map(p => p.id));
  return state.records.filter(r => (r.hospitalAtVisit ? r.hospitalAtVisit === org : ids.has(r.patientId)) && r.confirmed && r.attendance !== "미참여" && r.date.startsWith(period)).length;
}
export function feeFor(c: Contract, visits: number) {
  const supply = c.model === "회차당" ? visits * c.unitFee : c.monthlyFee;
  return { supply, vat: Math.round(supply * VAT), total: Math.round(supply * (1 + VAT)) };
}

export type InvoiceRow = { key: string; org: string; period: string; visits: number; supply: number; vat: number; total: number; status: "청구 전" | "청구 완료" | "입금 완료"; issuedAt?: string; paidAt?: string; current: boolean; contract: Contract; changed: boolean; adjustmentTotal: number; snapshot?: BillingSnapshot };

export function captureBilling(state: CareState, contract: Contract, period: string, at: string): BillingSnapshot {
  const recordIds = state.records.filter(r => r.confirmed && r.attendance !== "미참여" && r.date.startsWith(period) && (r.hospitalAtVisit ?? state.patients.find(p => p.id === r.patientId)?.hospital) === contract.organization).map(r => r.id).sort();
  const visits = recordIds.length;
  const sourceSignature = JSON.stringify([contract, state.records.filter(r => recordIds.includes(r.id)).map(r => [r.id, r.date, r.attendance, r.updatedAt]).sort()]);
  return { contract: JSON.parse(JSON.stringify(contract)), recordIds, sourceSignature, visits, ...feeFor(contract, visits), capturedAt: at };
}

/** 계약 시작월부터 이번 달까지 기관·월별 청구 행 (최신 달이 위) */
export function invoices(state: CareState, today: string): InvoiceRow[] {
  const now = today.slice(0, 7);
  const rows: InvoiceRow[] = [];
  for (const c of state.contracts) {
    const first = new Date(`${now}-01T00:00:00`); first.setMonth(first.getMonth() - 35);
    const recent = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
    let [y, m] = (c.since.slice(0, 7) > recent ? c.since.slice(0, 7) : recent).split("-").map(Number);
    for (let guard = 0; guard < 36; guard++) {
      const period = `${y}-${String(m).padStart(2, "0")}`;
      if (period > now) break;
      const visits = visitsFor(state, c.organization, period);
      const b = state.billing[billingKey(c.organization, period)];
      const live = captureBilling(state, c, period, "");
      const fixed = b?.snapshot;
      const fee = fixed ?? feeFor(c, visits);
      const adjustmentTotal = (b?.adjustments ?? []).reduce((n, a) => n + a.amount, 0);
      rows.push({ key: billingKey(c.organization, period), org: c.organization, period, visits: fixed?.visits ?? visits, supply: fee.supply, vat: fee.vat, total: fee.total + adjustmentTotal, status: b?.status ?? "청구 전", issuedAt: b?.issuedAt, paidAt: b?.paidAt, current: period === now, contract: fixed?.contract ?? c, snapshot: fixed, changed: !!fixed && fixed.sourceSignature !== live.sourceSignature, adjustmentTotal });
      m++; if (m > 12) { m = 1; y++; }
    }
  }
  // 발행한 청구 이력은 계약 시작일이 바뀌어도 남깁니다.
  for (const [key, entry] of Object.entries(state.billing)) {
    if (!entry.snapshot || rows.some(r => r.key === key)) continue;
    const split = key.lastIndexOf("|"), org = key.slice(0, split), period = key.slice(split + 1), fixed = entry.snapshot;
    const contract = state.contracts.find(c => c.organization === org) ?? fixed.contract;
    const adjustmentTotal = (entry.adjustments ?? []).reduce((n, a) => n + a.amount, 0);
    rows.push({ key, org, period, visits: fixed.visits, supply: fixed.supply, vat: fixed.vat, total: fixed.total + adjustmentTotal, status: entry.status, issuedAt: entry.issuedAt, paidAt: entry.paidAt, current: period === now, contract: fixed.contract, snapshot: fixed, changed: fixed.sourceSignature !== captureBilling(state, contract, period, "").sourceSignature, adjustmentTotal });
  }
  return rows.sort((a, b) => b.period.localeCompare(a.period) || a.org.localeCompare(b.org, "ko"));
}
