/**
 * Parse Schema.org Recipe JSON-LD blocks out of a page's HTML.
 *
 * Quality recipe sites (Bon Appétit, NYT Cooking, Serious Eats, Food52, King
 * Arthur, Smitten Kitchen, Allrecipes) all publish a `Recipe` JSON-LD block
 * with the same fields. When present, this is the authoritative source —
 * structured, complete, no LLM call needed.
 *
 * The shape of these blocks is messy in practice:
 *   - sometimes a single object,
 *   - sometimes an array of typed objects (only one of which is the Recipe),
 *   - sometimes nested under `@graph`,
 *   - sometimes `@type` is an array like `["Recipe", "NewsArticle"]`.
 *
 * This module finds the Recipe object across all of those shapes, then runs
 * every extracted string through `cleanText` so HTML entities and embedded
 * tags never reach the UI.
 */

import { cleanText } from "@/lib/text/decode";
import { upgradeImageUrl } from "./image";
import type { ExtractedIngredient, ExtractedInstruction } from "./types";
import { isIngredientSectionHeader, parseIngredientLine } from "./parseIngredient";

export interface AggregateRating {
  ratingValue?: number;
  reviewCount?: number;
  ratingCount?: number;
}

export interface RawJsonLdRecipe {
  url?: string;
  name?: string;
  description?: string;
  image?: string;
  author?: string;
  datePublished?: string;
  totalTimeMinutes?: number;
  cookTimeMinutes?: number;
  prepTimeMinutes?: number;
  recipeYield?: number;
  ingredients: ExtractedIngredient[];
  instructions: ExtractedInstruction[];
  category?: string[];
  cuisine?: string[];
  keywords?: string[];
  aggregateRating?: AggregateRating;
}

export function parseJsonLdRecipe(html: string): RawJsonLdRecipe | null {
  const blocks = extractJsonLdBlocks(html);
  for (const block of blocks) {
    const recipe = findRecipe(block);
    if (recipe) return normalizeRecipe(recipe);
  }
  return null;
}

/* --------------------------- block enumeration --------------------------- */

function extractJsonLdBlocks(html: string): unknown[] {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      // Some sites wrap JSON in CDATA blocks
      const cleaned = raw
        .replace(/^\s*\/\*\s*<!\[CDATA\[\s*\*\/\s*/, "")
        .replace(/\s*\/\*\s*\]\]>\s*\*\/\s*$/, "");
      blocks.push(JSON.parse(cleaned));
    } catch {
      // Some sites embed multiple JSON objects in one script tag separated by
      // newlines or have trailing commas. Try a quick splitter as a salvage.
      const salvaged = trySplit(raw);
      if (salvaged) blocks.push(salvaged);
    }
  }
  return blocks;
}

function trySplit(raw: string): unknown | null {
  // Try just the first balanced object
  const start = raw.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/* ----------------------------- recipe finder ---------------------------- */

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item);
      if (found) return found;
    }
    return null;
  }

  const obj = node as Record<string, unknown>;

  if (isRecipeType(obj["@type"])) {
    return obj;
  }

  // Walk @graph, mainEntity, and other typical containers
  const graph = obj["@graph"];
  if (graph) {
    const found = findRecipe(graph);
    if (found) return found;
  }

  const mainEntity = obj["mainEntity"];
  if (mainEntity) {
    const found = findRecipe(mainEntity);
    if (found) return found;
  }

  return null;
}

function isRecipeType(t: unknown): boolean {
  if (typeof t === "string") return t === "Recipe" || t.endsWith("/Recipe");
  if (Array.isArray(t)) return t.some(isRecipeType);
  return false;
}

/* ---------------------------- normalization ---------------------------- */

function normalizeRecipe(r: Record<string, unknown>): RawJsonLdRecipe {
  const rawIngredients = pickStringArray(r.recipeIngredient ?? r.ingredients);
  const ingredients: ExtractedIngredient[] = [];
  for (const raw of rawIngredients) {
    if (!raw) continue;
    if (isIngredientSectionHeader(raw)) continue;
    const parsed = parseIngredientLine(raw, ingredients.length);
    if (parsed.name) ingredients.push(parsed);
  }

  return {
    url: pickString(r.url),
    name: pickString(r.name),
    description: pickString(r.description),
    image: pickImage(r.image),
    author: pickAuthor(r.author),
    datePublished: pickString(r.datePublished),
    totalTimeMinutes: parseDurationMinutes(pickRawString(r.totalTime)),
    cookTimeMinutes: parseDurationMinutes(pickRawString(r.cookTime)),
    prepTimeMinutes: parseDurationMinutes(pickRawString(r.prepTime)),
    recipeYield: parseYield(r.recipeYield),
    ingredients,
    instructions: pickInstructions(r.recipeInstructions),
    category: pickStringArray(r.recipeCategory),
    cuisine: pickStringArray(r.recipeCuisine),
    keywords: pickKeywords(r.keywords),
    aggregateRating: pickRating(r.aggregateRating),
  };
}

