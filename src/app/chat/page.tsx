import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatView } from "./ChatView";
import "./chat.css";

export const metadata: Metadata = { title: "채팅 | NOPIUM" };

export default function ChatPage() {
  return <Suspense fallback={<div className="chat-page"><div className="chat-wrap"><p className="chat-muted" role="status">채팅을 불러오고 있어요.</p></div></div>}><ChatView /></Suspense>;
}
