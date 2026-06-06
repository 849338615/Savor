import type { Recipe, RecipeSummary } from "./types";

export interface SearchOptions {
  /** Selected filter tags. AND together; folded into the query string. */
  tags?: string[];
  limit?: number;
}

export interface SearchResult {
  recipes: RecipeSummary[];
  /**
   * The query the results are actually for, when it differs from what the user
   * typed — a spelling fix ("chiken"→"chicken") or a planner-normalized phrase.
   * Lets the UI show "Showing results for …". Absent when nothing changed.
   */
  correction?: string;
}

/**
 * Provider abstraction. v1 uses `mockProvider`. To go live, implement the
 * same interface against an API route that performs real search +
 * extraction, then swap the import in the hooks.
 */
export interface RecipeProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult>;
  getRecipe(id: string): Promise<Recipe | null>;
}
