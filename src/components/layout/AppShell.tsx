import { BottomNav } from "./BottomNav";

/**
 * Phone-first frame. On larger screens the column is constrained so the app
 * stays a focused mobile surface — never a stretched desktop site.
 *
 * The card is pinned to the viewport height so content scrolls *inside*
 * `<main>`, not by growing the page. Without this, tall pages (results,
 * recipe) would push the whole frame down, defeating the phone illusion.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full bg-cream flex justify-center overflow-hidden">
      <div className="relative flex h-full w-full max-w-[440px] flex-col bg-soft-white shadow-[0_0_0_1px_var(--color-mist)] sm:my-6 sm:h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:shadow-[var(--shadow-app-edge),0_0_0_1px_var(--color-mist)] sm:overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
