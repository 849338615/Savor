"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterChips } from "@/components/search/FilterChips";
import { RecipeResultRowSkeleton } from "@/components/feedback/RecipeResultRowSkeleton";
import { PulseDot } from "@/components/feedback/PulseDot";

/**
 * Results loading state — rendered automatically by Next.js while the
 * server-rendered `/results` page is fetching data. Designed to match the
 * loaded layout pixel-for-pixel so cards snap into place rather than pop.
 *
 * UX choices:
 *   - The TopBar's back button stays functional — bail-out path always present.
 *   - The SearchBar echoes the query so the user sees their input was received.
 *   - The status line names the work specifically: "Reading recipes from the
 *     web…" — beats a generic "Loading…".
 *   - 8 row skeletons match `RecipeResultRow` exactly. Pulses are staggered
 *     so the skeleton feels organic, not robotic.
 *   - No spinner. Brand is calm — a subtle breathing dot instead.
 */
export default function ResultsLoading() {
  return (
    <Suspense fallback={<ResultsLoadingShell query="" tag={null} />}>
      <ResultsLoadingClient />
    </Suspense>
  );
}

function ResultsLoadingClient() {
  const params = useSearchParams();
  const q = params?.get("q") ?? "";
  const tag = params?.get("tag") ?? null;
  return <ResultsLoadingShell query={q} tag={tag} />;
}

function ResultsLoadingShell({
  query,
  tag,
}: {
  query: string;
  tag: string | null;
}) {
  const headline = buildHeadline(query, tag);
  const status = buildStatus(query, tag);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Results" />

      <div className="px-6 pt-1">
        <SearchBar defaultValue={query} />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <div className="mt-4 px-6">
          <FilterChips />
        </div>
      </Suspense>

      <section className="flex flex-1 flex-col px-6 pt-8 pb-8">
        <h2 className="font-display text-[22px] font-semibold leading-tight text-ink">
          {headline}
        </h2>
        <p
          className="mt-2 flex items-center gap-2 text-[12px] text-stone"
          role="status"
          aria-live="polite"
        >
          <PulseDot />
          {status}
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <RecipeResultRowSkeleton delayMs={i * 80} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function buildHeadline(q: string, tag: string | null): string {
  if (q && tag) return `${capitalize(tag)} ideas for "${q}"`;
  if (q) return `Top recipes for "${q}"`;
  if (tag) return `${capitalize(tag)} recipes`;
  return "Top recipes for you";
}

function buildStatus(q: string, tag: string | null): string {
  if (q) return `Reading the top recipes for "${q}"…`;
  if (tag) return `Curating ${tag.toLowerCase()} recipes from the web…`;
  return "Reading the top recipes from the web…";
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
