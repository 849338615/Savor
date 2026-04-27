# Savor

A calm cooking app prototype. Search → top 8 results → structured recipe → guided one-step-at-a-time cooking mode.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 with brand tokens in `globals.css`
- Motion (framer-motion successor) for restrained transitions
- Zustand for the cooking session
- `@anthropic-ai/sdk` for the LLM extraction fallback
- Lucide React icons + custom SVG brand mark

## Run locally
```bash
npm install      # already done if you scaffolded with this repo
cp .env.example .env.local   # fill in keys for live recipes (optional)
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

Best viewed at a phone-sized viewport (390 × 844 in DevTools is ideal). On larger screens the app stays as a centered phone-shaped column — by design.

## Routes
| Path | Screen |
|---|---|
| `/` | Search (logo, search bar, mood chips) |
| `/results?q=…&tag=…` | Top 8 recipe results from the active provider |
| `/recipe/[id]` | Detail (Ingredients / Steps tabs, sticky Start Cooking) |
| `/recipe/[id]/cook` | Guided cooking — one step per screen, ←/→ navigates |
| `/saved` | Bookmarked recipes (client-side, persisted via Zustand) |
| `/api/recipes/[id]` | Internal JSON endpoint used by client components |

## Recipe providers
Two providers implement the same interface (`src/lib/recipes/provider.ts`):

- **`mockProvider`** — eight in-repo recipes (`mockData.ts`). Always available, no API keys.
- **`realProvider`** — live Google → Schema.org JSON-LD → Claude fallback pipeline. Selects the top 8 by quality score (rating × log(reviews) + search rank + domain authority + completeness gate). See [Live extraction](#live-recipe-extraction-real-provider).

`getProvider()` (`src/lib/recipes/getProvider.ts`) picks one based on `RECIPE_PROVIDER`:
- `auto` (default) — real if a search key is set, else mock.
- `real` — force real (errors if unconfigured).
- `mock` — force mock.

When real is active, mock-id detail pages (e.g. saved recipes from a previous mock-mode session) still resolve via a transparent fallback.

## Live recipe extraction (real provider)
The pipeline:

1. **Search** — `searchWebUrls` calls Brave Search (default) or SerpAPI for ~30 candidates with `<query> recipe` and the active tag mixed in.
2. **Fetch** — `fetchHtml` pulls each page's HTML (parallel, capped concurrency=6, 8s timeout, 2MB cap).
3. **Structured parse** — `parseJsonLdRecipe` extracts the Schema.org `Recipe` block from `<script type="application/ld+json">`. Most editorial sites (NYT Cooking, Bon Appétit, Serious Eats, Smitten Kitchen, Food52, King Arthur, Allrecipes) publish this — fast, reliable, free.
4. **LLM fallback** — `extractRecipeWithLlm` calls Claude (`claude-opus-4-7` default, JSON-schema output, prompt-cached system prefix) for pages without JSON-LD.
5. **Score** — `scoreCandidate` blends:
   - `ratingValue × log10(reviewCount + 1)` (primary signal)
   - search-rank prior (0–10 → small linear bonus)
   - trusted-domain boost (NYT Cooking, Bon Appétit, etc. get +4; Pinterest / TikTok / Reddit are blocked)
   - completeness gate (≥3 ingredients, ≥2 steps — vetoed if not)
6. **Top 8** — sorted by score, returned to the UI.

Results are cached in-process: searches for 5 minutes, individual recipes for 24 hours, negative cache (failed URLs) for 15 minutes. For multi-instance deploys, swap `TtlCache` for Vercel KV / Redis behind the same interface.

### Required env vars
See `.env.example`. Minimum for live mode:
- One of `BRAVE_API_KEY` (free tier) or `SERPAPI_KEY` (paid).
- `ANTHROPIC_API_KEY` — only needed for sites without JSON-LD. The pipeline still works without it; it just drops blog-style results that don't publish Schema.org.

### Adding a new search backend
Implement a function with the `searchWebUrls` signature returning `SearchHit[]` and add it to the conditional in `src/lib/recipes/extraction/search.ts`. Everything downstream is backend-agnostic.

## Architecture
- `src/lib/recipes/provider.ts` — `RecipeProvider` interface (single seam).
- `src/lib/recipes/mockProvider.ts` — in-repo dataset.
- `src/lib/recipes/realProvider.ts` — wraps the extraction pipeline.
- `src/lib/recipes/getProvider.ts` — env-driven selection + mock fallback.
- `src/lib/recipes/extraction/` — search, fetch, JSON-LD, LLM, scoring, cache.
- `src/lib/recipes/idEncoding.ts` — base64url URL ↔ recipe-id round-trip.
- `src/hooks/useCookingSession.ts` — Zustand store for the cook flow.
- `src/hooks/useSaved.ts` — Zustand store for saved recipes (localStorage).

## Brand
Tokens are defined as CSS variables in `src/app/globals.css` and exposed to Tailwind via `@theme inline`. Use them as utilities: `bg-forest`, `text-stone`, `bg-linen`, `bg-sage-mist`, etc.
