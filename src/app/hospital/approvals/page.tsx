import type { Metadata } from "next";
import { Approvals } from "./Approvals";

export const metadata: Metadata = { title: "처방 확인" };

export default function HospitalApprovalsPage() {
  return <Approvals />;
}
