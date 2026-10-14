import type { Metadata } from "next";
import { MyRequests } from "./MyRequests";

export const metadata: Metadata = { title: "신청 현황" };

export default function MyRequestsPage() {
  return <MyRequests />;
}
