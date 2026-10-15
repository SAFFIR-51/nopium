"use client";

import Link from "next/link";
import Image from "next/image";
import { expertPortraits } from "@/lib/expert-portraits";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { experts } from "@/lib/data";
import { addPatient } from "@/lib/care-store";
import { setDemoRole, useRole, useActor } from "@/lib/demo-session";
import { DEMO_MODE } from "@/lib/session";
import "./request-flow.css";
import "./request-chat.css";

const purposes = [
  ["수술 후 기능 회복", "관절·척추 수술 후 일상으로 돌아가기"],
  ["뇌졸중 후 기능 회복", "퇴원 후 움직임과 생활 속 활동 이어가기"],
  ["보행·균형 관리", "걷기와 균형, 기초 근력 관리하기"],
  ["일상 활동 관리", "식사·옷 입기 등 생활 속 동작 연습하기"],
  ["기타 · 상담 후 결정", "어떤 프로그램이 맞을지 함께 확인하기"],
];
const applicants = [["본인이 신청", "직접 이용할 프로그램을 찾고 있어요"], ["보호자로 신청", "가족이나 보호 대상자를 대신해 신청해요"], ["기관에서 연계", "기관에서 이용자의 프로그램을 연결해요"]];
const methods = [["방문", "전문가가 이용자의 집으로 방문해요"], ["센터", "이용자가 센터나 운동 공간으로 이동해요"], ["상담 후 결정", "상황을 확인한 뒤 적합한 방식을 정해요"]];
const regions = ["서울 송파구", "서울 강동구", "서울 강남구", "서울 마포구", "성남 분당구", "수원·용인", "기타 지역"];
const titles = ["어떤 관리가 필요하세요?", "누가 신청하고 계신가요?", "프로그램을 이용할 분을 알려주세요", "어디에서 진행하고 싶으세요?", "어느 지역에서 이용하시나요?", "언제 시작하고 싶으세요?", "함께 확인할 내용이 있나요?", "신청 내용을 확인해 주세요"];
const descriptions = ["가장 가까운 목적을 하나 선택해 주세요.", "신청하는 분과 실제 이용자가 달라도 괜찮아요.", "실제로 프로그램을 이용할 분의 정보입니다.", "이용자의 이동 가능 여부를 생각해 선택해 주세요.", "전문가의 활동 지역을 확인하는 데 사용해요.", "희망 일정이며, 전문가와 확인한 뒤 확정합니다.", "원하는 목표나 상담 시 확인할 내용을 적어주세요. (선택)", "수정할 내용이 있다면 해당 항목을 눌러 바꿀 수 있어요."];

function Choices({name, options, value, onChange}:{name:string;options:string[][];value:string;onChange:(value:string)=>void}) {
 return <fieldset className="request-options"><legend className="request-sr-only">{titles[Number(name)]}</legend>{options.map(([label, description])=><label key={label} className={`request-option ${value===label?"selected":""}`}><input type="radio" name={name} value={label} checked={value===label} onChange={()=>onChange(label)}/><span><b>{label}</b>{description&&<small>{description}</small>}</span></label>)}</fieldset>;
}
function today(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;}

