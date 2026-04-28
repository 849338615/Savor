"use client";

import { usePathname } from "next/navigation";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useLastResults, buildResultsHref } from "./useLastResults";

export type Section = "home" | "saved" | "profile";

interface NavState {
  section: Section;
  hasHydrated: boolean;
  setSection: (s: Section) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useNav = create<NavState>()(
  persist(
    (set) => ({
      section: "home",
      hasHydrated: false,
      setSection: (s) => set({ section: s }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "savor-nav",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ section: s.section }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

/** Map a pathname to its owning section, or null for shared screens
 *  (e.g. /recipe/*) that should inherit the user's current section. */
export function sectionForPath(pathname: string): Section | null {
  if (pathname === "/" || pathname.startsWith("/results")) return "home";
  if (pathname.startsWith("/saved")) return "saved";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

/**
 * Section-aware back target. The browser's history is linear across tabs,
 * so plain `router.back()` can yank the user out of their current section
 * (e.g. Saved → Home → press back lands on Saved). This resolver computes
 * a back href that stays inside the current tab.
 *
 * Returns null on tab roots (no back) or when the path is unknown — caller
 * decides the fallback (typically `router.back()` or hide the button).
 */
export function useSectionBackHref(): string | null {
  const pathname = usePathname() ?? "/";
  const section = useNav((s) => s.section);
  const lastQ = useLastResults((s) => s.q);
  const lastTag = useLastResults((s) => s.tag);

  // Tab roots — no back affordance.
  if (pathname === "/" || pathname === "/saved" || pathname === "/profile") {
    return null;
  }
  // Results lives under the Home section.
  if (pathname.startsWith("/results")) return "/";
  // Cook mode → recipe detail (handled inline by CookingClient, but keep
  // the rule here for completeness).
  if (pathname.endsWith("/cook")) return pathname.replace(/\/cook$/, "");
  // Recipe detail — return to the current section's landing page.
  if (pathname.startsWith("/recipe/")) {
    if (section === "saved") return "/saved";
    if (section === "profile") return "/profile";
    if (lastQ || lastTag) return buildResultsHref(lastQ, lastTag);
    return "/";
  }
  return null;
}
