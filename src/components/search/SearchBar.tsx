"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
  size?: "md" | "lg";
}

export function SearchBar({
  defaultValue = "",
  autoFocus,
  className,
  size = "md",
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/results?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-[var(--radius-pill)] border border-[var(--border-hairline)] bg-surface px-[18px] transition-colors focus-within:border-forest focus-within:shadow-[var(--shadow-focus)]",
        size === "lg" ? "py-[14px]" : "py-[13px]",
        className,
      )}
    >
      <Search
        size={18}
        strokeWidth={1.75}
        className="shrink-0 text-stone"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search recipes, ingredients…"
        aria-label="Search recipes"
        className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-[color:var(--fg-2)] outline-none focus-visible:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="text-[12px] text-stone transition-colors hover:text-ink"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </form>
  );
}
