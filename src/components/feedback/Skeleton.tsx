import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  rounded?: "sm" | "md" | "lg" | "pill" | "card";
}

const ROUNDED_MAP: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  pill: "rounded-[var(--radius-pill)]",
  card: "rounded-[var(--radius-2xl)]",
};

export function Skeleton({
  className,
  style,
  rounded = "md",
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("savor-pulse bg-cream", ROUNDED_MAP[rounded], className)}
      style={style}
    />
  );
}
