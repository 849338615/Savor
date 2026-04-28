"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LastResultsState {
  q: string;
  tag: string;
  hasHydrated: boolean;

  record: (q: string, tag: string) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useLastResults = create<LastResultsState>()(
  persist(
    (set) => ({
      q: "",
      tag: "",
      hasHydrated: false,

      record: (q, tag) => set({ q, tag }),
      clear: () => set({ q: "", tag: "" }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "savor-last-results",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ q: s.q, tag: s.tag }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function buildResultsHref(q: string, tag: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
  const search = params.toString();
  return `/results${search ? `?${search}` : ""}`;
}
