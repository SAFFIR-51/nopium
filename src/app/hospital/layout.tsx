import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HospitalShell } from "./HospitalShell";

export const metadata: Metadata = { title: { template: "%s | 병원·기관 · NPIUM", default: "병원·기관 | NPIUM" } };

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return <HospitalShell>{children}</HospitalShell>;
}
