import type { Metadata } from "next";
import { MyRecords } from "./MyRecords";

export const metadata: Metadata = { title: "기록·보고" };

export default function MyRecordsPage() {
  return <MyRecords />;
}
