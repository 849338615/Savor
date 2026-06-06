/**
 * Search adapter for recipe URLs. Two backends are supported:
 *
 *   - Brave Search API   (env: BRAVE_API_KEY)        — generous free tier
 *   - SerpAPI Google     (env: SERPAPI_KEY)          — paid, most reliable
 *
 * The first one with a key set is used. Both return a normalized SearchHit[].
 * Adding a new backend is one function — implement `searchWebUrls`.
 */

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
  /** 0-based rank in the search results — used as a popularity prior. */
  rank: number;
}

export interface SearchResults {
  hits: SearchHit[];
  /**
   * The engine's spelling-corrected version of the *user's query text* (with
   * our appended "recipe"/tag scaffolding stripped back off), when it differs
   * from what was typed. Search engines auto-correct and return results for
   * the corrected term already; we surface this so the UI can say "showing
   * results for …" and so callers can reason about the real query.
   */
  correctedQuery?: string;
}

export interface SearchOpts {
  /** Free-text user query — appended with " recipe" before being sent. */
  query: string;
  /** Optional tag/cuisine filters mixed into the query (e.g. ["vegetarian", "quick"]). */
  tags?: string[];
  /** How many candidate URLs to ask the search engine for. */
  candidateCount?: number;
}

const DEFAULT_CANDIDATES = 30;

export async function searchWebUrls(opts: SearchOpts): Promise<SearchResults> {
  const fullQuery = buildQuery(opts);
  const count = opts.candidateCount ?? DEFAULT_CANDIDATES;

  if (process.env.BRAVE_API_KEY) {
    return searchBrave(opts, fullQuery, count);
  }
  if (process.env.SERPAPI_KEY) {
    return searchSerpApi(opts, fullQuery, count);
  }
  throw new SearchUnavailableError(
    "No search provider configured. Set BRAVE_API_KEY or SERPAPI_KEY in .env.local.",
  );
}

/**
 * Recover the user-facing spelling correction from an engine-corrected *full*
 * query by stripping back the scaffolding (`buildQuery` appends the tags and
 * the word "recipe"). Returns undefined when nothing meaningful changed.
 */
function deriveCorrection(
  altered: string | undefined,
  opts: SearchOpts,
): string | undefined {
  if (!altered) return undefined;
  let s = altered.trim();
  const appended = [...(opts.tags ?? []), "recipe"];
  for (const part of [...appended].reverse()) {
    s = s.replace(new RegExp(`\\s*${escapeRegExp(part)}\\s*$`, "i"), "").trim();
  }
  const original = (opts.query ?? "").trim();
  if (!s || !original) return undefined;
  return s.toLowerCase() === original.toLowerCase() ? undefined : s;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class SearchUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchUnavailableError";
  }
}

function buildQuery({ query, tags }: SearchOpts): string {
  const parts = [query.trim(), ...(tags ?? []), "recipe"].filter(
    Boolean,
  ) as string[];
  return parts.join(" ");
}

/* --------------------------------- Brave --------------------------------- */

interface BraveResult {
  url: string;
  title: string;
  description?: string;
}

interface BraveResponse {
  web?: { results?: BraveResult[] };
  query?: { original?: string; altered?: string };
}

async function searchBrave(
  opts: SearchOpts,
  query: string,
  count: number,
): Promise<SearchResults> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(count, 20)));
  url.searchParams.set("safesearch", "moderate");
  url.searchParams.set("freshness", "py"); // past year — favor non-stale recipes

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": process.env.BRAVE_API_KEY!,
    },
    // Brave can be slow during peak — give it room.
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    throw new Error(`Brave Search ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as BraveResponse;
  const results = json.web?.results ?? [];

  const hits = results.slice(0, count).map((r, i) => ({
    url: r.url,
    title: stripTags(r.title ?? ""),
    snippet: stripTags(r.description ?? ""),
    rank: i,
  }));
  return { hits, correctedQuery: deriveCorrection(json.query?.altered, opts) };
}

/* -------------------------------- SerpAPI -------------------------------- */

interface SerpApiOrganicResult {
  link: string;
  title: string;
  snippet?: string;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
  search_information?: {
    spelling_fix?: string;
    corrected_query?: string;
  };
}

async function searchSerpApi(
  opts: SearchOpts,
  query: string,
  count: number,
): Promise<SearchResults> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(count));
  url.searchParams.set("api_key", process.env.SERPAPI_KEY!);

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`SerpAPI ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as SerpApiResponse;
  const results = json.organic_results ?? [];

  const hits = results.slice(0, count).map((r, i) => ({
    url: r.link,
    title: stripTags(r.title ?? ""),
    snippet: stripTags(r.snippet ?? ""),
    rank: i,
  }));
  const altered =
    json.search_information?.corrected_query ??
    json.search_information?.spelling_fix;
  return { hits, correctedQuery: deriveCorrection(altered, opts) };
}

/* -------------------------------- helpers -------------------------------- */

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
