import { AmbientLayer, Bloom } from "@/components/layout/AmbientBackground";

/**
 * Ambient layer for the home screen — the brand's most expressive
 * moment. Composes on top of the AppShell's base sand bloom with three
 * additional cues:
 *
 *   1. A second, more concentrated warm bloom in the upper-right —
 *      kitchen-window light, layered over the base for depth.
 *   2. A cool sage-mist haze in the lower-left — balances the warm
 *      so the negative space reads as a complete composition.
 *   3. A botanical half-leaf signature — the brand's identity
 *      anchor. Reserved for the home; carrying it across all screens
 *      would dilute it.
 *
 * design.md designates the icon-mark for "watermarks"; the leaf is the
 * same gesture at architectural scale, drawn in the brand's pen-and-ink
 * line style (1.5/1.2/0.9 stroke hierarchy, C1-continuous Bezier,
 * pinnate venation curving toward the apex).
 */
export function HomeAmbience() {
  return (
    <AmbientLayer>
      {/* Concentrated warm bloom — layered on top of the AppShell base
          for a deeper, richer warmth at the home's brand moment. Tighter
          radius and smaller diameter than the base, so the two blooms
          read as one organic glow rather than a doubled circle. */}
      <Bloom
        position="-right-[18%] -top-[12%]"
        size="w-[80%]"
        tone="sand"
        opacity={32}
        fadeAt={58}
      />
      {/* Cool sage haze — counterpoint that makes the warm read as warm */}
      <Bloom
        position="-left-[35%] bottom-[14%]"
        size="w-[90%]"
        tone="sage"
        opacity={40}
        fadeAt={65}
      />
      {/* Half-leaf signature — botanical identity anchor */}
      <svg
        viewBox="0 0 260 580"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -right-[1%] bottom-[13%] h-[66%] w-auto -rotate-[4deg] text-forest opacity-[0.11] [&_path]:[vector-effect:non-scaling-stroke]"
      >
        <path
          d="M 250 28 C 246 50, 30 130, 30 290 C 30 450, 246 530, 250 552"
          strokeWidth="1.5"
        />
        <path d="M 250 40 Q 242 295, 250 544" strokeWidth="1.2" />
        <g strokeWidth="0.9" opacity="0.85">
          <path d="M 250 90 Q 210 70, 170 72" />
          <path d="M 250 155 Q 178 122, 105 118" />
          <path d="M 250 225 Q 158 184, 65 180" />
          <path d="M 250 300 Q 145 250, 40 250" />
          <path d="M 250 375 Q 155 330, 60 330" />
          <path d="M 250 445 Q 178 409, 105 405" />
          <path d="M 250 510 Q 205 490, 160 495" />
        </g>
      </svg>
    </AmbientLayer>
  );
}
