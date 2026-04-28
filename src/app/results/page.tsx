import { Suspense } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterChips } from "@/components/search/FilterChips";
import { RecipeResultRow } from "@/components/results/RecipeResultRow";
import { RecordLastResults } from "@/components/results/RecordLastResults";
import { RecipeResultRowSkeleton } from "@/components/feedback/RecipeResultRowSkeleton";
import { PulseDot } from "@/components/feedback/PulseDot";
import { getProvider } from "@/lib/recipes/getProvider";
import { pluralize } from "@/lib/utils";

interface ResultsPageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

/**
 * Results page. The data fetch lives inside a keyed `<Suspense>` boundary
 * so that *every* search change — including in-segment soft navigations
 * (typing a new query while already on `/results`) — re-suspends and shows
 * the loading state. `loading.tsx` only fires on hard segment changes.
 *
 * The page shell (TopBar, SearchBar, chips, headline) renders synchronously
 * with the current params, so the user sees their query reflected
 * immediately while the new data is fetched.
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { q = "", tag } = await searchParams;
  const headline = buildHeadline(q, tag);

  return (
    <div className="flex flex-1 flex-col">
      <RecordLastResults q={q} tag={tag ?? ""} />
      <TopBar title="Results" />

      {/* Header rhythm: TopBar → SearchBar (24px, framing the bar away
          from the nav lockup) → Chips (16px, intra-section) → Section
          headline (24px, mirrors the TopBar gap to bookend the header
          zone). The 24/16/24 pattern reads as a distinct "header
          section" between the nav and the results body. */}
      <div className="px-6 pt-3">
        <SearchBar defaultValue={q} />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <div className="mt-4 px-6">
          <FilterChips />
        </div>
      </Suspense>

      <section className="flex flex-1 flex-col px-6 pt-6 pb-8">
        <h2 className="font-display text-[22px] font-semibold leading-tight text-ink">
          {headline}
        </h2>

        <Suspense
          key={`${q}::${tag ?? ""}`}
          fallback={<ResultsBodyLoading query={q} tag={tag ?? null} />}
        >
          <ResultsBody q={q} tag={tag} />
        </Suspense>
      </section>
    </div>
  );
}

/* --------------------------- data + render body -------------------------- */

async function ResultsBody({ q, tag }: { q: string; tag?: string }) {
  const recipes = await getProvider().search(q, { tag, limit: 8 });

  if (recipes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-start justify-center gap-1 pb-12">
        <p className="text-[14px] font-medium text-ink">
          Nothing matched.
        </p>
        <p className="max-w-[34ch] text-[13px] leading-relaxed text-stone">
          Try a broader search, or pick a mood from the chips above.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 text-[12px] text-stone">{pluralize(recipes.length, "result")}</p>

      <ul className="mt-4 flex flex-col gap-3">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeResultRow recipe={recipe} />
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------ loading body ----------------------------- */

function ResultsBodyLoading({
  query,
  tag,
}: {
  query: string;
  tag: string | null;
}) {
  return (
    <>
      <p
        className="mt-2 flex items-center gap-2 text-[12px] text-stone"
        role="status"
        aria-live="polite"
      >
        <PulseDot />
        {buildStatus(query, tag)}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <RecipeResultRowSkeleton delayMs={i * 80} />
          </li>
        ))}
      </ul>
    </>
  );
}

/* --------------------------------- copy --------------------------------- */

function buildHeadline(q: string, tag?: string): string {
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
