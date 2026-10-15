import { db, readState, sessionAccount } from "@/lib/server/database";
import { authorize, scopedState } from "@/lib/server/authorization";
import { body, enabled, json } from "@/lib/server/http";
import { createRepository } from "@/lib/repo/engine";
export async function GET(request: Request) {
  if (!enabled()) return json({}, 404); const account = sessionAccount(request); if (!account) return json({ error: "로그인이 필요합니다." }, 401);
  const data = readState(); return json({ revision: data.revision, state: scopedState(data.state, account) });
}
export async function POST(request: Request) {
  if (!enabled()) return json({}, 404); const account = sessionAccount(request); if (!account) return json({ error: "로그인이 필요합니다." }, 401);
  let locked = false;
  try {
    const input = await body(request);
    if (typeof input.command !== "string" || !Array.isArray(input.args) || input.args.length > 8 || !Number.isInteger(input.revision)) return json({ error: "요청 형식을 확인해 주세요." }, 400);
    const d = db(); d.exec("BEGIN IMMEDIATE"); locked = true;
    const original = readState();
    if (input.revision !== original.revision) { d.exec("ROLLBACK"); locked = false; return json({ error: "다른 사용자가 데이터를 변경했습니다. 최신 내용을 확인한 뒤 다시 처리해 주세요.", revision: original.revision, state: scopedState(original.state, account) }, 409); }
    const args = authorize(original.state, account, input.command, input.args);
    let state = original.state;
    const repo = createRepository(() => state, fn => { state = fn(state); });
    const method = repo[input.command as keyof typeof repo];
    const result = (method as (...args: unknown[]) => unknown)(...args);
    const changed = JSON.stringify(state) !== JSON.stringify(original.state), revision = original.revision + Number(changed);
    if (changed) {
      d.prepare("UPDATE care SET revision=?,body=? WHERE id=1").run(revision, JSON.stringify(state));
      d.prepare("INSERT INTO audit(accountId,command,revision,at) VALUES(?,?,?,?)").run(account.id, input.command, revision, new Date().toISOString());
    }
    d.exec("COMMIT"); locked = false;
    return json({ result, revision, state: scopedState(state, account), changed });
  } catch (error) { if (locked) db().exec("ROLLBACK"); return json({ error: error instanceof Error && error.message.includes("접근 권한") ? error.message : "저장하지 못했습니다. 입력 내용과 현재 상태를 확인해 주세요." }, 400); }
}
