import type { Metadata } from "next";
import { HospitalPatients } from "./HospitalPatients";

export const metadata: Metadata = { title: "연계 대상" };

export default function HospitalPage() {
  return <HospitalPatients />;
}
