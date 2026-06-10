"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { TAB, NAV_FORWARD, NAV_BACK, ENTER_COOK, EXIT_COOK } from "@/lib/transitions";

/**
 * The app's scroll surface + the page-transition backbone.
 *
 * The primary nav is now a floating glass island that hovers *over* this
 * scroll area (see BottomNav), rather than taking its own row. So standard
 * screens reserve bottom space here to keep their last content clear of the
 * island. Screens that hide the nav — cook mode and recipe detail, both under
 * `/recipe/*` — opt out, mirroring BottomNav's own visibility rule so the two
 * never drift apart.
 *
 * Page transitions: a SINGLE, persistent `<ViewTransition>` with a stable
 * `name` lives here (in the layout). Because it never unmounts, every
 * navigation is an *update* of one named group — exactly one old + one new
 * snapshot. The earlier approach (a re-mounting `template.tsx`) briefly put
 * two differently-named ViewTransitions in the DOM at once; Chromium deduped
 * that, but WebKit/Safari captured all four snapshots and ghosted. One stable
 * name avoids that entirely. Each navigation tags itself with a transition
 * type (see lib/transitions.ts); `default` maps the active type to a CSS class
 * that globals.css animates. Untyped / first paint → "none" (instant swap).
 */
const VT_CLASS = {
  [TAB]: "vt-crossfade",
  [NAV_FORWARD]: "vt-forward",
  [NAV_BACK]: "vt-back",
  [ENTER_COOK]: "vt-enter-cook",
  [EXIT_COOK]: "vt-exit-cook",
  default: "none",
} as const;

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
      <ViewTransition name="page" default={VT_CLASS} update={VT_CLASS}>
        {children}
      </ViewTransition>
    </main>
  );
}
