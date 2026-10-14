"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { RoleShell, WorkspaceHeading } from "@/components/RoleShell";
import { useProviderCare } from "./use-provider-care";
import "../my/my-page.css";
import "../my/my-home-type.css";
import "./expert.css";

/** 보호자 내 관리와 같은 구성: /expert 가 홈(허브), 나머지는 뒤로 가기가 있는 하위 화면. */
export function ExpertShell({ children }: { children: ReactNode }) {
  const data = useProviderCare();
  const name = data ? `${data.provider.name} 선생님` : "제공자";
  return <RoleShell layout="list" area="provider" person={{ name, sub: data?.provider.license ?? "", icon: "calendar" }} menu={[]}>{children}</RoleShell>;
}

/** 하위 화면 상단: 뒤로 가기 + 제목 (보호자 화면 MySubHeader와 같은 모양). */
export function ExpertSubHeader({ title, subtitle, action, back = "/expert", backLabel = "내 관리로 돌아가기" }: { title: string; subtitle?: string; action?: ReactNode; back?: string; backLabel?: string }) {
  return <div className="my-subheader">
    <Link href={back} className="my-back" aria-label={backLabel}><Icon name="chevron" size={20} /></Link>
    <div style={{ flex: 1, minWidth: 0 }}><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    {action}
  </div>;
}

export function ExpertHeading(props: { title: string; subtitle?: string; action?: ReactNode }) {
  return <WorkspaceHeading {...props} />;
}
