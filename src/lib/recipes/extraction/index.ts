/**
 * Recipe extraction orchestrator.
 *
 *   search query
 *      ├── searchWebUrls       → 30 candidate URLs, ranked by Google
 *      │
 *      ├── for each (parallel, capped concurrency):
 *      │     ├── fetchHtml
 *      │     ├── parseJsonLdRecipe   ── if found, done (the fast path)
 *      │     └── extractRecipeWithLlm ── otherwise, ask Claude
 *      │
 *      ├── scoreCandidate     → drop incomplete / blocked, rank by quality
 *      └── return top 8
 *
 * Single-recipe extraction (`extractOne`) is the same per-URL pipeline,
 * exposed for the recipe-detail route.
 */
import {
  extractCanonicalUrl,
  extractOgImage,
  extractPageTitle,
  extractReadableText,
  fetchHtml,
} from "./fetch";
import { parseJsonLdRecipe } from "./jsonld";
import { extractRecipeWithLlm } from "./llmExtractor";
import {
  isIngredientSectionHeader,
  parseIngredientLine,
} from "./parseIngredient";
import { needsNormalization, normalizeCandidate } from "./normalize";
import { isBlockedDomain, scoreCandidate, type ScoredCandidate } from "./scoring";
import { searchWebUrls, type SearchHit } from "./search";
import { TtlCache } from "./cache";
import type { ExtractedCandidate, ExtractedIngredient } from "./types";
import { validateCandidate } from "./validate";

const SEARCH_CACHE = new TtlCache<ScoredCandidate[]>(64, 5 * 60 * 1000); // 5 min
const RECIPE_CACHE = new TtlCache<ExtractedCandidate>(256, 24 * 60 * 60 * 1000); // 24 h
const NEGATIVE_CACHE = new TtlCache<true>(512, 15 * 60 * 1000); // 15 min — don't re-burn LLM calls on URLs that just failed

const CONCURRENCY = 6;

export interface SearchAndExtractOpts {
  query: string;
  tag?: string;
  limit?: number;
  candidateCount?: number;
  /** Set to false to skip LLM fallback (JSON-LD only). */
  allowLlmFallback?: boolean;
}

