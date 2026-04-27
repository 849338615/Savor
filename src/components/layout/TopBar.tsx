"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  variant?: "back" | "close";
  onClose?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
  /** Apply 64px top inset for an iOS-like dynamic-island clearance. */
  iosInset?: boolean;
}

export function TopBar({
  title,
  variant = "back",
  onClose,
  rightSlot,
  className,
  iosInset = true,
}: TopBarProps) {
  const router = useRouter();
  const Icon = variant === "close" ? X : ArrowLeft;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between gap-3 bg-soft-white/85 px-5 backdrop-blur",
        iosInset ? "pt-[env(safe-area-inset-top,1rem)] pb-3" : "py-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => (onClose ? onClose() : router.back())}
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
