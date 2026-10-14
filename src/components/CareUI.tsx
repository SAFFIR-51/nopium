"use client";
import { useEffect, useRef, type ReactNode, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { careRepo, useCare, todayLocal, type Patient } from "@/lib/repo";
import { MEASURES, measuredCodes, measureSeries } from "@/lib/measures";
import "./report.css";
import "./session-report.css";

/** 상태별 색: 진행·확정=초록, 대기=주황, 반려·누락=빨강, 종료=회색, 그 외=보라 */
const badgeTone=(t:ReactNode)=>{const v=String(t);if(/진행 중|확정|승인|수락|공유됨|동의/.test(v))return "green";if(/대기|요청|확인 중|임시|부분/.test(v))return "amber";if(/반려|거절|누락|미참여|조정/.test(v))return "red";if(/종료|미동의/.test(v))return "grey";return "";};
export function Badge({children}:{children:ReactNode}){return <span className={`care-badge ${badgeTone(children)}`}>{children}</span>;}
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const old=document.body.style.overflow;document.body.style.overflow="hidden";ref.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();if(e.key==="Tab"){const elements=ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,textarea,select,[tabindex="0"]');if(!elements?.length)return;const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener("keydown",key);return()=>{document.body.style.overflow=old;document.removeEventListener("keydown",key);previous?.focus();};},[onClose]);
 return <div className="care-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`care-modal ${wide?"wide-modal":""}`}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><Icon name="close"/></button></div>{children}</div></div>;
}
export function PreviewStrip(){return <div className="preview-strip"><span className="preview-dot"/> 체험용 예시 데이터 <span>입력·변경한 내용은 이 브라우저에 저장됩니다.</span></div>;}
export type Tone="violet"|"blue"|"green"|"orange"|"red"|"teal";
const toneByIcon:Partial<Record<IconName,Tone>>={clock:"blue",calendar:"violet",chat:"orange",file:"green",shield:"red",user:"teal",check:"green",bell:"orange"};
export function Metric({label,value,note,icon,tone,href}:{label:string;value:ReactNode;note:string;icon:IconName;tone?:Tone;href?:string}){const body=<><div><span className="metric-icon"><Icon name={icon} size={18}/></span><span>{label}</span></div><b>{value}</b><p>{note}</p></>;const cls=`metric-card tone-${tone??toneByIcon[icon]??"violet"}`;return href?<a className={`${cls} is-link`} href={href}>{body}</a>:<div className={cls}>{body}</div>;}
export function Progress({patient}:{patient:Patient}){return <div className="care-progress"><div><span>프로그램 진행</span><b>{patient.completed}<small> / {patient.total}회</small></b></div><div className="progress-track"><span style={{width:`${patient.completed/patient.total*100}%`}}/></div></div>;}
/**
 * 월간 진행 보고서: 그 달의 확정된 회차 보고서를 자동으로 모은 요약입니다.
 * 자동 생성 결과는 원본 회차 보고서와 연결되고, 담당 선생님이 확인한 뒤 기관에 공유합니다. (기획서 6장 자동화 범위)
 */
export function ReportView({patient,onClose,readOnly=false}:{patient:Patient;onClose:()=>void;readOnly?:boolean}){
 const state=useCare();
 const all=state.records.filter(r=>r.patientId===patient.id&&r.confirmed).sort((a,b)=>a.date.localeCompare(b.date));
 const month=(all[all.length-1]?.date??todayLocal()).slice(0,7);
 const period=`${month.slice(0,4)}년 ${Number(month.slice(5,7))}월`;
 const recs=all.filter(r=>r.date.startsWith(month));
 const report=state.reports.find(r=>r.patientId===patient.id);const shared=report?.shared??false;
 const share=()=>careRepo.shareReport(patient.id,period);
 const count=(a:string)=>recs.filter(r=>(r.attendance??"참여")===a).length;
 const minutes=recs.reduce((n,r)=>n+(r.durationMin??0),0);
 const codes=measuredCodes(recs);
 const adverse=recs.filter(r=>r.adverse?.occurred);
 const education=recs.filter(r=>r.education).map(r=>r.education as string);
 const md=(iso:string)=>`${Number(iso.slice(5,7))}.${Number(iso.slice(8,10))}`;
 return <Modal title={`${period} 진행 보고서`} onClose={onClose} wide><div className="report-paper"><div className="report-brand"><b>NOPIUM</b><span>MONTHLY CARE REPORT</span></div><h3>{patient.name} 님의 {Number(month.slice(5,7))}월 관리 요약</h3><p className="report-muted">회차 보고서 {recs.length}건에서 자동으로 모은 요약 · 담당 {patient.provider||"배정 전"} 선생님 확인</p>
 <div className="report-summary"><div><small>진행 회차</small><b>{count("참여")+count("부분 참여")}회 <small>(부분 {count("부분 참여")})</small></b></div><div><small>미참여</small><b>{count("미참여")}회</b></div><div><small>총 진행 시간</small><b>{minutes}분</b></div></div>
 <h4>목표</h4><p>{patient.goal}</p><Progress patient={patient}/>
 <h4>측정값 변화</h4>{codes.length?<table className="report-table"><thead><tr><th>항목</th><th>첫 기록</th><th>최근</th><th>변화</th></tr></thead><tbody>{codes.map(c=>{const ser=measureSeries(recs,c.code);const f=ser[0],l=ser[ser.length-1];const d=Math.round((l.value-f.value)*10)/10;return <tr key={c.code}><td>{c.label}</td><td>{f.value}{c.unit} <small>{md(f.date)}</small></td><td>{l.value}{c.unit} <small>{md(l.date)}</small></td><td>{ser.length>1?`${d>0?"+":""}${d}${c.unit}`:"–"}</td></tr>;})}</tbody></table>:<p className="report-muted">이번 달 측정값이 없습니다.</p>}
 <h4>회차별 기록</h4>{recs.length?recs.map(r=><div className="report-line" key={r.id}><b>{md(r.date)} · {r.sessionNo?`${r.sessionNo}회차`:r.title} · {r.attendance??"참여"}</b><p>{r.content}</p></div>):<p className="report-muted">확정된 기록이 아직 없습니다.</p>}
 <h4>이상 반응·안전</h4>{adverse.length?adverse.map(r=><div className="report-line" key={r.id}><b>{md(r.date)}</b><p>{r.adverse?.detail} → {r.adverse?.action}</p></div>):<p className="report-muted">기록된 이상 반응이 없습니다.</p>}
 {education.length>0&&<><h4>보호자 안내</h4><ul className="report-list">{education.map((e,i)=><li key={i}>{e}</li>)}</ul></>}
 <h4>다음 계획과 주의사항</h4><p>{recs[recs.length-1]?.next??"-"}</p><p className="report-muted">{patient.precautions} · 기록된 측정값이며 의료적 판단을 대신하지 않습니다.</p></div>
 <div className="modal-actions"><span className={shared?"shared-label":"muted"}>{shared?"공유됨 · 병원 화면에서 확인 가능":"기관 공유 전"}</span>{!readOnly&&<button className="btn-primary" disabled={!patient.consent||shared||!recs.length} onClick={share}>{shared?"공유 완료":"확인하고 병원에 공유"}</button>}</div></Modal>;
}
export function savedTimeLabel(iso?:string){if(!iso)return "";const d=new Date(iso);return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}
/** 방문 전 평가(초기)·종료 평가(사후). 표준 도구 점수는 코드·값으로 저장하고, 비우면 미측정입니다. */
export function AssessmentForm({patient,onClose,period:fixed,by}:{patient:Patient;onClose:()=>void;period?:"초기 평가"|"중간 평가"|"사후 평가";by?:string}){
 const [period,setPeriod]=useState<string>(fixed??"초기 평가");
 const [values,setValues]=useState({rom:"",strength:"",walking:"",balance:"",adl:"",environment:""});
 const [scores,setScores]=useState<Record<string,string>>({});
 const fields:[keyof typeof values,string,string][]=[["walking","보행","보조기구·보호자 동행 여부"],["balance","균형","방향 전환·지지 여부"],["strength","근력","평가 방법과 결과"],["rom","관절 가동범위","부위·방향과 측정값"],["adl","일상생활 동작","도움이 필요한 동작"],["environment","주거환경","문턱·욕실·동선 등 위험 요소"]];
 const save=()=>{careRepo.addAssessment({patientId:patient.id,period,date:todayLocal(),...values,by,measures:MEASURES.map(m=>({code:m.code,value:scores[m.code]?Number(scores[m.code]):null})).filter(m=>m.value!==null)});onClose();};
 return <Modal title={`${patient.name} 님 ${period==="초기 평가"?"방문 전 평가":period==="사후 평가"?"종료 평가":"중간 평가"}`} onClose={onClose} wide>
  <p className="modal-lead">{period==="초기 평가"?"면담과 신체기능·주거환경을 평가해요. 담당 의사가 이 평가를 보고 방문 계획을 확인해요.":period==="사후 평가"?"기능을 다시 평가해 방문 전과 비교해요. 저장하면 병원이 종료를 확인할 수 있어요.":"진행 중 기능을 점검해요."}</p>
  <form className="care-form" onSubmit={e=>{e.preventDefault();save();}}>
   {!fixed&&<label>평가 시점<select value={period} onChange={e=>setPeriod(e.target.value)}>{["초기 평가","중간 평가","사후 평가"].map(t=><option key={t}>{t}</option>)}</select></label>}
   <fieldset className="srf-measures"><legend>표준 평가 점수 <small>측정하지 않은 항목은 비워 두세요</small></legend><table><tbody>{MEASURES.map(m=><tr key={m.code}><td><b>{m.label}</b><small>{m.method}</small></td><td><span className="srf-unit"><input type="number" step="0.1" min="0" max={m.max} value={scores[m.code]??""} onChange={e=>setScores(v=>({...v,[m.code]:e.target.value}))} placeholder="미측정" aria-label={`${m.label} (${m.unit})`}/><em>{m.unit}</em></span></td></tr>)}</tbody></table></fieldset>
   <div className="form-two">{fields.map(([key,label,placeholder])=><label key={key}>{label}<textarea rows={2} value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))} placeholder={placeholder}/></label>)}</div>
   <p className="form-hint">자동 판단 없이 입력한 결과만 기록해요.</p>
   <button type="submit" className="btn-primary wide">{period==="초기 평가"?"평가 저장하고 의사 확인 요청":period==="사후 평가"?"종료 평가 저장":"평가 저장"}</button>
  </form></Modal>;
}

