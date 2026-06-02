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
import { parseJsonLdRecipe, type RawJsonLdRecipe } from "./jsonld";
import { extractRecipeWithLlm } from "./llmExtractor";
import { parseMicrodataRecipe } from "./microdata";
import {
  isIngredientSectionHeader,
  parseIngredientLine,
} from "./parseIngredient";
import {
  needsNormalization,
  normalizeCandidate,
  shouldReconcileWithPageText,
} from "./normalize";
import { isBlockedDomain, scoreCandidate, type ScoredCandidate } from "./scoring";
import { searchWebUrls, type SearchHit } from "./search";
import { TtlCache } from "./cache";
import type { ExtractedCandidate, ExtractedIngredient } from "./types";
import { validateCandidate, verifyAgainstSource } from "./validate";

const SEARCH_CACHE = new TtlCache<ScoredCandidate[]>(64, 5 * 60 * 1000); // 5 min
const RECIPE_CACHE = new TtlCache<ExtractedCandidate>(256, 24 * 60 * 60 * 1000); // 24 h
const NEGATIVE_CACHE = new TtlCache<true>(512, 15 * 60 * 1000); // 15 min — don't re-burn LLM calls on URLs that just failed

const CONCURRENCY = 6;

export interface SearchAndExtractOpts {
  query: string;
  tags?: string[];
  limit?: number;
  candidateCount?: number;
  /** Set to false to skip LLM fallback (JSON-LD only). */
  allowLlmFallback?: boolean;
}

