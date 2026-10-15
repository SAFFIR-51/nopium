"use client";
import { mutationFailed } from "@/lib/repo";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { chatAccount, threadsFor } from "@/lib/chat";
import { useRole } from "@/lib/demo-session";
import { careRepo, useCare } from "@/lib/repo";
import { DEMO_MODE } from "@/lib/session";
import { LoginNeeded } from "./LoginNeeded";

const time = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const listTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  return d.toDateString() === now.toDateString() ? time(iso) : `${d.getMonth() + 1}.${d.getDate()}`;
};

export function ChatView() {
  const state = useCare();
  const role = useRole();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const me = chatAccount(role);
  const threads = threadsFor(state, role);
  const requested = params.get("c");
  const current = threads.find(t => t.id === requested) ?? null;
  // 내 관리의 "빠른 문의" 버튼에서 넘어온 문장을 입력창에 미리 넣어 둡니다(보내기 전 수정 가능).
  const [draft, setDraft] = useState(() => params.get("t") ?? "");
  const listRef = useRef<HTMLDivElement>(null);

  // 대화방을 열면 읽음 처리
  useEffect(() => { if (current && me && current.unread > 0) careRepo.markThreadRead(current.id, me.key); }, [current, me]);
  // 새 메시지가 오면 맨 아래로
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [current?.id, current?.messages.length]);

  if (role === null) return <div className="chat-page"><div className="chat-wrap"><p className="chat-muted" role="status">채팅을 불러오고 있어요.</p></div></div>;
  if (!me) return <div className="chat-page"><div className="chat-wrap"><LoginNeeded what="채팅" /></div></div>;

  const open = (id: string) => { if (id !== current?.id) setDraft(""); router.replace(`${path}?c=${id}`, { scroll: false }); };
  const send = async () => { if (!current || current.closed || !draft.trim()) return; if (mutationFailed(await careRepo.sendMessage(current.id, me, draft))) return; setDraft(""); };

  let lastDay = "";
  return <div className="chat-page"><div className="chat-wrap">
    <h1 className="chat-title">채팅</h1>
    <div className={`chat-box ${current ? "has-current" : ""}`}>
      <aside className="chat-list" aria-label="대화 목록">
        {threads.length ? <ul>{threads.map(t => <li key={t.id}><button className={t.id === current?.id ? "active" : ""} onClick={() => open(t.id)} aria-current={t.id === current?.id ? "true" : undefined}>
          <span className="chat-avatar">{t.photo ? <Image src={t.photo} width={44} height={44} alt="" /> : t.avatar}</span>
          <span className="chat-item-body"><span className="chat-item-top"><b>{t.title}</b><small>{listTime(t.last?.at)}</small></span><span className="chat-item-sub">{t.subtitle}</span><span className="chat-item-last">{t.last ? t.last.text : t.closed ?? "아직 주고받은 메시지가 없어요."}</span></span>
          {t.unread > 0 && <em className="chat-unread" aria-label={`안 읽은 메시지 ${t.unread}건`}>{t.unread}</em>}
        </button></li>)}</ul> : <p className="chat-muted">대화할 상대가 아직 없어요.</p>}
      </aside>

      <section className="chat-room" aria-label={current ? `${current.title} 대화` : "대화"}>
        {current ? <>
          <header className="chat-room-head">
            <button className="chat-back" aria-label="대화 목록으로" onClick={() => router.replace(path, { scroll: false })}><Icon name="chevron" size={20} /></button>
            <span className="chat-avatar sm">{current.photo ? <Image src={current.photo} width={36} height={36} alt="" /> : current.avatar}</span>
            <div><b>{current.title}</b><small>{current.subtitle}</small></div>
          </header>
          <div className="chat-messages" ref={listRef}>
            {current.messages.length ? current.messages.map(m => {
              const d = day(m.at); const sep = d !== lastDay; lastDay = d;
              const mine = m.senderKey === me.key;
              return <div key={m.id}>
                {sep && <p className="chat-day">{d}</p>}
                <div className={`chat-msg ${mine ? "mine" : ""}`}>
                  {!mine && <span className="chat-sender">{m.senderName}</span>}
                  <div className="chat-bubble-row"><p className="chat-bubble">{m.text}</p><span className="chat-time">{mine && m.readBy.length > 1 ? "읽음 · " : ""}{time(m.at)}</span></div>
                </div>
              </div>;
            }) : <p className="chat-empty">첫 메시지를 보내 대화를 시작해 보세요.</p>}
          </div>
          <form className="chat-compose" onSubmit={e => { e.preventDefault(); send(); }}>
            <textarea rows={2} value={draft} disabled={!!current.closed} maxLength={2000} placeholder={current.closed ?? "메시지를 입력하세요. (Enter 전송 · Shift+Enter 줄바꿈)"} aria-label="메시지 입력"
              onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
            <button type="submit" disabled={!!current.closed || !draft.trim()}>전송</button>
          </form>
          <p className="chat-notice"><Icon name="shield" size={13} />응급 상황이라면 채팅 대신 119에 연락하세요. 건강 정보는 필요한 범위에서만 공유해 주세요.{DEMO_MODE && " · 체험용 대화는 이 브라우저에만 저장돼요. 역할을 바꾸면 상대방 화면에서 답장할 수 있어요."}</p>
        </> : <div className="chat-placeholder"><Icon name="chat" size={36} /><p>대화를 선택해 주세요.</p></div>}
      </section>
    </div>
  </div></div>;
}
