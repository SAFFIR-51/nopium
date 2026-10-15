import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import "./partner.css";

export const metadata: Metadata = { title: "전문가 가입 | NPIUM", description: "퇴원 후 재활이 필요한 분들과 가까운 곳에서 만나세요. NPIUM 재활·운동 전문가 가입 안내." };

const steps = [
  { title: "가입하고 자격을 확인받아요", text: "면허·경력과 배상책임보험을 등록하면 운영자가 검수한 뒤 활동을 시작할 수 있어요." },
  { title: "조건에 맞는 배정 요청을 받아요", text: "활동 지역과 진행 방식, 제공 분야에 맞는 대상의 배정 요청이 도착해요. 일정을 확인해 수락하거나 사유를 남겨 거절할 수 있어요." },
  { title: "기록과 보고를 한곳에서 관리해요", text: "회차 기록, 평가, 월간 보고서를 작성하고 동의 범위 안에서 연계 병원과 공유해요." },
];
const features = [
  { icon: "pin", title: "원하는 지역·방식으로", text: "방문, 센터, 비대면 점검 중 가능한 방식과 활동 지역을 직접 정해요." },
  { icon: "building", title: "병원 연계 대상", text: "퇴원 후 재활이 필요한 연계 병원의 대상과 이어질 수 있어요." },
  { icon: "file", title: "기록 도구 제공", text: "임시 저장·확정·정정 이력이 남는 회차 기록과 보고서를 제공해요." },
] as const;
const faqs = [
  ["가입 조건이 있나요?", "물리치료사, 작업치료사, 언어재활사, 건강운동관리사 등 재활·운동 분야의 자격을 가진 분이 가입할 수 있어요. 가입할 때 면허 번호와 자격 서류를 등록하고, 운영자 검수 후 활동을 시작합니다."],
  ["검수에는 무엇을 확인하나요?", "면허·자격, 경력, 배상책임보험 가입 여부와 제공 가능한 프로그램 범위를 확인해요. 보완이 필요하면 가입할 때 입력한 연락처로 안내합니다."],
  ["어떤 분들을 만나게 되나요?", "병원에서 퇴원한 뒤 집이나 가까운 센터에서 재활을 이어가려는 분들이에요. 의료적 판단과 프로그램 기준은 권한 있는 전문가와 연계 기관이 정한 내용을 따릅니다."],
  ["이용 비용은 어떻게 되나요?", "이용 조건과 정산 방식은 운영 정책이 확정되면 가입 전에 안내해 드려요."],
];

export default function PartnerPage() {
  return <div className="partner-page">
    <section className="partner-hero">
      <div className="partner-wrap">
        <p className="partner-eyebrow">NPIUM PARTNER</p>
        <h1>퇴원 후 재활이 필요한 분들과<br />가장 가까운 곳에서 만나세요</h1>
        <p>병원 밖에서도 이어지는 재활, NPIUM 전문가로 함께해 주세요.</p>
        <Link href="/partner/join" className="partner-cta">전문가 가입하기</Link>
      </div>
    </section>
    <section className="partner-section">
      <div className="partner-wrap">
        <h2>NPIUM에서 활동하는 방법</h2>
        <ol className="partner-steps">{steps.map((s, i) => <li key={s.title}><span>STEP {i + 1}</span><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
      </div>
    </section>
    <section className="partner-section alt">
      <div className="partner-wrap">
        <h2>재활에 맞춘 활동 환경</h2>
        <div className="partner-features">{features.map(f => <div key={f.title}><span><Icon name={f.icon} size={22} /></span><h3>{f.title}</h3><p>{f.text}</p></div>)}</div>
      </div>
    </section>
    <section className="partner-section">
      <div className="partner-wrap narrow">
        <h2>자주 묻는 질문</h2>
        <div className="partner-faq">{faqs.map(([q, a]) => <details key={q}><summary>Q. {q}</summary><p>{a}</p></details>)}</div>
      </div>
    </section>
    <section className="partner-bottom">
      <div className="partner-wrap">
        <h2>지금 전문가로 가입하고<br />첫 배정 요청을 받아보세요</h2>
        <Link href="/partner/join" className="partner-cta">전문가 가입하기</Link>
        <small>체험 화면입니다. 입력한 가입 정보는 이 브라우저에만 저장되며 실제로 접수되지 않습니다.</small>
      </div>
    </section>
  </div>;
}
