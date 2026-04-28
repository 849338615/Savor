"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RecipeSummary } from "@/lib/recipes/types";
import { useSaved } from "@/hooks/useSaved";
import { RecipeCard } from "@/components/results/RecipeCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { pluralize } from "@/lib/utils";

export default function SavedPage() {
  // Select the raw state slices — never call a method inside a useSaved
  // selector. Methods that build a derived array (like `orderedIds()`)
  // return a fresh reference every render, which trips the
  // `useSyncExternalStore` "snapshot must be cached" check and produces an
  // infinite render loop. Derive once with useMemo from stable inputs.
  const ids = useSaved((s) => s.ids);
  const summaries = useSaved((s) => s.summaries);
  const savedAt = useSaved((s) => s.savedAt);
  const setSummary = useSaved((s) => s.setSummary);
  const remove = useSaved((s) => s.remove);

  // Most-recent-first ordering reflects how users think about the list.
  const orderedIds = useMemo(
    () =>
      Object.keys(ids).sort((a, b) => (savedAt[b] ?? 0) - (savedAt[a] ?? 0)),
    [ids, savedAt],
  );

  // Hydration guard — without this, the server renders an empty store and
  // we'd briefly flash the empty state before the persisted data arrives.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Lazy-hydrate any saved id that doesn't have a summary yet. This only
  // runs for legacy bookmarks (saved before the snapshot field existed); new
  // bookmarks always carry their summary at save time. Dead ids (404) get
  // pruned so the count stays accurate.
  //
  // The in-flight set survives re-renders so a snapshot landing in store
  // (which triggers a re-render with a smaller `missing` list) doesn't kick
  // off a second fetch for ids already being hydrated.
  const inFlight = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const id of orderedIds) {
      if (summaries[id]) continue;
      if (inFlight.current.has(id)) continue;
      inFlight.current.add(id);
      void (async () => {
        try {
          const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
          if (res.status === 404) {
            remove(id);
            return;
          }
          if (!res.ok) return;
          const data = (await res.json()) as RecipeSummary;
          setSummary(id, data);
        } catch {
          // Network error — leave the id alone; we'll retry on next visit.
        } finally {
          inFlight.current.delete(id);
        }
      })();
    }
  }, [orderedIds, summaries, remove, setSummary]);

  // Render: instant for ids with a snapshot, skeleton for the (rare) legacy
  // ids still hydrating. This replaces the old full-screen spinner.
  const cards = orderedIds.map((id) => ({ id, summary: summaries[id] }));
  const renderedCount = cards.filter((c) => c.summary).length;
  const totalCount = orderedIds.length;

  // While hydrating from localStorage on the client, suppress the empty
  // state — we don't yet know whether there are any saved recipes.
  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="Saved" />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="Saved" />
        <div className="flex flex-1 items-center justify-center pb-12">
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
        </div>
      </div>
    );
  }

  // Show the resolved count when it differs (e.g., during legacy hydration);
  // otherwise the saved count. This avoids the "2 recipes" / 1-card mismatch.
  const displayCount = renderedCount > 0 ? renderedCount : totalCount;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Saved" />
      <p className="px-6 pb-4 text-[13px] leading-none text-stone">
        {pluralize(displayCount, "recipe")} kept for later.
      </p>
      <ul className="flex flex-col gap-3.5 px-6 pb-8">
        {cards.map(({ id, summary }) => (
          <li key={id}>
            {summary ? (
              <RecipeCard recipe={summary} variant="list" confirmRemove />
            ) : (
              <div className="flex flex-col gap-2">
                <Skeleton className="aspect-[5/3] w-full" rounded="lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
