"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Type } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CookingStep } from "@/components/cook/CookingStep";
import { CookingControls } from "@/components/cook/CookingControls";
import { TimerDisplay } from "@/components/cook/TimerDisplay";
import { Skeleton } from "@/components/feedback/Skeleton";
import { useCookingSession } from "@/hooks/useCookingSession";
import { useWakeLock } from "@/hooks/useWakeLock";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/recipes/types";

export function CookingClient({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const stepIndex = useCookingSession((s) => s.stepIndex);
  const recipeId = useCookingSession((s) => s.recipeId);
  const start = useCookingSession((s) => s.start);
  const next = useCookingSession((s) => s.next);
  const prev = useCookingSession((s) => s.prev);
  const goTo = useCookingSession((s) => s.goTo);
  const hasHydrated = useCookingSession((s) => s.hasHydrated);
  const largeText = useCookingSession((s) => s.largeText);
  const toggleLargeText = useCookingSession((s) => s.toggleLargeText);

  useWakeLock(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (recipeId !== recipe.id) {
      start(recipe.id, recipe.steps.length, {
        slug: recipe.slug,
        title: recipe.title,
      });
    }
  }, [
    hasHydrated,
    recipe.id,
    recipe.slug,
    recipe.title,
    recipe.steps.length,
    recipeId,
    start,
  ]);

  const safeIndex = Math.min(
    Math.max(0, stepIndex),
    Math.max(0, recipe.steps.length - 1),
  );
  const step = recipe.steps[safeIndex];
  const total = recipe.steps.length;
  const isLast = safeIndex === total - 1;

  const startX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 56) return;
    if (dx < 0 && !isLast) next();
    else if (dx > 0 && safeIndex > 0) prev();
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const exit = useCallback(() => {
    // Pop the /cook entry so back from /recipe returns to wherever the user
    // came from (results/saved/etc.). router.push would add a duplicate
    // /recipe entry, leaving /cook in history and trapping back-nav.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(`/recipe/${recipe.slug}`);
    }
  }, [router, recipe.slug]);

  const [confirmExit, setConfirmExit] = useState(false);
  const requestExit = () => {
    if (safeIndex === 0) return exit();
    setConfirmExit(true);
  };

  if (!hasHydrated) {
    return (
      <div
        className="flex h-full min-h-0 flex-col bg-cream"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
        }}
      >
        <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(env(safe-area-inset-top,1rem),3.5rem)]">
          <Skeleton className="h-11 w-11" rounded="pill" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-11" rounded="pill" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-7">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="flex gap-2.5 px-5 pt-3.5">
          <Skeleton className="h-[52px] flex-1" rounded="pill" />
          <Skeleton className="h-[52px] flex-1" rounded="pill" />
        </div>
      </div>
    );
  }

  const progressPct = total > 1 ? ((safeIndex + 1) / total) * 100 : 100;

  return (
    <div
      className="relative flex h-full min-h-0 flex-col bg-cream"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="sr-only">Cooking: {recipe.title}</h1>
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(env(safe-area-inset-top,1rem),3.5rem)]">
        <button
          type="button"
          onClick={requestExit}
          aria-label="Exit cooking"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-soft-white"
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] tabular-nums text-stone">
            Step {safeIndex + 1} of {total}
          </span>
          <div
            className="relative h-[3px] w-full max-w-[200px] overflow-hidden rounded-full bg-[var(--border-hairline)]"
            role="progressbar"
            aria-valuenow={safeIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          >
            <motion.span
              className="absolute inset-y-0 left-0 right-0 origin-left rounded-full bg-forest will-change-transform"
              initial={false}
              animate={{ scaleX: progressPct / 100 }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={toggleLargeText}
          aria-label={largeText ? "Use default text size" : "Use larger text"}
          aria-pressed={largeText}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full transition-colors",
            largeText
              ? "bg-sage-mist text-forest"
              : "text-ink hover:bg-soft-white",
          )}
        >
          <Type size={20} strokeWidth={1.75} />
        </button>
      </header>

      <ol
        aria-label="Step rail"
        className="mx-auto flex w-full max-w-[360px] items-center justify-between px-3 pb-1"
      >
        {recipe.steps.map((s, i) => {
          const done = i < safeIndex;
          const current = i === safeIndex;
          return (
            <li key={s.id} className="flex">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={current ? "step" : undefined}
                className="grid h-11 w-11 place-items-center"
              >
                <span
                  aria-hidden
                  className={cn(
                    "block h-2 w-2 rounded-full transition-colors",
                    current
                      ? "bg-forest"
                      : done
                      ? "bg-sage"
                      : "bg-[var(--border-strong)]",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-7 py-6 text-center",
          largeText && "text-[1.15em]",
        )}
      >
        <CookingStep step={step} largeText={largeText} />
        {step?.durationSeconds ? (
          <TimerDisplay
            suggestedSeconds={step.durationSeconds}
            size="large"
          />
        ) : null}
      </div>

      <div
        className="flex gap-2.5 px-5 pt-3.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
      >
        <CookingControls
          canPrev={safeIndex > 0}
          canNext={!isLast}
          isLast={isLast}
          recipeSlug={recipe.slug}
          onPrev={prev}
          onNext={next}
        />
      </div>

      <AnimatePresence>
        {confirmExit && (
          <motion.div
            className="absolute inset-0 z-40 flex items-end bg-[var(--scrim-modal)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setConfirmExit(false)}
          >
            <motion.div
              role="dialog"
              aria-label="Leave cooking?"
              className="w-full rounded-t-[var(--radius-2xl)] bg-soft-white px-6 pb-8 pt-6"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom), 2rem)",
              }}
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-display text-[20px] font-semibold leading-tight text-ink">
                Leave cooking?
              </p>
              <p className="mt-1.5 max-w-[34ch] text-[14px] leading-relaxed text-stone">
                Your progress will stay here, ready to pick up later.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmExit(false)}
                  className="h-12 flex-1 rounded-[var(--radius-pill)] border border-forest text-[14px] font-semibold text-forest transition-colors hover:bg-cream"
                >
                  Keep cooking
                </button>
                <button
                  type="button"
                  onClick={exit}
                  className="h-12 flex-1 rounded-[var(--radius-pill)] bg-forest text-[14px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)]"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
