import { redirect } from "next/navigation";

// 담당 치료사 배정은 병원이 합니다. 운영팀의 예전 배정 관리 화면은 진행 현황으로 옮겼습니다.
export default function AdminAssignmentsPage() {
  redirect("/admin/progress");
}
