import type { Metadata } from "next";
import { ScheduleView } from "./ScheduleView";

export const metadata: Metadata = { title: "일정표" };

export default function ExpertSchedulePage() {
  return <ScheduleView />;
}
