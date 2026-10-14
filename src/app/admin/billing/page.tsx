import type { Metadata } from "next";
import { Billing } from "./Billing";

export const metadata: Metadata = { title: "정산·수수료" };

export default function AdminBillingPage() {
  return <Billing />;
}
