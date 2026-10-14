import type { Metadata } from "next";
import { MyOverview } from "./MyOverview";

export const metadata: Metadata = { title: "내 관리" };

export default function MyPage() {
  return <MyOverview />;
}
