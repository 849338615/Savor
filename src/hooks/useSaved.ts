"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SavedState {
  ids: Record<string, true>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  count: () => number;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      ids: {},
      toggle: (id) =>
        set((s) => {
          const next = { ...s.ids };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { ids: next };
        }),
      isSaved: (id) => !!get().ids[id],
      count: () => Object.keys(get().ids).length,
    }),
    { name: "savor-saved-recipes" },
  ),
);
