"use client";
import { describeChanges } from "@/lib/measures";
import { experts } from "@/lib/data";
import { seed } from "./seed";
import type { CareRecord, CareRepository, CareState, Patient } from "./types";

/**
 * 브라우저 체험용 저장소. localStorage에 예시 데이터를 보관합니다.
 * 실제 서비스 데이터(건강 정보)는 여기에 저장하면 안 됩니다.
 */
const KEY = "nopium-care-preview-v1";

let cached: CareState = seed;
let initialized = false;
const listeners = new Set<() => void>();

const nowIso = () => new Date().toISOString();
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const newId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;

/** 이전 버전에 저장된 체험 데이터를 현재 구조로 맞춥니다. */
function migrate(parsed: Partial<CareState>): CareState {
  const providerIdByName = new Map(experts.map(e => [e.name, e.id]));
  const seedById = new Map(seed.patients.map(p => [p.id, p]));
  const patients: Patient[] = (parsed.patients ?? seed.patients).map(stored => {
    // 예시 대상은 새로 추가된 필드를 예시 값으로 채웁니다.
    const p = { ...seedById.get(stored.id), ...stored } as Patient;
    return p.providerId || !p.provider ? p : { ...p, providerId: providerIdByName.get(p.provider) };
  });
  // 이전 체험 데이터에 남은 홈 운동·컨디션 기록은 버립니다.
  const { homeExercises: _h, exerciseLogs: _e, conditionLogs: _c, ...rest } = parsed as Partial<CareState> & Record<string, unknown>;
  void _h; void _e; void _c;
  return {
    ...seed,
    ...rest,
    patients,
    homeTasks: parsed.homeTasks ?? [],
    assignments: parsed.assignments ?? [],
    applications: parsed.applications ?? [],
    scheduleRequests: parsed.scheduleRequests ?? [],
    linkages: parsed.linkages ?? seed.linkages,
    contracts: parsed.contracts ?? seed.contracts,
    billing: parsed.billing ?? seed.billing,
    inquiries: parsed.inquiries ?? seed.inquiries,
    // 예시 문의 메시지는 없으면 채웁니다.
    messages: [...(parsed.messages ?? []), ...seed.messages.filter(m => !(parsed.messages ?? []).some(x => x.id === m.id))],
    // 예시 대상의 평가 기록은 새 단계 구조에 필요하므로 없으면 채웁니다.
    assessments: [...seed.assessments.filter(a => !(parsed.assessments ?? []).some(x => x.id === a.id)), ...(parsed.assessments ?? [])],
  } as CareState;
}

function read(): CareState {
  if (typeof window !== "undefined" && !initialized) {
    initialized = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.patients) && Array.isArray(parsed.records) && Array.isArray(parsed.reports)) cached = migrate(parsed);
      }
    } catch {
      cached = seed;
    }
  }
  return cached;
}

function write(fn: (state: CareState) => CareState) {
  cached = fn(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* 저장소를 쓸 수 없어도 현재 화면은 계속 동작하게 둡니다. */
  }
  listeners.forEach(l => l());
}

const patchPatient = (s: CareState, id: string, patch: Partial<Patient>): CareState => ({
  ...s,
  patients: s.patients.map(p => (p.id === id ? { ...p, ...patch } : p)),
});

