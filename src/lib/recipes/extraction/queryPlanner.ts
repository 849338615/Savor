/**
 * Query understanding (the "brain" for hard searches).
 *
 * Web search backends already handle spelling and on-topic ranking for normal
 * dish queries, so the common path needs no LLM. But two shapes defeat plain
 * keyword search:
 *
 *   - Over-specified: "gluten free dairy free high protein chicken dinner under
 *     30 minutes for toddlers" — every constraint ANDed into the query drags
 *     results down to niche allergy micro-blogs with thin structured data.
 *   - Garbled / vague: heavy misspellings, or a request phrased as a sentence.
 *
 * For these, one fast Haiku call turns the raw query into a clean search plan:
 * the core dish, an optimal (not over-constrained) search string, the
 * constraints mapped to the app's tag vocabulary, and a bare-dish fallback.
 * This is invoked sparingly — only for long queries, or when a first pass
 * comes back weak — to respect the per-search cost ceiling.
 */
import Anthropic from "@anthropic-ai/sdk";
import { TAG_VOCAB } from "./index";

export interface QueryPlan {
  /** Spelling-corrected version of the user's text, for display. */
  corrected: string;
  /** Optimal web-search string: core dish + the most defining modifiers. */
  searchQuery: string;
  /** The core dish alone — used as the relevance-matching basis. */
  dish: string;
  /** Constraints (diet/time/technique/cuisine) mapped to the app tag vocab. */
  tags: string[];
  /** Simplest fallback (typically the bare dish) if `searchQuery` is too narrow. */
  relaxedQuery: string;
}

/** Long, sentence-like queries are the ones that benefit from planning. */
export function isHardQuery(q: string): boolean {
  const words = q.trim().split(/\s+/).filter(Boolean);
  return words.length >= 6;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set — required for query planning.");
  }
  return (_client ??= new Anthropic());
}

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You turn a messy recipe search query into a clean search plan. The user is looking for recipes; their query may be misspelled, phrased as a sentence, or piled with constraints.

Return JSON matching the schema:

- "corrected": the user's query with spelling fixed, otherwise faithful to what they asked. Keep it short and natural (what you'd show after "Showing results for…"). If nothing was misspelled, return the query as-is.
- "dish": the single core dish or food at the heart of the query, stripped of every modifier. "high protein gluten free chicken parm for kids" → "chicken parmesan". "something cozy with squash" → "butternut squash soup" (pick the most likely concrete dish). Always a real, searchable dish.
- "searchQuery": the best web-search string — the core dish plus AT MOST the one or two most defining modifiers (a cuisine, a key method, or the single most important diet word). Do NOT pile in every constraint; over-constrained queries return junk. No need to add the word "recipe".
- "tags": the query's constraints mapped to this exact vocabulary (lowercase, choose only ones that clearly apply, omit the rest): ${[...TAG_VOCAB].join(", ")}. Map "under 30 minutes"/"fast" → "quick"; "weeknight" → "weeknight"; protein/diet words to their tag if present. Return [] if none apply.
- "relaxedQuery": the most reliable fallback — almost always just the dish — to use if the precise search comes up short.

Examples:
"chiken parmesean" → {"corrected":"chicken parmesan","dish":"chicken parmesan","searchQuery":"chicken parmesan","tags":["chicken","italian","dinner"],"relaxedQuery":"chicken parmesan"}
"quick gluten free dairy free high protein chicken dinner under 30 min for toddlers" → {"corrected":"quick gluten-free high-protein chicken dinner","dish":"chicken dinner","searchQuery":"gluten free chicken dinner","tags":["chicken","dinner","quick","gluten-free","dairy-free"],"relaxedQuery":"chicken dinner"}
"cozy vegetarian soup for a rainy day" → {"corrected":"cozy vegetarian soup","dish":"vegetable soup","searchQuery":"vegetarian soup","tags":["soup","vegetarian","comfort"],"relaxedQuery":"vegetable soup"}

Return ONLY the JSON object.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    corrected: { type: "string" },
    searchQuery: { type: "string" },
    dish: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    relaxedQuery: { type: "string" },
  },
  required: ["corrected", "searchQuery", "dish", "tags", "relaxedQuery"],
} as const;

/**
 * Plan a query. Returns null on any failure (no key, API error, bad JSON) so
 * the caller transparently falls back to using the raw query.
 */
export async function planQuery(rawQuery: string): Promise<QueryPlan | null> {
  const q = rawQuery.trim();
  if (!q) return null;
  try {
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 400,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral", ttl: "1h" },
        },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: q }],
    });

    for (const block of response.content) {
      if (block.type !== "text") continue;
      const p = JSON.parse(block.text) as Partial<QueryPlan>;
      const dish = (p.dish || "").trim();
      const searchQuery = (p.searchQuery || dish).trim();
      if (!searchQuery) return null;
      return {
        corrected: (p.corrected || q).trim(),
        searchQuery,
        dish: dish || searchQuery,
        tags: sanitizeTags(p.tags),
        relaxedQuery: (p.relaxedQuery || dish || searchQuery).trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Keep only known vocabulary tags, deduped. */
function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out = new Set<string>();
  for (const t of tags) {
    if (typeof t !== "string") continue;
    const slug = t.toLowerCase().trim();
    if (TAG_VOCAB.has(slug)) out.add(slug);
  }
  return [...out].slice(0, 6);
}
