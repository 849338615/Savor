import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM fallback for recipe extraction. Used only when JSON-LD parsing fails.
 *
 * Defaults to `claude-opus-4-7`. For high-volume extraction you can override
 * via the `RECIPE_LLM_MODEL` env var (e.g. `claude-haiku-4-5`) — extraction is
 * a structured task and a smaller model is plenty capable. Opus is the safe
 * default; haiku is the cost-optimized choice you opt into.
 *
 * No thinking (extraction does not benefit), structured JSON output via
 * `output_config.format`, and prompt caching on the system prefix so repeat
 * extractions in the same query share the cache.
 */

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set — required for LLM extraction fallback.",
    );
  }
  _client = new Anthropic();
  return _client;
}

export interface LlmExtractedRecipe {
  title: string;
  description?: string;
  totalTimeMinutes?: number;
  servings?: number;
  ingredients: string[];
  instructions: { section?: string; name?: string; text: string }[];
  tags: string[];
  rating?: { ratingValue?: number; reviewCount?: number };
}

const RECIPE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    totalTimeMinutes: { type: "integer" },
    servings: { type: "integer" },
    ingredients: { type: "array", items: { type: "string" } },
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
    tags: { type: "array", items: { type: "string" } },
    rating: {
      type: "object",
      additionalProperties: false,
      properties: {
        ratingValue: { type: "number" },
        reviewCount: { type: "integer" },
      },
    },
  },
  required: ["title", "ingredients", "instructions", "tags"],
} as const;

