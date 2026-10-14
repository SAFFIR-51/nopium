// 화면 구성용 예시 데이터. 실제 전문가·병원·환자 정보가 아닙니다.

export type Visit = "방문" | "센터" | "비대면 점검";

export type Expert = {
  id: string;
  name: string;
  license: string;
  years: number;
  focus: string[];
  visit: Visit[];
  area: string;
  price: number;
  rating: number;
  reviews: number;
  hospital?: string;
  photo: string;
  intro: string;
  slots: string;
};

export const conditions = [
  { key: "neuro", label: "뇌졸중·신경계", icon: "neuro" },
  { key: "joint", label: "관절 수술 후", icon: "joint" },
  { key: "spine", label: "척추·허리", icon: "spine" },
  { key: "senior", label: "낙상 예방", icon: "walker" },
  { key: "hand", label: "손·일상동작", icon: "hand" },
  { key: "speech", label: "삼킴·언어", icon: "speech" },
  { key: "cardio", label: "호흡·심장", icon: "lungs" },
  { key: "child", label: "소아 발달", icon: "child" },
] as const;

export const experts: Expert[] = [
  {
    id: "park",
    name: "박지훈",
    license: "물리치료사",
    years: 9,
    focus: ["뇌졸중·신경계", "보행 훈련"],
    visit: ["방문", "비대면 점검"],
    area: "서울 송파·강동",
    price: 70000,
    rating: 4.9,
    reviews: 128,
    hospital: "새봄재활의학과",
    photo: "/images/trainer.jpg",
    intro: "대학병원 신경계 재활 병동 6년. 편마비 환자의 집 구조에 맞춰 이동·보행 동선부터 같이 봅니다.",
    slots: "평일 오전, 토요일",
  },
  {
    id: "lee",
    name: "이수민",
    license: "물리치료사",
    years: 7,
    focus: ["관절 수술 후", "무릎·고관절"],
    visit: ["방문", "센터"],
    area: "성남 분당·수지",
    price: 60000,
    rating: 4.8,
    reviews: 94,
    hospital: "한결정형외과",
    photo: "/images/stretch.jpg",
    intro: "인공관절 수술 후 12주 프로그램을 주로 진행합니다. 집도의 프로토콜을 받아 단계별로 맞춥니다.",
    slots: "평일 오후, 저녁",
  },
  {
    id: "choi",
    name: "최현우",
    license: "작업치료사",
    years: 6,
    focus: ["손·일상동작", "뇌졸중·신경계"],
    visit: ["방문"],
    area: "서울 마포·서대문",
    price: 65000,
    rating: 4.9,
    reviews: 61,
    photo: "/images/yoga.jpg",
    intro: "식사, 옷 입기, 화장실 이용처럼 매일 하는 동작을 다시 혼자 할 수 있게 돕습니다. 보조도구 추천도 합니다.",
    slots: "평일 전체",
  },
  {
    id: "jung",
    name: "정예린",
    license: "물리치료사",
    years: 11,
    focus: ["척추·허리", "관절 수술 후"],
    visit: ["센터", "비대면 점검"],
    area: "서울 강남·서초",
    price: 75000,
    rating: 4.7,
    reviews: 203,
    hospital: "다온척추병원",
    photo: "/images/pilates-v2.jpg",
    intro: "척추 수술 후 복귀 운동과 통증 재발 관리. 협력 센터에서 장비를 써야 하는 단계까지 이어서 봅니다.",
    slots: "평일 저녁, 주말",
  },
  {
    id: "han",
    name: "한도윤",
    license: "건강운동관리사",
    years: 5,
    focus: ["낙상 예방", "근력 회복"],
    visit: ["방문", "센터"],
    area: "수원·용인",
    price: 50000,
    rating: 4.8,
    reviews: 47,
    photo: "/images/walking.jpg",
    intro: "퇴원 후 근력이 떨어진 어르신 대상. 보호자 동석 상담과 주간 운동 기록 공유를 기본으로 합니다.",
    slots: "평일 오전",
  },
  {
    id: "oh",
    name: "오세라",
    license: "언어재활사",
    years: 8,
    focus: ["삼킴·언어", "뇌졸중·신경계"],
    visit: ["방문", "비대면 점검"],
    area: "서울 전역",
    price: 70000,
    rating: 5.0,
    reviews: 38,
    hospital: "새봄재활의학과",
    photo: "/images/studio-v2.jpg",
    intro: "실어증·삼킴장애 재활. 가족이 매일 같이 할 수 있는 연습지를 회차마다 드립니다.",
    slots: "화·목·토",
  },
];

export const reviews = [
  { who: "김○○ 보호자", tag: "뇌경색 · 72세", expert: "박지훈", text: "퇴원하고 나서 뭘 해야 할지 몰랐는데, 병원에서 바로 연결해 줘서 집에 온 다음 주부터 방문 재활을 시작했어요. 외래 때 교수님이 기록을 보고 계셔서 설명할 게 없었습니다." },
  { who: "이○○", tag: "무릎 인공관절 · 64세", expert: "이수민", text: "주 2회 방문에 나머지 날은 앱에 올라온 운동만 했어요. 8주 차에 계단 혼자 내려갔습니다." },
  { who: "박○○ 보호자", tag: "삼킴장애 · 81세", expert: "오세라", text: "어머니가 다시 죽 대신 밥을 드세요. 선생님이 주신 연습지를 매일 저녁 같이 했습니다." },
];

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
