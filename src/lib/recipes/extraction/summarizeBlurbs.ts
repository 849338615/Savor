import Anthropic from "@anthropic-ai/sdk";

/**
 * Batched blurb summarizer for the search-results card.
 *
 * Source `description` fields are raw page prose — often a single 130+ char
 * marketing sentence that can't be trimmed to two lines without landing
 * mid-thought. This rewrites each result's title + description into a short,
 * SELF-CONTAINED phrase that fits the card and reads as a finished thought.
 *
 * Reliability is the whole point here, so the flow is defensive:
 *   1. One batched Haiku call covers every result (cheap, shares the cached
 *      system prefix).
 *   2. Any result the batch dropped, returned empty/oversized/clipped, or that
 *      threw, is retried individually in parallel — so one bad item can never
 *      leave a neighbour showing raw, truncated prose.
 *   3. Anything still unresolved falls back to its original description, which
 *      the UI trims as a last resort.
 *
 * Never throws. No-ops (returns originals) when ANTHROPIC_API_KEY is unset.
 * Model is intentionally not env-overridable — mirrors `llmExtractor`.
 */

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set — required for blurb summarization.",
    );
  }
  _client = new Anthropic();
  return _client;
}

const MODEL = "claude-haiku-4-5-20251001";

/** Target length the prompt aims for (~one and a half lines). */
const TARGET_CHARS = 54;
/**
 * Hard reject ceiling. A blurb longer than this either overflows the card's
 * two lines or signals the model ignored the brief — treat it as a miss and
 * retry rather than shipping a clipped phrase. Kept in lockstep with the
 * `excerpt()` budget the results row passes (see RecipeResultRow).
 */
export const BLURB_MAX_CHARS = 66;

export interface BlurbInput {
  title: string;
  description?: string;
}

interface IndexedInput extends BlurbInput {
  index: number;
}

const BLURBS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summaries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          blurb: { type: "string" },
        },
        required: ["index", "blurb"],
      },
    },
  },
  required: ["summaries"],
} as const;

const SYSTEM_PROMPT = `You write ultra-concise blurbs for a recipe search-results card. The card gives each blurb about two short lines — roughly ${TARGET_CHARS} characters — so every blurb must be a COMPLETE, self-contained thought that fits, never a sentence that trails off.

You receive a numbered list of recipes, each with a title and a (possibly messy) source description. For each one, return a single blurb.

# Blurb rules
- At most 9 words and ${TARGET_CHARS} characters. Shorter is better. NEVER exceed ${BLURB_MAX_CHARS} characters.
- A finished thought: it reads as a whole phrase, not a clipped fragment. It must NOT end with "…", "...", or a dangling word like "and", "with", "or", "the", "a".
- Say what the dish IS and, if room allows, its one standout trait (texture, method, speed). E.g. "Juicy pan-seared steak with a deep brown crust."
- Do NOT repeat the title verbatim — the title is already shown above the blurb. Add information, don't echo.
- No marketing fluff ("the best", "you'll love", "perfect every time"), no author voice ("here's how I…"), no quotes, no emoji.
- Sentence case. A single closing period is fine; no other end punctuation.
- If the description is empty, "(none)", or unusable, infer a sensible blurb from the title alone.

# Output
Return JSON: { "summaries": [ { "index": <the recipe's number>, "blurb": <text> }, ... ].
You MUST return exactly one entry for EVERY recipe in the list, using its given index. Never skip, merge, or reorder — if the list has indices 0 through N, your output has one entry for each.`;

/**
 * A blurb is usable only if it's a short, finished thought. Rejecting here
 * routes the item to a retry instead of letting a clipped/oversized phrase
 * reach the card.
 */
function isUsableBlurb(s: string): boolean {
  const t = s.trim();
  if (t.length < 3 || t.length > BLURB_MAX_CHARS) return false;
  if (t.endsWith("…") || t.endsWith("...")) return false;
  // A trailing conjunction/article is the signature of a truncated thought.
  if (/\b(and|with|or|but|the|a|an|of|in|on|for|to|plus)[.,]?$/i.test(t)) {
    return false;
  }
  return true;
}

/**
 * Request blurbs for a batch of recipes. Numbers each line by its *original*
 * index so the same routine works for the full set and for single-item
 * retries. Returns only the indices that came back with a usable blurb.
 */
async function requestBlurbs(
  batch: IndexedInput[],
): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (batch.length === 0) return result;

  const numbered = batch
    .map(
      (it) =>
        `${it.index}. Title: ${it.title}\n   Description: ${
          it.description?.trim() || "(none)"
        }`,
    )
    .join("\n\n");

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1_024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: BLURBS_JSON_SCHEMA },
    },
    messages: [{ role: "user", content: numbered }],
  });

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) return result;

  const parsed = JSON.parse(text) as {
    summaries?: { index: number; blurb: string }[];
  };
  if (!Array.isArray(parsed.summaries)) return result;

  const wanted = new Set(batch.map((b) => b.index));
  for (const entry of parsed.summaries) {
    const idx = entry?.index;
    const blurb = typeof entry?.blurb === "string" ? entry.blurb.trim() : "";
    if (wanted.has(idx) && !result.has(idx) && isUsableBlurb(blurb)) {
      result.set(idx, blurb);
    }
  }
  return result;
}

/**
 * Summarize a batch of recipes into short, complete blurbs. Returns an array
 * aligned to `items` (same length, same order). Indices that can't be
 * summarized keep their original description so the caller can fall back to
 * deterministic trimming. Never throws.
 */
export async function summarizeBlurbs(
  items: BlurbInput[],
): Promise<(string | undefined)[]> {
  const out = items.map((it) => it.description);
  if (items.length === 0 || !process.env.ANTHROPIC_API_KEY) return out;

  const indexed: IndexedInput[] = items.map((it, index) => ({ ...it, index }));
  const filled = new Set<number>();

  // Pass 1 — one batched call for everything. A thrown error (network, API,
  // malformed JSON) drops through to the per-item retry below rather than
  // failing the whole search.
  try {
    const batch = await requestBlurbs(indexed);
    for (const [i, blurb] of batch) {
      out[i] = blurb;
      filled.add(i);
    }
  } catch {
    /* fall through to retries */
  }

  // Pass 2 — retry every gap individually, in parallel. A single-item request
  // is the most reliable shape (no alignment to get wrong), so this rescues
  // both dropped indices and a fully-failed first pass.
  const missing = indexed.filter((it) => !filled.has(it.index));
  if (missing.length > 0) {
    const retries = await Promise.all(
      missing.map(async (it) => {
        try {
          const one = await requestBlurbs([it]);
          return [it.index, one.get(it.index)] as const;
        } catch {
          return [it.index, undefined] as const;
        }
      }),
    );
    for (const [i, blurb] of retries) {
      if (blurb) out[i] = blurb;
    }
  }

  return out;
}
