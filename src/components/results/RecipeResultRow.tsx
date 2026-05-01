"use client";

import Link from "next/link";
import { Clock, Star } from "lucide-react";
import type { RecipeSummary } from "@/lib/recipes/types";
import { cn, difficultyTone, formatMinutes } from "@/lib/utils";
import { BookmarkToggle } from "@/components/recipe/BookmarkToggle";
import { RecipePhoto } from "./RecipePhoto";

interface RecipeResultRowProps {
  recipe: RecipeSummary;
}

/**
 * Horizontal row card used on the results screen. Denser than the home grid
 * — surfaces source, summary, rating, and time/difficulty in one scan.
 */
export function RecipeResultRow({ recipe }: RecipeResultRowProps) {
  const rating = recipe.rating;
  const hasRating = !!rating?.ratingValue;
  const hasTime = recipe.totalMinutes > 0;

  return (
    <Link
      href={`/recipe/${recipe.slug}`}
      className="group flex gap-3.5 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-surface p-2.5 pr-4 transition-colors active:scale-[0.997] hover:border-forest/30"
    >
      <div className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-[var(--radius-md)]">
        <RecipePhoto recipe={recipe} />
        <BookmarkToggle
          recipeId={recipe.id}
          summary={recipe}
          size={13}
          visualSize={28}
          onScrim
          className="absolute right-0 top-0"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div className="flex flex-col gap-1.5">
          <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.16em] text-forest/80">
            {recipe.source}
          </p>
          <h3 className="font-display text-[17px] font-semibold leading-[1.2] tracking-[-0.005em] text-ink line-clamp-2">
            {recipe.title}
          </h3>
          {recipe.summary ? (
            <p className="text-[12.5px] leading-[1.45] text-stone line-clamp-2">
              {recipe.summary}
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] tabular-nums text-stone">
          {hasRating ? (
            <span className="inline-flex items-center gap-1 text-ink">
              <Star
                size={12}
                strokeWidth={0}
                fill="currentColor"
                className="text-forest"
                aria-hidden
              />
              <span className="font-semibold">
                {rating!.ratingValue.toFixed(1)}
              </span>
              {rating!.reviewCount ? (
                <span className="text-stone">
                  ({formatCount(rating!.reviewCount)})
                </span>
              ) : null}
            </span>
          ) : null}
          {hasRating && (hasTime || recipe.difficulty) ? <Dot /> : null}
          {hasTime ? (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} strokeWidth={1.6} aria-hidden />
              {formatMinutes(recipe.totalMinutes)}
            </span>
          ) : null}
          {hasTime && recipe.difficulty ? <Dot /> : null}
          {recipe.difficulty ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: difficultyTone(recipe.difficulty) }}
              />
              {recipe.difficulty}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function Dot() {
  return (
    <span
      aria-hidden
      className={cn("h-[3px] w-[3px] shrink-0 rounded-full bg-[color:var(--fg-3)]")}
    />
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
