/**
 * Fetch HTML for a recipe page. Uses a desktop-class User-Agent because some
 * sites (notably Allrecipes, Food Network) serve a stripped mobile shell with
 * no JSON-LD when they think the client is a bot.
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

export async function fetchHtml(url: string, timeoutMs = 8_000): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  // Cap at 2MB — recipe pages are big but not THIS big, and large pages are
  // almost always ad-laden noise that the parser will reject anyway.
  const reader = res.body?.getReader();
  if (!reader) return res.text();

  const decoder = new TextDecoder();
  let html = "";
  let total = 0;
  const max = 2 * 1024 * 1024;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (total > max) break;
  }
  html += decoder.decode();
  return html;
}

/**
 * Get the recipe-relevant text out of a recipe webpage. Used as the LLM
 * fallback input.
 *
 * Three-tier strategy:
 *   1. If the page exposes a recognized recipe-card subtree
 *      (schema.org `itemtype=".../Recipe"`, or one of the common WP recipe-card
 *      class names), return only that subtree. This is the common case on
 *      story-heavy blogs and reduces input from ~12K to ~1.5K tokens.
 *   2. Otherwise strip well-known chrome (nav/aside/footer/sidebar/comments/
 *      promo blocks/etc.) from the full page, then prefer `<main>`/`<article>`.
 *   3. Fall back to whole-page strip.
 *
 * Truncated to ~50KB.
 */
import { cleanText } from "@/lib/text/decode";
import { upgradeImageUrl } from "./image";

const NOISE_TAG_RE =
  /<(nav|aside|footer|header|form|noscript|script|style|svg|iframe|video|audio|picture|figure)\b[^>]*>[\s\S]*?<\/\1>/gi;

const NOISE_CLASS_TOKENS = [
  "site-header", "site-footer", "global-nav", "site-nav", "main-nav",
  "menu", "drawer", "sidebar", "subscribe", "newsletter", "signup",
  "comment", "comments", "disqus", "related", "you-may-also",
  "share", "social", "promo", "ad-", "ads-", "advert",
  "sponsor", "affiliate", "popup", "modal", "cookie",
  "breadcrumb", "author-bio", "back-to-top", "skip-to",
  "jump-to-recipe-button", "print-button",
];

const NOISE_CLASS_RE = new RegExp(
  String.raw`<(\w+)[^>]*\b(?:class|id)\s*=\s*["'][^"']*\b(` +
    NOISE_CLASS_TOKENS.join("|") +
    String.raw`)\b[^"']*["'][^>]*>[\s\S]*?<\/\1>`,
  "gi",
);

const RECIPE_BLOCK_RES = [
  /<(article|section|div)[^>]*itemtype\s*=\s*["'][^"']*\/Recipe["'][^>]*>[\s\S]*?<\/\1>/i,
  /<(article|section|div)[^>]*\bclass\s*=\s*["'][^"']*\b(?:wprm-recipe-container|tasty-recipes|mv-recipe|recipe-card|recipe-callout|recipe-content)\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/i,
];

function stripChrome(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(NOISE_TAG_RE, " ")
    .replace(NOISE_CLASS_RE, " ");
}

export function extractReadableText(html: string, maxChars = 50_000): string {
  // 1. Prefer a recognized recipe-card subtree if present and substantial.
  for (const re of RECIPE_BLOCK_RES) {
    const m = html.match(re);
    if (m && m[0].length > 600) {
      const text = cleanText(stripChrome(m[0]));
      return text.length > maxChars ? text.slice(0, maxChars) + "…" : text;
    }
  }

  // 2. Strip chrome from the full page, then prefer <main>/<article>.
  const cleaned = stripChrome(html);
  const article = cleaned.match(/<(main|article)\b[^>]*>([\s\S]*?)<\/\1>/i);
  const body = article?.[2] ?? cleaned;

  const stripped = cleanText(body);
  return stripped.length > maxChars
    ? stripped.slice(0, maxChars) + "…"
    : stripped;
}

/**
 * Try to find the page title from <title> or og:title, used as a fallback
 * when no JSON-LD recipe is present.
 */
export function extractPageTitle(html: string): string | undefined {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) return og[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return title?.[1]?.trim();
}

export function extractCanonicalUrl(
  html: string,
  fallback: string,
): string {
  const link = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  );
  return link?.[1] ?? fallback;
}

export function extractOgImage(html: string): string | undefined {
  const candidates: Array<{ url: string; alt?: string }> = [];

  const ogUrl = html.match(
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const ogAlt = html.match(
    /<meta[^>]+property=["']og:image:alt["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  if (ogUrl) candidates.push({ url: ogUrl, alt: ogAlt });

  const twUrl = html.match(
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const twAlt = html.match(
    /<meta[^>]+name=["']twitter:image:alt["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  if (twUrl) candidates.push({ url: twUrl, alt: twAlt });

  for (const { url, alt } of candidates) {
    if (isGenericBrandImage(url, alt)) continue;
    return upgradeImageUrl(url);
  }

  return undefined;
}

/**
 * Recognize site-wide brand/social-share assets so we don't hand them off as
 * recipe thumbnails. A broken 404 shell on a JS-rendered site (Modern
 * Proper, several Substack-style cooking blogs) commonly serves a generic
 * `og:image` like `…/global/site-seo-image.jpg` with alt
 * "The Modern Proper Brand Logotype" — surfacing that as the recipe photo
 * is worse than showing the gradient backstop.
 */
function isGenericBrandImage(url: string, alt?: string): boolean {
  if (alt && /\b(logo|logotype|brand|wordmark)\b/i.test(alt)) return true;
  return /\/(?:global\/|brand\/|social[-_]?share|seo[-_]?image|og[-_]?image|default[-_]?share|fallback)/i.test(
    url,
  );
}
