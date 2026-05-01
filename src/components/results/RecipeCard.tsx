"use client";

import Link from "next/link";
import type { RecipeSummary } from "@/lib/recipes/types";
import { cn, difficultyTone, pluralize } from "@/lib/utils";
import { BookmarkToggle } from "@/components/recipe/BookmarkToggle";
import { RecipePhoto } from "./RecipePhoto";

interface RecipeCardProps {
  recipe: RecipeSummary & { servings?: number };
  variant?: "grid" | "list";
  /** Forwarded to BookmarkToggle. Set on the Saved tab so unsaving asks
   *  for confirmation instead of disappearing the card on a stray tap. */
  confirmRemove?: boolean;
}

/**
 * grid: square photo on top, single-line title beneath. Used in 2-col grids.
 * list: full-width 5/3 photo on top, multi-line title + meta. Used on Saved.
 */
export function RecipeCard({
  recipe,
  variant = "grid",
  confirmRemove = false,
}: RecipeCardProps) {
  return (
    <Link
      href={`/recipe/${recipe.slug}`}
      className="group block rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-surface transition-transform active:scale-[0.99]"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-t-[var(--radius-lg)]",
          variant === "grid" ? "aspect-square" : "aspect-[5/3]",
        )}
      >
        <RecipePhoto recipe={recipe} />
        <BookmarkToggle
          recipeId={recipe.id}
          summary={recipe}
          size={variant === "grid" ? 14 : 16}
          visualSize={variant === "grid" ? 28 : 36}
          onScrim
          confirmRemove={confirmRemove}
          className={cn(
            "absolute",
            variant === "grid" ? "right-0 top-0" : "right-1 top-1",
          )}
        />
      </div>
      <div
        className={cn(
          variant === "grid" ? "px-3 pb-3 pt-2.5" : "px-4 pb-4 pt-3.5",
        )}
      >
        <h3
          className={cn(
            "font-display leading-tight text-ink",
            variant === "grid"
              ? "truncate text-[14px] font-semibold"
              : "text-[19px] font-semibold",
          )}
        >
          {recipe.title}
        </h3>
        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-stone tabular-nums",
            variant === "grid" ? "text-[11px]" : "text-[13px] gap-2.5",
          )}
        >
          <span>{recipe.totalMinutes} min</span>
          <span aria-hidden className="h-2.5 w-px bg-forest/40" />
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn(
                "rounded-full",
                variant === "grid" ? "h-[5px] w-[5px]" : "h-[6px] w-[6px]",
              )}
              style={{ background: difficultyTone(recipe.difficulty) }}
            />
            {recipe.difficulty}
          </span>
          {variant === "list" && recipe.servings ? (
            <>
              <span aria-hidden className="h-2.5 w-px bg-forest/40" />
              <span>{pluralize(recipe.servings, "serving")}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
