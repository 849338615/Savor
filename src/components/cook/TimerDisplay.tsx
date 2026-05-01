"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { formatSecondsAsClock } from "@/lib/utils";
import {
  getTimerRemainingMs,
  isTimerRunning,
  useCookingSession,
} from "@/hooks/useCookingSession";

interface TimerDisplayProps {
  suggestedSeconds?: number;
  size?: "default" | "large";
}

export function TimerDisplay({
  suggestedSeconds,
  size = "default",
}: TimerDisplayProps) {
  const recipeId = useCookingSession((s) => s.recipeId);
  const stepIndex = useCookingSession((s) => s.stepIndex);
  const timer = useCookingSession((s) =>
    suggestedSeconds && recipeId
      ? s.timers[`${recipeId}:${stepIndex}`]
      : undefined,
  );
  const ensureTimer = useCookingSession((s) => s.ensureTimer);
  const startTimer = useCookingSession((s) => s.startTimer);
  const pauseTimer = useCookingSession((s) => s.pauseTimer);
  const resetTimer = useCookingSession((s) => s.resetTimer);
  const markFinished = useCookingSession((s) => s.markTimerFinished);

  useEffect(() => {
    if (suggestedSeconds && recipeId)
      ensureTimer(recipeId, stepIndex, suggestedSeconds);
  }, [recipeId, stepIndex, suggestedSeconds, ensureTimer]);

  const running = isTimerRunning(timer);
  const remainingMs = timer
    ? getTimerRemainingMs(timer)
    : (suggestedSeconds ?? 0) * 1000;

  // Poll every 250ms but only re-render when the displayed second changes —
  // so the cook screen commits at most once per second, not four times.
  const [displaySec, setDisplaySec] = useState(() =>
    Math.ceil(remainingMs / 1000),
  );
  const lastSecRef = useRef(displaySec);

  useEffect(() => {
    const next = Math.ceil(remainingMs / 1000);
    if (next !== lastSecRef.current) {
      lastSecRef.current = next;
      setDisplaySec(next);
    }
  }, [remainingMs]);

  useEffect(() => {
    if (!running || !timer) return;
    const id = window.setInterval(() => {
      const next = Math.ceil(getTimerRemainingMs(timer) / 1000);
      if (next !== lastSecRef.current) {
        lastSecRef.current = next;
        setDisplaySec(next);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, timer]);

  useEffect(() => {
    if (running && remainingMs <= 0 && timer && !timer.finished && recipeId) {
      markFinished(recipeId, stepIndex);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([180, 90, 180]);
      }
    }
  }, [running, remainingMs, timer, markFinished, recipeId, stepIndex]);

  if (!suggestedSeconds || !recipeId) return null;
  const finished = timer?.finished ?? false;
  const remainingSec = displaySec;

  const isLarge = size === "large";

  return (
    <div
      className={
        isLarge
          ? "flex w-full max-w-[360px] flex-col items-center gap-3"
          : "mt-2 flex items-center gap-2"
      }
    >
      <div
        className={
          isLarge
            ? "relative flex w-full items-center justify-center rounded-[var(--radius-2xl)] border px-7 py-5 transition-colors duration-300 ease-out"
            : "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-hairline)] bg-surface px-[18px] py-2.5 text-[15px] font-semibold tabular-nums text-ink"
        }
        style={
          isLarge
            ? {
                // While the timer ticks, the pill warms: a thin honey wash
                // background and a honey hairline. On finish, both fade back
                // to the neutral surface.
                background: running
                  ? "color-mix(in oklch, var(--savor-honey-mist) 70%, var(--bg-surface))"
                  : "var(--bg-surface)",
                borderColor: running
                  ? "color-mix(in oklch, var(--savor-honey) 38%, var(--border-hairline))"
                  : "var(--border-hairline)",
              }
            : undefined
        }
      >
        <TimerIcon
          size={isLarge ? 26 : 14}
          strokeWidth={1.75}
          // In large mode the icon is absolutely positioned so the digits can
          // truly center inside the pill. With the icon in the flex flow it
          // would push the digits right-of-center, since nothing on the right
          // balances its width.
          className={
            isLarge
              ? "pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 transition-colors duration-300"
              : "transition-colors duration-300"
          }
          style={{
            color: finished
              ? "var(--savor-stone)"
              : running
                ? "var(--savor-honey-deep)"
                : "var(--savor-forest)",
          }}
          aria-hidden
        />
        <span
          className={
            isLarge
              ? "font-display tabular-nums leading-none text-[44px] font-semibold tracking-[-0.01em] transition-colors duration-300"
              : "tabular-nums"
          }
          style={
            isLarge
              ? {
                  color: finished
                    ? "var(--savor-stone)"
                    : running
                      ? "var(--savor-honey-deep)"
                      : "var(--savor-ink)",
                }
              : undefined
          }
          aria-live="polite"
          aria-atomic="true"
        >
          {finished ? "Done" : formatSecondsAsClock(remainingSec)}
        </span>
      </div>
      <div className={isLarge ? "flex items-center gap-2" : "flex items-center"}>
        <button
          type="button"
          onClick={() => {
            if (running) pauseTimer(recipeId, stepIndex);
            else startTimer(recipeId, stepIndex);
          }}
          aria-label={running ? "Pause timer" : "Start timer"}
          disabled={finished}
          className={
            isLarge
              ? "grid h-12 w-12 place-items-center rounded-full bg-forest text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)] disabled:opacity-40"
              : "grid h-11 w-11 place-items-center rounded-full text-forest transition-colors hover:bg-soft-white disabled:opacity-40"
          }
        >
          {running ? (
            <Pause size={isLarge ? 18 : 16} strokeWidth={1.75} aria-hidden />
          ) : (
            <Play size={isLarge ? 18 : 16} strokeWidth={1.75} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => resetTimer(recipeId, stepIndex)}
          aria-label="Reset timer"
          className={
            isLarge
              ? "grid h-12 w-12 place-items-center rounded-full text-stone transition-colors hover:text-forest"
              : "grid h-11 w-11 place-items-center rounded-full text-stone transition-colors hover:text-forest"
          }
        >
          <RotateCcw size={isLarge ? 16 : 14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
