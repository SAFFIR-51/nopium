export function enabled() { return process.env.NEXT_PUBLIC_DEMO_MODE === "false"; }
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const source = new URL(origin), target = new URL(request.url);
    // Next's Node adapter may expose localhost internally when the browser uses 127.0.0.1.
    return source.host === (request.headers.get("host") || target.host) && source.protocol === target.protocol;
  } catch { return false; }
}
export const json = (value: unknown, status = 200, extra: Record<string, string> = {}) => Response.json(value, { status, headers: { "Cache-Control": "no-store", ...extra } });
export async function body(request: Request) {
  if (!sameOrigin(request)) throw new Error("요청 출처를 확인할 수 없습니다.");
  const raw = await request.text();
  if (raw.length > 1_000_000) throw new Error("요청 크기가 너무 큽니다.");
  return JSON.parse(raw);
}
export const sessionCookie = (token: string, request: Request, logout = false) => `npium_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${logout ? 0 : 43200}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