/** `cleanText`-cleaned single string. */
function pickString(v: unknown): string | undefined {
  const raw = pickRawString(v);
  if (!raw) return undefined;
  const cleaned = cleanText(raw);
  return cleaned || undefined;
}

/** Untouched single string — for ISO durations and other code-shaped values. */
function pickRawString(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (v && typeof v === "object" && "@value" in v) {
    const inner = (v as Record<string, unknown>)["@value"];
    if (typeof inner === "string") return inner.trim() || undefined;
  }
  return undefined;
}

function pickStringArray(v: unknown): string[] {
  if (!v) return [];
  if (typeof v === "string") {
    const cleaned = cleanText(v);
    return cleaned ? [cleaned] : [];
  }
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? cleanText(x) : pickString(x)))
      .filter((x): x is string => !!x);
  }
  return [];
}

function pickKeywords(v: unknown): string[] {
  if (typeof v === "string") {
    return cleanText(v)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return pickStringArray(v).map((s) => s.toLowerCase());
}

/**
 * Pick the highest-resolution image from a Schema.org `image` field.
 *
 * The field is published in many shapes:
 *   - "https://…/photo.jpg"
 *   - ["https://…/sq.jpg", "https://…/4x3.jpg", "https://…/16x9.jpg"]
 *   - { "@type": "ImageObject", "url": "…", "width": 1200, "height": 900 }
 *   - [{ url, width, height }, …]
 *
 * Quality recipe sites (NYT, Bon Appétit, BBC Good Food, most WP Recipe
 * Maker / Tasty Recipes blogs) publish multiple aspect-ratio crops. The first
 * entry is often the 1:1 thumbnail — picking it leaves a soft, low-res hero
 * on the detail page even though a high-res 4:3 / 16:9 crop is right there.
 *
 * Strategy: collect every candidate URL with whatever width/height the site
 * provided, run each through `upgradeImageUrl` (strips WP `-768x1024` size
 * suffixes and `?w=300` downsizers), then prefer the largest by pixel area,
 * with a tie-break that favors landscape over square so the hero crop fills
 * the 5:4 hero on the detail page without distortion.
 */
function pickImage(v: unknown): string | undefined {
  const candidates = collectImageCandidates(v);
  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    const areaA = (a.width ?? 0) * (a.height ?? 0);
    const areaB = (b.width ?? 0) * (b.height ?? 0);
    if (areaA !== areaB) return areaB - areaA;
    // Same/unknown area: prefer landscape over square (better for 5:4 hero).
    const ratioA = a.width && a.height ? a.width / a.height : 1;
    const ratioB = b.width && b.height ? b.width / b.height : 1;
    return Math.abs(1 - ratioA) > Math.abs(1 - ratioB) ? -1 : 1;
  });

  return upgradeImageUrl(candidates[0].url);
}

interface ImageCandidate {
  url: string;
  width?: number;
  height?: number;
}

function collectImageCandidates(v: unknown): ImageCandidate[] {
  if (!v) return [];
  if (typeof v === "string") {
    return v.trim() ? [withUrlDims({ url: v.trim() })] : [];
  }
  if (Array.isArray(v)) {
    return v.flatMap(collectImageCandidates);
  }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const url =
      typeof obj.url === "string"
        ? obj.url
        : typeof obj.contentUrl === "string"
          ? obj.contentUrl
          : undefined;
    if (!url) return [];
    return [
      withUrlDims({
        url,
        width: pickDimension(obj.width),
        height: pickDimension(obj.height),
      }),
    ];
  }
  return [];
}

/**
 * Backfill missing width/height from the URL query string. Imgix and most
 * other transformation CDNs embed the requested dimensions as `w=`/`h=`
 * parameters; when the publisher serves a JSON-LD `image` array of bare
 * strings (Modern Proper, e.g.), this is the only signal we have to rank
 * variants by pixel area instead of falling back to a landscape tie-break
 * that might pick the lowest-resolution crop.
 */
