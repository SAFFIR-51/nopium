import { db, login, sessionAccount, tokenHash } from "@/lib/server/database";
import { body, enabled, json, sameOrigin, sessionCookie } from "@/lib/server/http";
export async function GET(request: Request) { if (!enabled()) return json({}, 404); return json({ account: sessionAccount(request) }); }
export async function POST(request: Request) {
  if (!enabled()) return json({}, 404);
  try { const input = await body(request); if (typeof input.username !== "string" || typeof input.password !== "string" || input.username.length > 80 || input.password.length > 128) return json({ error: "로그인 정보를 확인해 주세요." }, 400); const result = login(input.username, input.password); return result ? json({ account: result.account }, 200, { "Set-Cookie": sessionCookie(result.token, request) }) : json({ error: "로그인 정보를 확인해 주세요. 반복 실패 시 15분 후 다시 시도할 수 있습니다." }, 401); } catch { return json({ error: "로그인 요청을 처리하지 못했습니다." }, 400); }
}
export async function DELETE(request: Request) {
  if (!enabled()) return json({}, 404); if (!sameOrigin(request)) return json({}, 403);
  const token = /(?:^|;\s*)npium_session=([^;]+)/.exec(request.headers.get("cookie") || "")?.[1];
  if (token) db().prepare("DELETE FROM sessions WHERE token=?").run(tokenHash(token));
  return json({}, 200, { "Set-Cookie": sessionCookie("", request, true) });
}
