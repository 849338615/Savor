"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Home, Bookmark, ChefHat, User } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCookingSession } from "@/hooks/useCookingSession";
import { useLastResults, buildResultsHref } from "@/hooks/useLastResults";
import { useNav, sectionForPath, type Section } from "@/hooks/useNav";
import { TAB, ENTER_COOK } from "@/lib/transitions";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: typeof Home;
  section?: Section;
  match: (p: string) => boolean;
  /** View-transition type for this tab. Defaults to a peer crossfade (TAB). */
  transitionTypes?: string[];
};

const STATIC_ITEMS: Item[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    section: "home",
    // Once the user has searched, /results is their home — keep the Home
    // tab highlighted while they browse results so the IA stays coherent
    // with the redirected href below.
    match: (p) => p === "/" || p.startsWith("/results"),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: Bookmark,
    section: "saved",
    match: (p) => p.startsWith("/saved"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    section: "profile",
    match: (p) => p.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const recipeSlug = useCookingSession((s) => s.recipeSlug);
  const recipeId = useCookingSession((s) => s.recipeId);
  const hasHydrated = useCookingSession((s) => s.hasHydrated);
  const lastQ = useLastResults((s) => s.q);
  const lastTag = useLastResults((s) => s.tag);
  const lastHydrated = useLastResults((s) => s.hasHydrated);
  const clearLastResults = useLastResults((s) => s.clear);
  const setSection = useNav((s) => s.setSection);
  const reduce = useReducedMotion();

  // Keep the active section in sync with the URL. Direct nav, deep links,
  // and back/forward all flow through here. /recipe/* paths intentionally
  // return null so the user keeps the section they entered from.
  //
  // Landing on `/` is also the explicit "leave results" gesture: clear
  // any stored query so the Home tab won't bounce the user back to a
  // results page they intentionally left.
  useEffect(() => {
    const next = sectionForPath(pathname);
    if (next) setSection(next);
    if (pathname === "/") clearLastResults();
  }, [pathname, setSection, clearLastResults]);

  // Hidden on focus screens: cook mode and the recipe detail/decision screen.
  // Both are reached by forward navigation, both carry their own back
  // affordance plus a single dominant action — a hovering tab bar would only
  // clutter them. (The view-transition CSS renders the nav's old snapshot as
  // display:none, so it simply vanishes rather than sliding out.)
  if (pathname.startsWith("/recipe/")) return null;

  const items = STATIC_ITEMS.map((item) => {
    if (item.label !== "Home") return item;
    if (!lastHydrated) return item;
    if (!lastQ && !lastTag) return item;
    return { ...item, href: buildResultsHref(lastQ, lastTag) };
  });
  if (hasHydrated && recipeId && recipeSlug) {
    items.splice(2, 0, {
      href: `/recipe/${recipeSlug}/cook`,
      label: "Resume",
      icon: ChefHat,
      match: () => false,
      // Resuming drops into full-screen focus mode (nav bar disappears), so
      // it gets the "step into focus" motion rather than a peer crossfade.
      transitionTypes: [ENTER_COOK],
    });
  }

  // On-brand morph: ease-out-soft, no spring/bounce (mirrors --ease-out-soft /
  // --duration-base in globals.css). Collapses to an instant swap when the
  // user prefers reduced motion.
  const morph = reduce
    ? { duration: 0 }
    : ({ duration: 0.34, ease: [0.16, 1, 0.3, 1] } as const);

  return (
    <nav
      aria-label="Primary"
      className="nav-island absolute left-1/2 z-30 -translate-x-1/2 rounded-full p-1.5"
      style={{
        // Anchored during page transitions — see globals.css. Keeps the bar
        // fixed while page content slides/fades beneath it.
        viewTransitionName: "bottom-nav",
        bottom: "calc(env(safe-area-inset-bottom) + 0.625rem)",
      }}
    >
      <ul className="flex items-center gap-1">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <motion.li
                key={item.label}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={morph}
                className="flex"
              >
                <Link
                  href={item.href}
                  transitionTypes={item.transitionTypes ?? [TAB]}
                  onClick={() => {
                    if (item.section) setSection(item.section);
                  }}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={cn(
                    "relative flex h-11 items-center justify-center overflow-hidden rounded-full transition-[color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "bg-forest text-soft-white shadow-[0_3px_12px_-3px_rgba(31,77,58,0.6)]"
                      : "text-stone hover:bg-white/45 hover:text-ink",
                  )}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center">
                    <Icon
                      size={21}
                      strokeWidth={active ? 2 : 1.85}
                      aria-hidden
                    />
                  </span>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span
                        key="label"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={morph}
                        className="overflow-hidden"
                      >
                        <span className="block whitespace-nowrap pl-0.5 pr-4 text-[13px] font-semibold leading-none tracking-[-0.01em]">
                          {item.label}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </nav>
  );
}
