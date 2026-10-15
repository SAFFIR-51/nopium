import { randomUUID } from "node:crypto";
import { createAccount, db, readState, sessionAccount } from "@/lib/server/database";
import { body, enabled, json } from "@/lib/server/http";
import type { Account } from "@/lib/account";
export async function GET(request: Request) {
  if (!enabled()) return json({}, 404); if (sessionAccount(request)?.role !== "admin") return json({}, 403);
  return json({ accounts: db().prepare("SELECT id,username,name,role,organization,providerId,disabled FROM accounts ORDER BY role,name").all(), audit: db().prepare("SELECT accountId,command,revision,at FROM audit ORDER BY id DESC LIMIT 100").all() });
}
export async function POST(request: Request) {
  if (!enabled()) return json({}, 404); const actor = sessionAccount(request); if (actor?.role !== "admin") return json({}, 403);
  try {
    const i = await body(request);
    if (i.action === "disable") {
      if (i.id === actor.id || typeof i.id !== "string" || typeof i.disabled !== "boolean") return json({ error: "본인 계정은 비활성화할 수 없습니다." }, 400);
      db().prepare("UPDATE accounts SET disabled=? WHERE id=?").run(Number(i.disabled), i.id); db().prepare("DELETE FROM sessions WHERE accountId=?").run(i.id); return json({ ok: true });
    }
    if (i.action === "link") {
      const account = db().prepare("SELECT * FROM accounts WHERE id=? AND role='patient' AND disabled=0").get(String(i.accountId));
      const original = readState(); if (!account || !original.state.patients.some(p => p.id === i.patientId) || i.revision !== original.revision) return json({ error: "연결 대상과 최신 상태를 확인해 주세요." }, 409);
      const state = { ...original.state, patients: original.state.patients.map(p => p.id === i.patientId ? { ...p, guardianAccountId: String(i.accountId) } : p) };
      const d = db(); d.exec("BEGIN IMMEDIATE"); try { const current = readState(); if (current.revision !== original.revision) throw new Error(); d.prepare("UPDATE care SET body=?,revision=? WHERE id=1").run(JSON.stringify(state), original.revision + 1); d.prepare("INSERT INTO audit(accountId,command,revision,at) VALUES(?,?,?,?)").run(actor.id, "linkGuardian", original.revision + 1, new Date().toISOString()); d.exec("COMMIT"); } catch { d.exec("ROLLBACK"); return json({ error: "최신 상태를 확인한 뒤 다시 연결해 주세요." }, 409); } return json({ ok: true });
    }
    if (![i.username, i.name, i.password, i.role].every(v => typeof v === "string")) return json({}, 400);
    createAccount({ id: randomUUID(), username: i.username, name: i.name, role: i.role as Account["role"], organization: typeof i.organization === "string" ? i.organization : "", providerId: typeof i.providerId === "string" ? i.providerId : "", password: i.password }); return json({ ok: true });
  } catch { return json({ error: "계정 ID 중복, 비밀번호(12~128자), 소속과 치료사 등록 여부를 확인해 주세요." }, 400); }
}
