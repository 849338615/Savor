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

export interface SearchOpts {
  /** Free-text user query — appended with " recipe" before being sent. */
  query: string;
  /** Optional tag/cuisine filters mixed into the query (e.g. ["vegetarian", "quick"]). */
  tags?: string[];
  /** How many candidate URLs to ask the search engine for. */
  candidateCount?: number;
}

const DEFAULT_CANDIDATES = 30;

export async function searchWebUrls(opts: SearchOpts): Promise<SearchHit[]> {
  const fullQuery = buildQuery(opts);
  const count = opts.candidateCount ?? DEFAULT_CANDIDATES;

  if (process.env.BRAVE_API_KEY) {
    return searchBrave(fullQuery, count);
  }
  if (process.env.SERPAPI_KEY) {
    return searchSerpApi(fullQuery, count);
  }
  throw new SearchUnavailableError(
    "No search provider configured. Set BRAVE_API_KEY or SERPAPI_KEY in .env.local.",
  );
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
}

async function searchBrave(query: string, count: number): Promise<SearchHit[]> {
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

  return results.slice(0, count).map((r, i) => ({
    url: r.url,
    title: stripTags(r.title ?? ""),
    snippet: stripTags(r.description ?? ""),
    rank: i,
  }));
}

/* -------------------------------- SerpAPI -------------------------------- */

interface SerpApiOrganicResult {
  link: string;
  title: string;
  snippet?: string;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
}

async function searchSerpApi(
  query: string,
  count: number,
): Promise<SearchHit[]> {
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

  return results.slice(0, count).map((r, i) => ({
    url: r.link,
    title: stripTags(r.title ?? ""),
    snippet: stripTags(r.snippet ?? ""),
    rank: i,
  }));
}

/* -------------------------------- helpers -------------------------------- */

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
