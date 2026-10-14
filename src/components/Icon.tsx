import type { ReactNode } from "react";

const paths = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  pin: <><path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.3" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.4A8 8 0 1 1 20 12Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bell: <><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5l1.5-2Z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></>,
  home: <><path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" /><path d="M10 20v-5h4v5" /></>,
  building: <><path d="M5 20V5h9v15M14 10h5v10M3 20h18" /><path d="M8 8.5h3M8 12h3M8 15.5h3" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  file: <><path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5Z" /><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6" /></>,
  shield: <><path d="M12 3.5 19 6v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  neuro: <><path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.3A3 3 0 0 0 8 17.5a3 3 0 0 0 4 1.5V5.5A2.8 2.8 0 0 0 9 4.5Z" /><path d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.3 3 3 0 0 1-3.5 4.7 3 3 0 0 1-4 1.5" /></>,
  joint: <><path d="M9 3v6.5a3 3 0 0 0 6 0V3" /><path d="M9 21v-5.5a3 3 0 0 1 6 0V21" /></>,
  spine: <><rect x="9" y="3" width="6" height="3.5" rx="1.2" /><rect x="8.5" y="8" width="7" height="3.5" rx="1.2" /><rect x="8.5" y="13" width="7" height="3.5" rx="1.2" /><rect x="9" y="18" width="6" height="3" rx="1.2" /></>,
  walker: <><circle cx="10" cy="4.5" r="2" /><path d="m10 8-1 6 3 2.5V21M9 14l-2.5 7M10 8.5l4 2.5" /><path d="M17 10v11" /></>,
  hand: <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11V4.5a1.5 1.5 0 0 1 3 0V11V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5c-2 0-3.3-.8-4.5-2.2L3.8 15a1.5 1.5 0 0 1 2.3-1.9L8 15" />,
  speech: <><path d="M4 11.5a7.5 6.5 0 1 1 3.5 5.5L4 18.5l1-3.4a6 6 0 0 1-1-3.6Z" /><path d="M9 10h7M9 13h4.5" /></>,
  lungs: <><path d="M12 4v7M12 11c-1 1-2 1.5-3 1.5" /><path d="M8.5 6.5C5.5 7 4 11 4 16c0 2 1 3.5 3 3.5s3-1.5 3-4V9a2.5 2.5 0 0 0-1.5-2.5Z" /><path d="M15.5 6.5C18.5 7 20 11 20 16c0 2-1 3.5-3 3.5s-3-1.5-3-4V9a2.5 2.5 0 0 1 1.5-2.5Z" /></>,
  child: <><circle cx="12" cy="6" r="2.6" /><path d="M7 11.5 12 10l5 1.5M12 10v5M9.5 20.5 12 15l2.5 5.5" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
