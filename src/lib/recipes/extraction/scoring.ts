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

export function scoreCandidate(c: ExtractedCandidate): ScoredCandidate | null {
  const completenessScore = scoreCompleteness(c);
  if (completenessScore < 0) return null; // hard veto

  const ratingScore = scoreRating(c);
  const rankScore = scoreRank(c.searchRank);
  const domainScore = scoreDomain(c.url);

  const score = ratingScore + rankScore + domainScore + completenessScore;
  return {
    candidate: c,
    score,
    parts: { ratingScore, rankScore, domainScore, completenessScore },
  };
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
