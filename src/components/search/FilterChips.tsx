"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Chip {
  label: string;
  tag: string;
}

const DEFAULT_CHIPS: Chip[] = [
  { label: "All", tag: "" },
  { label: "Quick", tag: "quick" },
  { label: "Vegetarian", tag: "vegetarian" },
  { label: "Dinner", tag: "dinner" },
  { label: "Light", tag: "light" },
  { label: "Comfort", tag: "comfort" },
];

interface FilterChipsProps {
  chips?: Chip[];
  className?: string;
}

export function FilterChips({
  chips = DEFAULT_CHIPS,
  className,
}: FilterChipsProps) {
  const params = useSearchParams();
  const activeTag = params?.get("tag") ?? "";
  const q = params?.get("q") ?? "";

  function hrefFor(tag: string) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (tag) next.set("tag", tag);
    const search = next.toString();
    return `/results${search ? `?${search}` : ""}`;
  }

  const fadeMask =
    "linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%)";

  return (
    <div
      className={cn(
        "no-scrollbar flex items-center gap-2 overflow-x-auto pr-6",
        className,
      )}
      style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
    >
      {chips.map(({ label, tag }) => {
        const active = activeTag === tag;
        return (
          <Link
            key={label}
            href={hrefFor(tag)}
            aria-pressed={active}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] px-4 py-[9px] text-[13px] leading-none transition-colors",
              active
                ? "bg-sage-mist font-semibold text-forest"
                : "font-medium text-ink hover:bg-linen",
            )}
            style={
              active
                ? { boxShadow: "inset 0 0 0 1px var(--border-active-faint)" }
                : {
                    background: "var(--bg-surface)",
                    boxShadow: "inset 0 0 0 1px var(--border-hairline)",
                  }
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
