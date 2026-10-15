"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import type { Patient } from "@/lib/repo";
import "./report.css";
import "./session-report.css";

/** 상태별 색: 진행·확정=초록, 대기=주황, 반려·누락=빨강, 종료=회색, 그 외=보라 */
const badgeTone=(t:ReactNode)=>{const v=String(t);if(/진행 중|확정|승인|수락|공유됨|동의/.test(v))return "green";if(/대기|요청|확인 중|임시|부분/.test(v))return "amber";if(/반려|거절|누락|미참여|조정/.test(v))return "red";if(/종료|미동의/.test(v))return "grey";return "";};
export function Badge({children}:{children:ReactNode}){return <span className={`care-badge ${badgeTone(children)}`}>{children}</span>;}
export { PagePanel } from "./PagePanel";
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null), close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, old = document.body.style.overflow;
    document.body.style.overflow = "hidden"; ref.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const elements = ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.body.style.overflow = old; document.removeEventListener("keydown", key); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return <div className="care-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`care-modal ${wide ? "wide-modal" : ""}`}><div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="닫기" onClick={onClose}><Icon name="close" /></button></div>{children}</div></div>;
}
export function PreviewStrip(){return <div className="preview-strip"><span className="preview-dot"/> 체험용 예시 데이터 <span>입력·변경한 내용은 이 브라우저에 저장됩니다.</span></div>;}
export type Tone="violet"|"blue"|"green"|"orange"|"red"|"teal";
const toneByIcon:Partial<Record<IconName,Tone>>={clock:"blue",calendar:"violet",chat:"orange",file:"green",shield:"red",user:"teal",check:"green",bell:"orange"};
export function Metric({label,value,note,icon,tone,href}:{label:string;value:ReactNode;note:string;icon:IconName;tone?:Tone;href?:string}){const body=<><div><span className="metric-icon"><Icon name={icon} size={18}/></span><span>{label}</span></div><b>{value}</b><p>{note}</p></>;const cls=`metric-card tone-${tone??toneByIcon[icon]??"violet"}`;return href?<a className={`${cls} is-link`} href={href}>{body}</a>:<div className={cls}>{body}</div>;}
export function Progress({patient}:{patient:Patient}){return <div className="care-progress"><div><span>프로그램 진행</span><b>{patient.completed}<small> / {patient.total}회</small></b></div><div className="progress-track"><span style={{width:`${patient.completed/patient.total*100}%`}}/></div></div>;}
/** 월간 경과 보고서·외래 요약·보호자 요약은 ./reports/ReportView.tsx 에 있어요. */
export function savedTimeLabel(iso?:string){if(!iso)return "";const d=new Date(iso);return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}
/** 방문 전·중간·종료 평가 입력은 ./AssessmentForm.tsx 에 있어요. */

