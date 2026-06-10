import { HomeSearchControls } from "@/components/home/HomeSearchControls";
import { WelcomeHero } from "@/components/home/WelcomeHero";
import { HomeAmbience } from "@/components/home/HomeAmbience";

/**
 * Idle home. Brand identity is carried by the ambient layer (warm bloom,
 * sage haze, half-leaf signature) and by the editorial hero — no corner
 * mark needed. A time-aware welcome rotates between visits; chips and
 * the search bar route the user to /results.
 */
export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <HomeAmbience />

      {/* Editorial hero — sits 8.5rem (136px) below the top edge, or
          further down on devices whose safe-area inset is larger.
          Calibrated for a content-only top (no corner mark): roughly
          19% of phone-card height, the editorial sweet spot where the
          lockup feels grounded without crowding the dynamic island.
          Inline style — Tailwind v4's arbitrary-value parser is
          unreliable with nested env()/max() calls. */}
      <section
        className="relative z-10 flex flex-col gap-7 px-6"
        style={{ paddingTop: "max(env(safe-area-inset-top, 1rem), 8.5rem)" }}
      >
        <WelcomeHero />
      </section>

      {/* Spacer pushes the action zone to the bottom of the viewport */}
      <div className="flex-1 min-h-10" aria-hidden />

      {/* Anchored action zone — caption and chips cluster tight, search
          breathes alone as the primary action */}
      <section className="relative z-10 flex flex-col px-6 pb-5 pt-6">
        <HomeSearchControls />
      </section>
    </div>
  );
}