const SYSTEM_PROMPT = `You are a recipe extraction engine. Your job is to read the readable text of a recipe webpage and return a single, clean, structured Recipe object — no marketing copy, no ads, no "scroll to recipe" buttons, no related-recipes blocks, no comments, no author bios.

You always return JSON conforming to the provided schema. The page text may include long personal stories, sponsorship disclosures, related-recipe lists, comments, navigation chrome, footer links, and similar noise. Ignore it. Extract only the actual recipe.

# Field rules

**title** (required, string)
The cleaned recipe title. If the page title contains site decorations like " | NYT Cooking" or " - Bon Appétit", strip them. Use title case as the source uses it; do not re-case.

**description** (optional, string)
A 1–2 sentence summary of the recipe. If the page has a clear lede paragraph that describes the dish itself (not the author's anecdote), use a condensed version. If the only "summary" available is a personal story, omit this field.

**totalTimeMinutes** (optional, integer)
Total time from start to plate, in whole minutes. Read prep + cook time and sum them if needed. Convert hours: "1 hr 30 min" → 90. If only one of prep/cook is given, return that. Round to the nearest minute. Omit if no time is stated.

**servings** (optional, integer)
The number of servings (or yield count). Examples: "Serves 4" → 4; "Makes 12 cookies" → 12; "Yield: 2 loaves" → 2. If a range is given, take the higher number ("Serves 4 to 6" → 6). Omit if absent.

**ingredients** (required, array of strings)
Each entry is one ingredient line as it appears in the ingredient list, lightly cleaned:
  - Preserve quantity and unit: "200g spaghetti", "2 tbsp olive oil", "3 cloves garlic, minced".
  - Strip leading bullet/number markers and stray whitespace.
  - Do NOT split a single ingredient line into multiple lines (e.g. "1 onion, finely diced" is ONE entry, not two).
  - Do NOT translate fractions or convert units — keep what the recipe says.
  - Skip headings like "For the sauce:" — those are section labels, not ingredients.

**instructions** (required, array of step objects)
Each step is { section?: group name, name?: short title, text: full instruction }.
  - One step per discrete cooking action. Do not merge multiple steps into one paragraph; do not split one step into two.
  - The "text" field is the full action sentence(s) the recipe gives.
  - The "section" field groups related steps for multi-component recipes. Use it ONLY if the recipe explicitly groups its instructions (e.g. headers like "For the dashi", "For the broth", "Make the sauce", "Assembly"). Use a short noun phrase (e.g. "Dashi", "Broth", "Eggs", "Assembly"). Do NOT invent sections for simple linear recipes.
  - The "name" field is OPTIONAL and only used if the recipe explicitly labels the step (e.g. "Step 1: Cook the pasta" — name is "Cook the pasta"). Do NOT invent step names.
  - Strip step numbers from the text — they are conveyed by array order. "1. Heat the oven" → text: "Heat the oven."
  - Combine continuous prose ("First, … Next, … Finally, …") into one step per discrete instruction, preserving order.

**tags** (required, array of lowercase strings)
3–6 short tags describing the recipe. Pick from these whenever they apply: "vegetarian", "vegan", "gluten-free", "dairy-free", "quick", "easy", "weeknight", "weekend", "pasta", "soup", "salad", "rice", "noodles", "sandwich", "dessert", "baking", "breakfast", "brunch", "lunch", "dinner", "side", "appetizer", "snack", "comfort", "light", "one-pan", "sheet-pan", "slow-cooker", "instant-pot", "grilling", "asian", "italian", "mexican", "indian", "french", "middle-eastern", "mediterranean", "american". Add up to 2 freeform tags only if the recipe clearly fits and no listed tag does. All lowercase, hyphenated.

**rating** (optional, object)
If the page text mentions an aggregate rating ("4.8 stars from 2,341 reviews"), capture { ratingValue, reviewCount }. ratingValue is on a 0–5 scale. Omit if not present.

# Edge cases

- If the page is NOT a recipe (e.g. a list of recipes, an article about food, a 404 page), return title: "" and ingredients: []. The caller will discard it.
- If ingredients or instructions are missing or implausibly short (fewer than 2), still return what you found — do not invent steps.
- If the page mixes multiple recipes (e.g. "Plus our basic pasta dough"), extract only the primary one — the one the title is about.
- Decimal vs fraction: keep what the source uses ("0.5 cup" stays as "0.5 cup", "1/2 cup" stays as "1/2 cup").
- Strip emoji and decorative unicode from titles and ingredients.

# Worked example

Input (truncated):
"Pull-Apart Garlic Bread - The Pioneer Woman | Ree Drummond. Skip to recipe. Sign up for our newsletter! ... When I was growing up in Oklahoma, my grandmother used to make this every Sunday and the smell would fill the entire house... Yield: 8 servings. Total time: 35 minutes. Ingredients: 1 loaf sourdough bread, 1/2 cup salted butter, melted, 4 cloves garlic, minced, 2 tbsp parsley, chopped, 1/4 cup parmesan cheese. Instructions: 1. Preheat oven to 375°F. 2. Cut bread crosswise then lengthwise without cutting through the bottom crust. 3. Mix butter, garlic, parsley. 4. Pour butter mixture between cuts. 5. Sprinkle with parmesan. 6. Wrap in foil and bake 20 minutes. 7. Unwrap and bake 5 more minutes until golden. ... Comments (482) ... Related recipes: ... Subscribe ..."

Output:
{
  "title": "Pull-Apart Garlic Bread",
  "description": "Buttery, garlicky pull-apart sourdough — a 35-minute side that fills the house with the smell of garlic.",
  "totalTimeMinutes": 35,
  "servings": 8,
  "ingredients": [
    "1 loaf sourdough bread",
    "1/2 cup salted butter, melted",
    "4 cloves garlic, minced",
    "2 tbsp parsley, chopped",
    "1/4 cup parmesan cheese"
  ],
  "instructions": [
    { "text": "Preheat oven to 375°F." },
    { "text": "Cut bread crosswise then lengthwise without cutting through the bottom crust." },
    { "text": "Mix butter, garlic, parsley." },
    { "text": "Pour butter mixture between cuts." },
    { "text": "Sprinkle with parmesan." },
    { "text": "Wrap in foil and bake 20 minutes." },
    { "text": "Unwrap and bake 5 more minutes until golden." }
  ],
  "tags": ["bread", "side", "comfort", "baking", "quick"]
}

Return ONLY the JSON object, conforming to the schema. No prose.`;

const MODEL = process.env.RECIPE_LLM_MODEL || "claude-opus-4-7";

export async function extractRecipeWithLlm(
  url: string,
  pageText: string,
): Promise<LlmExtractedRecipe | null> {
  const response = await client().messages.create({
    model: MODEL,
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
        schema: RECIPE_JSON_SCHEMA,
      },
    },
    messages: [
      {
        role: "user",
        content: `URL: ${url}\n\nPage text:\n${pageText}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === "text") {
      try {
        const parsed = JSON.parse(block.text) as LlmExtractedRecipe;
        if (!parsed.title || parsed.ingredients.length === 0) return null;
        return parsed;
      } catch {
        return null;
      }
    }
  }
  return null;
}
