"use client";

import { Check } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { useUnits } from "@/hooks/useUnits";
import { type UnitSystem } from "@/lib/units/convert";
import { cn } from "@/lib/utils";

const OPTIONS: { value: UnitSystem; title: string; detail: string }[] = [
  {
    value: "metric",
    title: "Metric",
    detail: "Grams, kilograms, milliliters, liters",
  },
  {
    value: "imperial",
    title: "Imperial",
    detail: "Ounces, pounds, cups",
  },
];

export default function UnitsSettingsPage() {
  const storedSystem = useUnits((s) => s.system);
  const hasHydrated = useUnits((s) => s.hasHydrated);
  const setSystem = useUnits((s) => s.setSystem);

  // Match server/first-client render until the stored preference loads.
  const active = hasHydrated ? storedSystem : "metric";

  return (
    <div className="relative flex flex-1 flex-col">
      <TopBar title="Units" back="/profile" />

      <div className="px-5 pb-10 pt-2">
        <ul
          role="radiogroup"
          aria-label="Measurement system"
          className="flex flex-col gap-2.5"
        >
          {OPTIONS.map((opt) => {
            const selected = active === opt.value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSystem(opt.value)}
                  className="flex w-full items-center gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-surface px-4 py-3.5 text-left shadow-[var(--shadow-xs)] transition-colors hover:bg-cream"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-ink">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-stone">
                      {opt.detail}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-[22px] w-[22px] shrink-0 place-items-center transition-colors",
                      selected ? "text-forest" : "text-transparent",
                    )}
                  >
                    <Check size={18} strokeWidth={2.25} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
