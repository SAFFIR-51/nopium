"use client";
import { getAccount } from "./auth-client";
import { missingReports } from "@/lib/measures";
import { useSyncExternalStore } from "react";
import { visiblePatients } from "@/lib/access";
import { threadsFor } from "@/lib/chat";
import { assignmentHistory, assignmentStage } from "@/lib/assignment";
import { useCare, type CareState } from "@/lib/repo";
import { DEMO_ACCOUNTS, DEMO_MODE, demoProvider, type Role } from "@/lib/session";
import { useToday } from "@/lib/use-today";

export type Notice = { id: string; text: string; href: string };

const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** 역할별 알림. 체험 모드에서는 현재 데이터에서 만들고, 실제 서비스에서는 알림 서버의 이력으로 바꿉니다. */
export function buildNotices(state: CareState, role: Role, today: string): Notice[] {
  const out: Notice[] = [];
  // 새 메시지 알림에는 메시지 내용(건강 정보)을 넣지 않습니다. (기획서 2장 공통 사용성 기준)
  for (const t of threadsFor(state, role).filter(t => t.unread > 0 && t.last)) out.push({ id: `chat-${t.last!.id}`, text: `${t.title} 대화에 새 메시지 ${t.unread}건이 있어요.`, href: `/chat?c=${t.id}` });
  if (role === "patient") {
    for (const p of visiblePatients(state, "patient")) {
      if (p.status === "진행 중" && p.nextDate >= today && p.nextDate <= addDays(today, 7)) out.push({ id: `next-${p.id}-${p.nextDate}${p.nextTime}`, text: `${p.name} 님 ${md(p.nextDate)} ${p.nextTime} ${p.method} 일정이 있어요.`, href: "/my/schedule" });
      const last = state.records.find(r => r.patientId === p.id && r.confirmed);
      if (last) out.push({ id: `rec-${last.id}`, text: `${p.name} 님 ${last.title} 기록이 등록됐어요.`, href: "/my/records" });
      const sr = state.scheduleRequests.find(r => r.patientId === p.id && (r.status === "확정" || r.status === "조정 필요"));
      if (sr) out.push({ id: `sr-${sr.id}-${sr.status}`, text: `${p.name} 님 ${sr.kind === "변경" ? "일정 변경" : "참여 어려움"} 요청이 ${sr.status === "확정" ? "확인됐어요" : "조정이 필요해요"}.`, href: "/my/schedule" });
      if (p.status === "배정 대기") out.push({ id: `wait-${p.id}`, text: `${p.name} 님에게 맞는 전문가를 찾고 있어요.`, href: "/my/requests" });
      if (p.status === "승인 대기") out.push({ id: `appr-${p.id}`, text: `${p.name} 님 담당 전문가가 배정됐어요. 계획을 확인하고 있어요.`, href: "/my/requests" });
    }
  } else if (role === "provider") {
    const me = DEMO_MODE ? demoProvider() : { id: getAccount()?.providerId };
    for (const p of state.patients.filter(x => x.status === "배정 대기" && (!x.requestedProviderId || x.requestedProviderId === me?.id))) out.push({ id: `req-${p.id}`, text: `${p.name} 님 배정 요청이 도착했어요.`, href: "/expert/requests" });
    for (const r of state.scheduleRequests.filter(x => x.status === "요청")) { const p = state.patients.find(x => x.id === r.patientId && x.providerId === me?.id); if (p) out.push({ id: `srq-${r.id}`, text: `${p.name} 님 보호자가 ${r.kind === "변경" ? "일정 변경을 요청했어요" : "참여 어려움을 알렸어요"}.`, href: "/expert" }); }
    for (const p of state.patients.filter(x => x.providerId === me?.id && x.approval?.status === "반려" && x.status === "승인 대기")) out.push({ id: `rej-${p.id}-${p.approval?.at}`, text: `${p.name} 님 계획에 보완 요청이 있어요.`, href: `/expert/patients/${p.id}` });
    for (const p of missingReports(state, today, id => state.patients.find(x => x.id === id)?.providerId === me?.id)) out.push({ id: `miss-${p.id}-${p.nextDate}`, text: `${p.name} 님 ${md(p.nextDate)} 회차 보고서를 작성해 주세요.`, href: "/expert" });
  } else if (role === "hospital") {
    const mine = visiblePatients(state, "hospital");
    const ids = new Set(mine.map(p => p.id));
    for (const p of mine.filter(x => x.status === "배정 대기" && assignmentStage(state, x.id) !== "응답 대기")) out.push({ id: `hs-as-${p.id}-${assignmentHistory(state, p.id)[0]?.id ?? "new"}`, text: assignmentStage(state, p.id) === "재배정 필요" ? `${p.name} 님 매칭 조정이 필요합니다. NPIUM 처리 상태를 확인해 주세요.` : `${p.name} 님 NPIUM 매칭 상태를 확인해 주세요.`, href: "/hospital" });
    for (const p of mine.filter(x => x.status === "승인 대기" && x.approval?.status !== "반려")) out.push({ id: `rv-${p.id}`, text: `${p.name} 님 방문 전 평가가 끝났어요. 처방 확인이 필요해요.`, href: "/hospital/approvals" });
    // 알림에는 건강 정보를 넣지 않습니다: "이상 반응 기록" 사실만 알리고 내용은 화면에서 확인합니다.
    for (const r of state.records.filter(x => ids.has(x.patientId) && x.confirmed && x.adverse?.occurred && !x.adverse.reviewedBy)) { const p = mine.find(x => x.id === r.patientId)!; out.push({ id: `hs-ad-${r.id}`, text: `${p.name} 님 회차 보고서에 이상 반응 기록이 있어요. 담당 의사 확인이 필요해요.`, href: "/hospital" }); }
    for (const p of mine.filter(x => x.status === "진행 중" && state.assessments.some(a => a.patientId === x.id && a.period === "사후 평가"))) out.push({ id: `hs-cl-${p.id}`, text: `${p.name} 님 종료 평가가 끝났어요. 종료를 확인해 주세요.`, href: "/hospital" });
    for (const r of state.reports.filter(x => x.shared)) { const p = state.patients.find(x => x.id === r.patientId); if (p && p.hospital === (DEMO_MODE ? DEMO_ACCOUNTS.hospital.organization : getAccount()?.organization)) out.push({ id: `sh-${r.id}`, text: `${p.name} 님 ${r.period} 보고서가 공유됐어요.`, href: "/hospital/reports" }); }
  } else if (role === "admin") {
    // NPIUM 운영자의 통제·확인 사항입니다.
    for (const p of state.patients.filter(p => p.status === "배정 대기" || state.assignments.find(a => a.patientId === p.id)?.status === "수락")) out.push({ id: `matching-${p.id}`, text: `${p.name} 님 매칭 확인이 필요합니다.`, href: "/admin/assignments" });
    for (const [threadId, meta] of Object.entries(state.inquiries).filter(([, m]) => m.status === "접수")) out.push({ id: `iq-${threadId}-${meta.updatedAt}`, text: `새 문의가 접수됐어요. (${meta.category})`, href: "/admin/inquiries" });
    for (const [key, b] of Object.entries(state.billing).filter(([, b]) => b.status === "청구 완료")) out.push({ id: `bill-${key}`, text: `${key.replace("|", " ")} 이용료 입금을 확인해 주세요.${b.issuedAt ? ` (청구 ${b.issuedAt})` : ""}`, href: "/admin/billing" });
    for (const a of state.applications.filter(x => x.status === "검수 대기")) out.push({ id: `ap-${a.id}`, text: `${a.name} 님 전문가 가입 신청을 검수해 주세요.`, href: "/admin/providers" });
    for (const p of missingReports(state, today)) out.push({ id: `amiss-${p.id}-${p.nextDate}`, text: `${p.name} 님 ${md(p.nextDate)} 회차 보고서가 누락됐어요.`, href: "/admin" });
  }
  return out;
}

// 읽은 알림(체험용, 브라우저에만 저장)
const KEY = "npium-demo-seen-notices";
const listeners = new Set<() => void>();
const readSeen = () => { try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; } };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function markSeen(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(Array.from(new Set([...JSON.parse(readSeen() || "[]"), ...ids])).slice(-200))); } catch { /* 무시 */ }
  listeners.forEach(l => l());
}

export function useNotices(role: Role) {
  const state = useCare();
  const today = useToday();
  const seenRaw = useSyncExternalStore(subscribe, readSeen, () => "");
  const notices = today ? buildNotices(state, role, today) : [];
  let seen: string[] = [];
  try { seen = JSON.parse(seenRaw || "[]"); } catch { seen = []; }
  const unread = notices.filter(n => !seen.includes(n.id)).length;
  return { notices, unread, seen };
}
