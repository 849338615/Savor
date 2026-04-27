import Anthropic from "@anthropic-ai/sdk";
import { looksDirty } from "@/lib/text/decode";
import type {
  ExtractedCandidate,
  ExtractedIngredient,
  ExtractedInstruction,
} from "./types";

/**
 * Quality-gated LLM normalization for JSON-LD candidates.
 *
 * The fast path (`parseJsonLdRecipe`) handles 90% of the work for free, but
 * dirty sources still leak through: residual HTML entities, missing step
 * grouping on multi-component recipes, oddly-split ingredient lines, and
 * page-title cruft. Rather than blindly running an LLM on every recipe (cost
 * + latency hit on already-clean NYT / Bon Appétit / Serious Eats), the
 * gate decides whether the candidate would actually benefit.
 *
 * Uses Claude Haiku 4.5 — extraction is a structured task and the smaller
 * model handles it cheaply. Cached upstream by canonical URL for 24h, so
 * a recipe is normalized at most once per server instance per day.
 */

const NORMALIZE_MODEL =
  process.env.RECIPE_NORMALIZE_MODEL || "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set — required for recipe normalization.",
    );
  }
  _client = new Anthropic();
  return _client;
}

/**
 * Returns true when the candidate's data looks messy enough to warrant a
 * Haiku cleanup. Each condition catches one of the visible UX bugs:
 *   - dirty strings (residual entities/tags)
 *   - 12+ flat steps (multi-component recipe lost its sections)
 *   - section labels embedded in ingredient lines
 *   - very long titles (site decorations not stripped)
 *   - very long step bodies with no internal sentence boundary
 */
export function needsNormalization(c: ExtractedCandidate): boolean {
  if (looksDirty(c.title)) return true;
  if (c.title.length > 90) return true;

  for (const ing of c.ingredients) {
    if (looksDirty(ing.name) || (ing.note && looksDirty(ing.note))) return true;
    if (/^for (?:the )?[^:]{2,40}:?\s*$/i.test(ing.name)) return true;
  }

  let untitledLong = 0;
  let withSection = 0;
  for (const inst of c.instructions) {
    if (looksDirty(inst.text)) return true;
    if (inst.section) withSection += 1;
    if (!inst.section && !inst.name && inst.text.length > 220 && !/[.!?]\s+[A-Z]/.test(inst.text)) {
      untitledLong += 1;
    }
  }

  if (c.instructions.length >= 12 && withSection === 0) return true;
  if (untitledLong >= 3) return true;

  return false;
}

/* --------------------------------- prompt --------------------------------- */

