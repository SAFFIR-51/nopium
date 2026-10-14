import type { Metadata } from "next";
import { RequestsView } from "./RequestsView";

export const metadata: Metadata = { title: "배정 요청" };

export default function ExpertRequestsPage() {
  return <RequestsView />;
}
