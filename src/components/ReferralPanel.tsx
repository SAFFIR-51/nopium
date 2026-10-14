"use client";
import { useState } from "react";
import Link from "next/link";

export function ReferralPanel() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [matched, setMatched] = useState(false);

  return <section className="referral-panel referral-clean">
    <header className="referral-copy">
      <h2>{matched ? "연계된 프로그램을 확인하세요" : "병원 연계 코드"}</h2>
      <p>{matched ? "병원에서 안내받은 프로그램을 내 관리에서 이어가세요." : "병원에서 안내받은 6자리 코드를 입력해 주세요."}</p>
    </header>
    <div className="referral-form-box">
      {matched ? <>
        <p className="referral-verified">연계 프로그램 · 예시</p>
        <h3>퇴원 후 보행·균형 관리</h3>
        <dl><div><dt>연계 기관</dt><dd>새봄재활의학과</dd></div><div><dt>진행 방식</dt><dd>방문 프로그램</dd></div><div><dt>관리 대상</dt><dd>김○○ 님 · 예시</dd></div></dl>
        <Link className="referral-submit" href="/my">내 관리에서 확인</Link>
        <button className="referral-retry" onClick={() => { setMatched(false); setCode(""); setError(""); }}>다른 코드 입력</button>
      </> : <form onSubmit={e => {
        e.preventDefault();
        if (code === "SB2041") { setError(""); setMatched(true); }
        else setError("코드를 다시 확인해 주세요. 체험 코드는 SB2041입니다.");
      }}>
        <label htmlFor="referral-code">연계 코드</label>
        <input id="referral-code" value={code} autoComplete="off" spellCheck={false} maxLength={6} placeholder="6자리 연계 코드" aria-invalid={!!error} aria-describedby={error ? "referral-error referral-help" : "referral-help"} onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setError(""); }} />
        {error && <p id="referral-error" className="referral-error" role="alert">{error}</p>}
        <button className="referral-submit" disabled={code.length !== 6}>프로그램 확인</button>
        <p id="referral-help" className="referral-help">체험 코드 <b>SB2041</b>로 확인해 볼 수 있어요.</p>
      </form>}
      <small>체험용 화면으로, 실제 병원과 연결되지는 않습니다.</small>
    </div>
  </section>;
}
