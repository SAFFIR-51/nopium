import type { Metadata } from "next";
import { MySchedule } from "./MySchedule";

export const metadata: Metadata = { title: "일정" };

export default function MySchedulePage() {
  return <MySchedule />;
}
