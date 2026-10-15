import type { Metadata } from "next";
import { OperationsOverview } from "./OperationsOverview";

export const metadata: Metadata = { title: "운영 현황" };

export default function AdminPage() {
  return <OperationsOverview />;
}
