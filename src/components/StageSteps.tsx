import { CARE_STAGES, carePhase, stageTodo, type Stage } from "@/lib/program";

/** 병원 연계형 6단계 진행 표시. 지금 단계와 그 단계에서 누가 무엇을 하는지 함께 보여 줍니다. */
export function StageSteps({ stage, compact = false }: { stage: Stage; compact?: boolean }) {
  const now = CARE_STAGES.indexOf(carePhase(stage));
  const todo = stageTodo(stage);
  return <div className={`stage-steps ${compact ? "compact" : ""}`}>
    <ol aria-label="프로그램 단계">{CARE_STAGES.map((s, i) => <li key={s} className={i < now ? "done" : i === now ? "now" : ""} aria-current={i === now ? "step" : undefined}><span className="stage-dot">{i < now ? "✓" : i + 1}</span><span className="stage-name">{s}</span></li>)}</ol>
    {!compact && <p className="stage-todo"><b>{todo.who}</b> {todo.what}</p>}
  </div>;
}
