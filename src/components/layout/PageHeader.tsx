import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  rightSlot?: ReactNode;
  className?: string;
}

/**
 * The shared header for top-level browse surfaces (home, saved, profile).
 * Detail/cook screens use TopBar (with a back arrow) instead.
 */
export function PageHeader({ title, rightSlot, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 px-5 pb-2 pt-[max(env(safe-area-inset-top,1rem),3.5rem)]",
        className,
      )}
    >
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.005em] text-ink">
        {title}
      </h1>
      {rightSlot ? (
        <div className="flex h-9 items-center">{rightSlot}</div>
      ) : null}
    </header>
  );
}
