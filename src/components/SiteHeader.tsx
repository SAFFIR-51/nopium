"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Modal } from "./CareUI";
import { Icon, type IconName } from "./Icon";
import { useSwitchRole } from "./RoleShell";
import { setDemoRole, useRole } from "@/lib/demo-session";
import { markSeen, useNotices } from "@/lib/notifications";
import { unreadCount } from "@/lib/chat";
import { careRepo, useCare } from "@/lib/repo";
import { DEMO_ACCOUNTS, DEMO_MODE, ROLE_INFO, demoProvider, type Role } from "@/lib/session";
import "./site-header-roles.css";

export function Logo() {
  return <Link href="/" className="logo" aria-label="NOPIUM 홈"><Image src="/brand/nopium-wordmark-uppercase-heavy.svg" width={92} height={21} alt="NOPIUM" priority /></Link>;
}

type NavItem = { href: string; label: string };
const publicNav: NavItem[] = [
  { href: "/request", label: "프로그램 신청" },
  { href: "/experts", label: "전문가 찾기" },
  { href: "/spaces", label: "센터·공간" },
];
/** 상단 메뉴는 역할과 관계없이 같습니다. 각 역할의 업무는 오른쪽 "내 관리"에서 합니다. */
const navByRole: Record<Role, NavItem[]> = { guest: publicNav, patient: publicNav, provider: publicNav, hospital: publicNav, admin: publicNav };
const roleIcons: Record<Role, IconName> = { guest: "home", patient: "user", provider: "calendar", hospital: "building", admin: "shield" };
const roleOrder: Role[] = ["guest", "patient", "provider", "hospital", "admin"];
/** 헤더에 보일 체험 계정 이름. 인증 연결 후에는 세션 사용자 이름으로 바꿉니다. */
function accountName(role: Role) {
  switch (role) {
    case "patient": return `${DEMO_ACCOUNTS.patient.name} 님`;
    case "provider": return `${demoProvider()?.name ?? "제공자"} 선생님`;
    case "hospital": return DEMO_ACCOUNTS.hospital.organization;
    case "admin": return DEMO_ACCOUNTS.admin.name;
    default: return ROLE_INFO[role].label;
  }
}

