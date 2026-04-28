import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AmbientLayerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container for one or more <Bloom /> elements. Sits absolute inside its
 * positioned ancestor — typically the AppShell card or a page wrapper —
 * pointer-events-none so it never intercepts clicks, overflow-hidden so
 * blooms clip to the surface they're decorating.
 *
 * Stacking: paired with `relative` on the sibling content (or `relative
 * z-10`), the layer paints below content automatically by document order.
 */
export function AmbientLayer({ children, className }: AmbientLayerProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BloomProps {
  /** Tailwind absolute-positioning classes (e.g. "-right-[28%] -top-[18%]"). */
  position: string;
  /** Width as a Tailwind class. The bloom is square, so this is its diameter. */
  size?: string;
  /** Color tone — sand for warmth (kitchen light), sage for calm balance. */
  tone?: "sand" | "sage";
  /** Visual weight, 0–100. */
  opacity?: number;
  /** Percentage of the bloom radius at which the gradient hits transparent. */
  fadeAt?: number;
}

/**
 * A single soft, blurred radial bloom. Used to add ambient warmth or a
 * cool tint to a screen's negative space. Multiple blooms compose
 * naturally by stacking inside an <AmbientLayer />.
 */
export function Bloom({
  position,
  size = "w-[110%]",
  tone = "sand",
  opacity = 60,
  fadeAt = 62,
}: BloomProps) {
  const color =
    tone === "sand" ? "var(--color-sand)" : "var(--color-sage-mist)";
  return (
    <div
      className={cn(
        "absolute aspect-square rounded-full blur-3xl",
        size,
        position,
      )}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent ${fadeAt}%)`,
        opacity: opacity / 100,
      }}
    />
  );
}
