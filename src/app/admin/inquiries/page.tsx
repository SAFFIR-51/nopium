import type { Metadata } from "next";
import { Inquiries } from "./Inquiries";

export const metadata: Metadata = { title: "문의 관리" };

export default function AdminInquiriesPage() {
  return <Inquiries />;
}
