"use client";
import type { ReactNode } from "react";
import { RoleShell, WorkspaceHeading } from "@/components/RoleShell";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { useAdminCare } from "./use-admin-care";

/** NOPIUM 운영(ERP): 운영 현황 · 진행 현황 · 정산·수수료 · 문의 관리 · 치료사 검수. 담당 치료사 배정은 병원이 합니다. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { actionCount, openInquiries, toInvoice, unpaid, applications, missing, unreviewed } = useAdminCare();
  return <RoleShell area="admin" person={{ name: DEMO_ACCOUNTS.admin.name, sub: "운영 관리자", icon: "shield" }} menu={[
    { href: "/admin", label: "운영 현황", icon: "home", count: actionCount },
    { href: "/admin/progress", label: "진행 현황", icon: "user", count: missing.length + unreviewed.length },
    { href: "/admin/billing", label: "정산·수수료", icon: "file", count: toInvoice.length + unpaid.length },
    { href: "/admin/inquiries", label: "문의 관리", icon: "chat", count: openInquiries.length },
    { href: "/admin/providers", label: "치료사 검수", icon: "calendar", count: applications.length },
  ]}>{children}</RoleShell>;
}

export function AdminHeading(props: { title: string; subtitle?: string; action?: ReactNode }) {
  return <WorkspaceHeading eyebrow="NOPIUM OPERATIONS" {...props} />;
}