const SYSTEM_PROMPT = `You normalize recipe data that has already been extracted from a webpage's JSON-LD. Your job is to clean and structure it — NOT to invent or rewrite content.

You always return JSON conforming to the provided schema. Input is a partially-cleaned recipe candidate (title, ingredient lines, instruction objects). Output is a polished version with the same content.

# Rules

**title**
Strip site decorations and marketing trailers. Keep the recipe name only.
  - "Best Homemade Ramen Recipe | Bon Appétit" → "Best Homemade Ramen"
  - "How to cook steak – like a chef!" → "How to cook steak"
  - "The best chocolate chip cookies you'll ever make" → "The best chocolate chip cookies"
  - "Crispy Chicken Thighs - The Modern Proper" → "Crispy Chicken Thighs"
Strip suffixes that begin after a dash/em-dash/pipe AND end with "!" or "?", and suffixes that look like a site/author name. Strip "Recipe" / "(Easy)" / "(Quick)" tails.

**ingredients** — array of structured objects { quantity?, unit?, name, note?, optional? }
For each input ingredient line, split into:
  - quantity: numeric quantity verbatim from source ("1/2", "1 1/2", "200", "16", "1-2", "to taste"). Do NOT translate fractions or convert units.
  - unit: ONLY when the unit is one of: cup, cups, tbsp, tablespoon, tablespoons, tsp, teaspoon, teaspoons, oz, ounce, ounces, lb, pound, pounds, g, gram, grams, kg, ml, l, liter, pinch, dash, drop, clove, cloves, can, jar, package, slice, piece, bunch, sprig, head, stick, stalk, sheet, fillet, knob, handful, quart, pint, gallon. Otherwise leave unit empty (e.g. "16 dried shiitake mushrooms" → quantity: "16", unit: "", name: "dried shiitake mushrooms").
  - name: the ingredient itself, e.g. "low-sodium chicken broth", "kombu (kelp)", "dried shiitake mushrooms".
  - note: parenthetical descriptors and post-comma modifiers, e.g. 'about a 10" square piece', "finely chopped", "to taste", "drained", "plus more for serving". Move these out of "name". When a line has multiple parenthetical groups, fold their contents into a single note separated by "; ".
  - optional: true if the source says "(optional)" or "Optional:".
Skip pure section labels like "For the dashi:" — those are not ingredients.

# Common ingredient failure patterns — handle these carefully

**Footnote references** like "(Note 1)", "(Notes 1, 2)", "(*1)", "(see note)" point to a footnotes block this view cannot resolve. Drop them entirely from name AND note. NEVER emit note: "Note 1" — that's worse than nothing.

**Dual-unit amounts** like "200g / 7 oz", "75g / 5 tbsp", "2.5 oz / 5 tbsp butter": preserve BOTH halves in quantity. Output quantity: "200g / 7 oz" (keep the slash). DO NOT abandon one side.
  - Input: "75g / 5 tbsp unsalted butter (Note 2, cut into 1.25cm/1/2\\" cubes)"
  - Output: { quantity: "75g / 5 tbsp", name: "unsalted butter", note: "cut into 1.25cm / 1/2\\" cubes" }

**"Or" alternatives** like "6 sprigs fresh thyme or 3 sprigs rosemary": one ingredient slot, two acceptable items. Keep the alternation visible in name AND quantity.
  - Input: "6 sprigs fresh thyme or 3 sprigs rosemary"
  - Output: { quantity: "6 sprigs (or 3 sprigs)", name: "fresh thyme or rosemary" }

**Multi-parenthetical lines** like "2 boneless ribeye steaks (Note 1, 2.5 cm/1\\" thick, approx 300g/10 oz each) (room temp)": after dropping note refs, fold the rest into a single note separated by "; ".
  - Input: "2 x 300g/10 oz boneless ribeye or scotch fillet steaks (Note 1, 2.5 cm/1\\" thick, approx 300g/10 oz each)"
  - Output: { quantity: "2", name: "boneless ribeye or scotch fillet steaks", note: "2.5 cm / 1\\" thick, approx 300g / 10 oz each" }

**Stray punctuation**: never emit name with leading "/", "(,", trailing "(", trailing comma, or unmatched parens. If your output would contain these, fix them.

# Worked example — RecipeTinEats Steak

INPUT ingredients:
  - "2 x 300g/10 oz boneless ribeye or scotch fillet steaks (Note 1, 2.5 cm/1\\" thick, approx 300g/10 oz each)"
  - "1 tbsp vegetable oil"
  - "Salt and pepper"
  - "75g / 5 tbsp unsalted butter (Note 2, cut into 1.25cm/1/2\\" cubes)"
  - "6 sprigs fresh thyme or 3 sprigs rosemary"
  - "1 garlic clove, smashed (skin on, optional)"

OUTPUT ingredients:
  [
    { "quantity": "2",         "name": "boneless ribeye or scotch fillet steaks", "note": "2.5 cm / 1\\" thick, approx 300g / 10 oz each" },
    { "quantity": "1",         "unit": "tbsp", "name": "vegetable oil" },
    {                         "name": "salt and pepper" },
    { "quantity": "75g / 5 tbsp", "name": "unsalted butter",        "note": "cut into 1.25cm / 1/2\\" cubes" },
    { "quantity": "6 sprigs (or 3 sprigs)", "name": "fresh thyme or rosemary" },
    { "quantity": "1",         "name": "garlic clove",              "note": "smashed; skin on", "optional": true }
  ]

INPUT title: "How to cook steak – like a chef!"
OUTPUT title: "How to cook steak"


**instructions** — array of structured objects { section?, name?, text }
Group instructions into sections if and only if the source recipe is structured into multiple components (e.g. dashi, broth, eggs, assembly). Use a short noun phrase as the section name ("Dashi", "Broth", "Marinated Eggs", "Assembly") — NOT a verb. If the source is a simple linear recipe, do NOT add sections.
  - text: the instruction body, faithful to the source. Decode any leftover HTML entities and strip embedded tags. Do NOT paraphrase or rewrite.
  - name: only set if the recipe explicitly labels the step. Do NOT invent step names. If the source provided a step name that is just a truncated copy of the body, omit it.
  - Strip leading "Step 1:" / "1." numbering — order conveys position.

# Faithfulness contract

You may not:
  - invent steps or ingredients
  - paraphrase, summarize, or rewrite step bodies
  - convert units, change fractions, or alter quantities
  - reorder steps

You must:
  - decode HTML entities (&nbsp; → space, &amp; → &, &#39; → ', etc.)
  - strip inline HTML tags from text fields
  - collapse stray whitespace
  - preserve emoji-free, accent-faithful Unicode

Return ONLY the JSON object. No prose.`;

const NORMALIZE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          quantity: { type: "string" },
          unit: { type: "string" },
          name: { type: "string" },
          note: { type: "string" },
          optional: { type: "boolean" },
        },
        required: ["name"],
      },
    },
    instructions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          section: { type: "string" },
          name: { type: "string" },
          text: { type: "string" },
        },
        required: ["text"],
      },
    },
  },
  required: ["title", "ingredients", "instructions"],
} as const;

interface NormalizedRecipe {
  title: string;
  ingredients: ExtractedIngredient[];
  instructions: ExtractedInstruction[];
}

export async function normalizeCandidate(
  c: ExtractedCandidate,
): Promise<NormalizedRecipe> {
  // Send only the data we want cleaned — not the full HTML. This keeps the
  // call cheap (a handful of KB) and the model focused on the structuring
  // task rather than re-extracting from page noise.
  const payload = {
    title: c.title,
    ingredients: c.ingredients.map((i) => stringifyIngredient(i)),
    instructions: c.instructions.map((s) => ({
      section: s.section,
      name: s.name,
      text: s.text,
    })),
  };

  const response = await client().messages.create({
    model: NORMALIZE_MODEL,
    max_tokens: 4_096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: NORMALIZE_SCHEMA,
      },
    },
    messages: [
      {
        role: "user",
        content: `Normalize this recipe:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === "text") {
      const parsed = JSON.parse(block.text) as NormalizedRecipe;
      if (
        !parsed.title ||
        !Array.isArray(parsed.ingredients) ||
        !Array.isArray(parsed.instructions) ||
        parsed.ingredients.length === 0 ||
        parsed.instructions.length === 0
      ) {
        throw new Error("normalize: incomplete output");
      }
      return parsed;
    }
  }
  throw new Error("normalize: no text content");
}

/** Round-trip a structured ingredient back to a single line for the LLM input. */
function stringifyIngredient(i: ExtractedIngredient): string {
  const parts: string[] = [];
  if (i.quantity) parts.push(i.quantity);
  if (i.unit) parts.push(i.unit);
  parts.push(i.name);
  let line = parts.join(" ");
  if (i.note) line += `, ${i.note}`;
  if (i.optional) line += " (optional)";
  return line;
}
