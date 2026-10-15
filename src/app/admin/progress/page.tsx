import type { Metadata } from "next";
import { ProgressBoard } from "./ProgressBoard";
import { Suspense } from "react";

export const metadata: Metadata = { title: "진행 현황" };

type Props = { searchParams: Promise<{ patient?: string }> };

async function ProgressContent({ searchParams }: Props) {
  const { patient } = await searchParams;
  return <ProgressBoard key={patient} initialPatientId={patient} />;
}

export default function AdminProgressPage(props: Props) {
  return <Suspense fallback={<p role="status">환자 진행 화면을 준비하고 있습니다.</p>}><ProgressContent {...props} /></Suspense>;
}