/** 헤더 드롭다운. 바깥을 누르거나 Esc를 누르면 닫힙니다. */
function Dropdown({ label, trigger, children, className = "", onOpen }: { label: string; trigger: ReactNode; children: (close: () => void) => ReactNode; className?: string; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return <div className={`nav-drop ${className}`} ref={ref}>
    <button className="nav-drop-trigger" aria-label={label} aria-expanded={open} aria-haspopup="true" onClick={() => { if (!open) onOpen?.(); setOpen(!open); }}>{trigger}</button>
    {open && <div className="nav-drop-panel">{children(() => setOpen(false))}</div>}
  </div>;
}

/** 숨고처럼 로그인 후 헤더 오른쪽: 내 관리 · 채팅 · 알림 · 프로필 */
function UserArea({ role, isCurrent, inMyArea, onSwitch }: { role: Exclude<Role, "guest">; isCurrent: (href: string) => boolean; inMyArea: boolean; onSwitch: () => void }) {
  const router = useRouter();
  const { notices, unread, seen } = useNotices(role);
  const chatUnread = unreadCount(useCare(), role);
  const careUnread = notices.filter(n => !n.id.startsWith("chat-") && !seen.includes(n.id)).length;
  const home = ROLE_INFO[role].home;
  return <span className="nav-user">
    <Link href={home} className="nav-text-link nav-dotted" aria-current={inMyArea ? "page" : undefined}>내 관리{careUnread > 0 && <span className="nav-text-dot" aria-label="새 소식" />}</Link>
    <Link href="/chat" className="nav-text-link nav-chat-link" aria-current={isCurrent("/chat") ? "page" : undefined}>채팅{chatUnread > 0 && <em className="nav-badge" aria-label={`안 읽은 메시지 ${chatUnread}건`}>{chatUnread > 99 ? "99+" : chatUnread}</em>}</Link>
    <Dropdown label={`알림 ${unread}건`} className="nav-bell" onOpen={() => markSeen(notices.map(n => n.id))} trigger={<><Icon name="bell" size={21} />{unread > 0 && <span className="nav-dot" aria-hidden="true" />}</>}>{close => <>
      <p className="nav-drop-title">알림</p>
      {notices.length ? <ul className="nav-notices">{notices.slice(0, 6).map(n => <li key={n.id}><Link href={n.href} onClick={close}>{n.text}</Link></li>)}</ul> : <p className="nav-drop-empty">새 알림이 없어요.</p>}
      <Link href="/notifications" className="nav-drop-more" onClick={close}>알림 전체 보기</Link>
    </>}</Dropdown>
    <Dropdown label="내 계정 메뉴" className="nav-profile" trigger={<><span className="nav-avatar"><Icon name="user" size={18} /></span><Icon name="down" size={14} /></>}>{close => <>
      <div className="nav-profile-head"><span className="nav-avatar lg">{accountName(role).slice(0, 1)}</span><div><b>{accountName(role)}</b><small>{ROLE_INFO[role].label}</small></div></div>
      <Link href={home} onClick={close}>내 관리</Link>
      {DEMO_MODE && <button onClick={() => { close(); onSwitch(); }}>역할 변경</button>}
      <button onClick={() => { close(); setDemoRole("guest"); router.push("/"); }}>로그아웃</button>
    </>}</Dropdown>
  </span>;
}

/** 모바일 하단 내비게이션 (5개). 신청·가입처럼 화면 전체를 쓰는 흐름에서는 숨깁니다. */
/** 체험 데이터는 이 브라우저(localStorage)에만 저장됩니다. 역할 선택 창에서 처음 예시로 되돌립니다. */
function DemoReset() {
  const [ask, setAsk] = useState(false);
  const [done, setDone] = useState(false);
  return <div className="role-reset">
    {done ? <p>체험 데이터를 처음 예시로 되돌렸어요.</p>
      : ask ? <><p>이 브라우저에 저장한 신청·보고서·채팅·일정 변경이 모두 처음 예시로 돌아가요. 되돌릴 수 없어요.</p><div><button onClick={() => setAsk(false)}>취소</button><button className="danger" onClick={() => { careRepo.reset(); setAsk(false); setDone(true); }}>초기화하기</button></div></>
      : <><p>체험 데이터는 이 브라우저에만 저장돼요.</p><button onClick={() => setAsk(true)}>체험 데이터 초기화</button></>}
  </div>;
}

function BottomNav({ role, path, onLogin }: { role: Role; path: string | null; onLogin: () => void }) {
  const chatUnread = unreadCount(useCare(), role === "guest" ? null : role);
  if (path && (path.startsWith("/request") || path.startsWith("/partner/join"))) return null;
  const home = ROLE_INFO[role].home;
  const items: { href: string; label: string; icon: IconName; badge?: number; active: boolean }[] = [
    { href: "/", label: "홈", icon: "home", active: path === "/" },
    { href: "/experts", label: "전문가 찾기", icon: "search", active: !!path?.startsWith("/experts") },
    { href: "/request", label: "신청", icon: "plus", active: false },
    { href: "/chat", label: "채팅", icon: "chat", badge: chatUnread, active: !!path?.startsWith("/chat") },
    { href: home, label: "내 관리", icon: "user", active: role !== "guest" && !!path && path !== "/" && path.startsWith(home) },
  ];
  return <nav className="bottom-nav" aria-label="하단 메뉴">
    {items.map(it => it.label === "내 관리" && role === "guest"
      ? <button key={it.label} onClick={onLogin}><Icon name={it.icon} size={22} /><span>{it.label}</span></button>
      : <Link key={it.label} href={it.href} className={it.active ? "active" : ""} aria-current={it.active ? "page" : undefined}><span className="bottom-nav-icon"><Icon name={it.icon} size={22} />{!!it.badge && <em>{it.badge > 99 ? "99+" : it.badge}</em>}</span><span>{it.label}</span></Link>)}
  </nav>;
}

/**
 * usePathname은 생성되지 않은 동적 파라미터 경로(예: /expert/patients/[id])의 사전 렌더링에서 지연됩니다.
 * 헤더 전체가 렌더링을 막지 않도록 경로 의존 부분을 Suspense로 감쌉니다.
 */
export function SiteHeader() {
  return <Suspense fallback={<HeaderView path={null} />}><HeaderWithPath /></Suspense>;
}
function HeaderWithPath() {
  return <HeaderView path={usePathname()} />;
}

function HeaderView({ path }: { path: string | null }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const role = useRole() ?? "guest";
  const switchRole = useSwitchRole();
  const nav = navByRole[role];
  const home = path === "/";
  const isCurrent = (href: string) => path !== null && (href === ROLE_INFO[role].home || href === "/request" ? path === href : path.startsWith(href));
  return <>
    {home && <a href="/request" className="brand-masthead" aria-label="퇴원 후에도 일상을 잇는 운동, 프로그램 신청">
      <div className="masthead-message"><span>퇴원 후에도</span><span className="masthead-photo"><Image src="/images/nopium-banner-professional.png" fill sizes="112px" alt="" priority /></span><strong>일상을 잇는 운동</strong></div>
    </a>}
    <header className={`header reference-header ${home ? "reference-home-header" : ""}`}>
      <div className="wrap header-row">
        <button className="mobile-menu-toggle" aria-label="메뉴 열기" onClick={() => setMenu(true)}><Icon name="menu" size={22} /></button>
        <Logo />
        <nav className="nav-main" aria-label="서비스 메뉴">{nav.map(n => n.href === "/request" ?
          <a key={n.href} href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}>{n.label}</a> :
          <Link key={n.href} href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}>{n.label}</Link>)}</nav>
        {role !== "guest" && <Link href="/notifications" className="mobile-bell" aria-label="알림"><Icon name="bell" size={22} /></Link>}
        <nav className="nav-partner" aria-label="파트너 메뉴">
          {DEMO_MODE && (role === "guest"
            ? <button className="nav-account" onClick={() => setOpen(true)}>로그인 / 역할 선택</button>
            : <UserArea role={role} isCurrent={isCurrent} inMyArea={path !== null && path !== "/" && path.startsWith(ROLE_INFO[role].home)} onSwitch={() => setOpen(true)} />)}
          {role === "guest" && <Link href="/partner" className="nav-expert">전문가 가입</Link>}
        </nav>
      </div>
    </header>
    <BottomNav role={role} path={path} onLogin={() => setOpen(true)} />
    {menu && <Modal title="메뉴" onClose={() => setMenu(false)}><nav className="mobile-menu-links" aria-label="모바일 서비스 메뉴">{nav.map(n => <a key={n.href} href={n.href} onClick={() => setMenu(false)}>{n.label}<Icon name="chevron" size={18} /></a>)}</nav>{DEMO_MODE && <div className="mobile-menu-partners">{role !== "guest" && <Link href={ROLE_INFO[role].home} onClick={() => setMenu(false)}>{accountName(role)} · 내 관리</Link>}{role !== "guest" && <><Link href="/chat" onClick={() => setMenu(false)}>채팅</Link><Link href="/notifications" onClick={() => setMenu(false)}>알림</Link></>}<button onClick={() => { setMenu(false); setOpen(true); }}>{role === "guest" ? "로그인 / 역할 선택" : `역할 변경 · 지금 ${ROLE_INFO[role].label}`}</button>{role === "guest" && <Link href="/partner" onClick={() => setMenu(false)}>전문가 가입</Link>}</div>}</Modal>}
    {open && <Modal title="로그인 / 역할 선택" onClose={() => setOpen(false)}><p className="modal-lead">실제 로그인은 연결 전이에요. 체험할 역할을 고르면 그 계정으로 로그인한 것처럼 메뉴와 첫 화면, 볼 수 있는 정보가 바뀝니다.</p><div className="role-choices">{roleOrder.map(r => <button key={r} className={r === role ? "current" : ""} aria-current={r === role ? "true" : undefined} onClick={() => { setOpen(false); switchRole(r); }}><span><Icon name={roleIcons[r]} /></span><div><b>{ROLE_INFO[r].label}{r === role && " · 현재"}</b><small>{ROLE_INFO[r].text}</small></div><Icon name="chevron" size={18} /></button>)}</div><p className="role-join-link">전문가로 활동하고 싶으신가요? <Link href="/partner" onClick={() => setOpen(false)}>전문가 가입</Link></p>
      <DemoReset /></Modal>}
  </>;
}


