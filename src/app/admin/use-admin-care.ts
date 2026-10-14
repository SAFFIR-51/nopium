"use client";
import { invoices } from "@/lib/billing";
import { threadsFor } from "@/lib/chat";
import { experts } from "@/lib/data";
import { missingReports } from "@/lib/measures";
import { daysLeft, hasAssessment } from "@/lib/program";
import { useCare, type InquiryMeta } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { useToday } from "@/lib/use-today";

export type InquiryRow = { id: string; who: string; kind: "보호자" | "병원" | "치료사" | "기타"; last?: { text: string; at: string; fromAdmin: boolean }; meta: InquiryMeta; unread: number };

/**
 * NOPIUM 운영(ERP): 배정은 병원이 하고, 운영팀은 수수료·진행 현황·문의를 관리합니다.
 * 운영 목적 밖의 건강 정보는 일괄 열람하지 않는다는 원칙(기획서 5장)에 따라 단계·건수 위주로 씁니다.
 */
export function useAdminCare() {
  const state = useCare();
  const today = useToday();
  const admin = DEMO_ACCOUNTS.admin.id;
  const kindOf = (key: string): InquiryRow["kind"] => key === DEMO_ACCOUNTS.patient.id ? "보호자" : key === DEMO_ACCOUNTS.hospital.id ? "병원" : experts.some(e => e.id === key) ? "치료사" : "기타";
  const inquiries: InquiryRow[] = threadsFor(state, "admin").filter(t => t.messages.length).map(t => {
    const key = t.id.slice(8);
    const fromAdmin = t.last?.senderKey === admin;
    const meta = state.inquiries[t.id] ?? { status: fromAdmin ? "완료" : "접수", category: "일반", updatedAt: t.last?.at ?? "" };
    return { id: t.id, who: t.title, kind: kindOf(key), last: t.last && { text: t.last.text, at: t.last.at, fromAdmin }, meta, unread: t.unread };
  }).sort((a, b) => (b.last?.at ?? "").localeCompare(a.last?.at ?? ""));
  const openInquiries = inquiries.filter(i => i.meta.status !== "완료");
  const bills = today ? invoices(state, today) : [];
  const toInvoice = bills.filter(b => !b.current && b.status === "청구 전" && b.total > 0);
  const unpaid = bills.filter(b => b.status === "청구 완료");
  const missing = today ? missingReports(state, today) : [];
  const unreviewed = state.records.filter(r => r.confirmed && r.adverse?.occurred && !r.adverse.reviewedBy);
  const ending = today ? state.patients.filter(p => { const d = daysLeft(p, today); return p.status === "진행 중" && d !== null && d >= 0 && d <= 14 && !hasAssessment(state, p.id, "사후 평가"); }) : [];
  const waitingAssign = state.patients.filter(p => p.status === "배정 대기");
  const applications = state.applications.filter(a => a.status === "검수 대기");
  return { state, today, inquiries, openInquiries, bills, toInvoice, unpaid, missing, unreviewed, ending, waitingAssign, applications,
    actionCount: openInquiries.length + toInvoice.length + unpaid.length + applications.length };
}
