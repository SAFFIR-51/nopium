"use client";
import { Icon } from "@/components/Icon";
import { setDemoRole } from "@/lib/demo-session";
import { DEMO_MODE, ROLE_INFO, type WorkRole } from "@/lib/session";

/** 로그인 전 안내. 체험 모드에서는 역할을 골라 바로 볼 수 있습니다. */
export function LoginNeeded({ what }: { what: string }) {
  return <section className="chat-login">
    <Icon name="shield" size={30} />
    <h2>로그인 후 {what}을 볼 수 있어요</h2>
    <p>{DEMO_MODE ? "실제 로그인은 연결 전이에요. 체험할 역할을 골라 주세요." : "로그인해 주세요."}</p>
    {DEMO_MODE && <div>{(["patient", "provider", "hospital", "admin"] as WorkRole[]).map(r => <button key={r} onClick={() => setDemoRole(r)}>{ROLE_INFO[r].label}</button>)}</div>}
  </section>;
}