function withUrlDims(c: ImageCandidate): ImageCandidate {
  if (c.width && c.height) return c;
  try {
    const u = new URL(c.url);
    const w = c.width ?? pickDimension(u.searchParams.get("w"));
    const h = c.height ?? pickDimension(u.searchParams.get("h"));
    if (w || h) return { ...c, width: w, height: h };
  } catch {
    /* not a parseable URL — leave as is */
  }
  return c;
}

function pickDimension(v: unknown): number | undefined {
  if (typeof v === "number" && v > 0) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return undefined;
}

function pickAuthor(v: unknown): string | undefined {
  if (typeof v === "string") return cleanText(v) || undefined;
  if (Array.isArray(v) && v.length) return pickAuthor(v[0]);
  if (v && typeof v === "object" && "name" in v) {
    return pickString((v as Record<string, unknown>).name);
  }
  return undefined;
}

/**
 * Walk recipeInstructions, preserving any `HowToSection` grouping name as
 * a `section` field on each step. Without this, multi-component recipes
 * (e.g. ramen with dashi / broth / eggs / assembly) collapse into one flat
 * list of nameless steps.
 */
function pickInstructions(v: unknown, section?: string): ExtractedInstruction[] {
  if (!v) return [];
  if (typeof v === "string") {
    // Some sites publish a single string of newline-separated steps
    const text = cleanText(v);
    return text
      .split(/\n+|\.\s+(?=[A-Z])/g)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10)
      .map((s) => ({
        section,
        text: s.endsWith(".") ? s : `${s}.`,
      }));
  }
  if (Array.isArray(v)) {
    const flat: ExtractedInstruction[] = [];
    for (const item of v) {
      if (!item) continue;
      if (typeof item === "string") {
        const t = cleanText(item);
        if (t) flat.push(section ? { section, text: t } : { text: t });
        continue;
      }
      if (typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;
      // HowToSection — recurse with the section's name carried down
      if (obj["@type"] === "HowToSection") {
        const secName = pickString(obj.name);
        const inner = obj.itemListElement ?? obj.itemList;
        if (inner) {
          flat.push(...pickInstructions(inner, secName ?? section));
        }
        continue;
      }
      const text = pickString(obj.text) ?? pickString(obj.name);
      if (!text) continue;
      const name = pickString(obj.name);
      const out: ExtractedInstruction = { text };
      if (section) out.section = section;
      if (name && name !== text) out.name = name;
      flat.push(out);
    }
    return flat;
  }
  return [];
}

function pickRating(v: unknown): AggregateRating | undefined {
  if (!v || typeof v !== "object") return undefined;
  const obj = v as Record<string, unknown>;
  const out: AggregateRating = {};
  const rv = obj.ratingValue;
  if (typeof rv === "number") out.ratingValue = rv;
  else if (typeof rv === "string") {
    const n = parseFloat(rv);
    if (!Number.isNaN(n)) out.ratingValue = n;
  }
  const rc = obj.reviewCount ?? obj.ratingCount;
  if (typeof rc === "number") {
    if (obj.reviewCount !== undefined) out.reviewCount = rc;
    if (obj.ratingCount !== undefined) out.ratingCount = rc;
  } else if (typeof rc === "string") {
    const n = parseInt(rc.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) {
      if (obj.reviewCount !== undefined) out.reviewCount = n;
      if (obj.ratingCount !== undefined) out.ratingCount = n;
    }
  }
  return out.ratingValue || out.reviewCount || out.ratingCount ? out : undefined;
}

function parseYield(v: unknown): number | undefined {
  if (typeof v === "number") return Math.max(1, Math.round(v));
  if (typeof v === "string") {
    const m = v.match(/(\d+)/);
    if (m) return Math.max(1, parseInt(m[1], 10));
  }
  if (Array.isArray(v)) {
    for (const x of v) {
      const n = parseYield(x);
      if (n) return n;
    }
  }
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if ("value" in obj) return parseYield(obj.value);
  }
  return undefined;
}

/**
 * Convert ISO 8601 duration (PT1H30M / PT45M / PT2H) to whole minutes.
 * Schema.org's `totalTime` field uses this format.
 */
export function parseDurationMinutes(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const m = v.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return undefined;
  const [, h, mn, s] = m;
  const total =
    (h ? parseInt(h, 10) * 60 : 0) +
    (mn ? parseInt(mn, 10) : 0) +
    (s ? Math.round(parseInt(s, 10) / 60) : 0);
  return total > 0 ? total : undefined;
}
