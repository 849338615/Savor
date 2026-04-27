import Image from "next/image";
import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterChips } from "@/components/search/FilterChips";

/**
 * Idle home. The brand moment lives here — quiet mark, editorial headline,
 * supporting line. No recipes are previewed; the user picks a mood or types
 * a search and we route them to /results. The action zone is anchored to the
 * bottom so the search field sits where the thumb naturally rests.
 */
export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Quiet brand anchor */}
      <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,1rem),3.5rem)]">
        <Image
          src="/brand/savor-icon-mark.png"
          alt="Savor"
          width={1254}
          height={1254}
          className="h-9 w-9 object-contain"
          priority
        />
      </header>

      {/* Editorial hero */}
      <section className="flex flex-col gap-5 px-6 pt-12">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest">
          <span aria-hidden className="block h-px w-8 bg-forest/45" />
          Tonight
        </p>
        <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.015em] text-ink">
          What&rsquo;s for
          <br />
          dinner?
        </h1>
        <p className="max-w-[30ch] text-[15px] leading-[1.6] text-stone text-balance">
          Search a dish, an ingredient, or pick a mood. We&rsquo;ll guide you,
          one step at a time.
        </p>
      </section>

      {/* Spacer pushes the action zone to the bottom of the viewport */}
      <div className="flex-1" aria-hidden />

      {/* Anchored action zone */}
      <section className="flex flex-col gap-3 px-6 pb-3 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest">
          Try a mood
        </p>
        <Suspense fallback={<div className="h-9" />}>
          <FilterChips />
        </Suspense>
        <div className="pt-2">
          <SearchBar size="lg" />
        </div>
      </section>
    </div>
  );
}
