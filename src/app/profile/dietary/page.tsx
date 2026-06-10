"use client";

import { Check } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { useDietary } from "@/hooks/useDietary";
import { DIET_OPTIONS } from "@/lib/filters";
import { cn } from "@/lib/utils";

/** Plain-language description of what each diet excludes/emphasizes. */
const DESCRIPTIONS: Record<string, string> = {
  vegetarian: "No meat or fish",
  vegan: "No animal products",
  "gluten-free": "No wheat, barley, or rye",
  "dairy-free": "No milk, cheese, or butter",
  "high-protein": "Protein-forward dishes",
};

export default function DietaryPreferencesPage() {
  const tags = useDietary((s) => s.tags);
  const hasHydrated = useDietary((s) => s.hasHydrated);
  const toggle = useDietary((s) => s.toggle);
  const clear = useDietary((s) => s.clear);

  // Match server/first-client render until the stored preference loads.
  const selected = hasHydrated ? tags : [];

  return (
    <div className="relative flex flex-1 flex-col">
      <TopBar title="Dietary preferences" back="/profile" />

      <div className="px-5 pb-10 pt-2">
        <ul
          role="group"
          aria-label="Dietary preferences"
          className="flex flex-col gap-2.5"
        >
          {DIET_OPTIONS.map((opt) => {
            const checked = selected.includes(opt.tag);
            return (
              <li key={opt.tag}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(opt.tag)}
                  className="flex w-full items-center gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-surface px-4 py-3.5 text-left shadow-[var(--shadow-xs)] transition-colors hover:bg-cream"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-ink">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-stone">
                      {DESCRIPTIONS[opt.tag]}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border-[1.5px] transition-colors",
                      checked
                        ? "border-forest bg-forest text-cream"
                        : "border-[var(--border-strong)] text-transparent",
                    )}
                  >
                    <Check size={13} strokeWidth={2.4} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {selected.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="mt-4 px-1 text-[13px] font-medium text-stone transition-colors hover:text-ink"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
