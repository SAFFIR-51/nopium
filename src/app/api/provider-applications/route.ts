import { randomUUID } from "node:crypto";
import { db, readState } from "@/lib/server/database";
import { body, enabled, json } from "@/lib/server/http";
import type { ProviderApplication } from "@/lib/repo/types";
export async function POST(request: Request) {
  if (!enabled()) return json({}, 404);
  try {
    const i = await body(request);
    if (![i.name, i.license, i.licenseNumber, i.phone, i.email].every(v => typeof v === "string" && v.trim() && v.length <= 150) || ![i.programs, i.methods, i.regions].every(v => Array.isArray(v) && v.length > 0 && v.length < 30 && v.every(s => typeof s === "string" && s.length <= 100)) || !Number.isInteger(i.years) || i.years < 0 || i.years > 100 || !["가입", "준비 중"].includes(i.insurance)) return json({ error: "신청 항목을 확인해 주세요." }, 400);
    const application: ProviderApplication = { id: `app-${randomUUID()}`, createdAt: new Date().toISOString(), status: "검수 대기", name: i.name, license: i.license, licenseNumber: i.licenseNumber, phone: i.phone, email: i.email, programs: i.programs, methods: i.methods, regions: i.regions, years: i.years, insurance: i.insurance, marketing: i.marketing === true, documentName: typeof i.documentName === "string" ? i.documentName.slice(0, 200) : undefined };
    const d = db(); d.exec("BEGIN IMMEDIATE");
    try { const { state, revision } = readState(); const duplicate = state.applications.some(a => a.email === application.email && a.status === "검수 대기"); if (duplicate) { d.exec("ROLLBACK"); return json({ error: "이미 검수 중인 신청이 있습니다." }, 409); } d.prepare("UPDATE care SET body=?,revision=? WHERE id=1").run(JSON.stringify({ ...state, applications: [application, ...state.applications] }), revision + 1); d.exec("COMMIT"); } catch { d.exec("ROLLBACK"); throw new Error(); }
    return json({ result: application.id });
  } catch { return json({ error: "신청을 저장하지 못했습니다." }, 400); }
}
