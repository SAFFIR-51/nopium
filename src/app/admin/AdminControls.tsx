"use client";
import { allProviders } from "@/lib/workflow";
import { ALL, organizations, type AdminFilter } from "@/lib/admin-data";
import type { CareState } from "@/lib/repo";

export function AdminFilters({ state, filter, onChange }: { state: CareState; filter: AdminFilter; onChange: (filter: AdminFilter) => void }) {
  return <div className="admin-filters">
    <label>병원<select value={filter.hospital} onChange={e => onChange({ ...filter, hospital: e.target.value })}><option>{ALL}</option>{organizations(state).map(h => <option key={h}>{h}</option>)}</select></label>
    <label>치료사<select value={filter.provider} onChange={e => onChange({ ...filter, provider: e.target.value })}><option value={ALL}>{ALL}</option>{allProviders(state).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>기록·보고 기간<input type="month" value={filter.month} onChange={e => { if (e.target.value) onChange({ ...filter, month: e.target.value }); }} /></label>
    <button className="business-action" onClick={() => onChange({ ...filter, hospital: ALL, provider: ALL })}>조건 초기화</button>
  </div>;
}

export function AdminStats({ items }: { items: { label: string; value: number | string; unit?: string; note?: string }[] }) {
  return <div className="admin-stats">{items.map(i => <div key={i.label}><span>{i.label}</span><b>{i.value}<small>{i.unit}</small></b>{i.note && <p>{i.note}</p>}</div>)}</div>;
}
