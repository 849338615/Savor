"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Recipe } from "@/lib/recipes/types";
import { useSaved } from "@/hooks/useSaved";
import { RecipeCard } from "@/components/results/RecipeCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";

export default function SavedPage() {
  const ids = useSaved((s) => s.ids);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const idCount = Object.keys(ids).length;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = Object.keys(ids);
      const out: Recipe[] = [];
      const batchSize = 6;
      for (let i = 0; i < list.length; i += batchSize) {
        if (cancelled) return;
        const batch = list.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((id) =>
            fetch(`/api/recipes/${encodeURIComponent(id)}`).then((res) =>
              res.ok ? (res.json() as Promise<Recipe>) : null,
            ),
          ),
        );
        for (const r of results) if (r) out.push(r);
      }
      if (cancelled) return;
      setRecipes(out);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const loading = idCount > 0 && !hydrated;

  return (
    <div className="flex flex-col">
      <PageHeader title="Saved" />

      {loading ? (
        <ul className="flex flex-col gap-3.5 px-5 pb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[5/3] w-full" rounded="lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </li>
          ))}
        </ul>
      ) : idCount === 0 ? (
        <EmptyState
          title="Nothing saved yet."
          body="Tap the bookmark on any recipe to keep it here for later."
          action={
            <Link
              href="/"
              className="grid h-10 place-items-center rounded-[var(--radius-pill)] bg-forest px-4 text-[13px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)]"
            >
              Browse recipes
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3.5 px-5 pb-8">
          {recipes.map((r) => (
            <li key={r.id}>
              <RecipeCard recipe={r} variant="list" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
