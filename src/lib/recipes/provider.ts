import type { Recipe, RecipeSummary } from "./types";

export interface SearchOptions {
  tag?: string;
  limit?: number;
}

/**
 * Provider abstraction. v1 uses `mockProvider`. To go live, implement the
 * same interface against an API route that performs real search +
 * extraction, then swap the import in the hooks.
 */
export interface RecipeProvider {
  search(query: string, options?: SearchOptions): Promise<RecipeSummary[]>;
  getRecipe(id: string): Promise<Recipe | null>;
}
