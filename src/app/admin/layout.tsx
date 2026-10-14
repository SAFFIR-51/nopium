import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = { title: { template: "%s | 운영 · NOPIUM", default: "운영 | NOPIUM" } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
