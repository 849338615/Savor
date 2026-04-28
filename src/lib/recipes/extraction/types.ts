import type { AggregateRating } from "./jsonld";

/**
 * Structured ingredient produced by the extraction layer. Splitting the
 * line into `quantity`, `unit`, `name`, and `note` lets the UI render
 * the amount column cleanly and surface descriptors as muted secondary
 * text, instead of jamming everything into a single string.
 */
export interface ExtractedIngredient {
  quantity?: string;
  unit?: string;
  name: string;
  note?: string;
  optional?: boolean;
}

/**
 * Structured instruction. `section` is carried over from `HowToSection`
 * grouping in the source JSON-LD, so a multi-component recipe (dashi /
 * broth / eggs / assembly) keeps its natural structure instead of
 * collapsing into one flat list of 15 nameless steps.
 */
export interface ExtractedInstruction {
  section?: string;
  name?: string;
  text: string;
}

/**
 * The intermediate shape produced by the extraction layer, before being
 * mapped to the app's user-facing `Recipe` type. Keeps extraction-only
 * fields (rating, search rank, source) that we use for scoring but don't
 * surface verbatim in the UI.
 */
export interface ExtractedCandidate {
  url: string;
  source: string;
  searchRank: number;

  title: string;
  description?: string;
  image?: string;

  totalTimeMinutes?: number;
  servings?: number;

  ingredients: ExtractedIngredient[];
  instructions: ExtractedInstruction[];

  tags: string[];
  aggregateRating?: AggregateRating;

  /** Which path produced this — useful for debugging and observability. */
  via:
    | "json-ld"
    | "json-ld+normalized"
    | "json-ld+reconciled"
    | "microdata"
    | "microdata+normalized"
    | "llm"
    | "llm-unverified";
}
