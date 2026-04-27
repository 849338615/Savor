import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
      <p className="font-display text-[24px] font-semibold leading-tight tracking-[-0.005em] text-ink">
        Recipe not found.
      </p>
      <p className="mt-2 max-w-[28ch] text-[14px] leading-relaxed text-stone">
        It may have been removed, or the link is off by a letter.
      </p>
      <Link
        href="/"
        className="mt-6 grid h-11 place-items-center rounded-[var(--radius-pill)] bg-forest px-5 text-[14px] font-semibold text-soft-white transition-colors hover:bg-[var(--bg-brand-hover)]"
      >
        Find another recipe
      </Link>
    </div>
  );
}
