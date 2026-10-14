"use client";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { useRole } from "@/lib/demo-session";
import { markSeen, useNotices } from "@/lib/notifications";
import { LoginNeeded } from "../chat/LoginNeeded";

const iconFor = (id: string): IconName => id.startsWith("chat-") ? "chat" : id.startsWith("next-") ? "calendar" : id.startsWith("rec-") || id.startsWith("sh-") ? "file" : id.startsWith("ap-") ? "user" : "clock";

export function NotificationsView() {
  const role = useRole();
  const { notices, seen } = useNotices(role ?? "guest");
  if (role === null) return <div className="chat-page"><div className="chat-wrap"><p className="chat-muted" role="status">알림을 불러오고 있어요.</p></div></div>;
  if (role === "guest") return <div className="chat-page"><div className="chat-wrap"><LoginNeeded what="알림" /></div></div>;
  const unread = notices.filter(n => !seen.includes(n.id));
  return <div className="chat-page"><div className="chat-wrap noti-wrap">
    <div className="noti-head"><h1 className="chat-title">알림</h1><button disabled={!unread.length} onClick={() => markSeen(notices.map(n => n.id))}>모두 읽음</button></div>
    {notices.length ? <ul className="noti-list">{notices.map(n => <li key={n.id} className={seen.includes(n.id) ? "" : "unread"}>
      <Link href={n.href} onClick={() => markSeen([n.id])}><span className="noti-icon"><Icon name={iconFor(n.id)} size={18} /></span><span className="noti-text">{n.text}</span>{!seen.includes(n.id) && <span className="noti-dot" aria-label="안 읽음" />}<Icon name="chevron" size={16} /></Link>
    </li>)}</ul> : <p className="noti-empty">새 알림이 없어요.</p>}
    <p className="noti-foot">알림에는 건강 정보 같은 상세 내용을 담지 않아요. 내용은 해당 화면에서 확인해 주세요.</p>
  </div></div>;
}
