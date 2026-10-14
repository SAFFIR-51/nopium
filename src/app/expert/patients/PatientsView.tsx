"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PlaceInfo } from "@/components/PlaceInfo";
import { programStage } from "@/lib/program";
import { useToday } from "@/lib/use-today";
import { ExpertSubHeader } from "../ExpertShell";
import { useProviderCare } from "../use-provider-care";

const tabs = ["진행 중", "승인 대기", "종료", "전체"] as const;
const short = (iso: string) => iso.slice(5).replace("-", ".");

/** 담당 대상: 숨고 받은 견적처럼 한 열 목록. 위에서 상태를 고르고, 카드 하나에 지금 단계·다음 방문·장소를 보여 줍니다. */
export function PatientsView() {
  const data = useProviderCare();
  const today = useToday();
  const [tab, setTab] = useState<(typeof tabs)[number]>("진행 중");
  if (!data) return null;
  const list = data.patients.filter(p => tab === "전체" || p.status === tab);
  const draftIds = new Set(data.drafts.map(r => r.patientId));
  const count = (t: (typeof tabs)[number]) => (t === "전체" ? data.patients.length : data.patients.filter(p => p.status === t).length);
  return <div className="sg sg-work my-home my-sub-view">
    <ExpertSubHeader title="담당 대상" subtitle={`배정된 대상 ${data.patients.length}명 · 단계와 다음 방문을 확인해요`} />
    <div className="sg-filter" role="tablist" aria-label="진행 상태">
      {tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t} {count(t)}</button>)}
    </div>
    {list.length ? list.map(p => {
      const stage = programStage(data.state, p, today);
      const warn = stage === "방문 전 평가" || stage === "종료 평가" || draftIds.has(p.id);
      return <section className="sg-card" key={p.id}>
        <Link className="sg-row" href={`/expert/patients/${p.id}`}>
          <span><small className={`sg-state ${warn ? "warn" : p.status === "진행 중" ? "on" : "off"}`}>{stage}{draftIds.has(p.id) ? " · 작성 중인 보고서" : ""}</small>
            <b>{p.name} 님 <small style={{ display: "inline" }}>{p.age}세 · {p.sex}</small></b>
            <small>{p.condition} · {p.hospital}</small></span>
          <span className="sg-right">{p.status === "종료" ? "기록 보기" : "상세"}<Icon name="chevron" size={14} /></span>
        </Link>
        {p.status !== "종료" && <>
          <div className="sg-divider" />
          <div className="sg-progress-label"><span>다음 방문 <b>{short(p.nextDate)} {p.nextTime}</b></span><span>방문 <b>{p.completed}</b> / {p.total}회</span></div>
          <div className="sg-progress"><span style={{ width: `${Math.min(100, (p.completed / p.total) * 100)}%` }} /></div>
          <PlaceInfo patient={p} full={false} map={false} changed={!!p.nextPlace} />
          <p className="sg-caution"><Icon name="shield" size={14} />{p.precautions}</p>
        </>}
        {p.status === "종료" && p.closure && <p className="sg-highlight">{p.closure.summary}</p>}
      </section>;
    }) : <section className="sg-card sg-empty">이 상태에 해당하는 대상이 없어요.</section>}
  </div>;
}
