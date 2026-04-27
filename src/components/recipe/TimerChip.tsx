import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSecondsAsClock } from "@/lib/utils";

interface TimerChipProps {
  seconds: number;
  className?: string;
}

/**
 * Passive metadata: shows the suggested timer for a step in the Steps tab.
 * Not a button — the live timer lives in cook mode. Treat like meta-text.
 */
export function TimerChip({ seconds, className }: TimerChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium text-stone tabular-nums",
        className,
      )}
    >
      <Clock size={12} strokeWidth={1.75} aria-hidden />
      {formatSecondsAsClock(seconds)}
    </span>
  );
}
