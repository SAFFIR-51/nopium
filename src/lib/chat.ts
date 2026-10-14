import { visiblePatients } from "@/lib/access";
import { expertPortraits } from "@/lib/expert-portraits";
import type { CareState, ChatMessage } from "@/lib/repo";
import { DEMO_ACCOUNTS, demoProvider, type Role } from "@/lib/session";

/**
 * 채팅방 규칙 (체험용)
 * - care-{대상 id}: 대상의 보호자 계정 ↔ 담당 제공자. 담당이 바뀌면 새 담당자가 이어서 봅니다.
 * - support-{계정 키}: 각 계정 ↔ NOPIUM 운영팀 문의방.
 * 실제 서비스에서는 서버가 방 참여자와 열람 권한을 검증해야 합니다. (기획서 5장)
 */

export type ChatAccount = { key: string; name: string };

export function chatAccount(role: Role | null): ChatAccount | null {
  switch (role) {
    case "patient": return { key: DEMO_ACCOUNTS.patient.id, name: DEMO_ACCOUNTS.patient.name };
    case "provider": { const p = demoProvider(); return p ? { key: p.id, name: p.name } : null; }
    case "hospital": return { key: DEMO_ACCOUNTS.hospital.id, name: DEMO_ACCOUNTS.hospital.organization };
    case "admin": return { key: DEMO_ACCOUNTS.admin.id, name: DEMO_ACCOUNTS.admin.name };
    default: return null;
  }
}

export type ChatThread = {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  photo?: string;
  messages: ChatMessage[];
  last?: ChatMessage;
  unread: number;
  /** 대화 대상이 정해지지 않아 보낼 수 없는 방 */
  closed?: string;
};

const supportTitle = "NOPIUM 운영팀";
const accountLabel: Record<string, string> = {
  [DEMO_ACCOUNTS.patient.id]: `${DEMO_ACCOUNTS.patient.name} 님 (보호자)`,
  [DEMO_ACCOUNTS.hospital.id]: `${DEMO_ACCOUNTS.hospital.organization}`,
  [DEMO_ACCOUNTS.provider.id]: `${demoProvider()?.name ?? "제공자"} 선생님`,
};

function thread(state: CareState, me: ChatAccount, base: Omit<ChatThread, "messages" | "last" | "unread">): ChatThread {
  const messages = state.messages.filter(m => m.threadId === base.id).sort((a, b) => a.at.localeCompare(b.at));
  return { ...base, messages, last: messages[messages.length - 1], unread: messages.filter(m => m.senderKey !== me.key && !m.readBy.includes(me.key)).length };
}

export function threadsFor(state: CareState, role: Role | null): ChatThread[] {
  const me = chatAccount(role);
  if (!me) return [];
  const out: ChatThread[] = [];
  if (role === "patient") {
    for (const p of visiblePatients(state, "patient")) {
      out.push(thread(state, me, p.providerId
        ? { id: `care-${p.id}`, title: `${p.provider} 전문가`, subtitle: `${p.name} 님 · ${p.condition}`, avatar: p.provider.slice(0, 1), photo: expertPortraits[p.providerId] }
        : { id: `care-${p.id}`, title: "담당 전문가 배정 중", subtitle: `${p.name} 님 · ${p.condition}`, avatar: p.name.slice(0, 1), closed: "전문가가 배정되면 대화를 시작할 수 있어요." }));
    }
    out.push(thread(state, me, { id: `support-${me.key}`, title: supportTitle, subtitle: "일정·배정·이용 문의", avatar: "N" }));
  } else if (role === "provider") {
    for (const p of state.patients.filter(x => x.providerId === me.key)) {
      const guardian = p.guardianAccountId === DEMO_ACCOUNTS.patient.id ? `보호자 ${DEMO_ACCOUNTS.patient.name} 님` : "이용자";
      out.push(thread(state, me, { id: `care-${p.id}`, title: `${p.name} 님`, subtitle: `${guardian} · ${p.condition}`, avatar: p.name.slice(0, 1) }));
    }
    out.push(thread(state, me, { id: `support-${me.key}`, title: supportTitle, subtitle: "배정·정산·운영 문의", avatar: "N" }));
  } else if (role === "hospital") {
    out.push(thread(state, me, { id: `support-${me.key}`, title: supportTitle, subtitle: "연계·승인·보고 문의", avatar: "N" }));
  } else if (role === "admin") {
    // 담당 대상이 있는 제공자는 모두 문의방을 둡니다 (기록 누락 확인 등).
    const providerLabel = Object.fromEntries(state.patients.filter(p => p.providerId).map(p => [p.providerId as string, `${p.provider} 선생님`]));
    const label = (key: string) => accountLabel[key] ?? providerLabel[key] ?? key;
    const keys = new Set([DEMO_ACCOUNTS.patient.id, DEMO_ACCOUNTS.provider.id, DEMO_ACCOUNTS.hospital.id, ...Object.keys(providerLabel), ...state.messages.filter(m => m.threadId.startsWith("support-")).map(m => m.threadId.slice(8))]);
    for (const key of keys) out.push(thread(state, me, { id: `support-${key}`, title: label(key), subtitle: "운영팀 문의방", avatar: label(key).slice(0, 1) }));
  }
  // 최근 대화가 위로
  return out.sort((a, b) => (b.last?.at ?? "").localeCompare(a.last?.at ?? ""));
}

export function unreadCount(state: CareState, role: Role | null) {
  return threadsFor(state, role).reduce((n, t) => n + t.unread, 0);
}
