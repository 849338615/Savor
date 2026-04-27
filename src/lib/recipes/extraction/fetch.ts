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
 * Get just the page text (no tags, no scripts, no styles). Used as the LLM
 * fallback input — much smaller than full HTML, and the model only needs the
 * words. Truncated to ~50KB.
 */
import { cleanText } from "@/lib/text/decode";

export function extractReadableText(html: string, maxChars = 50_000): string {
  const stripped = cleanText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " "),
  );

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
  const og = html.match(
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  );
  return og?.[1];
}
