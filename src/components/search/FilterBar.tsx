"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { FilterPanel } from "./FilterPanel";
import { labelForTag } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  /** Currently-applied tags. */
  selected: string[];
  /** Called when the applied selection changes (Apply, or a pill removal). */
  onChange: (tags: string[]) => void;
  className?: string;
}

/**
 * The in-page filter bar: a "Filters" trigger that opens the {@link FilterPanel},
 * followed by a removable pill for each applied tag. Pure controlled component
 * — `onChange` decides the behavior (home stages into state; results pushes a
 * new URL to reissue the search), so both screens share one bar.
 */
export function FilterBar({ selected, onChange, className }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  // Right-edge fade so a clipped pill row reads as scrollable.
  const fadeMask =
    "linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%)";

  return (
    <>
      <div
        className={cn(
          "no-scrollbar flex items-center gap-2 overflow-x-auto pr-6",
          className,
        )}
        style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-4 py-[9px] text-[13px] leading-none transition-colors",
            count > 0
              ? "bg-sage-mist font-semibold text-forest"
              : "font-medium text-ink hover:bg-linen",
          )}
          style={
            count > 0
              ? { boxShadow: "inset 0 0 0 1px var(--border-active-faint)" }
              : {
                  background: "var(--bg-surface)",
                  boxShadow: "inset 0 0 0 1px var(--border-hairline)",
                }
          }
        >
          <SlidersHorizontal size={15} strokeWidth={1.85} aria-hidden />
          Filters
          {count > 0 && (
            <span className="ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-forest px-1 text-[11px] font-semibold tabular-nums text-soft-white">
              {count}
            </span>
          )}
        </button>

        {selected.map((tag) => {
          const label = labelForTag(tag);
          return (
            <span
              key={tag}
              className="flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] bg-sage-mist py-[9px] pl-4 pr-2 text-[13px] font-semibold leading-none text-forest"
              style={{ boxShadow: "inset 0 0 0 1px var(--border-active-faint)" }}
            >
              {label}
              <button
                type="button"
                onClick={() => onChange(selected.filter((t) => t !== tag))}
                aria-label={`Remove ${label} filter`}
                className="-mr-0.5 flex h-5 w-5 items-center justify-center rounded-full text-forest/70 transition-colors hover:bg-forest/10 hover:text-forest"
              >
                <X size={13} strokeWidth={2.25} aria-hidden />
              </button>
            </span>
          );
        })}
      </div>

      <FilterPanel
        open={open}
        initial={selected}
        onApply={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
