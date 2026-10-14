import { Icon } from "@/components/Icon";
import { mapUrl, placeAddress, placeName, upcomingPlace, type Place } from "@/lib/places";
import type { Patient } from "@/lib/repo";

/** 방문 장소 한 줄: 장소 이름 · 주소 · 길찾기. full=false면 주소를 구 단위까지만 보여 줍니다. */
export function PlaceInfo({ patient, place, full = true, map = true, changed }: { patient: Patient; place?: Place; full?: boolean; map?: boolean; changed?: boolean }) {
  const pl = place ?? upcomingPlace(patient);
  const address = placeAddress(patient, pl, full);
  return <p className="place-info"><Icon name="pin" size={14} /><b>{placeName(pl)}</b>{changed && <em>이번 회차만 변경</em>}<span>{address}</span>
    {map && full && address && <a href={mapUrl(address)} target="_blank" rel="noreferrer">길찾기</a>}</p>;
}
