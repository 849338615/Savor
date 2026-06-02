import { RECIPES } from "./mockData";
import type { RecipeProvider, SearchOptions } from "./provider";
import type { Recipe, RecipeSummary } from "./types";

function toSummary(r: Recipe): RecipeSummary {
  const {
    id,
    slug,
    title,
    source,
    sourceUrl,
    thumbnail,
    gradient,
    totalMinutes,
    difficulty,
    tags,
    summary,
  } = r;
  return {
    id,
    slug,
    title,
    source,
    sourceUrl,
    thumbnail,
    gradient,
    totalMinutes,
    difficulty,
    tags,
    summary,
  };
}

function score(recipe: Recipe, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  let s = 0;
  if (recipe.title.toLowerCase().includes(q)) s += 4;
  if (recipe.tags.some((t) => t.toLowerCase().includes(q))) s += 2;
  if (recipe.summary?.toLowerCase().includes(q)) s += 1;
  if (recipe.ingredients.some((i) => i.name.toLowerCase().includes(q))) s += 1;
  return s;
}

export const mockProvider: RecipeProvider = {
  async search(query, options: SearchOptions = {}) {
    const limit = options.limit ?? 8;
    const tags = (options.tags ?? []).map((t) => t.toLowerCase());

    // Every selected tag must be present (AND). No tags → all recipes.
    const candidates = tags.length
      ? RECIPES.filter((r) => {
          const recipeTags = r.tags.map((t) => t.toLowerCase());
          return tags.every((t) => recipeTags.includes(t));
        })
      : RECIPES;

    if (!query.trim()) {
      // No query — return top by tag (or all), preserving array order.
      return candidates.slice(0, limit).map(toSummary);
    }

    return candidates
      .map((r) => ({ r, s: score(r, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map(({ r }) => toSummary(r));
  },

  async getRecipe(id) {
    return RECIPES.find((r) => r.id === id || r.slug === id) ?? null;
  },
};
