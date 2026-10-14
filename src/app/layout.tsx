import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./market-soomgo.css";
import "./request-button-gradient.css";
import "./brand-refresh.css";
import "./banner-centered.css";
import "./referral-clean.css";
import "./layout-clean.css";
import "./profile-card-polish.css";
import "./ui-refinement.css";
import "./card-name-location.css";

export const metadata: Metadata = {
  title: "NOPIUM | 퇴원 후에도 이어지는 재활",
  description: "병원에서 퇴원한 뒤에도 집이나 가까운 센터에서 재활 전문가와 재활을 이어가세요. 신청부터 일정, 프로그램 기록과 보고까지 한곳에서 확인하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}









