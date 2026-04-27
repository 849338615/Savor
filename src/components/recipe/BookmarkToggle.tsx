"use client";

import { Bookmark } from "lucide-react";
import { useSaved } from "@/hooks/useSaved";
import { cn } from "@/lib/utils";

interface BookmarkToggleProps {
  recipeId: string;
  size?: number;
  /** Visual diameter of the scrim circle. Hit area is always 44px. */
  visualSize?: number;
  className?: string;
  onScrim?: boolean;
}

/**
 * Bookmark control with a calm fill transition: stacked outline + filled
 * icons cross-fade rather than snapping. The button itself is always 44×44
 * (WCAG); the scrim circle inside can be smaller via `visualSize`.
 */
export function BookmarkToggle({
  recipeId,
  size = 16,
  visualSize,
  className,
  onScrim = false,
}: BookmarkToggleProps) {
  const isSaved = useSaved((s) => !!s.ids[recipeId]);
  const toggle = useSaved((s) => s.toggle);
  const visual = visualSize ?? 36;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(recipeId);
      }}
      aria-label={isSaved ? "Unsave recipe" : "Save recipe"}
      aria-pressed={isSaved}
      className={cn("grid h-11 w-11 place-items-center", className)}
    >
      <span
        aria-hidden
        style={{ width: visual, height: visual }}
        className={cn(
          "relative grid place-items-center rounded-full transition-colors",
          onScrim
            ? "bg-soft-white/85 text-forest backdrop-blur hover:bg-soft-white"
            : "text-forest hover:bg-cream",
        )}
      >
        <Bookmark
          size={size}
          strokeWidth={1.75}
          fill="none"
          className={cn(
            "transition-opacity duration-200 ease-out",
            isSaved ? "opacity-0" : "opacity-100",
          )}
        />
        <Bookmark
          size={size}
          strokeWidth={1.75}
          fill="currentColor"
          className={cn(
            "absolute inset-0 m-auto transition-[opacity,transform] duration-200 ease-out",
            isSaved ? "opacity-100 scale-100" : "opacity-0 scale-90",
          )}
        />
      </span>
    </button>
  );
}
