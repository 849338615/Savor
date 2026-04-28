"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type TimerKey = string;

interface TimerState {
  durationSec: number;
  endsAt: number | null;
  pausedRemainingMs: number | null;
  finished: boolean;
}

interface CookingSessionState {
  recipeId: string | null;
  recipeSlug: string | null;
  recipeTitle: string | null;
  stepIndex: number;
  totalSteps: number;
  checkedIngredients: Record<string, boolean>;
  servingsOverride: Record<string, number>;
  timers: Record<TimerKey, TimerState>;
  largeText: boolean;
  hasHydrated: boolean;

  start: (
    recipeId: string,
    totalSteps: number,
    meta?: { slug?: string; title?: string },
  ) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  toggleIngredient: (recipeId: string, ingredientId: string) => void;
  setServings: (recipeId: string, n: number) => void;
  toggleLargeText: () => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;

  ensureTimer: (recipeId: string, stepIndex: number, durationSec: number) => void;
  startTimer: (recipeId: string, stepIndex: number) => void;
  pauseTimer: (recipeId: string, stepIndex: number) => void;
  resetTimer: (recipeId: string, stepIndex: number) => void;
  markTimerFinished: (recipeId: string, stepIndex: number) => void;
}

const timerKey = (recipeId: string, stepIndex: number) =>
  `${recipeId}:${stepIndex}`;

export const useCookingSession = create<CookingSessionState>()(
  persist(
    (set) => ({
      recipeId: null,
      recipeSlug: null,
      recipeTitle: null,
      stepIndex: 0,
      totalSteps: 0,
      checkedIngredients: {},
      servingsOverride: {},
      timers: {},
      largeText: false,
      hasHydrated: false,

      start: (recipeId, totalSteps, meta) =>
        set((s) =>
          s.recipeId === recipeId
            ? {
                totalSteps,
                recipeSlug: meta?.slug ?? s.recipeSlug,
                recipeTitle: meta?.title ?? s.recipeTitle,
              }
            : {
                recipeId,
                recipeSlug: meta?.slug ?? null,
                recipeTitle: meta?.title ?? null,
                stepIndex: 0,
                totalSteps,
              },
        ),

      next: () =>
        set((s) => ({
          stepIndex: Math.min(s.stepIndex + 1, Math.max(0, s.totalSteps - 1)),
        })),

      prev: () => set((s) => ({ stepIndex: Math.max(s.stepIndex - 1, 0) })),

      goTo: (index) =>
        set((s) => ({
          stepIndex: Math.max(0, Math.min(index, Math.max(0, s.totalSteps - 1))),
        })),

      toggleIngredient: (recipeId, ingredientId) =>
        set((s) => {
          const key = `${recipeId}:${ingredientId}`;
          const next = { ...s.checkedIngredients };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { checkedIngredients: next };
        }),

      setServings: (recipeId, n) =>
        set((s) => ({
          servingsOverride: { ...s.servingsOverride, [recipeId]: n },
        })),

      toggleLargeText: () => set((s) => ({ largeText: !s.largeText })),

      setHasHydrated: (v) => set({ hasHydrated: v }),

      reset: () =>
        set({
          recipeId: null,
          recipeSlug: null,
          recipeTitle: null,
          stepIndex: 0,
          totalSteps: 0,
        }),

      ensureTimer: (recipeId, stepIndex, durationSec) =>
        set((s) => {
          const key = timerKey(recipeId, stepIndex);
          const existing = s.timers[key];
          if (existing && existing.durationSec === durationSec) return s;
          return {
            timers: {
              ...s.timers,
              [key]: {
                durationSec,
                endsAt: null,
                pausedRemainingMs: null,
                finished: false,
              },
            },
          };
        }),

      startTimer: (recipeId, stepIndex) =>
        set((s) => {
          const key = timerKey(recipeId, stepIndex);
          const t = s.timers[key];
          if (!t || t.finished) return s;
          const remainingMs = t.pausedRemainingMs ?? t.durationSec * 1000;
          if (remainingMs <= 0) return s;
          return {
            timers: {
              ...s.timers,
              [key]: {
                ...t,
                endsAt: Date.now() + remainingMs,
                pausedRemainingMs: null,
              },
            },
          };
        }),

      pauseTimer: (recipeId, stepIndex) =>
        set((s) => {
          const key = timerKey(recipeId, stepIndex);
          const t = s.timers[key];
          if (!t || t.endsAt === null) return s;
          return {
            timers: {
              ...s.timers,
              [key]: {
                ...t,
                pausedRemainingMs: Math.max(0, t.endsAt - Date.now()),
                endsAt: null,
              },
            },
          };
        }),

      resetTimer: (recipeId, stepIndex) =>
        set((s) => {
          const key = timerKey(recipeId, stepIndex);
          const t = s.timers[key];
          if (!t) return s;
          return {
            timers: {
              ...s.timers,
              [key]: {
                ...t,
                endsAt: null,
                pausedRemainingMs: null,
                finished: false,
              },
            },
          };
        }),

      markTimerFinished: (recipeId, stepIndex) =>
        set((s) => {
          const key = timerKey(recipeId, stepIndex);
          const t = s.timers[key];
          if (!t) return s;
          return {
            timers: {
              ...s.timers,
              [key]: {
                ...t,
                endsAt: null,
                pausedRemainingMs: 0,
                finished: true,
              },
            },
          };
        }),
    }),
    {
      name: "savor-cooking-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        recipeId: s.recipeId,
        recipeSlug: s.recipeSlug,
        recipeTitle: s.recipeTitle,
        stepIndex: s.stepIndex,
        totalSteps: s.totalSteps,
        checkedIngredients: s.checkedIngredients,
        servingsOverride: s.servingsOverride,
        timers: s.timers,
        largeText: s.largeText,
      }),
      onRehydrateStorage: () => (state) => {
        // Direct mutation here would bypass zustand's notify, leaving every
        // hasHydrated-gated component stuck on its skeleton. Always go
        // through set, which is what setHasHydrated wraps.
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function getTimerRemainingMs(t: TimerState | undefined): number {
  if (!t) return 0;
  if (t.endsAt !== null) return Math.max(0, t.endsAt - Date.now());
  if (t.pausedRemainingMs !== null) return t.pausedRemainingMs;
  return t.durationSec * 1000;
}

export function isTimerRunning(t: TimerState | undefined): boolean {
  return !!t && t.endsAt !== null;
}
