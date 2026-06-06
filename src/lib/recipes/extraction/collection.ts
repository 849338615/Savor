/**
 * Mine individual-recipe URLs out of a recipe *collection* page — a roundup
 * or listicle like "21 Best Egg Recipes" or "Easy Egg Recipes for Dinner".
 *
 * Why this exists: search engines answer broad queries ("egg", "chicken",
 * "soup") overwhelmingly with collection pages, not single recipes. The
 * per-recipe extraction pipeline (JSON-LD → microdata → LLM) deliberately
 * rejects collections — they aren't a single recipe — so for a broad query
 * almost every hit is discarded and the user sees one or two results. Rather
 * than drop a roundup, we harvest the recipe links it points at and feed those
 * back through the same pipeline. The roundups become a *source* of recipes
 * instead of dead weight.
 *
 * Two sources, because roundups publish their items two different ways:
 *   1. Schema.org `ItemList` → `itemListElement` URLs (blog-style roundups,
 *      e.g. WP Recipe Maker sites, point each item at the real recipe page).
 *   2. Plain `<a href>` anchors (slideshow-style editorial roundups — Hearst's
 *      Delish/Good Housekeeping — put `#slide-N` in the ItemList and link the
 *      real recipe via a "Get the recipe" anchor).
 *
 * This is deliberately conservative: same-site links only, flat recipe-shaped
 * slugs only, with a blocklist of obvious non-recipe sections. The extraction
 * pipeline is the final quality gate, so a stray false positive only costs one
 * fetch — but a false negative costs a result, so we err toward inclusion
 * within those guardrails.
 */

import { extractJsonLdBlocks } from "./jsonld";

/** Path segments that are never an individual recipe. */
const NON_RECIPE_SEGMENTS = new Set([
  "category", "categories", "tag", "tags", "topic", "topics",
  "author", "authors", "about", "contact", "privacy", "terms",
  "disclosure", "disclosures", "policy", "policies", "shop", "store",
  "account", "login", "signin", "signup", "register", "subscribe",
  "newsletter", "email", "search", "page", "amp", "print", "wp-admin",
  "wp-content", "wp-json", "feed", "comment", "comments", "cdn-cgi",
  "recipes", "recipe-index", "gallery", "galleries", "video", "videos",
  "news", "product", "products", "my-stuff", "reviews", "collections",
]);

/** Trailing slugs that mark a slug as itself a roundup/category, not a recipe. */
const COLLECTION_SLUG_RE = /-(?:recipes|ideas|dinners|dishes|favorites|menus?|roundup)$/i;

/** Asset / feed URLs masquerading as links. */
const NON_HTML_EXT_RE = /\.(?:jpe?g|png|gif|webp|avif|svg|pdf|mp4|mov|css|js|json|xml|rss)$/i;

export function harvestRecipeLinks(
  html: string,
  baseUrl: string,
  max = 40,
): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const basePath = trimSlashes(base.pathname);

  const out = new Set<string>();
  const add = (raw: string) => {
    if (out.size >= max) return;
    const norm = normalizeRecipeUrl(raw, base, basePath);
    if (norm) out.add(norm);
  };

  // 1. Structured: ItemList → item URLs.
  for (const url of itemListUrls(html)) add(url);

  // 2. Anchors.
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.size < max) add(m[1]);

  return Array.from(out);
}

/* ------------------------------- URL filter ------------------------------ */

function normalizeRecipeUrl(
  raw: string,
  base: URL,
  basePath: string,
): string | null {
  let u: URL;
  try {
    u = new URL(raw, base);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (!sameSite(u.hostname, base.hostname)) return null;

  // Drop the fragment (slideshow `#slide-N` anchors collapse onto the
  // collection page itself) and tracking query.
  u.hash = "";
  u.search = "";

  const path = trimSlashes(u.pathname);
  if (!path) return null; // homepage
  if (path === basePath) return null; // the collection page itself
  if (NON_HTML_EXT_RE.test(path)) return null;

  const segs = path.split("/").filter(Boolean);
  if (segs.length < 1 || segs.length > 3) return null;
  for (const s of segs) {
    if (NON_RECIPE_SEGMENTS.has(s.toLowerCase())) return null;
    if (/^g\d+$/i.test(s)) return null; // Hearst gallery id (vs. `aNNN` recipe)
  }

  const last = segs[segs.length - 1].toLowerCase();
  if (!last.includes("-")) return null; // recipes carry descriptive slugs
  if (COLLECTION_SLUG_RE.test(last)) return null;

  return u.toString();
}

function sameSite(a: string, b: string): boolean {
  a = a.replace(/^www\./i, "").toLowerCase();
  b = b.replace(/^www\./i, "").toLowerCase();
  // Equal, or one a subdomain of the other (cooking.nytimes.com ↔ nytimes.com).
  return a === b || a.endsWith("." + b) || b.endsWith("." + a);
}

function trimSlashes(p: string): string {
  return p.replace(/^\/+|\/+$/g, "");
}

/* ---------------------------- ItemList walking --------------------------- */

function itemListUrls(html: string): string[] {
  const urls: string[] = [];
  for (const block of extractJsonLdBlocks(html)) collectItemListUrls(block, urls);
  return urls;
}

function collectItemListUrls(node: unknown, out: string[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collectItemListUrls(n, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  const items = obj.itemListElement;
  if (Array.isArray(items)) {
    for (const it of items) {
      const u = listItemUrl(it);
      if (u) out.push(u);
    }
  }
  for (const k of Object.keys(obj)) {
    if (k === "itemListElement") continue;
    collectItemListUrls(obj[k], out);
  }
}

/** Pull a URL off a `ListItem` in any of its common shapes. */
function listItemUrl(it: unknown): string | undefined {
  if (typeof it === "string") return it;
  if (!it || typeof it !== "object") return undefined;
  const o = it as Record<string, unknown>;
  if (typeof o.url === "string") return o.url;
  const item = o.item;
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const inner = item as Record<string, unknown>;
    if (typeof inner.url === "string") return inner.url;
    if (typeof inner["@id"] === "string") return inner["@id"] as string;
  }
  if (typeof o["@id"] === "string") return o["@id"] as string;
  return undefined;
}
