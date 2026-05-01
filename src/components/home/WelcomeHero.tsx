"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";

interface Message {
  eyebrow: string;
  headline: string; // \n marks the editorial line break
  tone: string;
}

interface Period {
  hours: ReadonlyArray<number>;
  eyebrow: string;
  /** CSS color used to tint the eyebrow rule + label by time of day. */
  tone: string;
  messages: ReadonlyArray<string>;
}

/**
 * Time-of-day periods. Each maps a span of hours to an on-brand eyebrow
 * plus a small pool of Playfair headlines. Voice rules from design.md §1:
 * present tense, conversational, sentence case, no exclamation, no urgency.
 * "Let's" is reserved for guiding moments inside cook mode and is
 * deliberately not used here.
 */
// Each period carries a tone: a calm hue cue that shifts the eyebrow rule
// across the day. Sunrise honey → midday forest → afternoon sage → evening
// forest-deep → wind-down clay → night ink. Subtle; always low chroma.
const PERIODS: ReadonlyArray<Period> = [
  {
    hours: [5, 6, 7, 8, 9],
    eyebrow: "Good morning",
    tone: "var(--savor-honey-deep)",
    messages: [
      "What’s for\nbreakfast?",
      "A slow\nmorning.",
      "Coffee\nfirst?",
      "A soft\nstart.",
    ],
  },
  {
    hours: [10, 11],
    eyebrow: "Late morning",
    tone: "var(--savor-honey-deep)",
    messages: ["Brunch\ntoday?", "What’s\ncooking?", "A late\nstart?"],
  },
  {
    hours: [12, 13],
    eyebrow: "Midday",
    tone: "var(--savor-forest)",
    messages: ["Lunch\ntoday?", "What’s\nfor lunch?", "A simple\nplate?"],
  },
  {
    hours: [14, 15, 16],
    eyebrow: "Afternoon",
    tone: "var(--savor-olive)",
    messages: [
      "What’s\ncooking?",
      "Prep for\ntonight?",
      "A quiet\nkitchen.",
      "Snack\nbreak?",
    ],
  },
  {
    hours: [17, 18, 19, 20],
    eyebrow: "Tonight",
    tone: "var(--savor-forest)",
    messages: [
      "What’s for\ndinner?",
      "Tonight’s\nplate?",
      "What are we\ncooking?",
      "Dinner,\ntogether.",
    ],
  },
  {
    hours: [21, 22, 23],
    eyebrow: "Wind down",
    tone: "var(--savor-clay-deep)",
    messages: ["A late\nsupper?", "Something\nsimple?", "A small\nplate?"],
  },
  {
    // 12am – 4am
    hours: [0, 1, 2, 3, 4],
    eyebrow: "Still up",
    tone: "var(--savor-stone)",
    messages: [
      "A late night\nnibble?",
      "Quiet\nkitchen.",
      "Just a\nsnack?",
    ],
  },
];

/**
 * SSR + first-paint default. Matches the most common cooking moment;
 * the picked message swaps in once the client clock is available.
 */
const SSR_DEFAULT: Message = {
  eyebrow: "Tonight",
  headline: "What’s for\ndinner?",
  tone: "var(--savor-forest)",
};

function pickMessage(): Message {
  const h = new Date().getHours();
  const period = PERIODS.find((p) => p.hours.includes(h));
  if (!period) return SSR_DEFAULT;
  const headline =
    period.messages[Math.floor(Math.random() * period.messages.length)];
  return { eyebrow: period.eyebrow, headline, tone: period.tone };
}

/**
 * Module-scoped cache so getSnapshot returns a stable reference across
 * renders (useSyncExternalStore requires referential stability or it
 * detects a "snapshot loop"). One pick per page load — refreshing the
 * home gives a new headline.
 */
let cachedMessage: Message | null = null;
function getClientSnapshot(): Message {
  if (!cachedMessage) cachedMessage = pickMessage();
  return cachedMessage;
}
function getServerSnapshot(): Message {
  return SSR_DEFAULT;
}
const noOpSubscribe = () => () => {};

/**
 * Time-aware welcome that rotates between visits. SSR + hydration paint
 * uses the static default; once mounted, useSyncExternalStore swaps to
 * the client snapshot, and motion's `key`-based remount cross-fades the
 * picked headline in. If the picked message happens to equal the default
 * (evening visits hitting "Tonight / What's for dinner?"), no animation
 * fires — the page just looks settled.
 */
export function WelcomeHero() {
  const msg = useSyncExternalStore(
    noOpSubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const isSwap =
    msg.headline !== SSR_DEFAULT.headline ||
    msg.eyebrow !== SSR_DEFAULT.eyebrow;

  return (
    <motion.div
      key={msg.headline}
      initial={isSwap ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5"
    >
      <p
        className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: msg.tone }}
      >
        <span
          aria-hidden
          className="block h-px w-8"
          style={{
            background: `color-mix(in oklch, ${msg.tone} 55%, transparent)`,
          }}
        />
        {msg.eyebrow}
      </p>
      <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.015em] text-ink whitespace-pre-line text-balance">
        {msg.headline}
      </h1>
    </motion.div>
  );
}
