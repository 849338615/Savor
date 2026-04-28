/**
 * Parse Schema.org Recipe from HTML5 microdata.
 *
 * Many older blogs (pre-redesign Simply Recipes, classic WP Recipe Maker
 * installs) publish their recipe via microdata attributes on regular HTML
 * elements rather than a JSON-LD `<script>` block. Without this fallback we
 * pay an LLM call on every such site — slower, more expensive, and less
 * reliable than parsing structured data already in the markup.
 *
 * Targets the common shape:
 *   <div itemscope itemtype="http://schema.org/Recipe">
 *     <h1 itemprop="name">Title</h1>
 *     <span itemprop="recipeIngredient">2 cups flour</span>
 *     <li itemprop="recipeInstructions">Mix...</li>
 *
 * Compact regex parser — no DOM. Falls through to LLM if the shape is unusual.
 */
import { cleanText } from "@/lib/text/decode";
import { upgradeImageUrl } from "./image";
import type { RawJsonLdRecipe } from "./jsonld";
import { parseDurationMinutes } from "./jsonld";
import { isIngredientSectionHeader, parseIngredientLine } from "./parseIngredient";
import type { ExtractedIngredient, ExtractedInstruction } from "./types";

export function parseMicrodataRecipe(html: string): RawJsonLdRecipe | null {
  const scopeMatch = html.match(
    /<(\w+)[^>]*itemscope[^>]*itemtype\s*=\s*["'][^"']*\/Recipe["'][^>]*>([\s\S]*?)<\/\1>/i,
  );
  if (!scopeMatch) return null;
  const block = scopeMatch[2];

  const propAll = (prop: string): string[] => {
    const re = new RegExp(
      String.raw`<[^>]+\bitemprop\s*=\s*["']` +
        prop +
        String.raw`["'][^>]*?(?:content\s*=\s*["']([^"']*)["'])?[^>]*>([\s\S]*?)<\/[a-z]+>`,
      "gi",
    );
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) !== null) {
      const v = (m[1] ?? cleanText(m[2]) ?? "").trim();
      if (v) out.push(v);
    }
    return out;
  };
  const propFirst = (p: string): string | undefined => propAll(p)[0];

  const rawIng = propAll("recipeIngredient").length
    ? propAll("recipeIngredient")
    : propAll("ingredients");
  const ingredients: ExtractedIngredient[] = [];
  for (const line of rawIng) {
    if (isIngredientSectionHeader(line)) continue;
    const parsed = parseIngredientLine(line, ingredients.length);
    if (parsed.name) ingredients.push(parsed);
  }

  const instructions: ExtractedInstruction[] = propAll("recipeInstructions")
    .map((t) => cleanText(t))
    .filter((t) => t.length >= 10)
    .map((text) => ({ text }));

  if (ingredients.length < 3 || instructions.length < 2) return null;

  const yieldRaw = propFirst("recipeYield");
  const recipeYield = yieldRaw
    ? Math.max(1, parseInt(yieldRaw.replace(/[^\d]/g, ""), 10) || 0) || undefined
    : undefined;

  return {
    name: propFirst("name"),
    description: propFirst("description"),
    image: upgradeImageUrl(propFirst("image")),
    author: propFirst("author"),
    datePublished: propFirst("datePublished"),
    totalTimeMinutes: parseDurationMinutes(propFirst("totalTime")),
    cookTimeMinutes: parseDurationMinutes(propFirst("cookTime")),
    prepTimeMinutes: parseDurationMinutes(propFirst("prepTime")),
    recipeYield,
    ingredients,
    instructions,
    category: propAll("recipeCategory"),
    cuisine: propAll("recipeCuisine"),
    keywords: [],
  };
}
