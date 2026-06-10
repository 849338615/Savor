"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  Leaf,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import { useSaved } from "@/hooks/useSaved";
import { useCookingSession } from "@/hooks/useCookingSession";
import { useUnits } from "@/hooks/useUnits";
import { useDietary } from "@/hooks/useDietary";
import { unitSystemLabel } from "@/lib/units/convert";
import { labelForTag } from "@/lib/filters";
import { ENTER_COOK, NAV_FORWARD } from "@/lib/transitions";
import {
  AmbientLayer,
  Bloom,
} from "@/components/layout/AmbientBackground";

interface Row {
  label: string;
  meta?: string;
  href?: string;
  icon: LucideIcon;
}

export default function ProfilePage() {
  const savedCount = useSaved((s) => Object.keys(s.ids).length);
  const recipeTitle = useCookingSession((s) => s.recipeTitle);
  const recipeSlug = useCookingSession((s) => s.recipeSlug);
  const stepIndex = useCookingSession((s) => s.stepIndex);
  const totalSteps = useCookingSession((s) => s.totalSteps);
  const hasHydrated = useCookingSession((s) => s.hasHydrated);
  const resetSession = useCookingSession((s) => s.reset);

  const unitSystem = useUnits((s) => s.system);
  const unitsHydrated = useUnits((s) => s.hasHydrated);

  const dietaryTags = useDietary((s) => s.tags);
  const dietaryHydrated = useDietary((s) => s.hasHydrated);
  const dietaryMeta =
    !dietaryHydrated || dietaryTags.length === 0
      ? "Not set"
      : dietaryTags.length === 1
        ? labelForTag(dietaryTags[0])
        : `${dietaryTags.length} selected`;

  const rows: Row[] = [
    {
      label: "Saved recipes",
      meta: String(savedCount),
      href: "/saved",
      icon: Bookmark,
    },
    {
      label: "Dietary preferences",
      meta: dietaryMeta,
      href: "/profile/dietary",
      icon: Leaf,
    },
    {
      label: "Units",
      meta: unitsHydrated ? unitSystemLabel(unitSystem) : "Metric",
      href: "/profile/units",
      icon: Ruler,
    },
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
          className="mx-auto grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full"
          aria-hidden
        >
          <svg
            viewBox="0 0 64 64"
            className="h-[72px] w-[72px] text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Toque crown — three puffs */}
            <path d="M19 33c-5.5 0-9.5-4-9.5-9.2 0-4.6 3.6-8.4 8.2-8.6 1-4.4 5-7.7 9.8-7.7 3.3 0 6.2 1.6 8 4 1.4-1 3.1-1.6 5-1.6 4.4 0 8 3.4 8.4 7.7 4.1.5 7.3 4 7.3 8.2 0 5.2-4 9.2-9.5 9.2" />
            {/* Hat band */}
            <path d="M19 33v15.5c0 1.4 1.1 2.5 2.5 2.5h21c1.4 0 2.5-1.1 2.5-2.5V33" />
            <path d="M19 41h26" />
            {/* Pleat hints on the band */}
            <path d="M27 41v10M37 41v10" />
          </svg>
        </div>
        <h1 className="mt-3 font-display text-[22px] font-semibold text-ink">
          You
        </h1>
        <p className="mt-1 text-[13px] text-stone">
          Sign in to sync saved recipes across devices.
        </p>
      </header>

      {hasHydrated && recipeSlug && recipeTitle ? (
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
              transitionTypes={[ENTER_COOK]}
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

      <ul className="relative mt-5 flex flex-col gap-2.5 px-5">
        {rows.map((r) => {
          const Icon = r.icon;
          const Inner = (
            <>
              <span
                aria-hidden
                className="grid w-6 shrink-0 place-items-center text-forest"
              >
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-[15px] text-ink">{r.label}</span>
              {r.meta ? (
                <span className="text-[13px] text-stone">{r.meta}</span>
              ) : null}
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                className="shrink-0 text-[color:var(--fg-3)]"
              />
            </>
          );
          const className =
            "flex w-full items-center gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-surface px-3.5 py-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-cream";
          return (
            <li key={r.label}>
              {r.href ? (
                <Link
                  href={r.href}
                  transitionTypes={[NAV_FORWARD]}
                  className={className}
                >
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
