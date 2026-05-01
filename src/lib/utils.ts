import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Difficulty } from "@/lib/recipes/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Difficulty maps to one of the three semantic edible-warm tones.
 * Returned as a CSS var ref, so callers paint with `style={{ color: tone }}`
 * or pass it through to a swatch background.
 */
export function difficultyTone(d: Difficulty | string | undefined): string {
  switch (d) {
    case "Easy":
      return "var(--fg-easy)";
    case "Hard":
      return "var(--fg-hard)";
    case "Medium":
    default:
      return "var(--fg-medium)";
  }
}

/**
 * Step-section keyword → tone. Best-effort string match against common
 * recipe section names; unknown sections fall back to forest (the brand
 * anchor), which reads as "no special phase, just a step."
 */
export function sectionTone(section: string | undefined): string {
  if (!section) return "var(--fg-brand)";
  const s = section.toLowerCase();
  if (/(prep|mise|chop|marina|knead|mix the|prepare)/.test(s))
    return "var(--fg-section-prep)";
  if (/(cook|sear|fry|simmer|braise|boil|broil|bake|roast|saut|grill|stir-?fry|reduce|broth|stew|sauce)/.test(s))
    return "var(--fg-section-cook)";
  if (/(rest|cool|chill|set|prove|proof|rise|ferment)/.test(s))
    return "var(--fg-section-rest)";
  if (/(serve|plate|finish|garnish|assemble|to serve)/.test(s))
    return "var(--fg-section-serve)";
  return "var(--fg-brand)";
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function pluralize(
  count: number,
  singular: string,
  plural: string = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatSecondsAsClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
