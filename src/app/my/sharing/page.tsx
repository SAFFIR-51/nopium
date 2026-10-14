import type { Metadata } from "next";
import { Sharing } from "./Sharing";

export const metadata: Metadata = { title: "정보 공유·보호자 연결" };

export default function SharingPage() {
  return <Sharing />;
}
