/**
 * Filter taxonomy shared by the home and results filter panels.
 *
 * Tags are the durable identifier carried in the `tag` URL param (comma-joined)
 * and folded into the search query. Values overlap the mock dataset's tags
 * (see `recipes/mockData.ts`) so mock-mode filtering returns hits; the real
 * provider appends any label to the search string, so all values work live.
 *
 * Client-safe — no `server-only` import — because the filter UI is a client
 * component and the results page reads these helpers server-side too.
 */

export interface FilterOption {
  label: string;
  tag: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

/**
 * Groups are ordered the way people actually narrow a craving:
 * occasion → cuisine → dietary constraints → effort → vibe. Each tag is a
 * search-friendly token (folded into the web query) that also overlaps the
 * mock dataset where possible.
 */
export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "meal",
    label: "Meal",
    options: [
      { label: "Breakfast", tag: "brunch" },
      { label: "Lunch", tag: "lunch" },
      { label: "Dinner", tag: "dinner" },
      { label: "Snack", tag: "snack" },
      { label: "Dessert", tag: "dessert" },
    ],
  },
  {
    id: "cuisine",
    label: "Cuisine",
    options: [
      { label: "Italian", tag: "italian" },
      { label: "Mexican", tag: "mexican" },
      { label: "Asian", tag: "asian" },
      { label: "Mediterranean", tag: "mediterranean" },
      { label: "Indian", tag: "indian" },
    ],
  },
  {
    id: "diet",
    label: "Diet",
    options: [
      { label: "Vegetarian", tag: "vegetarian" },
      { label: "Vegan", tag: "vegan" },
      { label: "Gluten-free", tag: "gluten-free" },
      { label: "Dairy-free", tag: "dairy-free" },
      { label: "High-protein", tag: "high-protein" },
    ],
  },
  {
    id: "time",
    label: "Time & effort",
    options: [
      { label: "Quick", tag: "quick" },
      { label: "5-ingredient", tag: "5-ingredient" },
      { label: "One-pan", tag: "one-pan" },
      { label: "Make-ahead", tag: "make-ahead" },
      { label: "Light", tag: "light" },
    ],
  },
  {
    id: "mood",
    label: "Mood",
    options: [
      { label: "Comfort", tag: "comfort" },
      { label: "Fresh", tag: "salad" },
      { label: "Healthy", tag: "healthy" },
      { label: "Spicy", tag: "spicy" },
    ],
  },
];

const ALL_OPTIONS: FilterOption[] = FILTER_GROUPS.flatMap((g) => g.options);

/**
 * The "Diet" group, surfaced on its own so the standing dietary-preferences
 * setting and the per-search filter panel share one taxonomy — saved
 * preferences carry the same search tags the filters already use.
 */
export const DIET_OPTIONS: FilterOption[] =
  FILTER_GROUPS.find((g) => g.id === "diet")?.options ?? [];

/** Parse the comma-joined `tag` URL param into a clean list of tags. */
export function parseTags(param?: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Serialize selected tags back into the comma-joined URL value. */
export function serializeTags(tags: string[]): string {
  return tags.join(",");
}

/** Human label for a tag (falls back to the tag itself for unknowns). */
export function labelForTag(tag: string): string {
  return ALL_OPTIONS.find((o) => o.tag === tag)?.label ?? tag;
}
