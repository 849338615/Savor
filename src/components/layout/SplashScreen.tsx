"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AmbientLayer, Bloom } from "./AmbientBackground";

/**
 * Savor launch screen — "The Simmer".
 *
 * Shown once on each cold load of the app (a full page load / true launch).
 * It is rendered inline as the top layer of the AppShell card — *not* mounted
 * behind a client-only flag — so it is part of the server-rendered HTML and
 * covers the app from the very first paint. The app never flashes behind it.
 * In-app navigation keeps the AppShell mounted, so this never re-fires on
 * route changes; only a real reload replays it.
 *
 * The composition reuses the brand's own vocabulary so the launch feels like
 * the app exhaling into view, not a generic spinner:
 *  - warm cream field with the same ambient sand/sage blooms as every screen;
 *  - the pot-and-leaf mark settles in and breathes, as if simmering;
 *  - three steam wisps rise and dissipate — the same "something is cooking"
 *    metaphor the in-app loading indicator (<PulseDot />) uses, scaled up;
 *  - the `savor` wordmark wipes in left-to-right, like ink being savored;
 *  - a hairline tagline and a slim progress thread ground the screen, then the
 *    whole surface lifts away to reveal the home screen.
 *
 * Motion is fully gated on `prefers-reduced-motion`: no drawing, no steam, no
 * breathing — just a brief, calm cross-fade. (The global reduced-motion CSS
 * rule only covers CSS animations; motion/react needs this JS gate too.)
 *
 * No-JS safety: AppShell renders a <noscript> rule that hides `.savor-splash`
 * outright, so visitors without JavaScript see the app immediately rather than
 * a logo that never animates away.
 */

const EASE_SOFT = [0.16, 1, 0.3, 1] as const; // --ease-out-soft
const HOLD_MS = 2300; // calm beat before the screen lifts away
const HOLD_REDUCED_MS = 850;

/**
 * Read `prefers-reduced-motion` in an SSR/hydration-safe way. The server (and
 * the first client render) get `false`, so the markup matches and hydration
 * never fails; React then re-renders with the real value. Using
 * `useSyncExternalStore` (the same pattern as <WelcomeHero />) keeps this out
 * of an effect, so it sidesteps cascading-render lint and reads cleanly.
 */
let reducedMql: MediaQueryList | null = null;
const reducedQuery = "(prefers-reduced-motion: reduce)";
function getReducedMql() {
  return (reducedMql ??= window.matchMedia(reducedQuery));
}
function subscribeReduced(onChange: () => void) {
  const mql = getReducedMql();
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => getReducedMql().matches,
    () => false,
  );
}

export function SplashScreen() {
  const reduce = usePrefersReducedMotion();
  const [show, setShow] = useState(true);

  const dismiss = useCallback(() => setShow(false), []);

  // Auto-dismiss after the hold; allow a tap / key press to skip ahead.
  useEffect(() => {
    const t = window.setTimeout(dismiss, reduce ? HOLD_REDUCED_MS : HOLD_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduce, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="savor-splash absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 18%, var(--bg-surface) 0%, var(--bg-app) 46%, var(--bg-cream) 100%)",
            transformOrigin: "50% 44%",
          }}
          // Opaque from first paint (SSR) so the app never shows through.
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 1.035 }}
          transition={{ duration: reduce ? 0.32 : 0.56, ease: EASE_SOFT }}
          onClick={dismiss}
          role="status"
          aria-label="Savor is starting"
        >
          {/* Ambient warmth — the same blooms the rest of the app composes. */}
          <AmbientLayer>
            <Bloom
              position="-right-[18%] -top-[14%]"
              size="w-[85%]"
              tone="sand"
              opacity={58}
              fadeAt={66}
            />
            <Bloom
              position="-left-[22%] bottom-[2%]"
              size="w-[80%]"
              tone="sage"
              opacity={34}
              fadeAt={68}
            />
          </AmbientLayer>

          {/* Center lockup. Nudged slightly above optical center so the
              tagline + progress thread settle into the lower third. */}
          <div className="relative z-10 -mt-6 flex flex-col items-center px-8">
            <MarkStage reduce={!!reduce} />

            {/* Wordmark — wipes in left-to-right, blur resolving to sharp.
                Keyed on `reduce` so resolving the preference after mount
                remounts with the reduced transition from t=0 (a swap of only
                the transition would keep the full-motion delay baked in). */}
            <motion.img
              key={`word-${reduce ? "r" : "f"}`}
              src="/brand/savor-wordmark-cut.png"
              alt="Savor"
              width={150}
              height={35}
              fetchPriority="high"
              decoding="sync"
              draggable={false}
              className="mt-[22px] h-auto w-[150px] select-none"
              // Constant initial/animate (same keys in both modes) so the
              // mount-gate's first no-preference render can't strand a property
              // at its hidden value. Reduced motion fades opacity and snaps the
              // clip/blur via the `default` transition — a calm fade, no wipe.
              initial={{
                opacity: 0,
                clipPath: "inset(0 100% 0 0)",
                filter: "blur(7px)",
              }}
              animate={{
                opacity: 1,
                clipPath: "inset(0 0% 0 0)",
                filter: "blur(0px)",
              }}
              transition={
                reduce
                  ? { opacity: { duration: 0.45, delay: 0.08 }, default: { duration: 0.001 } }
                  : { duration: 0.82, ease: EASE_SOFT, delay: 0.72 }
              }
            />

            {/* Hairline tagline — echoes the WelcomeHero eyebrow motif. */}
            <motion.div
              key={`tag-${reduce ? "r" : "f"}`}
              className="mt-5 flex items-center gap-3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { opacity: { duration: 0.45, delay: 0.12 }, default: { duration: 0.001 } }
                  : { duration: 0.6, ease: EASE_SOFT, delay: 1.35 }
              }
            >
              <span className="block h-px w-6 bg-[color-mix(in_oklch,var(--color-olive)_60%,transparent)]" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-olive">
                Focus on cooking
              </span>
              <span className="block h-px w-6 bg-[color-mix(in_oklch,var(--color-olive)_60%,transparent)]" />
            </motion.div>
          </div>

          {/* Progress thread — slim, determinate, fills across the hold so the
              screen reads as "loading" without a spinner competing with the
              steam. Hidden under reduced motion. */}
          {!reduce && (
            <div
              aria-hidden
              className="absolute bottom-[max(env(safe-area-inset-bottom,1rem),2.75rem)] left-1/2 h-[2px] w-[116px] -translate-x-1/2 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--color-forest)_12%,transparent)]"
            >
              <motion.span
                className="block h-full w-full origin-left rounded-full bg-[color-mix(in_oklch,var(--color-forest)_55%,transparent)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: HOLD_MS / 1000,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </div>
          )}

          <span className="sr-only">Loading Savor</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The pot-and-leaf mark plus its rising steam. Two nested motion layers keep
 * concerns separate: the outer layer plays the one-shot entrance (settle), the
 * inner layer runs a continuous, barely-there "breathing" loop — the mark
 * looking alive on the heat. Steam is anchored to this stage so it always sits
 * just over the lid regardless of viewport size.
 */
