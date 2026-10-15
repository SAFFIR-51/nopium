"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { conditions } from "@/lib/data";
import { careRepo } from "@/lib/repo";
import { setDemoRole } from "@/lib/demo-session";
import { DEMO_MODE } from "@/lib/session";
import "@/app/request/request-flow.css";
import "../partner.css";

// 숨고 고수 가입 흐름(분야 → 제공 서비스 → 필수 정보)을 참고하되,
// 재활 서비스에 필요한 자격·제공 범위 확인(기획서 3장 제공자 관리)을 앞 단계에 넣었습니다.

const licenses: { label: string; text: string; icon: IconName }[] = [
  { label: "물리치료사", text: "보행·근력·관절 기능 회복", icon: "walker" },
  { label: "작업치료사", text: "일상생활 동작·손 기능", icon: "hand" },
  { label: "언어재활사", text: "삼킴·언어·의사소통", icon: "speech" },
  { label: "건강운동관리사", text: "운동 처방과 체력 관리", icon: "joint" },
  { label: "기타 재활·운동 자격", text: "검수 때 자격을 확인해요", icon: "plus" },
];
const methods = [["방문", "대상자의 집으로 찾아가요"], ["센터", "센터·운동 공간에서 진행해요"], ["비대면 점검", "영상으로 상태와 과제를 확인해요"]];
const regions = ["서울 송파·강동", "서울 강남·서초", "서울 마포·서대문", "서울 전역", "성남 분당·수지", "수원·용인", "기타 지역"];
const terms = [
  { key: "age", label: "만 19세 이상입니다", required: true },
  { key: "service", label: "이용약관 동의", required: true },
  { key: "privacy", label: "개인정보 수집 및 이용 동의", required: true },
  { key: "policy", label: "전문가 활동 운영정책 동의 (기록·안전 기준 포함)", required: true },
  { key: "marketing", label: "광고성 정보 수신 동의", required: false },
] as const;
type TermKey = (typeof terms)[number]["key"];
const titles = ["어떤 전문가로 활동하실 건가요?", "어떤 프로그램을 제공할 수 있나요?", "어디에서, 어떻게 진행할 수 있나요?", "자격 정보를 알려주세요", "필수 정보 입력 방식을 선택해 주세요", "마지막으로 필수 정보를 입력해 주세요"];
const descriptions = ["보유한 자격을 하나 선택해 주세요.", "제공할 수 있는 분야를 모두 선택해 주세요. 배정 요청은 선택한 분야로만 도착해요.", "가능한 진행 방식과 활동 지역을 모두 선택해 주세요.", "운영자가 검수한 뒤 활동을 시작할 수 있어요.", "", "가입 신청 후 검수 결과를 이 연락처로 안내해요."];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v: string) => /^01[016789]-?\d{3,4}-?\d{4}$/.test(v);
const passwordOk = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

function Checks({ legend, options, values, onChange }: { legend: string; options: string[][]; values: string[]; onChange: (v: string[]) => void }) {
  return <fieldset className="request-options join-checks"><legend className="request-sr-only">{legend}</legend>
    {options.map(([label, description]) => <label key={label} className={`request-option ${values.includes(label) ? "selected" : ""}`}><input type="checkbox" checked={values.includes(label)} onChange={() => onChange(toggle(values, label))} /><span><b>{label}</b>{description && <small>{description}</small>}</span></label>)}
  </fieldset>;
}

