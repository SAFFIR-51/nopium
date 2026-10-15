"use client";
import { useHospitalAccount } from "@/lib/demo-session";
import type { ReactNode } from "react";
import { RoleShell, WorkspaceHeading } from "@/components/RoleShell";
import { useHospitalCare } from "./use-hospital-care";

export function HospitalShell({ children }: { children: ReactNode }) {
  const { state, approvals, reports, patients } = useHospitalCare();
  const ids = new Set(patients.map(p => p.id));
  const openLinks = state.linkages.filter(l => ids.has(l.patientId) && l.status === "의뢰").length;
  const me = useHospitalAccount();
  return <RoleShell area="hospital" person={{ name: me.organization, sub: `${me.name} · ${me.title}`, icon: "building" }} menu={[
    { href: "/hospital", label: "확인할 일", icon: "user" },
    { href: "/hospital/approvals", label: "처방 확인", icon: "shield", count: approvals.filter(p => p.approval?.status !== "반려" && state.assessments.some(a => a.patientId === p.id && a.period === "초기 평가")).length },
    { href: "/hospital/linkage", label: "지역사회 연계", icon: "link", count: openLinks },
    { href: "/hospital/reports", label: "공유된 보고서", icon: "file", count: reports.filter(r => r.shared).length },
  ]}>{children}</RoleShell>;
}

export function HospitalHeading(props: { title: string; subtitle?: string; action?: ReactNode }) {
  return <WorkspaceHeading eyebrow="NPIUM CONNECT" {...props} />;
}
