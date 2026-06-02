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

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "meal",
    label: "Meal",
    options: [
      { label: "Breakfast", tag: "brunch" },
      { label: "Lunch", tag: "lunch" },
      { label: "Dinner", tag: "dinner" },
      { label: "Dessert", tag: "dessert" },
    ],
  },
  {
    id: "diet",
    label: "Diet",
    options: [
      { label: "Vegetarian", tag: "vegetarian" },
      { label: "Vegan", tag: "vegan" },
    ],
  },
  {
    id: "time",
    label: "Time & effort",
    options: [
      { label: "Quick", tag: "quick" },
      { label: "Light", tag: "light" },
      { label: "One-pan", tag: "one-pan" },
    ],
  },
  {
    id: "mood",
    label: "Mood",
    options: [
      { label: "Comfort", tag: "comfort" },
      { label: "Fresh", tag: "salad" },
    ],
  },
];

const ALL_OPTIONS: FilterOption[] = FILTER_GROUPS.flatMap((g) => g.options);

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
