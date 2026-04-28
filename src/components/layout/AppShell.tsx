import { BottomNav } from "./BottomNav";
import { AmbientLayer, Bloom } from "./AmbientBackground";

/**
 * Phone-first frame. On larger screens the column is constrained so the
 * app stays a focused mobile surface — never a stretched desktop site.
 *
 * The card is pinned to the viewport height so content scrolls *inside*
 * `<main>`, not by growing the page. Without this, tall pages (results,
 * recipe) would push the whole frame down, defeating the phone illusion.
 *
 * A subtle warm bloom lives at the AppShell level — *behind* main, so
 * it stays fixed during scroll — providing app-wide identity warmth
 * across every screen. Pages that want a stronger or more specific
 * treatment compose additional blooms on top (HomeAmbience, the cook
 * mode focus bloom, the profile avatar spotlight).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full bg-cream flex justify-center overflow-hidden">
      <div className="relative flex h-full w-full max-w-[440px] flex-col bg-soft-white shadow-[0_0_0_1px_var(--color-mist)] sm:my-6 sm:h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:shadow-[var(--shadow-app-edge),0_0_0_1px_var(--color-mist)] sm:overflow-hidden">
        {/* App-wide ambient warmth — a sand bloom in the upper-right
            that plays through every screen as the base identity layer.
            Sized and angled to stay clear of where content typically
            sits (cards down the spine of the page) so it never competes,
            but with enough presence that the warmth is recognizable on
            its own — pages don't have to compose anything extra to feel
            on-brand. Stronger compositions (HomeAmbience, cook focus,
            profile spotlight) layer additional blooms on top. */}
        <AmbientLayer>
          <Bloom
            position="-right-[30%] -top-[20%]"
            size="w-[120%]"
            tone="sand"
            opacity={52}
            fadeAt={64}
          />
        </AmbientLayer>
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
