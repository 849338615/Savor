export type Difficulty = "Easy" | "Medium" | "Hard";

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  source: string;
  sourceUrl: string;
  thumbnail?: string;
  /** Index 0–7 into the design system's FOOD_GRADIENTS placeholder list. */
  gradient?: number;
  totalMinutes: number;
  difficulty: Difficulty;
  tags: string[];
  /** 1–2 sentence editorial summary, when available. */
  summary?: string;
  /** Schema.org aggregateRating, when the source publishes one. */
  rating?: {
    ratingValue: number;
    reviewCount?: number;
  };
}

export interface Ingredient {
  id: string;
  /** Numeric/fraction quantity, e.g. "2", "1/2", "1 1/2", "1-2". */
  quantity?: string;
  /** Unit drawn from a known allowlist, e.g. "cup", "tbsp", "g". Empty when the ingredient has no unit ("3 eggs", "16 dried shiitake mushrooms"). */
  unit?: string;
  name: string;
  /** Parenthetical or post-comma modifier surfaced as muted secondary text, e.g. "finely chopped", "about a 10\" square piece". */
  note?: string;
  optional?: boolean;
  /** Display string combining quantity + unit (e.g. "1/2 cup", "200g", "16"). Computed by `realProvider`; used by `scaleAmount` and the amount column in `IngredientItem`. */
  amount?: string;
}

export interface Step {
  id: string;
  index: number;
  /** Section name from a HowToSection grouping (e.g. "Dashi", "Broth"). */
  section?: string;
  title: string;
  instruction: string;
  durationSeconds?: number;
}

export interface Recipe extends RecipeSummary {
  summary?: string;
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
}

/**
 * Shape representing a recipe blob as it would be returned from a real
 * extraction pipeline before any structuring. Kept here so the parser
 * boundary is explicit and the mock and future-real paths share types.
 */
export interface RawRecipeBlob {
  sourceUrl: string;
  source: string;
  rawText: string;
  jsonLd?: unknown;
}