export async function searchAndExtractTopRecipes(
  opts: SearchAndExtractOpts,
): Promise<ScoredCandidate[]> {
  const limit = opts.limit ?? 8;
  const tags = opts.tags ?? [];
  const cacheKey = `${opts.query}::${tags.join(",")}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached) return cached.slice(0, limit);

  const hits = await searchWebUrls({
    query: opts.query,
    tags,
    candidateCount: opts.candidateCount ?? 30,
  });

  const filteredHits = hits.filter((h) => !isBlockedDomain(h.url));

  const candidates = await mapWithConcurrency(
    filteredHits,
    CONCURRENCY,
    (hit) => extractFromHit(hit, opts.allowLlmFallback ?? true, false),
  );

  // Two different search hits can resolve to the same canonical URL — Google
  // sometimes lists a tracking-suffixed URL alongside the bare one, and any
  // redirect chain (`/r/abc` → final post) collapses post-extraction. Without
  // a dedup pass, the UI ends up rendering two `<li>`s with the same
  // `recipe.id` and React rightly complains about duplicate keys. Keep the
  // highest-scoring copy of each canonical URL.
  const byUrl = new Map<string, ScoredCandidate>();
  for (const c of candidates) {
    if (!c) continue;
    const scored = scoreCandidate(c);
    if (!scored) continue;
    const existing = byUrl.get(scored.candidate.url);
    if (!existing || scored.score > existing.score) {
      byUrl.set(scored.candidate.url, scored);
    }
  }
  const scored = Array.from(byUrl.values()).sort((a, b) => b.score - a.score);

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
     * @deprecated Retained for API stability. The `needsNormalization` gate
     * is now the single source of truth on both search and detail paths;
     * this flag has no effect.
     */
    forceNormalize?: boolean;
  } = {},
): Promise<ExtractedCandidate | null> {
  if (isBlockedDomain(url)) return null;

  const cached = RECIPE_CACHE.get(url);
  if (cached) {
    // If the cache holds a raw JSON-LD candidate that the gate would NOW flag
    // (e.g., because the gate has been extended since extraction time, or the
    // candidate has artifacts the search-path gate missed), upgrade in place.
    // No upgrade is run when the cached candidate is already clean.
    if (cached.via === "json-ld" && needsNormalization(cached)) {
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
  // forceNormalize is deprecated/ignored; gate decides on both paths.
  return extractFromHit(hit, opts.allowLlmFallback ?? true, false);
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
    const candidate = buildCandidateFromStructured({
      rec: jsonLd,
      canonical,
      source,
      searchRank: hit.rank,
      hitTitle: hit.title,
      ogImage,
      html,
      via: "json-ld",
    });
    return await finalizeStructured(candidate, html, hit.url, canonical, forceNormalize);
  }

  // Second-tier structured: HTML5 microdata (older blogs, classic WP Recipe Maker).
  const microdata = parseMicrodataRecipe(html);
  if (
    microdata &&
    microdata.ingredients.length >= 3 &&
    microdata.instructions.length >= 2
  ) {
    const candidate = buildCandidateFromStructured({
      rec: microdata,
      canonical,
      source,
      searchRank: hit.rank,
      hitTitle: hit.title,
      ogImage,
      html,
      via: "microdata",
    });
    return await finalizeStructured(candidate, html, hit.url, canonical, forceNormalize);
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

    // Source-grounded coverage check. The LLM may hallucinate a quantity,
    // drop a step, or pull an ingredient from a "you may also like" carousel.
    // If coverage is poor: drop hard on the detail path (the user is looking
    // at one recipe and we shouldn't show garbage); on the search path,
    // downgrade to "llm-unverified" so a verified competitor wins in scoring.
    const coverage = verifyAgainstSource(candidate, text);
    if (!coverage.passed) {
      if (
        forceNormalize &&
        (coverage.ingredientsCovered < 0.5 || coverage.stepsCovered < 0.5)
      ) {
        NEGATIVE_CACHE.set(hit.url, true);
        return null;
      }
      candidate.via = "llm-unverified";
    }

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

/* ----------------- structured-data helpers (JSON-LD + microdata) ----------------- */

interface StructuredBuildOpts {
  rec: RawJsonLdRecipe;
  canonical: string;
  source: string;
  searchRank: number;
  hitTitle: string;
  ogImage?: string;
  html: string;
  via: "json-ld" | "microdata";
}

function buildCandidateFromStructured(o: StructuredBuildOpts): ExtractedCandidate {
  return {
    url: o.canonical,
    source: o.source,
    searchRank: o.searchRank,
    title: cleanRecipeTitle(o.rec.name ?? extractPageTitle(o.html) ?? o.hitTitle),
    description: o.rec.description,
    image: o.rec.image ?? o.ogImage,
    totalTimeMinutes:
      o.rec.totalTimeMinutes ??
      sumDefined(o.rec.prepTimeMinutes, o.rec.cookTimeMinutes),
    servings: o.rec.recipeYield,
    ingredients: o.rec.ingredients,
    instructions: o.rec.instructions,
    tags: deriveTags({
      category: o.rec.category,
      cuisine: o.rec.cuisine,
      keywords: o.rec.keywords,
    }),
    aggregateRating: o.rec.aggregateRating,
    via: o.via,
  };
}

async function finalizeStructured(
  candidate: ExtractedCandidate,
  html: string,
  hitUrl: string,
  canonical: string,
  _forceNormalize: boolean,
): Promise<ExtractedCandidate | null> {
  // Cleanup pass:
  //   - Conditionally via the `needsNormalization` gate. The gate covers
  //     dirty strings, parser artifacts, lost section grouping, etc. — i.e.
  //     anything an LLM cleanup would actually fix. If the gate says no, the
  //     output is already clean and an LLM call is wasted.
  //   - On known-messy hosts (RecipeTinEats, Half Baked Harvest, Pioneer
  //     Woman, …) or when the structured data itself looks broken
  //     (`shouldReconcileWithPageText`), pass the page text as a
  //     reconciliation source so the normalizer can fix wrong/lossy fields
  //     against the actual recipe content.
  // (`_forceNormalize` retained in the signature for API stability; the
  // gate now decides on both search and detail paths.)
  const reconcile =
    candidate.via === "json-ld" &&
    shouldReconcileWithPageText(candidate, canonical);

  if (needsNormalization(candidate) || reconcile) {
    try {
      const pageText = reconcile ? extractReadableText(html) : undefined;
      const normalized = await normalizeCandidate(candidate, pageText);
      candidate.title = normalized.title || candidate.title;
      candidate.ingredients = normalized.ingredients;
      candidate.instructions = normalized.instructions;
      candidate.via = reconcile
        ? "json-ld+reconciled"
        : candidate.via === "microdata"
          ? "microdata+normalized"
          : "json-ld+normalized";
    } catch {
      /* keep raw — never fail extraction on normalization error */
    }
  }

  if (!validateCandidate(candidate)) {
    NEGATIVE_CACHE.set(hitUrl, true);
    return null;
  }

  RECIPE_CACHE.set(canonical, candidate);
  return candidate;
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
    // Trailer ending in ! or ? after en/em-dash or pipe (no hyphen here, since
    // hyphens commonly appear inside compound recipe terms — Pan-Sear,
    // Stir-Fry, Sous-Vide, Air-Fried, Slow-Cook).
    .replace(/\s*[\|–—]\s*[^\|–—]+[!?]\s*$/, "")
    // Same trailer pattern with a regular hyphen — but ONLY when the hyphen has
    // real whitespace on both sides ("Steak - Like a Chef!"), so we don't eat
    // half a compound word ("Pan-Sear Steak").
    .replace(/\s+-\s+[^-]+[!?]\s*$/, "")
    // Trailer after en/em-dash or pipe with non-empty suffix (site name).
    .replace(/\s*[\|–—]\s*[^\|–—]{2,40}$/, "")
    // " - SiteName" with uppercase suffix. Same whitespace rule as above:
    // require real spaces around the hyphen so compound words survive.
    .replace(/\s+-\s+[A-Z][^-]{2,40}$/, "")
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