export async function searchAndExtractTopRecipes(
  opts: SearchAndExtractOpts,
): Promise<ScoredCandidate[]> {
  const limit = opts.limit ?? 8;
  const cacheKey = `${opts.query}::${opts.tag ?? ""}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached) return cached.slice(0, limit);

  const hits = await searchWebUrls({
    query: opts.query,
    tag: opts.tag,
    candidateCount: opts.candidateCount ?? 30,
  });

  const filteredHits = hits.filter((h) => !isBlockedDomain(h.url));

  const candidates = await mapWithConcurrency(
    filteredHits,
    CONCURRENCY,
    (hit) => extractFromHit(hit, opts.allowLlmFallback ?? true, false),
  );

  const scored = candidates
    .filter((c): c is ExtractedCandidate => c !== null)
    .map(scoreCandidate)
    .filter((s): s is ScoredCandidate => s !== null)
    .sort((a, b) => b.score - a.score);

  SEARCH_CACHE.set(cacheKey, scored);
  return scored.slice(0, limit);
}

/**
 * Extract one recipe by URL — the same pipeline as the search path, used
 * for the recipe-detail page.
 */
export async function extractOne(
  url: string,
  opts: {
    searchRank?: number;
    allowLlmFallback?: boolean;
    /**
     * Always run the LLM normalizer regardless of the heuristic gate.
     * Used by the recipe-detail path where the user is paying close attention
     * and a small per-open Haiku cost (cached 24h) is worth predictable polish.
     */
    forceNormalize?: boolean;
  } = {},
): Promise<ExtractedCandidate | null> {
  if (isBlockedDomain(url)) return null;

  const forceNormalize = opts.forceNormalize ?? false;

  const cached = RECIPE_CACHE.get(url);
  if (cached) {
    // If the cache holds a raw JSON-LD candidate from an earlier search-path
    // extraction (gate didn't fire) and we now want forced normalization
    // (detail path), upgrade the cached entry in place.
    if (forceNormalize && cached.via === "json-ld") {
      try {
        const normalized = await normalizeCandidate(cached);
        cached.title = normalized.title || cached.title;
        cached.ingredients = normalized.ingredients;
        cached.instructions = normalized.instructions;
        cached.via = "json-ld+normalized";
        RECIPE_CACHE.set(url, cached);
      } catch {
        /* fall through with un-normalized cache hit */
      }
    }
    return cached;
  }
  if (NEGATIVE_CACHE.get(url)) return null;

  const hit: SearchHit = {
    url,
    title: "",
    snippet: "",
    rank: opts.searchRank ?? 99,
  };
  return extractFromHit(hit, opts.allowLlmFallback ?? true, forceNormalize);
}

/* ------------------------------ pipeline core ----------------------------- */

async function extractFromHit(
  hit: SearchHit,
  allowLlmFallback: boolean,
  forceNormalize: boolean,
): Promise<ExtractedCandidate | null> {
  const cached = RECIPE_CACHE.get(hit.url);
  if (cached) return cached;
  if (NEGATIVE_CACHE.get(hit.url)) return null;

  let html: string;
  try {
    html = await fetchHtml(hit.url);
  } catch {
    NEGATIVE_CACHE.set(hit.url, true);
    return null;
  }

  const canonical = extractCanonicalUrl(html, hit.url);
  const ogImage = extractOgImage(html);
  const source = sourceNameFromUrl(canonical);

  // Fast path: structured JSON-LD
  const jsonLd = parseJsonLdRecipe(html);
  if (
    jsonLd &&
    jsonLd.ingredients.length >= 3 &&
    jsonLd.instructions.length >= 2
  ) {
    const candidate: ExtractedCandidate = {
      url: canonical,
      source,
      searchRank: hit.rank,
      title: cleanRecipeTitle(jsonLd.name ?? extractPageTitle(html) ?? hit.title),
      description: jsonLd.description,
      image: jsonLd.image ?? ogImage,
      totalTimeMinutes:
        jsonLd.totalTimeMinutes ??
        sumDefined(jsonLd.prepTimeMinutes, jsonLd.cookTimeMinutes),
      servings: jsonLd.recipeYield,
      ingredients: jsonLd.ingredients,
      instructions: jsonLd.instructions,
      tags: deriveTags({
        category: jsonLd.category,
        cuisine: jsonLd.cuisine,
        keywords: jsonLd.keywords,
      }),
      aggregateRating: jsonLd.aggregateRating,
      via: "json-ld",
    };

    // Cleanup pass: always on the detail path (forceNormalize), gated on the
    // search path. The gate is a heuristic and misses real-world quirks
    // (footnote-style "(Note 1)" refs, dual-unit amounts) — the detail path
    // always normalizes so the user-attention surface stays polished.
    if (forceNormalize || needsNormalization(candidate)) {
      try {
        const normalized = await normalizeCandidate(candidate);
        candidate.title = normalized.title || candidate.title;
        candidate.ingredients = normalized.ingredients;
        candidate.instructions = normalized.instructions;
        candidate.via = "json-ld+normalized";
      } catch {
        /* keep raw — never fail extraction on normalization error */
      }
    }

    if (!validateCandidate(candidate)) {
      NEGATIVE_CACHE.set(hit.url, true);
      return null;
    }

    RECIPE_CACHE.set(canonical, candidate);
    return candidate;
  }

  // Slow path: LLM
  if (!allowLlmFallback) {
    NEGATIVE_CACHE.set(hit.url, true);
    return null;
  }
  try {
    const text = extractReadableText(html);
    const llm = await extractRecipeWithLlm(canonical, text);
    if (!llm || llm.ingredients.length < 3 || llm.instructions.length < 2) {
      NEGATIVE_CACHE.set(hit.url, true);
      return null;
    }
    const ingredients: ExtractedIngredient[] = [];
    for (const raw of llm.ingredients) {
      if (!raw) continue;
      if (isIngredientSectionHeader(raw)) continue;
      const parsed = parseIngredientLine(raw, ingredients.length);
      if (parsed.name) ingredients.push(parsed);
    }
    const candidate: ExtractedCandidate = {
      url: canonical,
      source,
      searchRank: hit.rank,
      title: cleanRecipeTitle(llm.title || extractPageTitle(html) || hit.title),
      description: llm.description,
      image: ogImage,
      totalTimeMinutes: llm.totalTimeMinutes,
      servings: llm.servings,
      ingredients,
      instructions: llm.instructions,
      tags: llm.tags,
      aggregateRating: llm.rating
        ? {
            ratingValue: llm.rating.ratingValue,
            reviewCount: llm.rating.reviewCount,
          }
        : undefined,
      via: "llm",
    };

    if (!validateCandidate(candidate)) {
      NEGATIVE_CACHE.set(hit.url, true);
      return null;
    }

    RECIPE_CACHE.set(canonical, candidate);
    return candidate;
  } catch {
    NEGATIVE_CACHE.set(hit.url, true);
    return null;
  }
}

/**
 * Strip site decorations and marketing trailers from titles.
 *   "Best Homemade Ramen Recipe | Bon Appétit"  → "Best Homemade Ramen"
 *   "How to cook steak – like a chef!"          → "How to cook steak"
 *   "Title - SiteName"                          → "Title"
 *
 * The recipe-name alone is what we want.
 */
function cleanRecipeTitle(t: string): string {
  return t
    // Trailer ending in ! or ? after any dash/pipe — almost always marketing.
    .replace(/\s*[\|–—\-]\s*[^\|–—\-]+[!?]\s*$/, "")
    // Trailer after en/em-dash or pipe with non-empty suffix (site name).
    .replace(/\s*[\|–—]\s*[^\|–—]{2,40}$/, "")
    // " - SiteName" with uppercase suffix.
    .replace(/\s*-\s*[A-Z][^-]{2,40}$/, "")
    // Trailing " Recipe" / " (Easy)" / " (Quick)" cruft.
    .replace(/\s+Recipe\s*$/i, "")
    .replace(/\s*\((?:easy|quick|simple|best|ultimate)\)\s*$/i, "")
    .trim();
}

/* ---------------------------- support helpers ---------------------------- */

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function sumDefined(...vals: (number | undefined)[]): number | undefined {
  const defined = vals.filter((v): v is number => typeof v === "number" && v > 0);
  if (defined.length === 0) return undefined;
  return defined.reduce((a, b) => a + b, 0);
}

function sourceNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return SOURCE_PRETTY[host] ?? host;
  } catch {
    return "the web";
  }
}

const SOURCE_PRETTY: Record<string, string> = {
  "cooking.nytimes.com": "NYT Cooking",
  "bonappetit.com": "Bon Appétit",
  "seriouseats.com": "Serious Eats",
  "food52.com": "Food52",
  "smittenkitchen.com": "Smitten Kitchen",
  "ottolenghi.co.uk": "Ottolenghi",
  "nigella.com": "Nigella",
  "epicurious.com": "Epicurious",
  "kingarthurbaking.com": "King Arthur Baking",
  "foodandwine.com": "Food & Wine",
  "thekitchn.com": "The Kitchn",
  "simplyrecipes.com": "Simply Recipes",
  "saveur.com": "Saveur",
  "americastestkitchen.com": "America's Test Kitchen",
  "foodnetwork.com": "Food Network",
  "bbcgoodfood.com": "BBC Good Food",
  "delish.com": "Delish",
  "minimalistbaker.com": "Minimalist Baker",
  "cookieandkate.com": "Cookie + Kate",
  "loveandlemons.com": "Love & Lemons",
  "halfbakedharvest.com": "Half Baked Harvest",
  "budgetbytes.com": "Budget Bytes",
  "onceuponachef.com": "Once Upon a Chef",
  "allrecipes.com": "Allrecipes",
};

const TAG_VOCAB = new Set([
  "vegetarian", "vegan", "gluten-free", "dairy-free", "quick", "easy",
  "weeknight", "weekend", "pasta", "soup", "salad", "rice", "noodles",
  "sandwich", "dessert", "baking", "breakfast", "brunch", "lunch", "dinner",
  "side", "appetizer", "snack", "comfort", "light", "one-pan", "sheet-pan",
  "slow-cooker", "instant-pot", "grilling", "asian", "italian", "mexican",
  "indian", "french", "middle-eastern", "mediterranean", "american",
  "bread", "chicken", "beef", "pork", "seafood", "fish",
]);

function deriveTags(input: {
  category?: string[];
  cuisine?: string[];
  keywords?: string[];
}): string[] {
  const all = [
    ...(input.category ?? []),
    ...(input.cuisine ?? []),
    ...(input.keywords ?? []),
  ];
  const out = new Set<string>();
  for (const raw of all) {
    const slug = raw
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (TAG_VOCAB.has(slug)) out.add(slug);
  }
  return Array.from(out).slice(0, 6);
}
