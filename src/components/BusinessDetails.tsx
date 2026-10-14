"use client";
import Link from "next/link";
import { Modal } from "@/components/CareUI";
import { BusinessStatus } from "@/components/BusinessTable";
import { experts } from "@/lib/data";
import type { Patient } from "@/lib/repo";

export function ExpertName({ id, name }: { id?: string; name?: string }) {
  const expert = experts.find(e => e.id === id);
  return expert ? <Link className="business-name-link" href={`/experts/${expert.id}`}>{name || expert.name}</Link> : <span>{name || "미배정"}</span>;
}

export function PatientInfoModal({ patient: p, onClose }: { patient: Patient; onClose: () => void }) {
  return <Modal title={`${p.name} · 대상자 정보`} wide onClose={onClose}>
    <div className="hospital-review">
      <div className="hospital-review-heading"><h3>대상자 및 프로그램 정보</h3><BusinessStatus>{p.status}</BusinessStatus></div>
      <dl className="hospital-review-grid">
        <div><dt>대상자</dt><dd>{p.name} · {p.age}세 · {p.sex}</dd></div>
        <div><dt>연계 기관</dt><dd>{p.hospital}</dd></div>
        <div><dt>프로그램</dt><dd>{p.condition}</dd></div>
        <div><dt>담당 전문가</dt><dd><ExpertName id={p.providerId} name={p.provider} /></dd></div>
        <div><dt>지역</dt><dd>{p.area}</dd></div>
        <div><dt>진행 방식</dt><dd>{p.method}</dd></div>
        <div><dt>다음 일정</dt><dd>{p.nextDate} {p.nextTime}</dd></div>
        <div><dt>진행 회차</dt><dd>{p.completed} / {p.total}회</dd></div>
        <div><dt>정보 공유</dt><dd>{p.consent ? "동의" : "미동의"}</dd></div>
        <div><dt>희망 전문가</dt><dd><ExpertName id={p.requestedProviderId} name={p.requestedProviderName || "지정 없음"} /></dd></div>
        <div className="full"><dt>관리 목표</dt><dd>{p.goal}</dd></div>
        <div className="full"><dt>주의사항</dt><dd>{p.precautions || "등록된 내용 없음"}</dd></div>
        {p.approval && <div className="full"><dt>계획 검토</dt><dd>{p.approval.status} · {p.approval.by}{p.approval.reason && ` · ${p.approval.reason}`}</dd></div>}
      </dl>
      <div className="modal-actions"><button className="business-action" onClick={onClose}>닫기</button></div>
    </div>
  </Modal>;
}
