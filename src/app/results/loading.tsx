"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SearchBar } from "@/components/search/SearchBar";
import { ResultsFilterBar } from "@/components/search/ResultsFilterBar";
import { RecipeResultRowSkeleton } from "@/components/feedback/RecipeResultRowSkeleton";
import { PulseDot } from "@/components/feedback/PulseDot";
import { labelForTag, parseTags } from "@/lib/filters";

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
    <Suspense fallback={<ResultsLoadingShell query="" tags={[]} />}>
      <ResultsLoadingClient />
    </Suspense>
  );
}

function ResultsLoadingClient() {
  const params = useSearchParams();
  const q = params?.get("q") ?? "";
  const tags = parseTags(params?.get("tag"));
  return <ResultsLoadingShell query={q} tags={tags} />;
}

function ResultsLoadingShell({
  query,
  tags,
}: {
  query: string;
  tags: string[];
}) {
  const headline = buildHeadline(query, tags);
  const status = buildStatus(query, tags);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Results" />

      <section className="scroll-fade-bottom flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4 pt-5">
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

      <section className="px-6 pb-5 pt-3">
        <Suspense fallback={<div className="h-10" />}>
          <ResultsFilterBar />
        </Suspense>
        <div className="pt-4">
          <SearchBar defaultValue={query} />
        </div>
      </section>
    </div>
  );
}

function tagsLabel(tags: string[]): string {
  return tags.map(labelForTag).join(" · ");
}

function buildHeadline(q: string, tags: string[]): string {
  const label = tagsLabel(tags);
  if (q && label) return `${label} ideas for "${q}"`;
  if (q) return `Top recipes for "${q}"`;
  if (label) return `${label} recipes`;
  return "Top recipes for you";
}

function buildStatus(q: string, tags: string[]): string {
  if (q) return `Reading the top recipes for "${q}"…`;
  if (tags.length)
    return `Curating ${tagsLabel(tags).toLowerCase()} recipes from the web…`;
  return "Reading the top recipes from the web…";
}
