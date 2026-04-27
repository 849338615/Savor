import type { RecipeSummary } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";

interface ThumbnailIllustrationProps {
  recipe: Pick<RecipeSummary, "id" | "tags" | "title">;
  className?: string;
}

/**
 * Calm, abstract SVG illustrations for thumbnails. Beats placeholder photos
 * for a v1 prototype: consistent palette, never broken, fast.
 */
export function ThumbnailIllustration({
  recipe,
  className,
}: ThumbnailIllustrationProps) {
  const motif = pickMotif(recipe);

  return (
    <svg
      viewBox="0 0 96 96"
      className={cn("block", className)}
      role="img"
      aria-label={recipe.title}
    >
      {/* Soft warm background ring */}
      <circle cx="48" cy="48" r="48" fill="var(--color-sage-mist)" />
      <circle cx="48" cy="48" r="36" fill="var(--color-soft-white)" />
      <Motif motif={motif} />
    </svg>
  );
}

type Motif = "bowl" | "leaf" | "egg" | "loaf" | "pot" | "slice";

function pickMotif(recipe: Pick<RecipeSummary, "id" | "tags">): Motif {
  const tags = recipe.tags;
  if (tags.includes("soup")) return "bowl";
  if (tags.includes("brunch") || tags.includes("one-pan")) return "egg";
  if (tags.includes("dessert")) return "slice";
  if (tags.includes("salad") || tags.includes("vegetarian")) return "leaf";
  if (tags.includes("chicken")) return "loaf";
  return "pot";
}

function Motif({ motif }: { motif: Motif }) {
  const fg = "var(--color-forest)";
  switch (motif) {
    case "bowl":
      return (
        <g
          fill="none"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M30 50h36" />
          <path d="M32 50c0 10 6 14 16 14s16-4 16-14" />
          <path d="M44 44c0-3 2-5 4-5" />
          <path d="M50 41c0-3 2-5 4-5" />
        </g>
      );
    case "leaf":
      return (
        <g
          fill="none"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M34 62c8-22 22-30 30-30 0 16-10 30-30 30z" />
          <path d="M44 56c4-6 10-12 16-16" />
        </g>
      );
    case "egg":
      return (
        <g
          fill="none"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse
            cx="48"
            cy="50"
            rx="14"
            ry="16"
            fill="var(--color-cream)"
            stroke={fg}
          />
          <circle cx="48" cy="50" r="5" fill={fg} stroke="none" />
        </g>
      );
    case "loaf":
      return (
        <g
          fill="none"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M30 56c0-8 8-12 18-12s18 4 18 12v4H30v-4z" />
          <path d="M38 50v6M44 49v7M50 49v7M56 49v7M62 50v6" />
        </g>
      );
    case "slice":
      return (
        <g
          fill="none"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M34 60l14-26 14 26z" fill="var(--color-cream)" />
          <path d="M40 56h16" />
        </g>
      );
    case "pot":
    default:
      return (
        <g
          fill="none"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M30 42h36" />
          <path d="M46 38c0-2 1-3 3-3" />
          <path d="M32 44c0 10 4 18 16 18s16-8 16-18" />
          <path d="M28 48c-2 0-2 3 0 3" />
          <path d="M68 48c2 0 2 3 0 3" />
        </g>
      );
  }
}
