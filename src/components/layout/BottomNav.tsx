"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Home, Bookmark, ChefHat, User } from "lucide-react";
import { useCookingSession } from "@/hooks/useCookingSession";
import { useLastResults, buildResultsHref } from "@/hooks/useLastResults";
import { useNav, sectionForPath, type Section } from "@/hooks/useNav";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: typeof Home;
  section?: Section;
  match: (p: string) => boolean;
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

/**
 * Bottom tab bar. Hidden during cook mode. The Cook tab only appears when
 * a real session exists; tapping it resumes that exact recipe rather than
 * promising one and dropping the user on the home screen.
 */
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

  if (pathname.endsWith("/cook")) return null;

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
      match: (p) => p.includes("/cook"),
    });
  }

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 border-t border-[var(--border-hairline)] bg-soft-white"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
      }}
    >
      <ul className="flex items-stretch justify-around px-2 pt-2">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                onClick={() => {
                  if (item.section) setSection(item.section);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-forest" : "text-stone hover:text-ink",
                )}
              >
                <Icon size={22} strokeWidth={1.75} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
