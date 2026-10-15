import type { MeasureCode } from "./measures";
import type { Prescription } from "./repo";

/**
 * 진료과별 방문재활 프로토콜 (제안서 CHAPTER 10·12: 병원 프로토콜 자동 적용, 금기 운동 경고).
 * 병원이 처방할 때 프로토콜을 고르면 핵심 평가 지표·금기 운동·주의사항이 처방에 붙고,
 * 치료사 회차 보고서에서 금기와 연결된 활동을 고르면 경고합니다.
 * 아래 내용은 체험용 예시입니다. 실제 항목은 협력 병원의 진료과 기준으로 바꿔 씁니다.
 */
export type Department = "재활의학과" | "정형외과" | "신경과";

export type Contraindication = {
  text: string;
  /** 이 금기와 관련된 활동 (회차 보고서에서 고르면 경고) */
  activities: string[];
};

export type Protocol = {
  id: string;
  dept: Department;
  label: string;
  /** 대상의 진단명에 이 단어가 있으면 이 프로토콜을 먼저 제안합니다. */
  keywords: string[];
  /** 방문 전·종료 평가에서 꼭 비교할 지표 */
  focusMeasures: MeasureCode[];
  /** 진료과가 리포트에서 중점으로 보는 것 (제안서 CHAPTER 12) */
  reportFocus: string;
  /** 평가 화면에 기본으로 펼칠 관절 가동범위·근력 항목 (src/lib/assessment.ts 코드) */
  romJoints: string[];
  mmtMuscles: string[];
  contraindications: Contraindication[];
  cautions: string[];
};

export const DEPARTMENTS: Department[] = ["재활의학과", "정형외과", "신경과"];

