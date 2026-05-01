"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Users } from "lucide-react";
import type { Recipe } from "@/lib/recipes/types";
import { difficultyTone, formatMinutes, pluralize } from "@/lib/utils";
import { BookmarkToggle } from "@/components/recipe/BookmarkToggle";
import { RecipePhoto } from "@/components/results/RecipePhoto";
import { useSectionBackHref } from "@/hooks/useNav";

interface RecipeHeroProps {
  recipe: Recipe;
}

export function RecipeHero({ recipe }: RecipeHeroProps) {
  const router = useRouter();
  const sectionBack = useSectionBackHref();
  const handleBack = () => {
    if (sectionBack) router.push(sectionBack);
    else router.back();
  };

  return (
    <div className="relative w-full overflow-hidden aspect-[5/4]">
      <RecipePhoto recipe={recipe} variant="hero" className="absolute inset-0" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-2 pt-[max(env(safe-area-inset-top,1rem),3.5rem)]">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center"
        >
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full bg-soft-white/85 text-ink backdrop-blur transition-colors hover:bg-soft-white"
          >
            <ArrowLeft size={20} strokeWidth={1.75} />
          </span>
        </button>
        <BookmarkToggle
          recipeId={recipe.id}
          summary={recipe}
          size={18}
          visualSize={40}
          onScrim
          confirmRemove
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-12 text-soft-white"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklch, var(--savor-ink) 62%, transparent) 0%, color-mix(in oklch, var(--savor-ink) 28%, transparent) 45%, transparent 100%)",
        }}
      >
        <h1 className="font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.01em] text-soft-white">
          {recipe.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-soft-white/90 tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} strokeWidth={1.75} aria-hidden />
            {formatMinutes(recipe.totalMinutes)}
          </span>
          <span aria-hidden className="h-3 w-px bg-soft-white/40" />
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} strokeWidth={1.75} aria-hidden />
            {pluralize(recipe.servings, "serving")}
          </span>
          <span aria-hidden className="h-3 w-px bg-soft-white/40" />
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-[7px] w-[7px] rounded-full ring-1 ring-soft-white/30"
              style={{ background: difficultyTone(recipe.difficulty) }}
            />
            {recipe.difficulty}
          </span>
        </div>
      </div>
    </div>
  );
}
