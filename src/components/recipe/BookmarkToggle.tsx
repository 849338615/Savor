"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import type { RecipeSummary } from "@/lib/recipes/types";
import { useSaved } from "@/hooks/useSaved";
import { ConfirmSheet } from "@/components/feedback/ConfirmSheet";
import { cn } from "@/lib/utils";

interface BookmarkToggleProps {
  recipeId: string;
  /**
   * Snapshot persisted alongside the bookmark so the Saved tab can render
   * the card without a network round-trip. Pass the recipe (summary OR full
   * `Recipe`, since `Recipe extends RecipeSummary`) on every surface that
   * already has it on hand: cards, list rows, detail hero. Optional only so
   * legacy callers keep compiling.
   */
  summary?: RecipeSummary;
  size?: number;
  /** Visual diameter of the scrim circle. Hit area is always 44px. */
  visualSize?: number;
  className?: string;
  onScrim?: boolean;
  /**
   * On surfaces where the bookmark IS the entry-list affordance (the Saved
   * tab), tapping it to remove the recipe is a one-tap data-loss path. Set
   * this to gate removal behind a confirmation sheet. Saving stays one-tap
   * everywhere.
   */
  confirmRemove?: boolean;
}

/**
 * Bookmark control with a calm fill transition: stacked outline + filled
 * icons cross-fade rather than snapping. The button itself is always 44×44
 * (WCAG); the scrim circle inside can be smaller via `visualSize`.
 */
export function BookmarkToggle({
  recipeId,
  summary,
  size = 16,
  visualSize,
  className,
  onScrim = false,
  confirmRemove = false,
}: BookmarkToggleProps) {
  const isSaved = useSaved((s) => !!s.ids[recipeId]);
  const toggle = useSaved((s) => s.toggle);
  const visual = visualSize ?? 36;
  const [confirming, setConfirming] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved && confirmRemove) {
      setConfirming(true);
      return;
    }
    toggle(recipeId, summary);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isSaved ? "Remove from saved" : "Save recipe"}
        aria-pressed={isSaved}
        aria-haspopup={isSaved && confirmRemove ? "dialog" : undefined}
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
      {confirmRemove && (
        <ConfirmSheet
          open={confirming}
          title="Remove from saved?"
          description={
            summary?.title ? (
              <>
                <span className="font-display text-[15px] font-semibold leading-snug text-ink">
                  {summary.title}
                </span>
                <span className="mt-1 block">
                  won&rsquo;t appear in your saved list anymore. You can save
                  it again any time.
                </span>
              </>
            ) : (
              <>
                This recipe won&rsquo;t appear in your saved list anymore.
                You can save it again any time.
              </>
            )
          }
          cancelLabel="Keep saved"
          confirmLabel="Remove"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            toggle(recipeId, summary);
            setConfirming(false);
          }}
        />
      )}
    </>
  );
}
