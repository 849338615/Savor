"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { FILTER_GROUPS } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  open: boolean;
  /** Currently-applied tags — the draft is reset to this each time we open. */
  initial: string[];
  /** Commit the draft selection. */
  onApply: (tags: string[]) => void;
  onClose: () => void;
}

/**
 * Calm bottom-sheet filter panel. Shares the affordances of the Savor
 * `ConfirmSheet` so the two surfaces feel like one family:
 *   - Backdrop tap and Escape both dismiss without applying.
 *   - Body scroll is locked while open.
 *   - Portal-rendered above all page chrome; constrained to the phone-card
 *     column on desktop.
 *
 * Edits are *drafted* — nothing changes upstream until "Apply". Re-opening
 * discards an abandoned draft by re-seeding from `initial`.
 */
export function FilterPanel({
  open,
  initial,
  onApply,
  onClose,
}: FilterPanelProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<string[]>(initial);
  const [wasOpen, setWasOpen] = useState(open);
  const titleId = useId();

  // Mount into the AppShell phone-card so the sheet stays inside the app
  // frame (scrim + sheet bounded by the card) rather than bleeding across
  // the whole desktop viewport. Falls back to <body> if the frame is absent.
  useEffect(() => {
    setContainer(document.getElementById("app-frame") ?? document.body);
  }, []);

  // Re-seed the draft from the applied selection on the open→ edge, so
  // unapplied edits from a previous open don't leak in. Adjusting state
  // during render (per the React docs) avoids an extra effect pass.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initial);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock the card's scroll host (the scrolling <main>) while open.
    const scrollHost = document.querySelector<HTMLElement>("#app-frame main");
    const prevOverflow = scrollHost?.style.overflow ?? "";
    if (scrollHost) scrollHost.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (scrollHost) scrollHost.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!container) return null;

  function toggle(tag: string) {
    setDraft((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-end justify-center bg-[var(--scrim-modal)] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[88%] w-full flex-col rounded-t-[var(--radius-2xl)] bg-soft-white shadow-[var(--shadow-lg)]"
            initial={{ y: 64, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber — a small cue that this surface came from the bottom
                edge. Decorative; not a drag affordance. */}
            <span
              aria-hidden
              className="mx-auto mt-3 block h-1 w-9 shrink-0 rounded-full bg-[var(--border-strong)]/60"
            />

            <div className="flex items-center justify-between px-6 pb-1 pt-4">
              <h2
                id={titleId}
                className="font-display text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ink"
              >
                Filters
              </h2>
              <span className="text-[12px] tabular-nums text-stone">
                {draft.length > 0 ? `${draft.length} selected` : "None"}
              </span>
            </div>

            {/* Scrollable groups */}
            <div className="flex-1 overflow-y-auto px-6 pt-3">
              <div className="flex flex-col gap-5 pb-2">
                {FILTER_GROUPS.map((group) => (
                  <fieldset key={group.id} className="border-0 p-0">
                    <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest">
                      {group.label}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map(({ label, tag }) => {
                        const active = draft.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggle(tag)}
                            className={cn(
                              "rounded-[var(--radius-pill)] px-4 py-[9px] text-[13px] leading-none transition-colors",
                              active
                                ? "bg-sage-mist font-semibold text-forest"
                                : "font-medium text-ink hover:bg-linen",
                            )}
                            style={
                              active
                                ? {
                                    boxShadow:
                                      "inset 0 0 0 1px var(--border-active-faint)",
                                  }
                                : {
                                    background: "var(--bg-surface)",
                                    boxShadow:
                                      "inset 0 0 0 1px var(--border-hairline)",
                                  }
                            }
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div
              className="flex shrink-0 gap-2.5 px-6 pt-4"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
            >
              <button
                type="button"
                onClick={() => setDraft([])}
                disabled={draft.length === 0}
                className="h-12 flex-1 rounded-[var(--radius-pill)] border border-forest bg-surface text-[14px] font-semibold text-forest transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:border-[var(--border-strong)] disabled:text-stone disabled:hover:bg-surface"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  onClose();
                }}
                className="h-12 flex-1 rounded-[var(--radius-pill)] bg-forest text-[14px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)] active:bg-[var(--bg-brand-pressed)]"
              >
                {draft.length > 0 ? `Apply (${draft.length})` : "Apply"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    container,
  );
}
