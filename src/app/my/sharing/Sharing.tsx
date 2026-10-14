"use client";
import { useState } from "react";
import { Modal } from "@/components/CareUI";
import { Icon } from "@/components/Icon";
import { careRepo } from "@/lib/repo";
import { DEMO_ACCOUNTS } from "@/lib/session";
import { MySubHeader } from "../PatientShell";
import { usePatientCare } from "../use-patient-care";

// 기획서 5장: 보호자는 연결·승인된 대상의 허용 범위만 보고, 관계 종료 시 접근이 회수됩니다.
// 동의·공유 범위·수신자·유효 기간을 기록하고, 다운로드된 파일은 권한 회수로 회수되지 않음을 안내합니다.
const links: Record<string, { relation: string; since: string; until: string }> = {
  p1: { relation: "자녀", since: "2026-09-20", until: "2027-09-19" },
  p4: { relation: "자녀", since: "2026-09-28", until: "2027-09-27" },
};
const scopes = ["일정", "회차 기록·평가", "월간 보고서", "담당 전문가 채팅"];

export function Sharing() {
  const { patients } = usePatientCare();
  const [confirmOff, setConfirmOff] = useState<string | null>(null);
  const me = DEMO_ACCOUNTS.patient;
  const target = patients.find(p => p.id === confirmOff);
  return <div className="sg sg-sub-page">
    <MySubHeader title="정보 공유·보호자 연결" subtitle="누가 어떤 정보를 볼 수 있는지 확인하고, 기관 공유 동의를 관리해요." />
    {patients.map(p => {
      const link = links[p.id] ?? { relation: "보호자", since: "-", until: "-" };
      const linked = p.hospital !== "직접 이용 신청";
      return <section className="my-card my-share" key={p.id}>
        <div className="my-card-head"><h2>{p.name} 님</h2><span className="my-status on">연결됨</span></div>
        <dl className="my-facts">
          <div><dt>보호자</dt><dd>{me.name} 님 · {link.relation}</dd></div>
          <div><dt>열람 범위</dt><dd className="my-chips">{scopes.map(s => <span key={s}>{s}</span>)}</dd></div>
          <div><dt>유효 기간</dt><dd>{link.since} ~ {link.until} <small className="my-muted-inline">기간이 끝나면 다시 승인받아야 해요</small></dd></div>
        </dl>
        <div className="my-share-row">
          <div><b>{linked ? `${p.hospital}에 진행 보고서 공유` : "연계 기관 공유"}</b><small>{linked ? "확정된 월간 보고서만 공유돼요. 끄면 앞으로 공유되는 보고서를 기관이 볼 수 없어요." : "직접 신청한 프로그램이라 공유할 연계 기관이 없어요."}</small></div>
          <button role="switch" aria-checked={p.consent} disabled={!linked} className={`my-switch ${p.consent ? "on" : ""}`} onClick={() => p.consent ? setConfirmOff(p.id) : careRepo.changePatient(p.id, { consent: true })}><span /></button>
        </div>
      </section>;
    })}
    <p className="my-caption"><Icon name="shield" size={12} /> 보호자 연결 해제·범위 변경은 대상자 본인 확인 후 처리돼요. (체험 화면에서는 준비 중)</p>
    {target && <Modal title="기관 공유를 끌까요?" onClose={() => setConfirmOff(null)}>
      <p className="modal-lead">{target.hospital}에서 {target.name} 님의 보고서를 더 이상 볼 수 없게 돼요. 이미 기관이 내려받은 파일은 이 설정으로 회수되지 않아요.</p>
      <div className="modal-actions"><span /><div><button className="btn-ghost" onClick={() => setConfirmOff(null)}>취소</button><button className="btn-primary" onClick={() => { careRepo.changePatient(target.id, { consent: false }); setConfirmOff(null); }}>공유 끄기</button></div></div>
    </Modal>}
  </div>;;
}
