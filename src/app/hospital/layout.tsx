import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HospitalShell } from "./HospitalShell";

export const metadata: Metadata = { title: { template: "%s | 병원·기관 · NOPIUM", default: "병원·기관 | NOPIUM" } };

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return <HospitalShell>{children}</HospitalShell>;
}
