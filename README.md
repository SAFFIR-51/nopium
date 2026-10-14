# NOPIUM

퇴원 후 프로그램 연결과 일정·기록·보고를 위한 UI 프로토타입입니다.

## 실행
`npm run dev` / `npm run build` / `npm run lint`

## 화면
- `/`: 전문가 탐색, 조건 필터, 프로필, 예시 연계 코드 SB2041
- `/request`: 대상 → 장소·일정 → 확인의 신청 흐름
- `/my`: 대상 선택, 일정 변경, 회차 기록과 보고 조회
- `/expert`: 전문가 업무 영역 (전용 레이아웃·메뉴)
  - `/expert` 오늘·일정 · `/expert/requests` 배정 수락·거절(사유) · `/expert/patients` 담당 대상 · `/expert/patients/[id]` 회차 기록(임시 저장·확정·정정 이력)·평가·보고 · `/expert/profile` 자격·제공 범위
- `/hospital`: 검색·필터, 프로그램 승인, 공유 보고 열람
- `/admin`: 신청 확인, 전문가 배정·재배정, 체험 초기화
- `/spaces`: 센터 지역 필터, 공간 정보와 예시 예약

## 데이터 접근 층

화면은 `src/lib/repo`의 `careRepo`와 `useCare()`만 사용합니다. `types.ts`의 `CareRepository` 계약을 지금은 브라우저 체험 구현(`local-repository.ts`)이 채우고, 서버 구현은 같은 계약으로 추가한 뒤 `repo/index.ts`에서 교체합니다. `src/lib/care-store.ts`는 기존 코드용 하위 호환 모듈입니다.

## 역할별 화면

| 역할 | 영역 | 메뉴 |
|---|---|---|
| 환자·보호자 | `/my` | 내 프로그램 · 신청 현황(`/my/requests`) · 기록·보고(`/my/records`) |
| 프로그램 제공자 | `/expert` | 오늘·일정 · 배정 요청 · 담당 대상(`/expert/patients/[id]`) · 내 자격·프로필 |
| 병원·기관 | `/hospital` | 연계 대상 · 계획 승인(`/hospital/approvals`, 승인·반려) · 공유된 보고서 |
| 운영 관리자 | `/admin` | 운영 현황(조치 필요 항목) · 배정 관리(제안·재배정) · 제공자 |

- 각 영역의 `layout.tsx`가 공통 `RoleShell`(`src/components/RoleShell.tsx`)에 메뉴를 넘깁니다. 현재 역할이 영역과 다르면 안내 화면을 보여줍니다.
- 헤더 메뉴도 역할별로 바뀌고, 제공자·병원·운영자는 홈(`/`) 대신 자기 업무 화면에서 시작합니다.
- 역할별 열람 범위는 `src/lib/access.ts`에 모았습니다. 서버 구현 시 같은 규칙을 서버에서 검증해야 합니다.
- 배정 흐름: 운영자 제안 → 제공자 수락(승인 대기) 또는 거절(사유) → 운영자 재배정 → 병원 계획 승인 또는 반려(사유) → 진행 중.

## 체험 모드

`NEXT_PUBLIC_DEMO_MODE`가 `false`가 아니면 체험 모드입니다. 헤더의 역할 선택으로 환자·보호자 / 제공자 / 병원·기관 / 운영자 예시 계정(`src/lib/session.ts`의 `DEMO_ACCOUNTS`)을 고를 수 있고, 선택은 브라우저의 `nopium-demo-role`에 저장됩니다. `false`로 두면 역할 선택과 체험 안내가 사라지고 업무 영역은 로그인 안내를 보여줍니다. 실제 인증을 붙이면 `src/lib/demo-session.ts`의 `useRole`을 세션 기반으로 바꾸고 `src/proxy.ts`에서 역할별 경로를 막습니다.

신청·배정·승인·기록·보고는 공통 브라우저 상태로 연결됩니다. localStorage의 `nopium-care-preview-v1`에 예시 데이터를 저장합니다. 운영 화면에서 초기화할 수 있습니다.

실제 인증·기관 접근 통제·서버 데이터 저장·병원 연동·결제·알림 전송은 연결되어 있지 않습니다. 화면의 역할 선택은 인증이나 실제 권한 제어가 아닙니다. 실제 개인·건강 정보 대신 예시 정보로 검토해야 합니다.

스타일: `src/app/marketplace.css`. 로고: `public/brand/nopium-logo.svg`.

홈은 검색, 분야 아이콘, 기획 배너, 목적별 서비스 목록 구조로 구성했습니다. 크몽·숨고의 공개 홈을 참고하되 로고·원본 콘텐츠·광고 이미지는 사용하지 않습니다. 홈의 프로그램 저장은 현재 화면 상태에 반영됩니다.
