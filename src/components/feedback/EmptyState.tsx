import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-5 flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-cream px-5 py-5",
        className,
      )}
    >
      <p className="text-[14px] font-medium text-ink">{title}</p>
      {body ? (
        <p className="text-[13px] leading-relaxed text-stone">{body}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
