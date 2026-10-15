import { Icon } from "./Icon";
import { protocolById } from "@/lib/protocols";
import type { Prescription } from "@/lib/repo";
import "./protocol.css";

/** 병원 처방의 금기 운동·주의사항. 치료사 화면과 회차 보고서에서 같은 모양으로 보여 줍니다. */
export function ContraBox({ rx, showOpinion = false }: { rx?: Prescription; showOpinion?: boolean }) {
  const contras = rx?.contraindications ?? [];
  const cautions = rx?.cautions ?? [];
  if (!contras.length && !cautions.length && !(showOpinion && rx?.doctorOpinion)) return null;
  const protocol = protocolById(rx?.protocolId);
  return <div className="contra-box">
    {contras.length > 0 && <><h4><Icon name="shield" size={14} />하지 말아야 할 운동</h4><ul>{contras.map(c => <li key={c}>{c}</li>)}</ul></>}
    {cautions.length > 0 && <div className={contras.length ? "contra-cautions" : undefined}><h4>주의사항</h4><ul>{cautions.map(c => <li key={c}>{c}</li>)}</ul></div>}
    {showOpinion && rx?.doctorOpinion && <div className="contra-cautions"><h4>주치의 재활 소견</h4><ul><li>{rx.doctorOpinion}</li></ul></div>}
    <p className="contra-meta">{protocol ? `${protocol.dept} · ${protocol.label} 프로토콜` : "병원 지정"}{rx?.doctor ? ` · ${rx.doctor}` : ""}</p>
  </div>;
}
