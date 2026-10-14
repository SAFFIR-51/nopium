import type { Metadata } from "next";
import { PatientsView } from "./PatientsView";

export const metadata: Metadata = { title: "담당 대상" };

export default function ExpertPatientsPage() {
  return <PatientsView />;
}
