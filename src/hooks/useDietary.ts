"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Standing dietary preferences — a persisted set of diet tags (drawn from
 * `DIET_OPTIONS` in `lib/filters`, so they're the same tokens the search
 * filters use). They pre-seed the home search filters, so every search
 * respects the user's diet by default while staying adjustable per search.
 *
 * `hasHydrated` follows the same discipline as the other persisted stores:
 * consumers read the empty default until rehydration completes, keeping
 * server-rendered markup and the first client render in agreement.
 */
interface DietaryState {
  tags: string[];
  hasHydrated: boolean;
  toggle: (tag: string) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useDietary = create<DietaryState>()(
  persist(
    (set) => ({
      tags: [],
      hasHydrated: false,
      toggle: (tag) =>
        set((s) => ({
          tags: s.tags.includes(tag)
            ? s.tags.filter((t) => t !== tag)
            : [...s.tags, tag],
        })),
      clear: () => set({ tags: [] }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "savor-dietary",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tags: s.tags }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
