/**
 * Quality scoring for recipe candidates.
 *
 * The user-visible promise of Savor's "top 8" is that those eight are *good*
 * recipes — not just the first eight URLs Google returned. The score blends
 * three signals:
 *
 *   1. **Rating × reviews** — the strongest quality signal. A 4.9-star recipe
 *      with 3,000 reviews ranks higher than a 5.0 with 4. We use
 *      `ratingValue × log10(reviewCount + 1)` to reward reviews on a curve
 *      (going from 100 → 1000 reviews matters more than 10000 → 100000).
 *
 *   2. **Search-rank prior** — Google's organic ranking is itself a popularity
 *      signal. A small linear bonus for being in the top 10 results. Weighted
 *      lightly so a high-rated #20 result can still beat a low-rated #1.
 *
 *   3. **Domain authority** — boost recipes from sources known for editorial
 *      quality control (real testers, real photographers, copyeditors).
 *      Hard-disqualify scrape farms.
 *
 * On top of all that, recipes that fail completeness checks (no real
 * ingredients, no instructions) get a hard veto so the LLM/JSON-LD pipeline
 * doesn't poison results with shells.
 */

import type { ExtractedCandidate } from "./types";

export interface ScoredCandidate {
  candidate: ExtractedCandidate;
  score: number;
  /** Subscores for debugging / explainability. */
  parts: {
    ratingScore: number;
    rankScore: number;
    domainScore: number;
    completenessScore: number;
    relevanceScore: number;
  };
}

const TRUSTED_DOMAINS = new Set([
  "cooking.nytimes.com",
  "www.bonappetit.com",
  "bonappetit.com",
  "www.seriouseats.com",
  "seriouseats.com",
  "food52.com",
  "smittenkitchen.com",
  "ottolenghi.co.uk",
  "www.nigella.com",
  "nigella.com",
  "www.epicurious.com",
  "epicurious.com",
  "www.kingarthurbaking.com",
  "kingarthurbaking.com",
  "www.foodandwine.com",
  "foodandwine.com",
  "www.thekitchn.com",
  "thekitchn.com",
  "www.simplyrecipes.com",
  "simplyrecipes.com",
  "www.saveur.com",
  "saveur.com",
  "www.eater.com",
  "eater.com",
  "www.americastestkitchen.com",
  "americastestkitchen.com",
  "www.cookscountry.com",
  "cookscountry.com",
  "www.cooksillustrated.com",
  "cooksillustrated.com",
  "www.foodnetwork.com",
  "foodnetwork.com",
  "www.bbcgoodfood.com",
  "bbcgoodfood.com",
  "www.delish.com",
  "delish.com",
]);

const SOLID_DOMAINS = new Set([
  "www.allrecipes.com",
  "allrecipes.com",
  "www.tasteofhome.com",
  "tasteofhome.com",
  "www.foodandwine.com",
  "minimalistbaker.com",
  "www.minimalistbaker.com",
  "cookieandkate.com",
  "www.cookieandkate.com",
  "loveandlemons.com",
  "www.loveandlemons.com",
  "halfbakedharvest.com",
  "www.halfbakedharvest.com",
  "www.budgetbytes.com",
  "budgetbytes.com",
  "www.onceuponachef.com",
  "onceuponachef.com",
]);

/** Sites that should never make the cut — content farms, AI slop, low quality. */
const BLOCKED_DOMAINS = new Set([
  "pinterest.com",
  "www.pinterest.com",
  "youtube.com",
  "www.youtube.com",
  "tiktok.com",
  "www.tiktok.com",
  "reddit.com",
  "www.reddit.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
]);

export function isBlockedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.has(host);
  } catch {
    return true;
  }
}

