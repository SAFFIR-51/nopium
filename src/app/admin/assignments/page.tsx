import { Assignments } from "./Assignments";
import { Suspense } from "react";

type Props = { searchParams: Promise<{ patient?: string }> };

async function AssignmentContent({ searchParams }: Props) {
  const { patient } = await searchParams;
  return <Assignments key={patient} initialPatientId={patient} />;
}

export default function AdminAssignmentsPage(props: Props) {
  return <Suspense fallback={<p role="status">매칭 화면을 준비하고 있습니다.</p>}><AssignmentContent {...props} /></Suspense>;
}
