// 보호자 화면 공통 날짜 표기
export const weekday = (iso: string) => "일월화수목금토"[new Date(`${iso}T00:00:00`).getDay()];
export const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;
export const dday = (today: string | null, iso: string) => {
  if (!today) return "";
  const n = Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000);
  return n === 0 ? "오늘" : n > 0 ? `D-${n}` : `${-n}일 지남`;
};
