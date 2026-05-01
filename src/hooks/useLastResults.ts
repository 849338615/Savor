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

/**
 * "Last results" backs the Home tab's redirect-to-current-search behavior.
 * Scoped to the *session* (not localStorage) on purpose:
 *  - Cross-session leakage feels wrong here. Re-launching the app should
 *    greet the user with the welcome hero, not yesterday's search.
 *  - Within a session, the user expects Home to return them to whatever
 *    they were last browsing — sessionStorage covers reloads and
 *    bfcache-restores while still resetting on a real new session.
 *
 * The store is also cleared explicitly when the user lands on `/`
 * (welcome) — the natural "leave the results section" gesture.
 */
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
      storage: createJSONStorage(() => sessionStorage),
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
