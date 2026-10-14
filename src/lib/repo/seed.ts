import type { CareState } from "./types";

// 체험용 예시 데이터. 실제 환자·병원 정보가 아닙니다.
export const seed: CareState = {
  patients: [
    { id: "p1", name: "김민수", age: 72, sex: "남", condition: "뇌경색 후 기능 회복", area: "서울 송파구", hospital: "새봄재활의학과", provider: "박지훈", providerId: "park", status: "진행 중", goal: "보호자 도움을 줄이고 실내 이동하기", precautions: "보행 시 보호자 동행 · 무리한 단독 이동 주의", completed: 6, total: 24, nextDate: "2026-10-15", nextTime: "10:00", method: "방문", consent: true, guardianAccountId: "demo-guardian" , doctor: "정윤호 (재활의학과 전문의)", prescription: { doctor: "정윤호 (재활의학과 전문의)", startDate: "2026-09-21", endDate: "2026-12-19", perWeek: 2, places: ["자택", "센터"], scope: ["보행", "균형", "근력", "일상 동작", "보호자 교육"] }, homeAddress: "서울 송파구 예시로 101, 3동 502호 (체험용 주소)", homeAccess: "엘리베이터 있음 · 현관 문턱 3cm", place: { kind: "자택" } },
    { id: "p2", name: "이서영", age: 64, sex: "여", condition: "무릎 수술 후 기능 회복", area: "성남 분당구", hospital: "새봄재활의학과", provider: "이수민", providerId: "lee", status: "승인 대기", goal: "일상에서 편안하게 걷기", precautions: "기관별 수술 후 주의사항 확인", completed: 0, total: 16, nextDate: "2026-10-16", nextTime: "14:00", method: "센터", consent: true, homeAddress: "성남 분당구 예시대로 20, 1101호 (체험용 주소)", homeAccess: "엘리베이터 있음", place: { kind: "센터", centerId: "onyu" } },
    { id: "p3", name: "정현우", age: 58, sex: "남", condition: "척추 수술 후 기능 회복", area: "서울 강동구", hospital: "새봄재활의학과", provider: "", status: "배정 대기", goal: "퇴원 후 안전한 활동 시작하기", precautions: "초기 평가와 소견 확인 필요", completed: 0, total: 12, nextDate: "2026-10-17", nextTime: "11:00", method: "방문", consent: true, homeAddress: "서울 강동구 예시길 33, 2층 (체험용 주소)", homeAccess: "엘리베이터 없음 · 2층 계단", place: { kind: "자택" } },
    { id: "p4", name: "최영숙", age: 77, sex: "여", condition: "균형과 일상 활동 관리", area: "서울 송파구", hospital: "새봄재활의학과", provider: "한도윤", providerId: "han", status: "진행 중", goal: "꾸준한 활동 습관 만들기", precautions: "현재 컨디션 확인 후 진행", completed: 4, total: 12, nextDate: "2026-10-15", nextTime: "15:00", method: "방문", consent: true, guardianAccountId: "demo-guardian" , doctor: "정윤호 (재활의학과 전문의)", prescription: { doctor: "정윤호 (재활의학과 전문의)", startDate: "2026-09-28", endDate: "2026-12-26", perWeek: 2, places: ["자택", "센터"], scope: ["균형", "근력", "보호자 교육"] }, homeAddress: "서울 송파구 예시로 88, 1층 (체험용 주소)", homeAccess: "1층 · 주차 가능", place: { kind: "센터", centerId: "live" } },
    { id: "p5", name: "윤정희", age: 69, sex: "여", condition: "파킨슨 보행·균형 관리", area: "서울 강동구", hospital: "새봄재활의학과", provider: "박지훈", providerId: "park", status: "진행 중", goal: "실내에서 넘어지지 않고 혼자 이동하기", precautions: "약 복용 후 컨디션 확인 · 방향 전환 시 보조", completed: 2, total: 12, nextDate: "2026-10-12", nextTime: "16:00", method: "방문", consent: true , doctor: "정윤호 (재활의학과 전문의)", prescription: { doctor: "정윤호 (재활의학과 전문의)", startDate: "2026-10-02", endDate: "2026-12-30", perWeek: 2, places: ["자택"], scope: ["보행", "균형", "이동·옮겨 앉기"] }, homeAddress: "서울 강동구 예시로 5, 704호 (체험용 주소)", homeAccess: "엘리베이터 있음 · 침실-욕실 동선 좁음", place: { kind: "자택" } },
  ],
  records: [
    { id: "r1", patientId: "p1", sessionNo: 6, date: "2026-10-12", title: "6회차 · 보행·균형", attendance: "참여", durationMin: 50, activities: ["보행", "균형", "보호자 교육"], content: "보호자 동행으로 실내 보행을 진행했습니다. 중간 휴식 후 계획한 활동을 마쳤습니다.", measures: [{ code: "walk_distance", value: 30, note: "지팡이 사용" }, { code: "walk_10m", value: 18.2 }, { code: "sts5", value: 16.8 }, { code: "single_leg", value: null, note: "균형 저하로 측정 생략" }, { code: "pain_nrs", value: 2 }], adverse: { occurred: false }, education: "문턱 넘을 때 보호자 위치(약한 쪽 반 걸음 뒤) 안내", next: "이동 동선과 수행 반응을 함께 확인합니다.", walk: "30", pain: "2", confirmed: true, authorId: "park", updatedAt: "2026-10-12T11:20:00+09:00" },
    { id: "r2", patientId: "p1", sessionNo: 5, date: "2026-10-08", title: "5회차 · 근력·일상 동작", attendance: "참여", durationMin: 50, activities: ["근력", "일상 동작", "이동·옮겨 앉기"], content: "의자에서 일어나기와 실내 이동을 진행했습니다. 보호자에게 동행 방법을 안내했습니다.", measures: [{ code: "walk_distance", value: 24, note: "지팡이 사용" }, { code: "walk_10m", value: 20.5 }, { code: "sts5", value: 18.0 }, { code: "single_leg", value: null }, { code: "pain_nrs", value: 3 }], adverse: { occurred: false }, education: "의자에서 일어설 때 발 위치 안내", next: "생활 환경에서 이동하기를 이어갑니다.", walk: "24", pain: "3", confirmed: true, authorId: "park", updatedAt: "2026-10-08T11:05:00+09:00" },
    { id: "r3", patientId: "p1", sessionNo: 4, date: "2026-10-05", title: "4회차 · 초기 목표 점검", attendance: "부분 참여", durationMin: 35, activities: ["보행", "관절 가동"], content: "피로감으로 일부만 진행했습니다. 목표와 주의사항을 다시 확인했습니다.", measures: [{ code: "walk_distance", value: 21, note: "지팡이 사용" }, { code: "walk_10m", value: 22.0 }, { code: "sts5", value: 19.5 }, { code: "single_leg", value: null }, { code: "pain_nrs", value: 3 }], adverse: { occurred: true, detail: "보행 중 가벼운 어지럼 호소", action: "앉아서 5분 휴식 후 회복, 이후 강도 낮춤" }, next: "수행 시간을 나누어 진행합니다.", walk: "21", pain: "3", confirmed: true, authorId: "park", updatedAt: "2026-10-05T10:50:00+09:00" },
    { id: "r4", patientId: "p4", sessionNo: 4, date: "2026-10-10", title: "4회차 · 균형·근력", attendance: "참여", durationMin: 45, activities: ["균형", "근력"], content: "벽 지지 균형 운동과 하지 근력 운동을 진행했습니다.", measures: [{ code: "single_leg", value: 6 }, { code: "sts5", value: 15.1 }, { code: "pain_nrs", value: 1 }], adverse: { occurred: false }, next: "지지 없이 서기 시간을 늘려 봅니다.", walk: "", pain: "1", confirmed: true, authorId: "han", updatedAt: "2026-10-10T16:00:00+09:00" },
    { id: "r5", patientId: "p4", sessionNo: 3, date: "2026-10-06", title: "3회차 · 균형", attendance: "참여", durationMin: 45, activities: ["균형", "보호자 교육"], content: "방향 전환 연습을 진행했습니다.", measures: [{ code: "single_leg", value: 4 }, { code: "sts5", value: 16.4 }, { code: "pain_nrs", value: 1 }], adverse: { occurred: false }, education: "욕실 미끄럼 방지 매트 권장", next: "근력 운동을 추가합니다.", walk: "", pain: "1", confirmed: true, authorId: "han", updatedAt: "2026-10-06T16:00:00+09:00" },
    { id: "r6", patientId: "p5", sessionNo: 2, date: "2026-10-09", title: "2회차 · 보행", attendance: "참여", durationMin: 50, activities: ["보행", "균형"], content: "방향 전환 시 보조하며 실내 보행을 진행했습니다.", measures: [{ code: "walk_distance", value: 40 }, { code: "walk_10m", value: 15.4 }, { code: "pain_nrs", value: 0 }], adverse: { occurred: false }, next: "복약 후 컨디션 좋은 시간대에 진행합니다.", walk: "40", pain: "0", confirmed: true, authorId: "park", updatedAt: "2026-10-09T17:00:00+09:00" },
  ],

  reports: [{ id: "rp1", patientId: "p1", period: "2026년 10월", shared: false }],
  homeTasks: [],
  assessments: [
    { id: "a1", patientId: "p1", period: "초기 평가", date: "2026-09-19", rom: "우측 어깨 굴곡 제한", strength: "우측 하지 근력 저하", walking: "지팡이 보행, 보호자 동행", balance: "방향 전환 시 불안정", adl: "화장실 이동 일부 도움", environment: "거실-화장실 문턱 3cm", measures: [{ code: "kmbi", value: 58 }, { code: "bbs", value: 34 }, { code: "tug", value: 24.5 }], by: "박지훈" },
    { id: "a2", patientId: "p4", period: "초기 평가", date: "2026-09-26", rom: "", strength: "하지 근력 저하", walking: "독립 보행", balance: "한 발 서기 2초", adl: "대부분 독립", environment: "욕실 미끄럼 위험", measures: [{ code: "kmbi", value: 82 }, { code: "bbs", value: 41 }, { code: "tug", value: 15.2 }], by: "한도윤" },
    { id: "a3", patientId: "p5", period: "초기 평가", date: "2026-09-30", rom: "", strength: "", walking: "동결 보행, 방향 전환 시 보조", balance: "후방 불안정", adl: "보행 외 대부분 독립", environment: "침실-욕실 동선 좁음", measures: [{ code: "kmbi", value: 70 }, { code: "bbs", value: 38 }, { code: "tug", value: 19.8 }], by: "박지훈" },
    { id: "a4", patientId: "p2", period: "초기 평가", date: "2026-10-12", rom: "무릎 굴곡 95도", strength: "대퇴사두근 약화", walking: "보행기 보행", balance: "양호", adl: "계단 이동 도움", environment: "아파트 엘리베이터 있음", measures: [{ code: "kmbi", value: 75 }, { code: "tug", value: 18.0 }], by: "이수민" },
  ],
  linkages: [],
  // 예시 계약 (수수료 단가는 체험용 가정값)
  contracts: [
    { organization: "새봄재활의학과", model: "회차당", unitFee: 8000, monthlyFee: 0, since: "2026-10-01", manager: "이하늘" },
    { organization: "한결정형외과", model: "월 정액", unitFee: 0, monthlyFee: 300000, since: "2026-10-01", manager: "박서윤" },
  ],
  billing: {},
  inquiries: {
    "support-demo-hospital": { status: "접수", category: "정산", updatedAt: "2026-10-13T09:10:00+09:00" },
    "support-park": { status: "처리 중", category: "이용 방법", assignee: "운영팀 김하나", updatedAt: "2026-10-12T17:00:00+09:00" },
  },
  applications: [],
  scheduleRequests: [],
  messages: [
    { id: "m5", threadId: "support-demo-hospital", senderKey: "demo-hospital", senderName: "이하늘", text: "10월 이용료 세금계산서는 11월 첫 주에 받을 수 있을까요?", at: "2026-10-13T09:10:00+09:00", readBy: ["demo-hospital"] },
    { id: "m6", threadId: "support-park", senderKey: "park", senderName: "박지훈", text: "회차 보고서를 정정하면 보호자에게도 알림이 가나요?", at: "2026-10-12T16:40:00+09:00", readBy: ["park", "demo-admin"] },
    { id: "m7", threadId: "support-park", senderKey: "demo-admin", senderName: "NOPIUM 운영팀", text: "정정된 보고서에는 '정정됨' 표시가 붙고, 보호자 화면에서 바뀐 항목을 볼 수 있어요. 알림 문구는 확인 후 다시 안내드릴게요.", at: "2026-10-12T17:00:00+09:00", readBy: ["demo-admin"] },
    { id: "m1", threadId: "care-p1", senderKey: "park", senderName: "박지훈", text: "안녕하세요, 박지훈입니다. 15일 방문 때 실내 이동 동선을 함께 확인하려고 해요.", at: "2026-10-12T14:05:00+09:00", readBy: ["park", "demo-guardian"] },
    { id: "m2", threadId: "care-p1", senderKey: "demo-guardian", senderName: "김지은", text: "네 선생님. 거실에서 화장실 가는 쪽 문턱이 제일 걱정돼요.", at: "2026-10-12T14:20:00+09:00", readBy: ["demo-guardian", "park"] },
    { id: "m3", threadId: "care-p1", senderKey: "park", senderName: "박지훈", text: "확인했습니다. 방문하실 때 보호자분도 함께 계시면 동행 방법을 같이 안내드릴게요.", at: "2026-10-12T15:02:00+09:00", readBy: ["park"] },
    { id: "m4", threadId: "support-demo-guardian", senderKey: "demo-admin", senderName: "NOPIUM 운영팀", text: "김지은 님, NOPIUM 운영팀입니다. 일정·배정 관련 문의는 이곳으로 남겨 주세요.", at: "2026-10-10T10:00:00+09:00", readBy: ["demo-admin", "demo-guardian"] },
  ],
  assignments: [
    { id: "as1", patientId: "p1", providerId: "park", providerName: "박지훈", status: "수락", createdAt: "2026-09-20T09:00:00+09:00", respondedAt: "2026-09-20T13:00:00+09:00" },
    { id: "as2", patientId: "p2", providerId: "lee", providerName: "이수민", status: "수락", createdAt: "2026-10-10T09:00:00+09:00", respondedAt: "2026-10-10T15:00:00+09:00" },
    { id: "as5", patientId: "p5", providerId: "park", providerName: "박지훈", status: "수락", createdAt: "2026-10-02T09:00:00+09:00", respondedAt: "2026-10-02T12:00:00+09:00" },
    { id: "as4", patientId: "p4", providerId: "han", providerName: "한도윤", status: "수락", createdAt: "2026-09-28T09:00:00+09:00", respondedAt: "2026-09-28T10:30:00+09:00" },
  ],
};
