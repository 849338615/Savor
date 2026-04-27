"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CookingControlsProps {
  canPrev: boolean;
  canNext: boolean;
  isLast: boolean;
  recipeSlug: string;
  onPrev: () => void;
  onNext: () => void;
}

export function CookingControls({
  canPrev,
  canNext,
  isLast,
  recipeSlug,
  onPrev,
  onNext,
}: CookingControlsProps) {
  const router = useRouter();

  const finish = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(`/recipe/${recipeSlug}`);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className={cn(
          "h-[52px] flex-1 rounded-[var(--radius-pill)] border border-forest bg-surface text-[15px] font-semibold text-forest transition-colors hover:bg-soft-white",
          !canPrev && "cursor-not-allowed opacity-40",
        )}
      >
        Previous
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={finish}
          className="h-[52px] flex-1 rounded-[var(--radius-pill)] bg-forest text-[15px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)] active:bg-[var(--bg-brand-pressed)]"
        >
          Finish
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={cn(
            "h-[52px] flex-1 rounded-[var(--radius-pill)] bg-forest text-[15px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)] active:bg-[var(--bg-brand-pressed)]",
            !canNext && "cursor-not-allowed opacity-50",
          )}
        >
          Next step
        </button>
      )}
    </>
  );
}
