import type { Metadata } from "next";
import { JoinFlow } from "./JoinFlow";

export const metadata: Metadata = { title: "전문가 가입하기 | NPIUM" };

export default function PartnerJoinPage() {
  return <JoinFlow />;
}
