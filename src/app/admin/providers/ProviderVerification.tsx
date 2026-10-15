"use client";
import { useToday } from "@/lib/use-today";
import { useState } from "react";
import { careRepo, PROVIDER_CHECKS, type ProviderControl } from "@/lib/repo";
import { allProviders, providerEligibility } from "@/lib/workflow";
import { useAdminCare } from "../use-admin-care";
import { DEMO_ACCOUNTS } from "@/lib/session";

function VerificationForm({ providerId }: { providerId: string }) {
  const { state } = useAdminCare();
  const today = useToday();
  const current = state.providerControls[providerId];
  const [checks, setChecks] = useState<ProviderControl["checks"]>(current?.checks ?? {});
  const [insuranceUntil, setUntil] = useState(current?.insuranceUntil ?? "");
  const [grade, setGrade] = useState<ProviderControl["grade"]>(current?.grade ?? "미지정");
  const [hold, setHold] = useState(current?.hold ?? false);
  const [reason, setReason] = useState(current?.reason ?? "");
  const [message, setMessage] = useState("");
  return <form className="care-form" onSubmit={async e => { e.preventDefault(); const ok = await careRepo.setProviderControl({ providerId, checks, insuranceUntil, grade, hold, reason, by: DEMO_ACCOUNTS.admin.name }); setMessage(ok ? "확인 자료와 배정 가능 상태를 저장했습니다." : "보험 기간·확인 근거·보류 사유를 확인해 주세요."); }}>
    <p className="admin-note">현재: {providerEligibility(state, providerId, today ?? "")}. 체크는 담당자가 확인 자료를 검토한 결과이며 외부 기관의 자동 검증을 의미하지 않습니다.</p>
    {PROVIDER_CHECKS.map(k => <div className="form-two" key={k}><label className="consent-check"><input type="checkbox" checked={checks[k]?.confirmed ?? false} onChange={e => setChecks(v => ({ ...v, [k]: { reference: v[k]?.reference ?? "", confirmed: e.target.checked } }))} /><span>{k}</span></label><label>{k} 확인 자료<input required={checks[k]?.confirmed} value={checks[k]?.reference ?? ""} placeholder="문서 식별정보·확인 경로" onChange={e => setChecks(v => ({ ...v, [k]: { confirmed: v[k]?.confirmed ?? false, reference: e.target.value } }))} /></label></div>)}
    <div className="form-two"><label>보험 유효기간<input required type="date" value={insuranceUntil} onChange={e => setUntil(e.target.value)} /></label><label>등급제 운영<select value={grade} onChange={e => setGrade(e.target.value as ProviderControl["grade"])}>{["미지정", "Junior", "Senior", "Specialist", "VIP 전담"].map(g => <option key={g}>{g}</option>)}</select></label></div>
    <label className="consent-check"><input type="checkbox" checked={hold} onChange={e => setHold(e.target.checked)} /><span>신규 배정 보류</span></label><label>확인·보류 사유<textarea required={hold} rows={2} value={reason} onChange={e => setReason(e.target.value)} /></label><button className="btn-primary">인증·등급·배정 상태 저장</button>{message && <p role="status" className="admin-feedback">{message}</p>}{current && <p className="admin-note">최근 확인 {current.by} · {current.at}</p>}
    <details><summary>인증·등급·배정 상태 변경 이력</summary>{state.providerControlHistory?.filter(v => v.providerId === providerId).map((v, i) => <p key={v.at + i}>{v.at} · {v.by} · {v.grade} · {v.hold ? "배정 보류" : "보류 해제"} · 보험 {v.insuranceUntil}<br />{v.reason}<br />{PROVIDER_CHECKS.map(k => `${k}: ${v.checks[k]?.confirmed ? v.checks[k]?.reference : "미확인"}`).join(" · ")}</p>)}</details>
  </form>;
}
export function ProviderVerification() {
  const { state } = useAdminCare();
  const today = useToday();
  const providers = allProviders(state);
  const [selectedId, setId] = useState("");
  const id = selectedId || providers[0]?.id || "";
  return <section className="admin-panel"><h2>면허·경력·이력·보험 확인과 등급제 운영</h2><div className="business-controls"><select aria-label="인증 대상 치료사" value={id} onChange={e => setId(e.target.value)}>{providers.map(p => <option key={p.id} value={p.id}>{p.name} · {providerEligibility(state, p.id, today ?? "")}</option>)}</select></div>{id && <VerificationForm key={id} providerId={id} />}</section>;
}
