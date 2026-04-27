"use client";

import { Minus, Plus } from "lucide-react";

interface ServingsStepperProps {
  value: number;
  baseValue: number;
  onChange: (next: number) => void;
}

export function ServingsStepper({ value, onChange }: ServingsStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-surface px-[18px] py-3.5">
      <span className="text-[14px] font-medium text-ink">Servings</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          aria-label="Decrease servings"
          className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
          disabled={value <= 1}
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border-strong)]"
          >
            <Minus size={14} strokeWidth={1.75} />
          </span>
        </button>
        <span className="min-w-[1.5rem] text-center text-[16px] font-semibold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          aria-label="Increase servings"
          className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-cream"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border-strong)]"
          >
            <Plus size={14} strokeWidth={1.75} />
          </span>
        </button>
      </div>
    </div>
  );
}
