"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, ChefHat, User } from "lucide-react";
import { useCookingSession } from "@/hooks/useCookingSession";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
};

const STATIC_ITEMS: Item[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  {
    href: "/saved",
    label: "Saved",
    icon: Bookmark,
    match: (p) => p.startsWith("/saved"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
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

  if (pathname.endsWith("/cook")) return null;

  const items = [...STATIC_ITEMS];
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