export function scoreCandidate(
  c: ExtractedCandidate,
  queryTerms: string[] = [],
): ScoredCandidate | null {
  const completenessScore = scoreCompleteness(c);
  if (completenessScore < 0) return null; // hard veto

  const ratingScore = scoreRating(c);
  const rankScore = scoreRank(c.searchRank);
  const domainScore = scoreDomain(c.url);
  const relevanceScore = scoreRelevance(c, queryTerms);

  // Unverified LLM extractions get a soft penalty so a verified competitor
  // with the same base score wins. They still appear in results when nothing
  // better is available.
  const unverifiedPenalty = c.via === "llm-unverified" ? -3 : 0;

  const score =
    ratingScore +
    rankScore +
    domainScore +
    completenessScore +
    relevanceScore +
    unverifiedPenalty;
  return {
    candidate: c,
    score,
    parts: { ratingScore, rankScore, domainScore, completenessScore, relevanceScore },
  };
}

/* ------------------------------ query terms ------------------------------ */

/**
 * Words that are noise for relevance matching — search scaffolding and generic
 * qualifiers that appear in titles regardless of the dish.
 */
const QUERY_STOPWORDS = new Set([
  "recipe", "recipes", "the", "and", "for", "with", "without", "best",
  "easy", "quick", "homemade", "how", "make", "your", "good", "great",
  "from", "scratch", "simple", "classic", "perfect", "ultimate",
]);

/**
 * Reduce a free-text query to the content terms used for relevance scoring.
 * Drops punctuation, scaffolding words, and very short tokens. Capped so a
 * pathologically long query can't blow up scoring.
 */
export function parseQueryTerms(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !QUERY_STOPWORDS.has(t))
    .slice(0, 8);
}

/* --------------------------- subscore functions --------------------------- */

function scoreRating(c: ExtractedCandidate): number {
  const rv = c.aggregateRating?.ratingValue ?? 0;
  const rc =
    c.aggregateRating?.reviewCount ?? c.aggregateRating?.ratingCount ?? 0;
  if (!rv || !rc) {
    // Neutral if absent — many editorial sites (Bon Appétit, Smitten Kitchen)
    // intentionally don't expose review counts. Use the domain boost to
    // compensate for them rather than penalizing here.
    return 0;
  }
  // ratingValue is 0–5; log10(reviews + 1) is 0–~5 for typical sites
  // (10K reviews ≈ 4). So this score is roughly 0–25.
  return rv * Math.log10(rc + 1);
}

function scoreRank(searchRank: number): number {
  // Top 10 results get a small linear bonus, capped. Weighted so it's a
  // tie-breaker, not a primary driver.
  return Math.max(0, 10 - searchRank) * 0.4;
}

function scoreDomain(url: string): number {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (TRUSTED_DOMAINS.has(host)) return 4;
    if (SOLID_DOMAINS.has(host)) return 1.5;
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Reward candidates whose title (and, more weakly, tags/description) actually
 * match what was searched, and penalize a total miss. Rating-based scoring
 * alone is query-blind: a five-star recipe harvested from a mixed roundup
 * ("30 chicken dinners") could outrank the dish the user actually asked for.
 * This signal keeps results *on topic* — most important for phase-2 harvested
 * results, which aren't guaranteed relevant by the search engine.
 *
 * Neutral (0) when there's no query (tag-only / empty browse), so it never
 * penalizes the home grid.
 */
function scoreRelevance(c: ExtractedCandidate, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;

  const title = c.title.toLowerCase();
  const meta = `${c.tags.join(" ")} ${c.description ?? ""}`.toLowerCase();

  let inTitle = 0;
  let inMeta = 0;
  for (const term of queryTerms) {
    if (title.includes(term)) inTitle++;
    else if (meta.includes(term)) inMeta++;
  }

  // A candidate that matches the query nowhere is almost certainly off-topic
  // drift from a roundup — push it below anything that does match.
  if (inTitle === 0 && inMeta === 0) return -5;

  const n = queryTerms.length;
  return (inTitle / n) * 8 + (inMeta / n) * 2;
}

function scoreCompleteness(c: ExtractedCandidate): number {
  const hasIngredients = c.ingredients.length >= 3;
  const hasSteps = c.instructions.length >= 2;
  if (!hasIngredients || !hasSteps) return -1; // veto
  // Light bonus for fully-formed recipes
  let bonus = 0;
  if (c.totalTimeMinutes && c.totalTimeMinutes > 0) bonus += 0.5;
  if (c.servings && c.servings > 0) bonus += 0.3;
  if (c.image) bonus += 0.3;
  return bonus;
}
