"use client";

import { usePathname } from "next/navigation";

/**
 * The app's scroll surface.
 *
 * The primary nav is now a floating glass island that hovers *over* this
 * scroll area (see BottomNav), rather than taking its own row. So standard
 * screens reserve bottom space here to keep their last content clear of the
 * island. Screens that hide the nav — cook mode and recipe detail, both under
 * `/recipe/*` — opt out, mirroring BottomNav's own visibility rule so the two
 * never drift apart.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const navHidden = pathname.startsWith("/recipe/");

  return (
    <main
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
      style={
        navHidden
          ? undefined
          : { paddingBottom: "calc(env(safe-area-inset-bottom) + 5.25rem)" }
      }
    >
      {children}
    </main>
  );
}
