import type { Step } from "@/lib/recipes/types";
import { TimerChip } from "./TimerChip";

interface StepListProps {
  steps: Step[];
}

export function StepList({ steps }: StepListProps) {
  const items: React.ReactNode[] = [];
  let lastSection: string | undefined;

  steps.forEach((step) => {
    if (step.section && step.section !== lastSection) {
      items.push(
        <li
          key={`section-${step.id}`}
          className="mt-3 first:mt-0 px-1 pt-1.5 pb-0.5 list-none"
        >
          <h3 className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-stone">
            {step.section}
          </h3>
        </li>,
      );
      lastSection = step.section;
    }
    if (!step.section) lastSection = undefined;

    items.push(
      <li
        key={step.id}
        className="flex gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-surface px-[18px] py-4"
      >
        <span className="min-w-[22px] text-[14px] font-semibold leading-[1.4] tabular-nums text-forest">
          {step.index}
        </span>
        <div className="flex-1">
          <h4 className="font-display text-[15px] font-semibold leading-snug text-ink">
            {step.title}
          </h4>
          <p className="mt-1 text-[14px] leading-relaxed text-stone">
            {step.instruction}
          </p>
          {step.durationSeconds ? (
            <div className="mt-2.5">
              <TimerChip seconds={step.durationSeconds} />
            </div>
          ) : null}
        </div>
      </li>,
    );
  });

  return <ol className="flex flex-col gap-2.5">{items}</ol>;
}