export const localRepository: CareRepository = {
  getSnapshot: read,
  getServerSnapshot: () => seed,
  subscribe(listener) {
    listeners.add(listener);
    const onStorage = () => {
      initialized = false;
      listeners.forEach(l => l());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },

  addPatient: patient => write(s => ({ ...s, patients: [patient, ...s.patients] })),
  changePatient: (id, patch) => write(s => patchPatient(s, id, patch)),

  proposeAssignment(patientId, provider) {
    write(s => {
      const patient = s.patients.find(p => p.id === patientId);
      if (!patient || patient.status !== "배정 대기") return s;
      return {
        ...patchPatient(s, patientId, { requestedProviderId: provider.id, requestedProviderName: provider.name }),
        assignments: [
          { id: newId("as"), patientId, providerId: provider.id, providerName: provider.name, status: "제안", createdAt: nowIso() },
          ...s.assignments,
        ],
      };
    });
  },

  acceptAssignment(patientId, provider) {
    write(s => {
      const patient = s.patients.find(p => p.id === patientId);
      // 이미 다른 제공자에게 배정된 경우 중복 수락하지 않습니다.
      if (!patient || patient.status !== "배정 대기") return s;
      const at = nowIso();
      return {
        ...patchPatient(s, patientId, { provider: provider.name, providerId: provider.id, status: "승인 대기" }),
        assignments: [
          { id: newId("as"), patientId, providerId: provider.id, providerName: provider.name, status: "수락", createdAt: at, respondedAt: at },
          ...s.assignments,
        ],
      };
    });
  },

  declineAssignment(patientId, provider, reason) {
    write(s => {
      const at = nowIso();
      const patient = s.patients.find(p => p.id === patientId);
      // 지정·제안받은 제공자가 거절하면 운영자 재배정 대상으로 돌립니다.
      const cleared = patient?.requestedProviderId === provider.id
        ? patchPatient(s, patientId, { requestedProviderId: undefined, requestedProviderName: undefined })
        : s;
      return {
        ...cleared,
        assignments: [
          { id: newId("as"), patientId, providerId: provider.id, providerName: provider.name, status: "거절", createdAt: at, respondedAt: at, reason },
          ...s.assignments,
        ],
      };
    });
  },

  approvePlan(patientId, by, precautions, prescription) {
    write(s => {
      const patient = s.patients.find(p => p.id === patientId);
      if (!patient?.providerId) return s; // 담당 치료사 없이 확인하지 않습니다.
      // 방문 전 평가 없이는 계획을 확인하지 않습니다.
      if (patient.status === "승인 대기" && !s.assessments.some(a => a.patientId === patientId && a.period === "초기 평가")) return s;
      return patchPatient(s, patientId, {
        status: patient.status === "승인 대기" ? "진행 중" : patient.status,
        precautions,
        ...(prescription ? { prescription, doctor: prescription.doctor } : {}),
        approval: { status: "승인", by, at: nowIso() },
      });
    });
  },

  extendPrescription(patientId, days, by) {
    write(s => {
      const p = s.patients.find(x => x.id === patientId);
      const rx = p?.prescription;
      if (!p || !rx) return s;
      const used = rx.extendedDays ?? 0;
      const add = Math.max(0, Math.min(days, 30 - used));
      if (!add) return s;
      const d = new Date(`${rx.endDate}T00:00:00`); d.setDate(d.getDate() + add);
      const endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return patchPatient(s, patientId, { prescription: { ...rx, endDate, extendedDays: used + add, note: [rx.note, `${by} 연장 ${add}일`].filter(Boolean).join(" · ") } });
    });
  },

  reviewAdverse(recordId, by, note) {
    write(s => ({ ...s, records: s.records.map(r => r.id === recordId && r.adverse?.occurred ? { ...r, adverse: { ...r.adverse, reviewedBy: by, reviewedAt: nowIso(), reviewNote: note } } : r) }));
  },

  closeProgram(patientId, by, summary) {
    write(s => {
      const p = s.patients.find(x => x.id === patientId);
      // 종료 평가(사후 평가) 없이 종료하지 않습니다.
      if (!p || p.status !== "진행 중" || !s.assessments.some(a => a.patientId === patientId && a.period === "사후 평가")) return s;
      return patchPatient(s, patientId, { status: "종료", closure: { at: nowIso(), by, summary } });
    });
  },

  addLinkage: linkage => write(s => ({ ...s, linkages: [{ ...linkage, id: newId("ln"), status: "의뢰", at: nowIso() }, ...s.linkages] })),
  setContract: (organization, patch) => write(s => {
    const has = s.contracts.some(c => c.organization === organization);
    const base = { organization, model: "회차당", unitFee: 0, monthlyFee: 0, since: todayLocal(), manager: "" } as const;
    return { ...s, contracts: has ? s.contracts.map(c => c.organization === organization ? { ...c, ...patch } : c) : [...s.contracts, { ...base, ...patch }] };
  }),
  setBilling: (key, patch) => write(s => ({ ...s, billing: { ...s.billing, [key]: { ...{ status: "청구 전" as const }, ...s.billing[key], ...patch } } })),
  setInquiry: (threadId, patch) => write(s => ({ ...s, inquiries: { ...s.inquiries, [threadId]: { ...{ status: "접수" as const, category: "일반" }, ...s.inquiries[threadId], ...patch, updatedAt: nowIso() } } })),
  completeLinkage: (id, result) => write(s => ({ ...s, linkages: s.linkages.map(l => l.id === id ? { ...l, status: "연계 완료", result } : l) })),

  rejectPlan(patientId, by, reason) {
    write(s => patchPatient(s, patientId, { approval: { status: "반려", by, at: nowIso(), reason } }));
  },

  saveRecord(patientId, input, { confirm, author }) {
    const id = input.id ?? newId("record");
    write(s => {
      const patient = s.patients.find(p => p.id === patientId);
      const previous = s.records.find(r => r.id === id);
      if (!patient || previous?.confirmed) return s; // 확정된 기록은 correctRecord로만 바꿉니다.
      const sessionNo = previous?.sessionNo ?? patient.completed + 1;
      const measures = input.measures ?? previous?.measures;
      const pick = (code: string) => { const v = measures?.find(m => m.code === code)?.value; return v === null || v === undefined ? "" : String(v); };
      const { id: _id, nextDate, nextTime, ...fields } = input;
      void _id;
      const record: CareRecord = {
        ...previous,
        ...fields,
        id,
        patientId,
        sessionNo,
        date: input.date ?? previous?.date ?? todayLocal(),
        place: fields.place ?? previous?.place ?? patient.nextPlace ?? patient.place ?? { kind: "자택" },
        title: input.activities ? `${sessionNo}회차 · ${input.activities.length ? input.activities.slice(0, 2).join("·") : "프로그램 진행"}` : previous?.title ?? `${sessionNo}회차 · 프로그램 진행`,
        // 하위 호환 필드는 측정값에서 채웁니다.
        walk: measures ? pick("walk_distance") : input.walk,
        pain: measures ? pick("pain_nrs") : input.pain,
        measures,
        confirmed: confirm,
        updatedAt: nowIso(),
        authorId: author?.id ?? previous?.authorId,
      };
      const records = [record, ...s.records.filter(r => r.id !== id)];
      if (!confirm) return { ...s, records };
      // 확정: 미참여는 회차 수에 넣지 않고, 다음 일정을 함께 갱신합니다.
      const counted = record.attendance !== "미참여";
      return {
        ...patchPatient(s, patientId, {
          completed: counted ? patient.completed + 1 : patient.completed,
          ...(nextDate && nextTime ? { nextDate, nextTime } : {}),
          nextPlace: undefined, // 이번 회차만 바꾼 장소는 확정 후 기본 장소로 돌아갑니다.
        }),
        records,
      };
    });
    return id;
  },

  correctRecord(recordId, input, reason, author) {
    write(s => ({
      ...s,
      records: s.records.map(r => {
        if (r.id !== recordId || !r.confirmed) return r;
        // 일정은 정정 대상이 아닙니다(일정 변경은 별도 흐름).
        const { nextDate: _d, nextTime: _t, ...fields } = input;
        void _d; void _t;
        const measures = fields.measures ?? r.measures;
        const pick = (code: string) => { const v = measures?.find(m => m.code === code)?.value; return v === null || v === undefined ? "" : String(v); };
        const sessionNo = r.sessionNo;
        const updated: CareRecord = {
          ...r,
          ...fields,
          measures,
          walk: measures ? pick("walk_distance") : fields.walk,
          pain: measures ? pick("pain_nrs") : fields.pain,
          title: fields.activities && sessionNo ? `${sessionNo}회차 · ${fields.activities.length ? fields.activities.slice(0, 2).join("·") : "프로그램 진행"}` : r.title,
          updatedAt: nowIso(),
        };
        const { revisions: prevRevisions, ...snapshot } = r;
        const changes = describeChanges(r, updated);
        return {
          ...updated,
          revisions: [{ at: nowIso(), by: author.name, reason, content: r.content, next: r.next, walk: r.walk, pain: r.pain, changes, snapshot }, ...(prevRevisions ?? [])],
        };
      }),
    }));
  },

  submitApplication(application) {
    const id = newId("app");
    write(s => ({ ...s, applications: [{ ...application, id, createdAt: nowIso(), status: "검수 대기" }, ...s.applications] }));
    return id;
  },

  reviewApplication(id, status, note) {
    write(s => ({ ...s, applications: s.applications.map(a => (a.id === id ? { ...a, status, reviewNote: note, reviewedAt: nowIso() } : a)) }));
  },

  requestSchedule(request) {
    write(s => ({
      ...s,
      // 같은 대상의 처리 전 요청은 새 요청으로 대체합니다.
      scheduleRequests: [{ ...request, id: newId("sr"), status: "요청", createdAt: nowIso() }, ...s.scheduleRequests.filter(r => !(r.patientId === request.patientId && r.status === "요청"))],
    }));
  },

  respondSchedule(id, status, response) {
    write(s => {
      const req = s.scheduleRequests.find(r => r.id === id);
      if (!req || req.status !== "요청") return s;
      const next = status === "확정" && req.kind === "변경" ? patchPatient(s, req.patientId, { ...(req.date && req.time ? { nextDate: req.date, nextTime: req.time } : {}), ...(req.place ? { nextPlace: req.place } : {}) }) : s;
      return { ...next, scheduleRequests: next.scheduleRequests.map(r => (r.id === id ? { ...r, status, response, respondedAt: nowIso() } : r)) };
    });
  },

  cancelScheduleRequest(id) {
    write(s => ({ ...s, scheduleRequests: s.scheduleRequests.map(r => (r.id === id && r.status === "요청" ? { ...r, status: "취소", respondedAt: nowIso() } : r)) }));
  },

  sendMessage(threadId, sender, text) {
    const body = text.trim();
    if (!body) return;
    write(s => ({ ...s, messages: [...s.messages, { id: newId("msg"), threadId, senderKey: sender.key, senderName: sender.name, text: body.slice(0, 2000), at: nowIso(), readBy: [sender.key] }] }));
  },

  markThreadRead(threadId, readerKey) {
    const s0 = read();
    if (!s0.messages.some(m => m.threadId === threadId && !m.readBy.includes(readerKey))) return; // 바뀐 게 없으면 저장하지 않습니다.
    write(s => ({ ...s, messages: s.messages.map(m => (m.threadId === threadId && !m.readBy.includes(readerKey) ? { ...m, readBy: [...m.readBy, readerKey] } : m)) }));
  },

  addAssessment: assessment => write(s => ({ ...s, assessments: [{ id: newId("a"), ...assessment }, ...s.assessments] })),

  shareReport(patientId, period) {
    write(s => {
      const report = s.reports.find(r => r.patientId === patientId);
      return {
        ...s,
        reports: report
          ? s.reports.map(r => (r.id === report.id ? { ...r, shared: true } : r))
          : [{ id: `rp-${patientId}`, patientId, period, shared: true }, ...s.reports],
      };
    });
  },

  toggleHomeTask: taskId =>
    write(s => ({
      ...s,
      homeTasks: s.homeTasks.includes(taskId) ? s.homeTasks.filter(t => t !== taskId) : [...s.homeTasks, taskId],
    })),

  reset: () => write(() => seed),
  update: write,
};
