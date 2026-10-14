import type { Metadata } from "next";
import { ProgressBoard } from "./ProgressBoard";

export const metadata: Metadata = { title: "진행 현황" };

export default function AdminProgressPage() {
  return <ProgressBoard />;
}
