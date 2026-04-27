/**
 * Shared text-cleaning utilities used across the recipe extraction pipeline.
 *
 * Recipe webpages are messy. JSON-LD blocks routinely contain HTML entities
 * (`&nbsp;`, `&#39;`), embedded inline tags (`<p>`, `<br>`), and stray
 * whitespace from copy/paste. We need a single boundary where this gets
 * cleaned so the data reaching the UI is presentable.
 */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  bull: "•",
  middot: "·",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  agrave: "à",
  acirc: "â",
  iuml: "ï",
  ntilde: "ñ",
  ouml: "ö",
  uuml: "ü",
  ccedil: "ç",
  deg: "°",
  times: "×",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  frac13: "⅓",
  frac23: "⅔",
  frac15: "⅕",
  frac25: "⅖",
  frac35: "⅗",
  frac45: "⅘",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

export function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ");
}

/**
 * stripTags → decodeEntities → collapse whitespace (including non-breaking
 * spaces) → trim. Idempotent. The order matters: strip first so any text
 * inside tags is removed, then decode entities, then collapse the resulting
 * whitespace runs.
 */
export function cleanText(s: string): string {
  if (!s) return "";
  return decodeEntities(stripTags(s))
    .replace(/[\s ]+/g, " ")
    .trim();
}

/**
 * Heuristic: does this string look like it still has unescaped HTML or
 * entity content that didn't get cleaned? Used by the normalization gate
 * to decide whether a JSON-LD candidate needs an LLM cleanup pass.
 */
export function looksDirty(s: string): boolean {
  if (!s) return false;
  if (/<[a-zA-Z\/!][^>]*>/.test(s)) return true;
  if (/&[a-zA-Z]+;/.test(s)) return true;
  if (/&#\d+;/.test(s)) return true;
  if (/ /.test(s)) return true;
  return false;
}
