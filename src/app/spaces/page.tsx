"use client";
import { Modal } from "@/components/CareUI";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { CENTERS } from "@/lib/places";
// 제휴 센터·공간 목록은 방문 장소(src/lib/places.ts)와 같은 데이터를 씁니다.
const spaces=CENTERS;
export default function Spaces(){const [region,setRegion]=useState('전체 지역');const [selected,setSelected]=useState<(typeof spaces)[number] | null>(null);const [reserved,setReserved]=useState(false);
  return <div className="spaces-page wrap"><p className="eyebrow">SPACE FOR YOUR CARE</p><div className="spaces-title"><h1>센터·공간 찾기</h1><p>가까운 곳에서, 전문가와 함께.<br/>프로그램에 맞는 센터를 만나보세요.</p></div><div className="space-filter"><span><Icon name="pin"/>지역 선택</span><select aria-label="센터 지역" value={region} onChange={e=>setRegion(e.target.value)}>{['전체 지역',...spaces.map(s=>s.area)].map(a=><option key={a}>{a}</option>)}</select><span className="muted small">공간과 센터는 체험용 예시입니다.</span></div><div className="space-grid">{spaces.filter(s=>region==='전체 지역'||s.area===region).map(s=><button className="space-card" key={s.name} onClick={()=>{setSelected(s);setReserved(false);}}><div className="space-photo"><Image src={s.image} fill sizes="(max-width: 700px) 100vw, 33vw" alt="프로그램 공간 예시"/><span>프로그램 공간</span></div><div><small><Icon name="pin" size={14}/>{s.area}</small><h2>{s.name}</h2><p>{s.description}</p><div className="record-tags">{s.tags.map(t=><span key={t}>{t}</span>)}</div></div></button>)}</div>
    {selected && <Modal title={selected.name} onClose={()=>setSelected(null)}><div className="space-modal-photo"><Image src={selected.image} fill sizes="550px" alt="센터 공간 예시"/></div><p className="modal-lead">{selected.description}</p>{reserved?<div className="soft-note"><Icon name="check"/><p>체험용 예약 요청이 완료됐어요. 실제 센터에는 전송되지 않습니다.</p></div>:<form className="care-form" onSubmit={e=>{e.preventDefault();setReserved(true);}}><div className="form-two"><label>희망 날짜<input required type="date" min="2026-10-13" defaultValue="2026-10-16"/></label><label>희망 시간<select><option>10:00 – 11:00</option><option>14:00 – 15:00</option><option>16:00 – 17:00</option></select></label></div><button className="btn-primary wide">예약 요청 체험</button></form>}</Modal>}
</div>;}
