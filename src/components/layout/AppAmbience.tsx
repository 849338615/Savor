"use client";

import { usePathname } from "next/navigation";
import { AmbientLayer, Bloom } from "./AmbientBackground";

/**
 * App-wide ambient warmth — a sand bloom in the upper-right that plays through
 * most screens as the base identity layer. Sized and angled to stay clear of
 * where content usually sits (cards down the spine of the page) so it never
 * competes. Stronger compositions (HomeAmbience, cook focus, profile spotlight)
 * layer additional blooms on top.
 *
 * Anchored during page transitions: the named view-transition group (see
 * globals.css) keeps the warm bloom fixed while content moves.
 *
 * Opted out on the results list, which wants a clean, neutral backdrop behind
 * the dense result cards.
 */
export function AppAmbience() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/results")) return null;

  return (
    <AmbientLayer className="[view-transition-name:ambient-bg]">
      <Bloom
        position="-right-[30%] -top-[20%]"
        size="w-[120%]"
        tone="sand"
        opacity={52}
        fadeAt={64}
      />
    </AmbientLayer>
  );
}
