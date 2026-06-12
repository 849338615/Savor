import { Suspense } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SearchBar } from "@/components/search/SearchBar";
import { ResultsFilterBar } from "@/components/search/ResultsFilterBar";
import { RecipeResultRow } from "@/components/results/RecipeResultRow";
import { RecordLastResults } from "@/components/results/RecordLastResults";
import { RecipeResultRowSkeleton } from "@/components/feedback/RecipeResultRowSkeleton";
import { PulseDot } from "@/components/feedback/PulseDot";
import { getProvider } from "@/lib/recipes/getProvider";
import { labelForTag, parseTags, serializeTags } from "@/lib/filters";
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
  const tags = parseTags(tag);
  const headline = buildHeadline(q, tags);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordLastResults q={q} tag={tag ?? ""} />
      <TopBar title="Results" />

      {/* Results body scrolls between the fixed TopBar and the bottom action
          zone. The headline rides with the list it titles. */}
      <section className="scroll-fade-bottom flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4 pt-5">
        <h2 className="font-display text-[22px] font-semibold leading-tight text-ink">
          {headline}
        </h2>

        <Suspense
          key={`${q}::${serializeTags(tags)}`}
          fallback={<ResultsBodyLoading query={q} tags={tags} />}
        >
          <ResultsBody q={q} tags={tags} />
        </Suspense>
      </section>

      {/* Bottom action zone — filter bar + search, anchored above the floating
          nav island. Mirrors the home layout so search lives in the same place
          across the app, always reachable rather than scrolling away up top. */}
      <section className="px-6 pb-5 pt-3">
        <Suspense fallback={<div className="h-10" />}>
          <ResultsFilterBar />
        </Suspense>
        <div className="pt-4">
          <SearchBar defaultValue={q} carryTags={tags} />
        </div>
      </section>
    </div>
  );
}

/* --------------------------- data + render body -------------------------- */

async function ResultsBody({ q, tags }: { q: string; tags: string[] }) {
  const { recipes, correction } = await getProvider().search(q, { tags, limit: 8 });

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
      <p className="mt-2 text-[12px] text-stone">
        {correction ? (
          <>
            Showing results for{" "}
            <span className="font-medium text-ink">{correction}</span>
            {" · "}
          </>
        ) : null}
        {pluralize(recipes.length, "result")}
      </p>

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
  tags,
}: {
  query: string;
  tags: string[];
}) {
  return (
    <>
      <p
        className="mt-2 flex items-center gap-2 text-[12px] text-stone"
        role="status"
        aria-live="polite"
      >
        <PulseDot />
        {buildStatus(query, tags)}
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
