import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ExpertShell } from "./ExpertShell";

export const metadata: Metadata = { title: { template: "%s | NOPIUM 전문가", default: "전문가 업무 | NOPIUM" } };

export default function ExpertLayout({ children }: { children: ReactNode }) {
  return <ExpertShell>{children}</ExpertShell>;
}
