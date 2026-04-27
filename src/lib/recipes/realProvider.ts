import type { RecipeProvider, SearchOptions } from "./provider";
import type {
  Recipe,
  RecipeSummary,
  Ingredient,
  Step,
  Difficulty,
} from "./types";
import { extractOne, searchAndExtractTopRecipes } from "./extraction";
import type { ExtractedCandidate, ExtractedIngredient } from "./extraction/types";
import type { ScoredCandidate } from "./extraction/scoring";
import { decodeRecipeId, encodeRecipeId, gradientIndexForUrl } from "./idEncoding";

/**
 * Real recipe provider — search + extract + score from the live web.
 *
 * Implements the same `RecipeProvider` interface as `mockProvider`, so pages
 * are agnostic to which one is in use. See `getProvider.ts` for the
 * env-driven selection.
 */
export const realProvider: RecipeProvider = {
  async search(query, options: SearchOptions = {}) {
    const limit = options.limit ?? 8;
    const tag = options.tag;

    // The real backend needs *something* to search for. Empty queries land
    // on the home grid; we substitute a generic seed so the user always sees
    // results on first load.
    const effectiveQuery =
      query.trim() ||
      [tag, "recipe ideas weeknight dinner"].filter(Boolean).join(" ");

    const scored = await searchAndExtractTopRecipes({
      query: effectiveQuery,
      tag,
      limit,
    });

    return scored.map(({ candidate }) =>
      toSummary(candidate, scoredRatingHint(scored, candidate)),
    );
  },

  async getRecipe(id) {
    const url = decodeRecipeId(id);
    if (!url) return null;
    // Detail page is the user-attention path: always normalize, regardless of
    // whether the heuristic gate would fire. Cached 24h via RECIPE_CACHE.
    const candidate = await extractOne(url, { forceNormalize: true });
    if (!candidate) return null;
    return toRecipe(candidate);
  },
};

/* ----------------------- candidate → app types ----------------------- */

function toSummary(c: ExtractedCandidate, _ratingHint: number): RecipeSummary {
  const id = encodeRecipeId(c.url);
  const ratingValue = c.aggregateRating?.ratingValue;
  const reviewCount =
    c.aggregateRating?.reviewCount ?? c.aggregateRating?.ratingCount;
  return {
    id,
    slug: id,
    title: c.title,
    source: c.source,
    sourceUrl: c.url,
    thumbnail: c.image,
    gradient: gradientIndexForUrl(c.url),
    totalMinutes: c.totalTimeMinutes ?? 0,
    difficulty: difficultyFromMinutes(c.totalTimeMinutes),
    tags: c.tags,
    summary: c.description,
    rating: ratingValue ? { ratingValue, reviewCount } : undefined,
  };
}

function toRecipe(c: ExtractedCandidate): Recipe {
  const summary = toSummary(c, 0);

  // Title rule:
  //   1. If a section is set, title becomes "<section> · Step <n-in-section>".
  //   2. Else if step.name is short and not a prefix of the body, use it.
  //   3. Else fall back to "Step <index>". Never truncate body text.
  let lastSection: string | undefined;
  let withinSection = 0;

  const steps: Step[] = c.instructions.map((inst, i) => {
    const index = i + 1;
    let title: string;

    if (inst.section) {
      if (inst.section !== lastSection) {
        lastSection = inst.section;
        withinSection = 1;
      } else {
        withinSection += 1;
      }
      title = `${inst.section} · Step ${withinSection}`;
    } else {
      lastSection = undefined;
      withinSection = 0;
      const name = inst.name?.trim();
      const usesGoodName =
        !!name &&
        name.length <= 60 &&
        !inst.text.toLowerCase().startsWith(name.toLowerCase());
      title = usesGoodName ? name! : `Step ${index}`;
    }

    return {
      id: `s${index}`,
      index,
      section: inst.section,
      title,
      instruction: inst.text.trim(),
    } satisfies Step;
  });

  return {
    ...summary,
    summary: c.description,
    servings: c.servings && c.servings > 0 ? c.servings : 4,
    ingredients: c.ingredients.map(toIngredient),
    steps,
  };
}

function toIngredient(i: ExtractedIngredient, idx: number): Ingredient {
  const amount = composeAmount(i);
  return {
    id: `i${idx + 1}`,
    quantity: i.quantity,
    unit: i.unit,
    name: i.name,
    note: i.note,
    optional: i.optional,
    amount,
  };
}

/** Build the legacy `amount` display string from `quantity` + `unit`. */
function composeAmount(i: ExtractedIngredient): string | undefined {
  const parts: string[] = [];
  if (i.quantity) parts.push(i.quantity);
  if (i.unit) parts.push(i.unit);
  const joined = parts.join(" ").trim();
  return joined || undefined;
}

function difficultyFromMinutes(m?: number): Difficulty {
  if (!m) return "Easy";
  if (m <= 30) return "Easy";
  if (m <= 75) return "Medium";
  return "Hard";
}

function scoredRatingHint(_all: ScoredCandidate[], _c: ExtractedCandidate): number {
  // Reserved — kept as an extension point for surfacing rating in the UI later.
  return 0;
}
