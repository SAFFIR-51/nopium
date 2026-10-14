import type { Metadata } from "next";
import { AdminOverview } from "./AdminOverview";

export const metadata: Metadata = { title: "운영 현황" };

export default function AdminPage() {
  return <AdminOverview />;
}
