import type { Metadata } from "next";
import { NotificationsView } from "./NotificationsView";
import "../chat/chat.css";
import "./notifications.css";

export const metadata: Metadata = { title: "알림 | NOPIUM" };

export default function NotificationsPage() {
  return <NotificationsView />;
}
