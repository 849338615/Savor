"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { useSectionBackHref } from "@/hooks/useNav";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  variant?: "back" | "close";
  onClose?: () => void;
  /** Explicit back target. Overrides the section-aware default. Pass a
   *  string href to navigate, or a function for custom handling. */
  back?: string | (() => void);
  rightSlot?: React.ReactNode;
  className?: string;
  /** Apply an iOS-like nav-bar inset. Top padding floors at 1.5rem (24px)
   *  so the bar reads as a proper nav bar even when no real safe-area
   *  inset is reported (desktop simulator, in-page card frames). On
   *  devices with a larger safe-area, the safe-area wins. */
  iosInset?: boolean;
}

export function TopBar({
  title,
  variant = "back",
  onClose,
  back,
  rightSlot,
  className,
  iosInset = true,
}: TopBarProps) {
  const router = useRouter();
  const sectionBack = useSectionBackHref();
  const Icon = variant === "close" ? X : ArrowLeft;

  // Section-aware back is the new default. Browser history often crosses
  // tabs (Saved → Home → press back lands on Saved), which breaks the
  // iOS-style per-tab stack the bottom nav implies.
  const handleBack = () => {
    if (onClose) return onClose();
    if (typeof back === "function") return back();
    const target = typeof back === "string" ? back : sectionBack;
    if (target) {
      router.push(target);
      return;
    }
    router.back();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between gap-3 bg-soft-white/85 px-6 backdrop-blur",
        iosInset ? "pb-3" : "py-3",
        className,
      )}
      // Inline style — Tailwind v4's arbitrary-value parser is unreliable
      // with nested env()/max() calls; inline guarantees the rule lands.
      style={
        iosInset
          ? { paddingTop: "max(env(safe-area-inset-top, 1rem), 1.5rem)" }
          : undefined
      }
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label={variant === "close" ? "Close" : "Back"}
        className="-ml-1.5 grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-cream"
      >
        <Icon size={20} strokeWidth={1.75} />
      </button>
      {title ? (
        <h1 className="flex-1 truncate text-center text-[15px] font-medium text-ink">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}
      <div className="-mr-1.5 flex h-11 w-11 items-center justify-end">
        {rightSlot}
      </div>
    </header>
  );
}
