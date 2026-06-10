"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  /** Body copy. Pass plain text for one paragraph or a node for richer
   *  layouts (e.g. an emphasised recipe title above the explanation). */
  description: React.ReactNode;
  /** Label for the destructive / forward action. */
  confirmLabel: string;
  /** Label for the safe / dismiss action. Defaults to "Cancel". */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Calm bottom-sheet confirmation. Mirrors the Savor "Leave cooking?" sheet
 * pattern so destructive flows feel like part of the same family.
 *
 * Affordances:
 *  - Backdrop tap, Escape key, and an explicit Cancel all dismiss.
 *  - Focus moves to the safe action on open (iOS HIG: the default button
 *    is the calm one; the destructive action is opt-in).
 *  - Body scroll is locked while the sheet is open.
 *  - Portal-rendered into the AppShell phone-card (#app-frame) so the
 *    scrim + sheet stay bounded by the app frame instead of bleeding
 *    across the whole desktop viewport, while still sitting above page
 *    chrome regardless of nested overflow:hidden / z-index contexts.
 */
export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  // Mount into the AppShell phone-card so the scrim + sheet stay inside the
  // app frame rather than bleeding across the whole desktop viewport. Falls
  // back to <body> if the frame is absent. Mirrors FilterPanel.
  useEffect(() => {
    setContainer(document.getElementById("app-frame") ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    // Lock the card's scroll host (the scrolling <main>) while open.
    const scrollHost = document.querySelector<HTMLElement>("#app-frame main");
    const prevOverflow = scrollHost?.style.overflow ?? "";
    if (scrollHost) scrollHost.style.overflow = "hidden";
    const t = window.setTimeout(() => cancelRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (scrollHost) scrollHost.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open, onCancel]);

  if (!container) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-end justify-center bg-[var(--scrim-modal)] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
          onClick={onCancel}
          aria-hidden={false}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full rounded-t-[var(--radius-2xl)] bg-soft-white px-6 pb-8 pt-7 shadow-[var(--shadow-lg)]"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 2rem)",
            }}
            initial={{ y: 64, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber — a small visual cue that this surface came from
                the bottom edge. Decorative; not a drag affordance. */}
            <span
              aria-hidden
              className="mx-auto mb-5 block h-1 w-9 rounded-full bg-[var(--border-strong)]/60"
            />

            <h2
              id={titleId}
              className="font-display text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ink"
            >
              {title}
            </h2>
            <div
              id={descId}
              className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-stone"
            >
              {description}
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="h-12 flex-1 rounded-[var(--radius-pill)] border border-forest bg-surface text-[14px] font-semibold text-forest transition-colors hover:bg-cream"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="h-12 flex-1 rounded-[var(--radius-pill)] bg-forest text-[14px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)] active:bg-[var(--bg-brand-pressed)]"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    container,
  );
}
