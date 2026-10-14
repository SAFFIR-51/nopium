"use client";
import { centersNear, placeName, samePlace, type Place, type PlaceKind } from "@/lib/places";
import type { Patient } from "@/lib/repo";

/** 장소 고르기: 자택 방문 + 가까운 제휴 센터. allowed로 처방이 허용한 종류만 보여 줍니다. */
export function PlacePicker({ patient, value, onChange, allowed, name }: { patient: Patient; value: Place; onChange: (p: Place) => void; allowed?: PlaceKind[]; name: string }) {
  const can = (k: PlaceKind) => !allowed || allowed.includes(k);
  const options: { place: Place; sub: string }[] = [
    ...(can("자택") ? [{ place: { kind: "자택" } as Place, sub: patient.homeAccess ? `${patient.area} · ${patient.homeAccess}` : patient.area }] : []),
    ...(can("센터") ? centersNear(patient.area).map(c => ({ place: { kind: "센터", centerId: c.id } as Place, sub: `${c.area} · ${c.tags.join(" · ")}` })) : []),
  ];
  return <div className="place-pick" role="radiogroup" aria-label="방문 장소">{options.map(o => <label key={o.place.centerId ?? "home"}>
    <input type="radio" name={name} checked={samePlace(o.place, value)} onChange={() => onChange(o.place)} />
    <span><b>{placeName(o.place)}</b><small>{o.sub}</small></span>
  </label>)}</div>;
}
