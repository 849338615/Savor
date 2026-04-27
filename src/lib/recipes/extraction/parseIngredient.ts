import { cleanText } from "@/lib/text/decode";
import type { ExtractedIngredient } from "./types";

/**
 * Parse a raw ingredient line into structured `{quantity, unit, name, note, optional}`.
 *
 * The earlier heuristic was too greedy — it consumed any short word after a
 * quantity as a unit, so "16 dried shiitake mushrooms" became
 * `amount: "16 dried"`, `name: "shiitake mushrooms"`. The fix is a closed
 * unit allowlist: only known cooking units land in `unit`; everything else
 * stays in `name`. Parenthetical and trailing-comma modifiers move to `note`
 * so they can render as muted secondary text.
 */

const VULGAR_FRACTIONS = "½⅓¼⅔¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞";

const QUANTITY_RE = new RegExp(
  // Mixed fraction: "1 1/2", "1 ½"
  String.raw`^\s*(` +
    // Range: "1-2", "1–2", "1 to 2"
    String.raw`(?:\d+(?:\.\d+)?(?:\s*\/\s*\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)` +
    String.raw`|` +
    // Mixed: "1 1/2", "1 ½"
    String.raw`(?:\d+\s+(?:\d+\s*\/\s*\d+|[${VULGAR_FRACTIONS}]))` +
    String.raw`|` +
    // Simple fraction: "1/2", "½"
    String.raw`(?:\d+\s*\/\s*\d+|[${VULGAR_FRACTIONS}])` +
    String.raw`|` +
    // Decimal or integer: "1", "1.5", "0.25"
    String.raw`(?:\d+(?:\.\d+)?)` +
    String.raw`)\s*`,
);

/**
 * Recognized cooking units. Anything outside this set stays in the name —
 * this is the central fix for the "16 dried" bug. Lowercase comparison.
 */
const UNIT_ALLOWLIST = new Set([
  "cup", "cups", "c", "c.",
  "tbsp", "tbsp.", "tablespoon", "tablespoons", "tbl", "tbls",
  "tsp", "tsp.", "teaspoon", "teaspoons",
  "oz", "oz.", "ounce", "ounces",
  "lb", "lb.", "lbs", "pound", "pounds",
  "g", "g.", "gram", "grams",
  "kg", "kg.", "kilo", "kilos", "kilogram", "kilograms",
  "mg", "mg.",
  "ml", "ml.", "milliliter", "milliliters", "millilitre", "millilitres",
  "l", "l.", "liter", "liters", "litre", "litres",
  "cl", "cl.",
  "pinch", "pinches",
  "dash", "dashes",
  "drop", "drops",
  "splash", "splashes",
  "clove", "cloves",
  "can", "cans",
  "jar", "jars",
  "package", "packages", "pkg", "pkg.", "pkt",
  "stick", "sticks",
  "slice", "slices",
  "piece", "pieces", "pc", "pcs",
  "bunch", "bunches",
  "sprig", "sprigs",
  "head", "heads",
  "stalk", "stalks",
  "sheet", "sheets",
  "strip", "strips",
  "fillet", "fillets", "filet", "filets",
  "loaf", "loaves",
  "ear", "ears",
  "rib", "ribs",
  "leaf", "leaves",
  "knob", "knobs",
  "handful", "handfuls",
  "bottle", "bottles",
  "scoop", "scoops",
  "quart", "quarts", "qt", "qt.",
  "pint", "pints", "pt", "pt.",
  "gallon", "gallons", "gal", "gal.",
  "fl", "fl.",
]);

/** "fl oz" — handle as a two-token unit. */
const TWO_TOKEN_UNITS: ReadonlyArray<readonly [string, string]> = [
  ["fl", "oz"],
  ["fl.", "oz."],
  ["fl", "oz."],
  ["fl.", "oz"],
];

/**
 * Section header lines that appear in ingredient lists like "For the dashi:".
 * These should be skipped, not parsed as ingredients.
 */
const SECTION_HEADER_RE = /^(?:for (?:the )?[^:]+|to (?:serve|finish|garnish|assemble)|topping|toppings|garnish|sauce):?\s*$/i;

export function isIngredientSectionHeader(line: string): boolean {
  return SECTION_HEADER_RE.test(line.trim());
}

/** Footnote-style references like "(Note 1)", "(Notes 1, 2)", "(*3)", "(see note)". */
const NOTE_REF_INSIDE_RE = /^(?:notes?\s+\d+(?:\s*[,&]\s*\d+)*|\*\s*\d+|see\s+notes?)\b/i;

/**
 * Strip footnote-style note references that point to a recipe-notes block we
 * can't resolve in this view. Leaves any non-note content of the same paren
 * intact: "(Note 1, finely chopped)" → "(finely chopped)".
 */
