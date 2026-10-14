"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { RoleShell } from "@/components/RoleShell";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { selectPatient, usePatientCare } from "./use-patient-care";
import "./my-page.css";

export function PatientShell({ children }: { children: ReactNode }) {
  const { patients } = usePatientCare();
  const me = DEMO_ACCOUNTS.patient;
  return <RoleShell layout="list" area="patient" person={{ name: `${me.name} 님`, sub: `${me.relation} · 연결된 대상 ${patients.length}명`, icon: "user" }} menu={[]}>{children}</RoleShell>;
}

/** 하위 화면 상단: 숨고 하위 화면처럼 뒤로 가기 + 제목. */
export function MySubHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="my-subheader">
    <Link href="/my" className="my-back" aria-label="내 관리로 돌아가기"><Icon name="chevron" size={20} /></Link>
    <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    {action}
  </div>;
}

/** 관리 대상 선택(드롭다운). 기본은 첫 대상이고, 여러 가족을 관리할 때 누구의 정보인지 항상 보이게 합니다. (기획서 2장) */
export function PatientSwitch() {
  const { patients, patient } = usePatientCare();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, [open]);
  if (!patient) return null;
  const multi = patients.length > 1;
  return <div className="my-picker" ref={ref}>
    <button type="button" className="my-picker-btn" aria-haspopup="listbox" aria-expanded={open} disabled={!multi} onClick={() => setOpen(o => !o)}>
      <span className="my-picker-text"><b>{patient.name} 님</b><small>{patient.condition}</small></span>
      <span className="care-status">{patient.status}</span>
      {multi && <span className="my-picker-caret" aria-hidden="true"><Icon name="down" size={16} /></span>}
    </button>
    {open && <ul className="my-picker-menu" role="listbox" aria-label="관리 대상 선택">
      {patients.map(p => <li key={p.id} role="option" aria-selected={p.id === patient.id}>
        <button type="button" onClick={() => { selectPatient(p.id); setOpen(false); }}>
          <span className="my-picker-text"><b>{p.name} 님</b><small>{p.condition} · {p.status}</small></span>
          {p.id === patient.id && <Icon name="check" size={16} />}
        </button>
      </li>)}
    </ul>}
  </div>;
}