export function JoinFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [license, setLicense] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [ways, setWays] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [years, setYears] = useState("");
  const [insurance, setInsurance] = useState<"가입" | "준비 중" | "">("");
  const [documentName, setDocumentName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // 비밀번호는 형식만 확인하고 어디에도 저장하지 않습니다. 실제 서비스에서는 인증 서비스로 바로 전달합니다.
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [agreed, setAgreed] = useState<Record<TermKey, boolean>>({ age: false, service: false, privacy: false, policy: false, marketing: false });
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(false);
  useEffect(() => { if (step > 0) titleRef.current?.focus({ preventScroll: true }); }, [step]);

  const requiredAgreed = terms.filter(t => t.required).every(t => agreed[t.key]);
  const allAgreed = terms.every(t => agreed[t.key]);
  const yearsNum = Number(years);
  const valid = [
    !!license,
    programs.length > 0,
    ways.length > 0 && areas.length > 0,
    licenseNumber.trim().length >= 4 && years !== "" && Number.isInteger(yearsNum) && yearsNum >= 0 && yearsNum <= 60 && !!insurance,
    true,
    name.trim().length >= 2 && emailOk(email) && passwordOk(password) && phoneOk(phone) && verified && requiredAgreed,
  ];
  const percent = done ? 100 : Math.round((step / titles.length) * 100);
  const move = (next: number) => { setStep(next); setTouched(false); window.scrollTo({ top: 0, behavior: "instant" }); };
  const next = () => { if (!valid[step]) { setTouched(true); return; } if (step === titles.length - 1) submit(); else move(step + 1); };
  const submit = async () => {
    if (submitted.current) return;
    submitted.current = true;
    const applicationId = await careRepo.submitApplication({ license, programs, methods: ways, regions: areas, licenseNumber: licenseNumber.trim(), years: yearsNum, insurance: insurance as "가입" | "준비 중", documentName: documentName || undefined, name: name.trim(), phone, email, marketing: agreed.marketing });
    if (!applicationId) return;
    setPassword("");
    setDone(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const error = (show: boolean, text: string) => touched && show ? <p className="request-error" role="alert">{text}</p> : null;

  return <div className="request-flow join-flow">
    <div className="request-progress-header"><div className="request-flow-width">
      <div className="request-progress-title"><h1>전문가 가입하기</h1><Link href="/partner">나가기 <Icon name="close" size={15} /></Link></div>
      <div className="request-progress-line"><div role="progressbar" aria-label="가입 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></div>
    </div></div>
    <div className="request-flow-body"><div className="request-flow-width">
      {done ? <section className="request-question request-done">
        <span className="request-done-icon"><Icon name="check" size={30} /></span>
        <h2>가입 신청이 접수됐어요</h2>
        <p>{name} 님의 자격 정보를 운영자가 검수하고 있어요.<br />검수가 끝나면 {email}(으)로 결과를 안내해 드려요.</p>
        <dl><div><dt>자격</dt><dd>{license} · 경력 {yearsNum}년</dd></div><div><dt>제공 분야</dt><dd>{programs.join(", ")}</dd></div><div><dt>진행 방식·지역</dt><dd>{ways.join(", ")} · {areas.join(", ")}</dd></div><div><dt>현재 상태</dt><dd>검수 대기</dd></div></dl>
        {DEMO_MODE && <button className="request-primary" onClick={() => { setDemoRole("provider"); router.push("/expert"); }}>전문가 화면 둘러보기 <Icon name="arrow" size={18} /></button>}
        <Link className="request-home-link" href="/">홈으로 돌아가기</Link>
        <small>체험용 가입 신청이며 실제로 접수되지 않습니다. 비밀번호는 저장하지 않았어요.</small>
      </section> : <section className="request-question">
        <div className="request-step-meta"><span>{String(step + 1).padStart(2, "0")} / {String(titles.length).padStart(2, "0")}</span></div>
        <h2 ref={titleRef} tabIndex={-1}>{titles[step]}</h2>
        {descriptions[step] && <p className="request-question-description">{descriptions[step]}</p>}
        <form noValidate onSubmit={e => { e.preventDefault(); next(); }}>
          {step === 0 && <fieldset className="join-license-grid"><legend className="request-sr-only">자격 선택</legend>
            {licenses.map(l => <label key={l.label} className={license === l.label ? "selected" : ""}><input type="radio" name="license" checked={license === l.label} onChange={() => setLicense(l.label)} /><span className="join-license-icon"><Icon name={l.icon} size={22} /></span><b>{l.label}</b><small>{l.text}</small></label>)}
          </fieldset>}
          {step === 1 && <Checks legend="제공 분야" options={conditions.map(c => [c.label, ""])} values={programs} onChange={setPrograms} />}
          {step === 2 && <>
            <h3 className="join-subtitle">진행 방식</h3>
            <Checks legend="진행 방식" options={methods} values={ways} onChange={setWays} />
            <h3 className="join-subtitle">활동 지역</h3>
            <div className="join-chips" role="group" aria-label="활동 지역">{regions.map(r => <button type="button" key={r} aria-pressed={areas.includes(r)} className={areas.includes(r) ? "selected" : ""} onClick={() => setAreas(toggle(areas, r))}>{r}</button>)}</div>
          </>}
          {step === 3 && <div className="request-fields">
            <label>면허·자격 번호<input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="자격증에 적힌 번호" autoComplete="off" /></label>
            <label>경력<div className="request-age"><input type="number" inputMode="numeric" min="0" max="60" value={years} onChange={e => setYears(e.target.value)} placeholder="예: 5" /><span>년</span></div></label>
            <fieldset className="join-inline"><legend>배상책임보험</legend>{(["가입", "준비 중"] as const).map(v => <label key={v} className={insurance === v ? "selected" : ""}><input type="radio" name="insurance" checked={insurance === v} onChange={() => setInsurance(v)} />{v === "가입" ? "가입했어요" : "가입 준비 중이에요"}</label>)}</fieldset>
            <label>자격 서류 <span className="join-optional">(선택 · 나중에 등록 가능)</span><input type="file" accept="image/*,.pdf" onChange={e => setDocumentName(e.target.files?.[0]?.name ?? "")} /></label>
            <p className="request-input-help">체험 화면에서는 파일 이름만 기록하고 파일은 저장하지 않아요.</p>
          </div>}
          {step === 4 && <div className="join-methods">
            <button type="button" className="join-social kakao" disabled>카카오로 시작하기 <small>준비 중</small></button>
            <button type="button" className="join-social naver" disabled>네이버로 시작하기 <small>준비 중</small></button>
            <button type="button" className="join-social email" onClick={() => move(5)}><Icon name="chat" size={17} />이메일로 시작하기</button>
          </div>}
          {step === 5 && <div className="request-fields">
            <label>이름<input value={name} onChange={e => setName(e.target.value)} placeholder="이름(실명)을 입력해 주세요." autoComplete="name" /></label>
            <p className="request-input-help">자격 서류의 이름과 같아야 검수를 통과할 수 있어요.</p>
            {error(name.trim().length < 2, "이름을 입력해 주세요.")}
            <label>이메일<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" /></label>
            {error(!emailOk(email), "이메일 형식을 확인해 주세요.")}
            <label>비밀번호<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="영문과 숫자를 포함해 8자 이상" autoComplete="new-password" /></label>
            {error(!passwordOk(password), "영문과 숫자를 포함해 8자 이상 입력해 주세요.")}
            <label>휴대전화 번호 인증<div className="join-phone"><input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setVerified(false); }} placeholder="예) 010-1234-5678" autoComplete="tel" /><button type="button" disabled={!phoneOk(phone) || verified} onClick={() => setVerified(true)}>{verified ? "인증 완료" : "인증"}</button></div></label>
            {DEMO_MODE && <p className="request-input-help">체험 화면에서는 문자가 발송되지 않고 바로 인증 처리돼요.</p>}
            {error(!phoneOk(phone) || !verified, "휴대전화 번호를 인증해 주세요.")}
            <div className="join-terms">
              <label className="request-consent join-all"><input type="checkbox" checked={allAgreed} onChange={e => setAgreed(Object.fromEntries(terms.map(t => [t.key, e.target.checked])) as Record<TermKey, boolean>)} /><b>약관 전체 동의</b></label>
              {terms.map(t => <label key={t.key} className="request-consent"><input type="checkbox" checked={agreed[t.key]} onChange={e => setAgreed(a => ({ ...a, [t.key]: e.target.checked }))} /><span>{t.label} <em>({t.required ? "필수" : "선택"})</em></span></label>)}
            </div>
            {error(!requiredAgreed, "필수 약관에 동의해 주세요.")}
          </div>}
          {error(step < 4 && !valid[step], step === 2 ? "진행 방식과 활동 지역을 하나 이상 선택해 주세요." : step === 3 ? "자격 번호, 경력, 보험 가입 여부를 확인해 주세요." : "항목을 선택해 주세요.")}
          {step !== 4 && <div className="request-actions">{step > 0 && <button type="button" className="request-back" onClick={() => move(step === 5 ? 4 : step - 1)}>이전</button>}<button type="submit" className="request-primary">{step === titles.length - 1 ? "가입 신청" : "다음"}</button></div>}
          {step === 4 && <div className="request-actions"><button type="button" className="request-back" onClick={() => move(3)}>이전</button></div>}
        </form>
      </section>}
    </div></div>
  </div>;
}