function stripNoteRefs(line: string): string {
  return line
    .replace(/\(\s*notes?\s+\d+(?:\s*[,&]\s*\d+)*\s*[,;.]?\s*([^)]*)\)/gi, (_, rest) => {
      const r = rest.trim().replace(/^[,;.\s]+/, "");
      return r ? `(${r})` : "";
    })
    .replace(/\(\s*\*\s*\d+\s*\)/g, "")
    .replace(/\(\s*see\s+notes?\s*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIngredientLine(raw: string, idx = 0): ExtractedIngredient {
  let line = cleanText(raw).replace(/^[-•*·–]+\s*/, "").trim();
  if (!line) return { name: "" };

  // Drop footnote refs FIRST so they never reach the parens or notes path.
  line = stripNoteRefs(line);

  let optional = false;
  // Optional marker: trailing "(optional)" or "optional"; leading "Optional:"
  const trailingOpt = line.match(/[,\s]*\(?\s*optional\s*\)?\s*\.?$/i);
  if (trailingOpt) {
    optional = true;
    line = line.slice(0, trailingOpt.index).trim().replace(/[,;]\s*$/, "");
  }
  const leadingOpt = line.match(/^optional[:\s,]+/i);
  if (leadingOpt) {
    optional = true;
    line = line.slice(leadingOpt[0].length).trim();
  }

  // Special-case "to taste" — keep as quantity-style descriptor.
  const toTaste = line.match(/^(.*?),?\s*to taste\s*\.?$/i);
  if (toTaste) {
    const remainder = toTaste[1].trim();
    return {
      quantity: "to taste",
      name: remainder || line,
      optional: optional || undefined,
    };
  }

  // Pull off a leading quantity if present.
  const qMatch = line.match(QUANTITY_RE);
  let quantity: string | undefined;
  if (qMatch) {
    quantity = qMatch[1].trim().replace(/\s+/g, " ");
    line = line.slice(qMatch[0].length).trim();
  }

  // Trim a stray leading slash left over from dual-unit residue like
  // "75g / 5 tbsp ..." after we ate "75g" as quantity+unit. Without this the
  // name would start with "/ 5 tbsp ..." (the LLM normalizer fixes this on
  // the detail path; this is the search-thumbnail backstop).
  line = line.replace(/^[/\\,]+\s*/, "").trim();

  // Try a leading unit token from the allowlist.
  let unit: string | undefined;
  if (line) {
    const tokens = line.split(/\s+/);
    if (tokens.length >= 2) {
      const two = `${tokens[0].toLowerCase()} ${tokens[1].toLowerCase()}`;
      const matched2 = TWO_TOKEN_UNITS.find(
        ([a, b]) => `${a} ${b}` === two,
      );
      if (matched2) {
        unit = `${tokens[0]} ${tokens[1]}`;
        line = tokens.slice(2).join(" ");
      }
    }
    if (!unit && tokens.length >= 1) {
      const lower = tokens[0].toLowerCase();
      if (UNIT_ALLOWLIST.has(lower)) {
        unit = tokens[0];
        line = tokens.slice(1).join(" ");
      }
    }
  }

  // Extract ALL parentheticals iteratively (the line may have multiple), drop
  // anything that's a note reference (e.g. "Note 1"), and fold the rest into
  // a single note separated by "; ". Whichever parens remain after this are
  // dangling artifacts — we strip them.
  let note: string | undefined;
  const parenRe = /\s*\(([^()]+)\)\s*/g;
  const noteParts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = parenRe.exec(line)) !== null) {
    const inside = m[1].trim().replace(/^[,;.\s]+/, "").trim();
    if (!inside) continue;
    if (NOTE_REF_INSIDE_RE.test(inside)) continue;
    noteParts.push(inside);
  }
  if (noteParts.length || /\(.*\)/.test(line)) {
    line = line.replace(/\s*\([^()]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  }
  if (noteParts.length) note = noteParts.join("; ");

  // Post-comma modifier: "kombu, about a 10\" square" / "garlic, finely minced"
  // Only treat the LAST comma as a note boundary, and only when the segment
  // looks descriptive (lowercase start, or starts with a participle/phrase).
  if (!note) {
    const lastComma = line.lastIndexOf(",");
    if (lastComma > 0) {
      const before = line.slice(0, lastComma).trim();
      const after = line.slice(lastComma + 1).trim();
      if (after && before && looksLikeModifier(after)) {
        line = before;
        note = after;
      }
    }
  }

  // Special "plus more" trailing phrase: keep it as a note.
  const plusMore = line.match(/^(.+?)\s+(plus more.+)$/i);
  if (plusMore) {
    line = plusMore[1].trim();
    note = note ? `${note}; ${plusMore[2]}` : plusMore[2];
  }

  // Final scrub: strip any stray punctuation that survived (leading commas,
  // unmatched parens, trailing punctuation), collapse whitespace.
  const name = line
    .replace(/^[\s,;.\/()\\-]+/, "")
    .replace(/[\s,;()\\-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  const out: ExtractedIngredient = { name: name || raw.trim() };
  if (quantity) out.quantity = quantity;
  if (unit) out.unit = unit;
  if (note) out.note = note;
  if (optional) out.optional = true;
  void idx;
  return out;
}

/** Heuristic: is this the kind of phrase that belongs in `note`? */
function looksLikeModifier(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  // Starts lowercase → almost certainly a continuation, not a separate ingredient.
  if (/^[a-z]/.test(trimmed)) return true;
  // Starts with common modifier words (case-insensitive).
  return /^(about|approximately|roughly|preferably|plus|optional|or|and|to taste|for serving|for garnish|divided|drained|rinsed|finely|coarsely|thinly|thickly|peeled|chopped|diced|minced|sliced|grated|crushed|toasted|softened|melted|cooled|warmed|cubed|julienned|halved|quartered|trimmed|seeded|stemmed|cored|deveined|skin-on|skinless|bone-in|boneless|fresh|dried|frozen|cooked|raw|small|medium|large|extra)/i.test(
    trimmed,
  );
}
