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

/**
 * Search input that submits reliably on every platform — including iOS Safari,
 * where implicit form-submit is fragile.
 *
 * Mobile-correctness checklist:
 *   - `type="search"` gives iOS the right input semantics (and a clear "Search"
 *     key on the virtual keyboard) instead of a generic "return".
 *   - `enterKeyHint="search"` explicitly labels the return key as "Search",
 *     so the affordance is unambiguous to the user.
 *   - `inputMode="search"` pairs with the above to ensure the right keyboard
 *     layout appears on Android and iOS.
 *   - A visually-hidden `<button type="submit">` guarantees the form always
 *     has a submit candidate. iOS's implicit-submit heuristic refuses to
 *     auto-submit when the form contains *any* non-submit button (the Clear
 *     button trips this). An explicit submit button is the only reliable cure.
 *   - `autoComplete="off"` and `spellCheck={false}` keep the input clean —
 *     recipe queries aren't names or addresses; autosuggestions get in the way.
 *   - The native `<input type="search">` "×" decoration is suppressed in
 *     `globals.css` so our custom Clear button is the only clear affordance.
 */
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
      action="/results"
      method="get"
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
        name="q"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
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
      {/* Hidden submit — guarantees Enter always submits, regardless of
          iOS implicit-submit heuristics. Stays in the accessibility tree
          so screen-reader users can still trigger it. */}
      <button type="submit" className="sr-only" tabIndex={-1}>
        Search
      </button>
    </form>
  );
}
