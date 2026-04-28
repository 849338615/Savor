"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/lib/recipes/types";

interface IngredientItemProps {
  ingredient: Ingredient;
  amountOverride?: string;
  checked: boolean;
  onToggle: () => void;
}

export function IngredientItem({
  ingredient,
  amountOverride,
  checked,
  onToggle,
}: IngredientItemProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-hairline)] px-3.5 py-3 text-left transition-colors",
        checked ? "bg-cream" : "bg-surface",
      )}
    >
      <span
        className={cn(
          "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border-[1.5px] transition-colors",
          checked
            ? "border-forest bg-forest text-cream"
            : "border-[var(--border-strong)] text-transparent",
        )}
      >
        <Check size={13} strokeWidth={2.4} aria-hidden />
      </span>
      <span
        className={cn(
          "flex-1 text-[15px] leading-snug text-ink transition-colors",
          checked && "text-stone line-through",
        )}
      >
        <span className="block first-letter:uppercase">
          {ingredient.name}
          {ingredient.optional && (
            <span className="ml-2 text-[11px] uppercase tracking-wider text-stone">
              optional
            </span>
          )}
        </span>
        {ingredient.note && (
          <span
            className={cn(
              "mt-0.5 block text-[12px] leading-snug text-stone",
              checked && "line-through",
            )}
          >
            {ingredient.note}
          </span>
        )}
      </span>
      {(amountOverride ?? ingredient.amount) ? (
        <span
          className={cn(
            "text-[13px] tabular-nums text-stone transition-colors",
            checked && "line-through",
          )}
        >
          {amountOverride ?? ingredient.amount}
        </span>
      ) : null}
    </button>
  );
}
