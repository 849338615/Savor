"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useSaved } from "@/hooks/useSaved";
import { useCookingSession } from "@/hooks/useCookingSession";
import {
  AmbientLayer,
  Bloom,
} from "@/components/layout/AmbientBackground";

interface Row {
  label: string;
  meta?: string;
  href?: string;
}

export default function ProfilePage() {
  const savedCount = useSaved((s) => Object.keys(s.ids).length);
  const recipeTitle = useCookingSession((s) => s.recipeTitle);
  const recipeSlug = useCookingSession((s) => s.recipeSlug);
  const stepIndex = useCookingSession((s) => s.stepIndex);
  const totalSteps = useCookingSession((s) => s.totalSteps);
  const hasHydrated = useCookingSession((s) => s.hasHydrated);
  const resetSession = useCookingSession((s) => s.reset);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows: Row[] = [
    { label: "Saved recipes", meta: String(savedCount), href: "/saved" },
    { label: "Dietary preferences", meta: "Not set" },
    { label: "Units", meta: "Metric" },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Avatar spotlight — a soft top-center warm bloom that focuses
          attention around the user's avatar without competing with the
          settings rows below. Composes with the AppShell base bloom for
          a layered, personal warmth. */}
      <AmbientLayer>
        <Bloom
          position="left-1/2 -top-[20%] -translate-x-1/2"
          size="w-[95%]"
          tone="sand"
          opacity={38}
          fadeAt={58}
        />
      </AmbientLayer>
      <header className="relative px-5 pb-2 pt-[max(env(safe-area-inset-top,1rem),3.5rem)] text-center">
        <div
          className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-sage-mist font-display text-[26px] font-semibold text-forest"
          aria-hidden
        >
          ·
        </div>
        <h1 className="mt-3 font-display text-[22px] font-semibold text-ink">
          You
        </h1>
        <p className="mt-1 text-[13px] text-stone">
          Sign in to sync saved recipes across devices.
        </p>
      </header>

      {mounted && hasHydrated && recipeSlug && recipeTitle ? (
        <section className="relative mx-5 mt-5 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-cream px-4 py-4">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest">
            <span aria-hidden className="h-px w-5 bg-forest/45" />
            In progress
          </p>
          <p className="mt-1 font-display text-[16px] font-semibold leading-snug text-ink">
            {recipeTitle}
          </p>
          <p className="mt-0.5 text-[12px] tabular-nums text-stone">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/recipe/${recipeSlug}/cook`}
              className="grid h-9 place-items-center rounded-[var(--radius-pill)] bg-forest px-3.5 text-[12px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)]"
            >
              Resume
            </Link>
            <button
              type="button"
              onClick={resetSession}
              className="grid h-9 place-items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-3.5 text-[12px] font-semibold text-stone transition-colors hover:text-ink"
            >
              End session
            </button>
          </div>
        </section>
      ) : null}

      <ul className="relative mt-5">
        {rows.map((r, i) => {
          const isFirst = i === 0;
          const isLast = i === rows.length - 1;
          const Inner = (
            <>
              <span className="flex-1 text-[15px] text-ink">{r.label}</span>
              {r.meta ? (
                <span className="text-[13px] text-stone">{r.meta}</span>
              ) : null}
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                className="text-[color:var(--fg-3)]"
              />
            </>
          );
          const className = `flex w-full items-center gap-3.5 border-t border-[var(--border-hairline)] px-5 py-4 ${
            isLast ? "border-b" : ""
          } ${isFirst ? "" : ""}`;
          return (
            <li key={r.label} className="bg-surface">
              {r.href ? (
                <Link href={r.href} className={className}>
                  {Inner}
                </Link>
              ) : (
                <button type="button" className={`${className} text-left`}>
                  {Inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
