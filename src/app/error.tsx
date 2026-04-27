"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
      <p className="font-display text-[24px] font-semibold leading-tight tracking-[-0.005em] text-ink">
        Something didn&rsquo;t load.
      </p>
      <p className="mt-2 max-w-[28ch] text-[14px] leading-relaxed text-stone">
        Take a breath, try again, or head back home.
      </p>
      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={reset}
          className="grid h-11 place-items-center rounded-[var(--radius-pill)] bg-forest px-5 text-[14px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="grid h-11 place-items-center rounded-[var(--radius-pill)] border border-forest bg-transparent px-5 text-[14px] font-semibold text-forest transition-colors hover:bg-soft-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
