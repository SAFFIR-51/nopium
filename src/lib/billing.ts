import type { CareState, Contract } from "@/lib/repo";

/**
 * NOPIUM 이용 수수료 (병원 연계형).
 * 회차당: 그 달에 확정된 방문 회차(미참여 제외) × 단가. 월 정액: 계약 금액.
 * 부가세 10%는 별도. 금액은 체험용 가정값이며 실제 계약 조건으로 바꿔야 합니다.
 */
export const VAT = 0.1;
export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const billingKey = (org: string, period: string) => `${org}|${period}`;

export function visitsFor(state: CareState, org: string, period: string) {
  const ids = new Set(state.patients.filter(p => p.hospital === org).map(p => p.id));
  return state.records.filter(r => ids.has(r.patientId) && r.confirmed && r.attendance !== "미참여" && r.date.startsWith(period)).length;
}
export function feeFor(c: Contract, visits: number) {
  const supply = c.model === "회차당" ? visits * c.unitFee : c.monthlyFee;
  return { supply, vat: Math.round(supply * VAT), total: Math.round(supply * (1 + VAT)) };
}

export type InvoiceRow = { key: string; org: string; period: string; visits: number; supply: number; vat: number; total: number; status: "청구 전" | "청구 완료" | "입금 완료"; issuedAt?: string; paidAt?: string; current: boolean; contract: Contract };

/** 계약 시작월부터 이번 달까지 기관·월별 청구 행 (최신 달이 위) */
export function invoices(state: CareState, today: string): InvoiceRow[] {
  const now = today.slice(0, 7);
  const rows: InvoiceRow[] = [];
  for (const c of state.contracts) {
    let [y, m] = c.since.slice(0, 7).split("-").map(Number);
    for (let guard = 0; guard < 36; guard++) {
      const period = `${y}-${String(m).padStart(2, "0")}`;
      if (period > now) break;
      const visits = visitsFor(state, c.organization, period);
      const fee = feeFor(c, visits);
      const b = state.billing[billingKey(c.organization, period)];
      rows.push({ key: billingKey(c.organization, period), org: c.organization, period, visits, ...fee, status: b?.status ?? "청구 전", issuedAt: b?.issuedAt, paidAt: b?.paidAt, current: period === now, contract: c });
      m++; if (m > 12) { m = 1; y++; }
    }
  }
  return rows.sort((a, b) => b.period.localeCompare(a.period) || a.org.localeCompare(b.org, "ko"));
}