export const PROTOCOLS: Protocol[] = [
  {
    id: "rehab-stroke", dept: "재활의학과", label: "뇌졸중 후 기능 회복",
    keywords: ["뇌경색", "뇌졸중", "뇌출혈"],
    focusMeasures: ["kmbi", "bbs", "tug", "walk_10m"],
    reportFocus: "일상생활 점수(K-MBI) 추적",
    romJoints: ["sh_flex", "sh_abd", "ankle_df"], mmtMuscles: ["sh_flex_m", "grip_m", "hip_flex_m", "knee_ext_m", "ankle_df_m"],
    contraindications: [
      { text: "마비된 팔을 잡아당겨 일으키거나 옮기기", activities: ["이동·옮겨 앉기", "일상 동작"] },
      { text: "마비측 어깨를 억지로 높이 들어 올리기", activities: ["관절 가동"] },
      { text: "보조 없이 계단 오르내리기", activities: ["보행"] },
    ],
    cautions: ["운동 전 혈압 확인 (병원이 정한 기준을 넘으면 그날 운동 중단)", "넘어지지 않게 보조자는 마비측에 서기"],
  },
  {
    id: "rehab-frailty", dept: "재활의학과", label: "근감소·노쇠 기능 유지",
    keywords: ["균형", "노쇠", "근감소", "일상 활동"],
    focusMeasures: ["sts5", "single_leg", "tug", "bbs"],
    reportFocus: "일상생활 점수와 낙상 위험 추적",
    romJoints: [], mmtMuscles: ["grip_m", "hip_flex_m", "hip_abd_m", "knee_ext_m"],
    contraindications: [
      { text: "숨이 차서 말하기 힘들 정도의 고강도 운동", activities: ["근력", "보행"] },
      { text: "붙잡을 곳 없이 눈 감고 하는 균형 훈련", activities: ["균형"] },
    ],
    cautions: ["어지럼·가슴 통증이 있으면 즉시 중단", "운동 중간에 물 마시기"],
  },
  {
    id: "ortho-knee", dept: "정형외과", label: "무릎 인공관절 수술 후",
    keywords: ["무릎"],
    focusMeasures: ["pain_nrs", "walk_10m", "sts5", "tug"],
    reportFocus: "관절 가동범위 회복 그래프",
    romJoints: ["knee_flex", "knee_ext_lag"], mmtMuscles: ["knee_ext_m", "hip_abd_m"],
    contraindications: [
      { text: "무릎 꿇기·깊게 쪼그려 앉기", activities: ["관절 가동", "일상 동작"] },
      { text: "점프·달리기 같은 충격 동작", activities: ["보행", "근력"] },
      { text: "통증 7점 이상인데 운동 계속하기", activities: [] },
    ],
    cautions: ["수술 부위 열감·붓기·진물이 있으면 병원에 연락", "체중을 싣는 정도는 담당 의사 지시를 따르기"],
  },
  {
    id: "ortho-hip", dept: "정형외과", label: "고관절 인공관절 수술 후",
    keywords: ["고관절", "골반"],
    focusMeasures: ["pain_nrs", "walk_10m", "tug", "bbs"],
    reportFocus: "관절 가동범위 회복과 근력 단계",
    romJoints: ["hip_flex", "hip_abd"], mmtMuscles: ["hip_abd_m", "hip_flex_m", "knee_ext_m"],
    contraindications: [
      { text: "고관절을 90도 넘게 굽히기 (낮은 의자, 깊이 숙이기)", activities: ["관절 가동", "일상 동작", "이동·옮겨 앉기"] },
      { text: "다리 꼬기·수술한 다리를 안쪽으로 돌리기", activities: ["관절 가동", "일상 동작"] },
      { text: "의사 허용 전 수술한 다리에 체중 전부 싣기", activities: ["보행", "균형"] },
    ],
    cautions: ["수술 방법에 따라 피해야 할 자세가 달라요. 담당 의사에게 확인", "의자·변기 높이 확인"],
  },
  {
    id: "ortho-spine", dept: "정형외과", label: "척추 수술 후",
    keywords: ["척추", "허리", "요추", "경추"],
    focusMeasures: ["pain_nrs", "walk_distance", "walk_10m", "tug"],
    reportFocus: "통증 변화와 보행 거리",
    romJoints: ["hip_flex"], mmtMuscles: ["hip_flex_m", "knee_ext_m", "ankle_df_m"],
    contraindications: [
      { text: "허리를 굽혀 바닥 물건 들기", activities: ["일상 동작", "근력"] },
      { text: "허리 비틀기 운동", activities: ["관절 가동"] },
      { text: "5kg 넘는 물건 들기", activities: ["근력", "일상 동작"] },
    ],
    cautions: ["보조기 착용 지시가 있으면 착용하고 운동", "다리 저림·힘 빠짐이 새로 생기면 즉시 병원에 연락"],
  },
  {
    id: "neuro-parkinson", dept: "신경과", label: "파킨슨병 보행·균형",
    keywords: ["파킨슨"],
    focusMeasures: ["walk_10m", "tug", "bbs", "single_leg"],
    reportFocus: "낙상 위험과 보행",
    romJoints: ["ankle_df"], mmtMuscles: ["hip_flex_m", "knee_ext_m"],
    contraindications: [
      { text: "보조 없이 빠른 방향 전환·뒷걸음 훈련", activities: ["보행", "균형"] },
      { text: "약 효과가 떨어진 시간에 보행 훈련", activities: ["보행"] },
    ],
    cautions: ["약 먹는 시간에 맞춰 방문 시간 정하기", "발이 얼어붙을 때(동결 보행) 쓸 신호·리듬 미리 정하기"],
  },
];

export const protocolById = (id?: string) => PROTOCOLS.find(p => p.id === id);

/** 진단명으로 어울리는 프로토콜을 제안합니다. 없으면 undefined. */
export function suggestProtocol(condition: string) {
  return PROTOCOLS.find(p => p.keywords.some(k => condition.includes(k)));
}

/** 처방에 적힌 금기 문구 → 연결된 활동. 병원이 직접 추가한 금기는 활동 연결이 없습니다. */
export function contraActivities(rx: Prescription | undefined, text: string): string[] {
  return protocolById(rx?.protocolId)?.contraindications.find(c => c.text === text)?.activities ?? [];
}

/** 고른 활동과 연결된 금기 목록 (회차 보고서 경고용) */
export function contraWarnings(rx: Prescription | undefined, activities: string[]) {
  return (rx?.contraindications ?? [])
    .map(text => ({ text, activities: contraActivities(rx, text).filter(a => activities.includes(a)) }))
    .filter(w => w.activities.length > 0);
}
