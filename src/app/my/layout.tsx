import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PatientShell } from "./PatientShell";

export const metadata: Metadata = { title: { template: "%s | 내 관리 · NPIUM", default: "내 관리 | NPIUM" } };

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
