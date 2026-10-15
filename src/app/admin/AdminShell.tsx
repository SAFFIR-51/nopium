"use client";
import type { ReactNode } from "react";
import { RoleShell, WorkspaceHeading } from "@/components/RoleShell";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { useAdminCare } from "./use-admin-care";
import "./admin-control.css";

/** 운영 통계·매칭 통제·데이터 분석과 보고·계약·정산·치료사 등록. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { actionCount, openInquiries, toInvoice, unpaid, applications, missing, unreviewed, matchingNeeded } = useAdminCare();
  return <RoleShell area="admin" person={{ name: DEMO_ACCOUNTS.admin.name, sub: "운영 관리자", icon: "shield" }} menu={[
    { href: "/admin", label: "운영 현황", icon: "home", count: actionCount },
    { href: "/admin/assignments", label: "환자 매칭 통제", icon: "calendar", count: matchingNeeded.length },
    { href: "/admin/progress", label: "환자별 진행", icon: "user", count: missing.length + unreviewed.length },
    { href: "/admin/accounts", label: "계정·접근 관리", icon: "shield" },
    { href: "/admin/quality", label: "월별 품질 평가·만족도", icon: "shield" },
    { href: "/admin/analysis", label: "데이터 분석", icon: "file" },
    { href: "/admin/billing", label: "병원 계약 관리·수익 정산", icon: "file", count: toInvoice.length + unpaid.length },
    { href: "/admin/inquiries", label: "문의 관리", icon: "chat", count: openInquiries.length },
    { href: "/admin/providers", label: "치료사 인증 및 등록", icon: "shield", count: applications.length },
  ]}>{children}</RoleShell>;
}

export function AdminHeading(props: { title: string; subtitle?: string; action?: ReactNode }) {
  return <WorkspaceHeading eyebrow="NPIUM OPERATIONS" {...props} />;
}