export default function RequestFlow({expertId}:{expertId?:string}){
 const expert=experts.find(e=>e.id===expertId);
 const role=useRole(); const actor=useActor();
 const [step,setStep]=useState(0),[condition,setCondition]=useState(""),[forWho,setForWho]=useState(""),[name,setName]=useState(""),[age,setAge]=useState(""),[method,setMethod]=useState(""),[area,setArea]=useState(""),[date,setDate]=useState(""),[time,setTime]=useState(""),[dateError,setDateError]=useState(""),[memo,setMemo]=useState(""),[consent,setConsent]=useState(false),[done,setDone]=useState(false),[editing,setEditing]=useState(false);
 const titleRef=useRef<HTMLHeadingElement>(null),dateRef=useRef<HTMLInputElement>(null),submitted=useRef(false);
 useEffect(()=>{if(step>0)titleRef.current?.focus({preventScroll:true});if(step===5)dateRef.current?.setAttribute("min",today());},[step]);
 const valid = [!!condition,!!forWho,name.trim().length>0&&Number.isInteger(Number(age))&&Number(age)>=1&&Number(age)<=120,!!method,!!area,!!date&&!!time&&!dateError,true,consent];
 const percent=done?100:Math.round(step/titles.length*100);
 const move=(next:number)=>{setStep(next);window.scrollTo({top:0,behavior:"instant"});};
 const edit=(next:number)=>{setEditing(true);move(next);};
 const submit=async()=>{if(!valid.every(Boolean)||submitted.current)return;if(date<today()){setDateError("오늘 이후의 날짜를 선택해 주세요.");move(5);return;}submitted.current=true;const result=await addPatient({id:`p-${crypto.randomUUID()}`,name:name.trim(),age:Number(age),sex:"미입력",condition,area,hospital:role==="hospital"?actor.organization:forWho==="기관에서 연계"?"기관 연계 신청":"직접 이용 신청",provider:"",status:"배정 대기",goal:memo.trim()||"퇴원 후 일상 활동을 이어가고 싶어요",precautions:"초기 평가와 주의사항 확인 필요",completed:0,total:12,nextDate:date,nextTime:time,method,consent,requestedProviderId:expert?.id,requestedProviderName:expert?.name,applicant:forWho,guardianAccountId:role==="hospital"||role==="admin"?undefined:actor.id});if ((result as unknown) === false) {submitted.current=false;return;}if(DEMO_MODE&&(role===null||role==="guest"))setDemoRole("patient");setDone(true);window.scrollTo({top:0,behavior:"instant"});};
 const summary=[{label:"관리 목적",value:condition,step:0},{label:"신청 구분",value:forWho,step:1},{label:"이용자",value:`${name} · ${age}세`,step:2},{label:"진행 방식",value:method,step:3},{label:"희망 지역",value:area,step:4},{label:"희망 일정",value:`${date} ${time}`,step:5},{label:"함께 확인할 내용",value:memo.trim()||"입력한 내용 없음",step:6}];
 if(!DEMO_MODE&&(!role||role==="guest"))return <section className="wrap care-panel"><h1>재활 프로그램 신청</h1><p>계정으로 로그인한 뒤 신청해 주세요.</p><Link href="/login" className="btn-primary">로그인</Link></section>;
 return <div className="request-flow request-chat"><div className="request-progress-header"><div className="request-flow-width"><div className="request-progress-title"><h1>재활 프로그램 신청</h1><Link href="/">나가기 <Icon name="close" size={15}/></Link></div><div className="request-progress-line"><div role="progressbar" aria-label="신청 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div><b>{percent}%</b></div></div></div>
 <div className="request-flow-body"><div className="request-flow-width">
 {done?<section className="request-question request-done"><span className="request-done-icon"><Icon name="check" size={30}/></span><h2>신청이 저장됐어요</h2><p>{name} 님의 희망 조건이 저장되었습니다.<br/>내 관리에서 배정 대기 상태를 확인할 수 있어요.</p><dl>{expert&&<div><dt>희망 전문가</dt><dd>{expert.name}</dd></div>}<div><dt>현재 상태</dt><dd>배정 대기</dd></div><div><dt>진행 방식</dt><dd>{method} · {area}</dd></div><div><dt>희망 일정</dt><dd>{date} {time}</dd></div></dl><Link className="request-primary" href={role==="hospital"?"/hospital":role==="admin"?"/admin":"/my"}>{role==="hospital"?"연계 대상 확인":role==="admin"?"운영 현황 확인":"내 관리 확인"} <Icon name="arrow" size={18}/></Link><a className="request-home-link" href="/request">새 신청 시작하기</a><Link className="request-home-link" href="/">홈으로 돌아가기</Link><small>체험용 신청이며 실제 기관이나 전문가에게 전송되지 않습니다.</small></section>:<>
 {expert&&<div className="request-selected-expert"><span className="request-provider-photo"><Image src={expertPortraits[expert.id]} fill sizes="40px" alt=""/></span><div><b>{expert.name} 전문가에게 신청</b><small>{expert.license} · {expert.area}</small></div><Link href={`/experts/${expert.id}`}>프로필</Link></div>}<div className="request-greeting"><p>{step===0?<>몇 가지 정보만 알려주시면<br/><b>내게 맞는 프로그램을 준비할 수 있어요.</b></>:step===7?<>마지막으로 내용을 확인해 주세요.<br/><b>저장 후 내 관리에서 이어볼 수 있어요.</b></>:<>한 가지씩 차근차근 알려주세요.<br/><b>선택한 내용은 이전 단계에서 바꿀 수 있어요.</b></>}</p></div>
 <section className="request-question"><div className="request-step-meta"><span>{String(step+1).padStart(2,"0")} / {String(titles.length).padStart(2,"0")}</span>{editing&&<span>내용 수정 중</span>}</div><h2 ref={titleRef} tabIndex={-1}>{titles[step]}</h2><p className="request-question-description">{descriptions[step]}</p>
 <form onSubmit={e=>{e.preventDefault();if(!valid[step])return;if(step===7)submit();else if(editing){setEditing(false);move(7);}else move(step+1);}}>
 {step===0&&<Choices name="0" options={purposes} value={condition} onChange={setCondition}/>}
 {step===1&&<Choices name="1" options={applicants} value={forWho} onChange={setForWho}/>}
 {step===2&&<div className="request-fields"><label>이용자 이름<input autoComplete="off" maxLength={40} required value={name} onChange={e=>setName(e.target.value)} placeholder="이용할 분의 이름"/></label><label>나이<div className="request-age"><input required type="number" inputMode="numeric" min="1" max="120" step="1" value={age} onChange={e=>setAge(e.target.value)} placeholder="예: 72"/><span>세</span></div></label><p className="request-input-help">만 1세부터 120세 사이의 정수로 입력해 주세요.</p></div>}
 {step===3&&<Choices name="3" options={expert?methods.filter(([label])=>label==="상담 후 결정"||expert.visit.some(v=>v===label)):methods} value={method} onChange={setMethod}/>}
 {step===4&&<Choices name="4" options={regions.map(r=>[r])} value={area} onChange={setArea}/>}
 {step===5&&<div className="request-fields"><label>희망 날짜<input ref={dateRef} type="date" required value={date} aria-invalid={!!dateError} aria-describedby={dateError?"request-date-error":undefined} onChange={e=>{setDate(e.target.value);setDateError(e.target.value&&e.target.value<today()?"오늘 이후의 날짜를 선택해 주세요.":"");}}/></label>{dateError&&<p id="request-date-error" className="request-error" role="alert">{dateError}</p>}<label>희망 시간<select required value={time} onChange={e=>setTime(e.target.value)}><option value="" disabled>시간을 선택해 주세요</option>{['09:00','10:00','11:00','14:00','15:00','16:00'].map(t=><option key={t}>{t}</option>)}</select></label><p className="request-input-help">제공자 일정과 필요한 평가를 확인한 뒤 실제 일정을 확정합니다.</p></div>}
 {step===6&&<div className="request-fields"><label className="request-sr-only" htmlFor="request-memo">함께 확인할 내용</label><textarea id="request-memo" rows={5} maxLength={500} value={memo} onChange={e=>setMemo(e.target.value)} placeholder="예: 실내에서 걷는 연습을 하고 싶어요. 보호자와 함께 진행할 수 있는지 궁금해요."/><div className="request-memo-count">{memo.length} / 500</div><p className="request-input-help">지금 적기 어렵다면 건너뛰어도 괜찮아요.</p></div>}
 {step===7&&<><dl className="request-review">{expert&&<div className="request-expert-review"><dt>희망 전문가</dt><dd>{expert.name} · {expert.license}<br/><small>배정 전, 일정과 제공 범위를 확인합니다.</small></dd></div>}{summary.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd><button type="button" aria-label={`${row.label} 수정`} onClick={()=>edit(row.step)}>수정</button></div>)}</dl><label className="request-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>체험용 신청 내용을 이 브라우저에 저장하는 것에 동의합니다.</span></label><p className="request-input-help">실제 기관·전문가에게 전송되지 않는 서비스 체험입니다.</p></>}
 <div className="request-actions">{step>0&&<button type="button" className="request-back" onClick={()=>{if(editing){setEditing(false);move(7);}else move(step-1);}}>{editing?"확인 화면":"이전"}</button>}<button className="request-primary" type="submit" disabled={!valid[step]}>{step===7?"신청 완료":editing?"수정 완료":step===6&&!memo.trim()?"건너뛰기":"다음"}{valid[step]&&<Icon name="arrow" size={17}/>}</button></div>
 </form></section><p className="request-bottom-note"> 입력 내용은 이 브라우저의 체험 데이터로만 사용됩니다.</p></>}
 </div></div></div>;
}

