"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecipeSummary } from "@/lib/recipes/types";

/**
 * Saved-recipes store.
 *
 * Each saved id keeps a `RecipeSummary` snapshot in `summaries` so the Saved
 * tab can render instantly from localStorage — no `/api/recipes/[id]` round
 * trip, no extraction pipeline, no spinner. The snapshot is captured at the
 * moment of bookmark from whatever surface the user tapped (search results,
 * detail hero, etc.).
 *
 * `ids` remains the source of truth for "is this saved?" and is what older
 * persisted state is migrated from. Snapshots are best-effort: legacy ids
 * without a snapshot cause the Saved tab to lazy-hydrate them through the
 * API, then write the result back here so subsequent visits are instant.
 */

interface SavedState {
  ids: Record<string, true>;
  summaries: Record<string, RecipeSummary>;
  savedAt: Record<string, number>;

  toggle: (id: string, summary?: RecipeSummary) => void;
  remove: (id: string) => void;
  setSummary: (id: string, summary: RecipeSummary) => void;
  isSaved: (id: string) => boolean;
  count: () => number;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      ids: {},
      summaries: {},
      savedAt: {},

      toggle: (id, summary) =>
        set((s) => {
          if (s.ids[id]) {
            const ids = { ...s.ids };
            const summaries = { ...s.summaries };
            const savedAt = { ...s.savedAt };
            delete ids[id];
            delete summaries[id];
            delete savedAt[id];
            return { ids, summaries, savedAt };
          }
          return {
            ids: { ...s.ids, [id]: true },
            summaries: summary
              ? { ...s.summaries, [id]: summary }
              : s.summaries,
            savedAt: { ...s.savedAt, [id]: Date.now() },
          };
        }),

      remove: (id) =>
        set((s) => {
          if (!s.ids[id] && !s.summaries[id]) return s;
          const ids = { ...s.ids };
          const summaries = { ...s.summaries };
          const savedAt = { ...s.savedAt };
          delete ids[id];
          delete summaries[id];
          delete savedAt[id];
          return { ids, summaries, savedAt };
        }),

      setSummary: (id, summary) =>
        set((s) => ({
          summaries: { ...s.summaries, [id]: summary },
        })),

      isSaved: (id) => !!get().ids[id],
      count: () => Object.keys(get().ids).length,
    }),
    {
      name: "savor-saved-recipes",
      version: 2,
      migrate: (persisted, version) => {
        // v0/v1 stored only `ids`. Backfill the new fields so existing
        // bookmarks survive the upgrade — they'll lazy-hydrate their
        // summaries on the next visit to the Saved tab.
        if (!persisted || typeof persisted !== "object") return persisted;
        const p = persisted as Partial<SavedState> & { ids?: Record<string, true> };
        if (version < 2) {
          return {
            ...p,
            ids: p.ids ?? {},
            summaries: p.summaries ?? {},
            savedAt: p.savedAt ?? {},
          } as SavedState;
        }
        return p as SavedState;
      },
    },
  ),
);
