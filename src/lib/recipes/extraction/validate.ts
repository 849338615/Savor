import type { ExtractedCandidate } from "./types";

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
