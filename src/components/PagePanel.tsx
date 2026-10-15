"use client";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import "./page-panel.css";

export function PagePanel({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <section className={`task-page ${wide ? "task-page-wide" : ""}`} aria-label={title}>
    <nav className="task-page-nav" aria-label="이전 화면"><button type="button" onClick={onClose}><Icon name="chevron" size={16} />이전 화면으로</button></nav>
    <header className="task-page-heading"><h1>{title}</h1></header>
    <div className="task-page-body">{children}</div>
  </section>;
}
