import type { Metadata } from "next";
import { TodayView } from "./TodayView";

export const metadata: Metadata = { title: "내 관리" };

export default function ExpertTodayPage() {
  return <TodayView />;
}
