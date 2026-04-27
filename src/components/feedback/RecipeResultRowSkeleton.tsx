import { Skeleton } from "./Skeleton";

interface RecipeResultRowSkeletonProps {
  /** Stagger this row's pulse so multiple rows feel organic, not robotic. */
  delayMs?: number;
}

/**
 * Pixel-matched skeleton for `RecipeResultRow`. Same border, same padding,
 * same thumbnail dimensions, same text-line stack. The only difference is
 * the content blocks are pulsing cream rectangles. When real data lands,
 * cards snap into place rather than popping.
 */
export function RecipeResultRowSkeleton({
  delayMs = 0,
}: RecipeResultRowSkeletonProps) {
  const delayStyle = delayMs ? { animationDelay: `${delayMs}ms` } : undefined;

  return (
    <div
      aria-hidden
      className="flex gap-3.5 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-surface p-2.5 pr-4"
    >
      <Skeleton
        rounded="md"
        className="h-[112px] w-[112px] shrink-0"
        style={delayStyle}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1.5">
        <div className="flex flex-col gap-2">
          {/* Source kicker */}
          <Skeleton
            rounded="sm"
            className="h-2.5 w-24"
            style={delayStyle}
          />
          {/* Title — two lines */}
          <Skeleton
            rounded="sm"
            className="h-4 w-[82%]"
            style={delayStyle}
          />
          <Skeleton
            rounded="sm"
            className="h-4 w-[58%]"
            style={delayStyle}
          />
          {/* Summary — two lines */}
          <Skeleton
            rounded="sm"
            className="mt-0.5 h-2.5 w-[94%]"
            style={delayStyle}
          />
          <Skeleton
            rounded="sm"
            className="h-2.5 w-[68%]"
            style={delayStyle}
          />
        </div>
        {/* Meta row */}
        <Skeleton
          rounded="sm"
          className="mt-3 h-3 w-[52%]"
          style={delayStyle}
        />
      </div>
    </div>
  );
}
