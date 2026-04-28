import type { ExtractedCandidate } from "./types";

/* --------------------------- structural validation --------------------------- */

/**
 * Reject obviously-broken candidates at the extraction boundary so they
 * don't reach the UI. Returning false drops the candidate; the caller
 * pushes the URL into NEGATIVE_CACHE so the next-best search result wins.
 *
 * Better to show a different recipe than a mangled one.
 */
export function validateCandidate(c: ExtractedCandidate): boolean {
  if (!c.title || c.title.length < 4 || c.title.length > 200) return false;

  if (c.ingredients.length === 0 || c.ingredients.length > 60) return false;
  if (c.instructions.length === 0) return false;

  for (const ing of c.ingredients) {
    if (ing.name.includes("<")) return false;
  }

  let shortBodies = 0;
  for (const inst of c.instructions) {
    if (!inst.text) return false;
    if (inst.text.includes("<")) return false;
    if (
      /^(subscribe|sign up for|follow us|leave a comment|join our|click here)/i.test(
        inst.text,
      )
    ) {
      return false;
    }
    if (inst.text.length < 25) shortBodies += 1;
  }

  // Mostly-tiny instruction bodies almost always means we captured a list of
  // section labels rather than actual cooking steps.
  if (shortBodies / c.instructions.length > 0.5) return false;

  return true;
}

/* --------------------------- source-grounded coverage --------------------------- */

/**
 * Catches LLM hallucination: ingredient swaps from "you may also like" links,
 * dropped steps, paraphrased-from-training-data instructions. Programmatic
 * substring + token-overlap check; zero LLM cost.
 *
 *  - ingredient covered: ≥1 of the ingredient's last-3 content tokens appears
 *    in the page text (so "soy sauce" matches "low-sodium soy sauce").
 *  - step covered: ≥80% of the step's distinctive tokens (≥4 chars,
 *    non-stopword) appear in the page text.
 *
 * Returns coverage; caller decides drop vs. downgrade.
 */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "with",
  "into", "until", "from", "on", "at", "by",
  "very", "fresh", "ripe", "cold", "hot", "small", "medium", "large",
  "about", "approximately", "roughly", "preferably", "plus", "more",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function ingredientHeadwords(name: string): string[] {
  // Last 3 content tokens anchor the substring search.
  return tokens(name).slice(-3);
}

export interface CoverageResult {
  ingredientsCovered: number;
  stepsCovered: number;
  passed: boolean;
}

export function verifyAgainstSource(
  c: ExtractedCandidate,
  pageText: string,
): CoverageResult {
  const haystack = pageText.toLowerCase();

  let ingHits = 0;
  for (const ing of c.ingredients) {
    const words = ingredientHeadwords(ing.name);
    if (words.length === 0 || words.some((w) => haystack.includes(w))) ingHits++;
  }
  const ingredientsCovered =
    c.ingredients.length === 0 ? 0 : ingHits / c.ingredients.length;

  let stepHits = 0;
  for (const inst of c.instructions) {
    const stepTokens = tokens(inst.text).filter((t) => t.length >= 4);
    if (stepTokens.length === 0) {
      stepHits++; // very short step — trust it
      continue;
    }
    const present = stepTokens.filter((t) => haystack.includes(t)).length;
    if (present / stepTokens.length >= 0.8) stepHits++;
  }
  const stepsCovered =
    c.instructions.length === 0 ? 0 : stepHits / c.instructions.length;

  // Pass thresholds: ingredients ≥0.85, steps ≥0.75. Steps are tolerated
  // lower because LLM may legitimately combine fragments.
  const passed = ingredientsCovered >= 0.85 && stepsCovered >= 0.75;
  return { ingredientsCovered, stepsCovered, passed };
}
