import "server-only";

import { mockProvider } from "./mockProvider";
import { realProvider } from "./realProvider";
import type { RecipeProvider, SearchOptions } from "./provider";
import type { Recipe } from "./types";
import { decodeRecipeId } from "./idEncoding";

/**
 * Provider selection.
 *
 *   RECIPE_PROVIDER=real   → real provider (requires BRAVE_API_KEY or SERPAPI_KEY,
 *                            and ANTHROPIC_API_KEY for the LLM fallback)
 *   RECIPE_PROVIDER=mock   → mock provider (the in-repo dataset of 8 recipes)
 *   RECIPE_PROVIDER=auto   → real if a search key is set, else mock (default)
 *
 * The composite provider below also handles the cross-pollination case: if
 * the real provider is on but a user navigates to a mock-slug detail page
 * (e.g. from a saved recipe in their previous mock-mode session), it falls
 * back to the mock dataset transparently.
 */

function pickProvider(): RecipeProvider {
  const choice = (process.env.RECIPE_PROVIDER || "auto").toLowerCase();
  const hasSearchKey = !!(process.env.BRAVE_API_KEY || process.env.SERPAPI_KEY);
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  if (choice === "mock") return mockProvider;
  if (choice === "real") {
    if (!hasSearchKey) {
      throw new Error(
        "RECIPE_PROVIDER=real but no search key set. Set BRAVE_API_KEY or SERPAPI_KEY.",
      );
    }
    return wrapWithMockFallback(realProvider);
  }
  // auto
  if (hasSearchKey && hasAnthropicKey) return wrapWithMockFallback(realProvider);
  if (hasSearchKey && !hasAnthropicKey) {
    // Real search but no LLM key — still useful, just JSON-LD only.
    return wrapWithMockFallback(realProvider);
  }
  return mockProvider;
}

/**
 * Real provider with mock as a tail. Handles two real cases:
 *   - The recipe-detail page is hit with an id that isn't a base64url URL
 *     (i.e. an old mock slug): try mock first.
 *   - Real search returns zero candidates (rare, e.g. quota exhausted): fall
 *     back to mock so the user always sees something.
 */
function wrapWithMockFallback(real: RecipeProvider): RecipeProvider {
  return {
    async search(query: string, options?: SearchOptions) {
      try {
        const result = await real.search(query, options);
        if (result.recipes.length > 0) return result;
      } catch (err) {
        console.error("[getProvider] real search failed, falling back:", err);
      }
      return mockProvider.search(query, options);
    },

    async getRecipe(id: string): Promise<Recipe | null> {
      // Mock-style slug → mock first
      if (!decodeRecipeId(id)) {
        return mockProvider.getRecipe(id);
      }
      try {
        const recipe = await real.getRecipe(id);
        if (recipe) return recipe;
      } catch (err) {
        console.error("[getProvider] real getRecipe failed:", err);
      }
      return mockProvider.getRecipe(id);
    },
  };
}

let cached: RecipeProvider | null = null;

/**
 * Get the active recipe provider for this server. Lazily resolves on first
 * call so a misconfiguration surfaces only when something actually tries
 * to hit it (e.g. doesn't crash the build).
 */
export function getProvider(): RecipeProvider {
  if (!cached) cached = pickProvider();
  return cached;
}

/** Test seam — drops the cached provider so env changes take effect. */
export function _resetProvider() {
  cached = null;
}
