import type { Metadata } from "next";
import { Providers } from "./Providers";

export const metadata: Metadata = { title: "제공자" };

export default function AdminProvidersPage() {
  return <Providers />;
}
