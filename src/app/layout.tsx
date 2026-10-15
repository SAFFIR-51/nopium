import { Suspense } from "react";
import type { Metadata } from "next";
import { ServerStatus } from "@/components/ServerStatus";
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
  metadataBase: new URL("https://nopium.vercel.app"),
  title: "NPIUM | 퇴원 후에도 이어지는 재활",
  description: "병원에서 퇴원한 뒤에도 집이나 가까운 센터에서 재활 전문가와 재활을 이어가세요. 신청부터 일정, 프로그램 기록과 보고까지 한곳에서 확인하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "NPIUM",
    title: "NPIUM | 퇴원 후에도, 일상을 잇는 운동",
    description: "집에서, 가까운 센터에서. 나에게 맞는 재활 프로그램을 만나보세요.",
    images: [{
      url: "/images/npium-social-v2.jpg",
      width: 1200,
      height: 630,
      alt: "NPIUM — 퇴원 후에도 일상을 잇는 운동",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NPIUM | 퇴원 후에도, 일상을 잇는 운동",
    description: "집에서, 가까운 센터에서. 나에게 맞는 재활 프로그램을 만나보세요.",
    images: ["/images/npium-social-v2.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <SiteHeader /><ServerStatus />
        <main><Suspense fallback={<p className="wrap" role="status">화면을 불러오고 있어요.</p>}>{children}</Suspense></main>
        <SiteFooter />
      </body>
    </html>
  );
}









