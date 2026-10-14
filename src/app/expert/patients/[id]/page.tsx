import type { Metadata } from "next";
import { Suspense } from "react";
import { seed } from "@/lib/repo/seed";
import { PatientDetail } from "./PatientDetail";

export const metadata: Metadata = { title: "대상 상세" };

// 예시 대상 id로 미리 렌더링하고, 신청으로 새로 생긴 id는 요청 시점에 렌더링됩니다.
// (Cache Components에서는 생성 파라미터가 없으면 레이아웃의 usePathname까지 Suspense가 필요해집니다.)
export function generateStaticParams() {
  return seed.patients.map(p => ({ id: p.id }));
}

export default function ExpertPatientPage() {
  return <Suspense fallback={<div className="care-panel" role="status">대상 정보를 불러오고 있어요.</div>}><PatientDetail /></Suspense>;
}
