import type { Metadata } from "next";
import { Reports } from "./Reports";

export const metadata: Metadata = { title: "공유된 보고서" };

export default function HospitalReportsPage() {
  return <Reports />;
}