function MarkStage({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {!reduce && <Steam />}
      <motion.div
        key={`mark-${reduce ? "r" : "f"}`}
        initial={{ opacity: 0, scale: 0.86, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reduce
            ? { opacity: { duration: 0.5, delay: 0.05 }, default: { duration: 0.001 } }
            : { duration: 0.9, ease: EASE_SOFT, delay: 0.12 }
        }
      >
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.018, 1] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 4.6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 1.1,
                }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/savor-mark-cut.png"
            alt=""
            width={146}
            height={111}
            fetchPriority="high"
            decoding="sync"
            draggable={false}
            className="h-auto w-[146px] select-none drop-shadow-[0_8px_22px_rgba(31,77,58,0.12)]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Three steam wisps rising from the pot. Each path "draws" from base to tip via
 * pathLength, then dissipates as opacity falls; a gentle upward drift adds lift.
 * Staggered by a third of the cycle so a wisp is always mid-rise — calm, never
 * busy. Anchored above the lid; sits behind the mark's drop shadow.
 */
function Steam() {
  const wisps = [
    { d: "M20 74 C16 62, 23 53, 19.5 42 C16.5 34, 21 28, 19.5 21", delay: 0 },
    { d: "M32 74 C27.5 60, 37.5 50, 32 31 C28 21, 34 15, 32 8", delay: 0.85 },
    { d: "M44 74 C48 62, 41 53, 45 42 C48 34, 43.5 28, 45 22", delay: 1.7 },
  ];
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 bottom-[80%] z-10 h-[70px] w-[58px] -translate-x-1/2"
    >
      <svg
        viewBox="0 0 64 80"
        className="h-full w-full overflow-visible"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          {/* Forest at the base fading to nothing at the tip — steam read
              against a backlight, the same idea as <PulseDot />. */}
          <linearGradient
            id="savor-splash-steam"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="80"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stopColor="var(--color-forest)" stopOpacity="0.62" />
            <stop offset="48%" stopColor="var(--color-forest)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--color-forest)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {wisps.map((w, i) => (
          <motion.path
            key={i}
            d={w.d}
            stroke="url(#savor-splash-steam)"
            initial={{ pathLength: 0, opacity: 0, y: 6 }}
            animate={{ pathLength: 1, opacity: [0, 0.85, 0.85, 0], y: -10 }}
            transition={{
              pathLength: {
                duration: 1.5,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.9,
                delay: w.delay,
              },
              opacity: {
                duration: 2.4,
                times: [0, 0.32, 0.62, 1],
                ease: "easeInOut",
                repeat: Infinity,
                delay: w.delay,
              },
              y: {
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
                delay: w.delay,
              },
            }}
          />
        ))}
      </svg>
    </span>
  );
}
