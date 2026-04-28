import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM fallback for recipe extraction. Used only when JSON-LD AND microdata
 * parsing both fail.
 *
 * Hardcoded to Claude Haiku 4.5 (`claude-haiku-4-5-20251001`). Each search
 * fetches up to 30 candidate URLs in parallel; without JSON-LD, every one
 * of them would otherwise need an Opus-class call. Haiku handles structured
 * extraction with a strong prompt cleanly at ~1/15th the price, so we
 * intentionally do NOT expose an env-var override — the cost ceiling matters
 * more than upgrading individual sources.
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

# Worked example — extreme narrative-to-recipe ratio (story blog)

Input (~3,000 words; only the recipe-relevant portion is reproduced; assume the rest is narrative + chrome):

"Grandma's Sunday Pot Roast - Heartland Kitchen … Skip to recipe ↓ …
[2,400 words about my Oklahoma childhood, the smell of beef in the kitchen,
why we don't make pot roast like we used to, a sponsored detour about a knife
brand, three paragraphs about Aunt Linda's funeral and how she always doubled
the carrots, an FAQ asking 'Can I use a slow cooker? Yes — cook on low for 8
hours.', a Pinterest pin prompt, an email signup, a 'shop my kitchen'
affiliate block, and finally:]

Yield: 6 servings · Total time: 3 hours 30 minutes

Ingredients
- 1 (4 lb) chuck roast
- 2 tbsp olive oil
- Salt and pepper
- 1 large yellow onion, quartered
- 4 carrots, cut into 2-inch pieces
- 4 cloves garlic, smashed
- 2 cups beef broth
- 1 cup dry red wine
- 2 sprigs fresh rosemary
- 2 sprigs fresh thyme

Instructions
1. Preheat oven to 325°F.
2. Pat roast dry, season generously with salt and pepper.
3. Heat oil in a Dutch oven over medium-high. Sear roast on all sides, about 4 min per side.
4. Add onion, carrots, garlic. Pour in broth and wine.
5. Tuck herbs around the roast. Cover.
6. Transfer to oven, braise 3 hours until fork-tender.
7. Rest 15 minutes before slicing against the grain.

[Then 600 words of comments and 'related recipes you'll love']"

CORRECT output:
{
  "title": "Grandma's Sunday Pot Roast",
  "description": "A 3.5-hour braised chuck roast with carrots, onions, garlic, red wine, and fresh herbs.",
  "totalTimeMinutes": 210,
  "servings": 6,
  "ingredients": [
    "1 (4 lb) chuck roast",
    "2 tbsp olive oil",
    "Salt and pepper",
    "1 large yellow onion, quartered",
    "4 carrots, cut into 2-inch pieces",
    "4 cloves garlic, smashed",
    "2 cups beef broth",
    "1 cup dry red wine",
    "2 sprigs fresh rosemary",
    "2 sprigs fresh thyme"
  ],
  "instructions": [
    { "text": "Preheat oven to 325°F." },
    { "text": "Pat roast dry, season generously with salt and pepper." },
    { "text": "Heat oil in a Dutch oven over medium-high. Sear roast on all sides, about 4 min per side." },
    { "text": "Add onion, carrots, garlic. Pour in broth and wine." },
    { "text": "Tuck herbs around the roast. Cover." },
    { "text": "Transfer to oven, braise 3 hours until fork-tender." },
    { "text": "Rest 15 minutes before slicing against the grain." }
  ],
  "tags": ["beef", "comfort", "weekend", "dinner", "american"]
}

What was DROPPED:
  - The Oklahoma childhood story → not part of the recipe.
  - "Aunt Linda doubled the carrots" → anecdote, NOT an instruction. Do not
    add a step "(optional: double the carrots)".
  - The FAQ about slow cooker → describes a *variant*, not the recipe shown.
  - The sponsored knife block, affiliate "shop my kitchen", comments,
    related-recipes list, email signup, Pinterest pin → all noise.
  - "Skip to recipe ↓" → navigation chrome.

# Anti-patterns to AVOID on story-heavy pages

1. NEVER pull ingredients from a "shop my kitchen" or affiliate block. Those
   are products the author sells, not ingredients in this recipe.
2. NEVER pull steps from FAQ answers ("Can I use a slow cooker? Yes…"). Those
   describe a variant, not the recipe being shown.
3. NEVER pull an ingredient or step from a "related recipes" / "you may also
   like" list. Those are different recipes entirely.
4. If the body of the post mentions a quantity casually ("we used to add a
   half-cup more wine"), do NOT update the ingredient list — use the formal
   ingredients block, not the prose.
5. If the page title contains a different dish than the recipe block (e.g.
   page title "10 Comfort Foods" but the recipe block is "Pot Roast"), use
   the recipe block's title.

Return ONLY the JSON object, conforming to the schema. No prose.`;

// Hardcoded — Opus is intentionally NOT a supported option (see file header).
const MODEL = "claude-haiku-4-5-20251001";

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
        // 1h TTL: 2x cache-write cost vs default 5min, but 0.1x cache-read
        // cost. Wins for any usage pattern where reads outnumber writes —
        // recipe searches within an hour share the same long system prompt.
        cache_control: { type: "ephemeral", ttl: "1h" },
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
