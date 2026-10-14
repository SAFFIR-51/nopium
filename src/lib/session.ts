import { experts, type Expert } from "@/lib/data";

/**
 * 개발·체험 모드. 기본값은 켜짐이며, 운영 배포에서는 NEXT_PUBLIC_DEMO_MODE=false 로 끕니다.
 * 켜져 있으면 역할 선택과 체험 데이터 안내가 보이고, 고른 역할의 예시 계정으로 로그인한 것처럼 동작합니다.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export type Role = "guest" | "patient" | "provider" | "hospital" | "admin";
export type WorkRole = Exclude<Role, "guest">;

export const ROLE_INFO: Record<Role, { label: string; home: string; text: string }> = {
  guest: { label: "일반 이용자", home: "/", text: "로그인 전 서비스 둘러보기" },
  patient: { label: "환자·보호자", home: "/my", text: "일정과 관리 기록 확인" },
  provider: { label: "프로그램 제공자", home: "/expert", text: "요청과 회차 기록 관리" },
  hospital: { label: "병원·기관", home: "/hospital", text: "연계·승인·보고 확인" },
  admin: { label: "운영 관리자", home: "/admin", text: "수수료·진행 현황·문의 관리" },
};

/** 체험 모드에서 쓰는 예시 계정. 인증이 연결되면 세션 정보로 교체합니다. */
export const DEMO_ACCOUNTS = {
  patient: { id: "demo-guardian", name: "김지은", relation: "보호자" },
  provider: { id: "park" },
  hospital: { id: "demo-hospital", name: "이하늘", title: "연계 코디네이터", organization: "새봄재활의학과", doctors: ["정윤호 (재활의학과 전문의)", "김서진 (재활의학과 전문의)"], socialWorker: "오미래 (의료사회복지사)" },
  admin: { id: "demo-admin", name: "NOPIUM 운영팀" },
} as const;

/** 체험 모드에서 사용할 예시 제공자 id. */
export const DEMO_PROVIDER_ID = DEMO_ACCOUNTS.provider.id;

export function demoProvider(): Expert | null {
  return experts.find(e => e.id === DEMO_PROVIDER_ID) ?? null;
}
