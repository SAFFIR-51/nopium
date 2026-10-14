import type { Metadata } from "next";
import { Linkages } from "./Linkages";

export const metadata: Metadata = { title: "지역사회 연계" };

export default function LinkagePage() {
  return <Linkages />;
}
