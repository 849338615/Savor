/**
 * Savor's "something is cooking" indicator. Three stylized wisps of steam
 * rising and dissipating — calmly, in sequence — drawn with a vertical
 * gradient (saturated forest at the base, fading to near-transparent at the
 * top, like real steam against a backlight).
 *
 * Why steam, not a dot: Savor's logo is a cooking pot with a leaf. A loading
 * state is the moment a search is "being prepared" — steam is the visual
 * metaphor that does that work without being literal. It also matches the
 * brand's calm, editorial tone: the wisps don't spin or blink, they breathe.
 *
 * Each wisp's path has a slightly different curvature and height — two
 * tall, one short — so the silhouette never reads as repeating. Animation
 * uses `stroke-dashoffset` to "draw" each wisp from bottom to top, then
 * fades it as it lifts off. Stagger is a third of the cycle so there is
 * always a wisp mid-rise; the eye never catches a beat of stillness.
 *
 * Pure CSS, no JS, respects `prefers-reduced-motion` via the global rule
 * in `globals.css`.
 */
export function PulseDot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-[18px] w-[14px] shrink-0 items-end ${className}`}
    >
      <svg
        viewBox="0 0 14 18"
        className="h-full w-full overflow-visible"
        fill="none"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient
            id="savor-steam-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="18"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stopColor="var(--color-forest)" stopOpacity="0.85" />
            <stop offset="55%" stopColor="var(--color-forest)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-forest)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="url(#savor-steam-gradient)">
          {/* short, lean-left wisp */}
          <path className="savor-steam savor-steam-1" d="M3 16 C2.4 13, 3.6 10, 3 6.5" />
          {/* tall central wisp — anchors the silhouette */}
          <path className="savor-steam savor-steam-2" d="M7 16 C8 12, 6 8.5, 7 3" />
          {/* medium-height, lean-right wisp */}
          <path className="savor-steam savor-steam-3" d="M11 16 C11.5 13.5, 10.4 10.5, 11 7" />
        </g>
      </svg>
    </span>
  );
}
