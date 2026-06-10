import { ViewTransition } from "react";
import { TAB, NAV_FORWARD, NAV_BACK, ENTER_COOK, EXIT_COOK } from "@/lib/transitions";

/**
 * Page-transition backbone.
 *
 * A `template` re-mounts on every navigation (unlike a `layout`, which
 * persists), so the `<ViewTransition>` inside it unmounts → mounts across a
 * route change. That mount/unmount is what makes the `enter`/`exit` maps fire,
 * giving us *directional* motion (old content leaves, new content arrives)
 * rather than a single morphing container.
 *
 * Each navigation tags itself with a transition type (see lib/transitions.ts);
 * the maps below translate that type into a CSS class, and globals.css defines
 * the actual motion for `::view-transition-old(.class)` / `-new(.class)`.
 * Untyped navigations (and the initial, non-transition page load) resolve to
 * `"none"` — they swap instantly, so nothing flashes on first paint.
 *
 * The bottom nav and the app-level ambient bloom live in the persisted layout
 * (AppShell) with their own `view-transition-name`s, so only this page content
 * moves while that chrome stays anchored.
 */
const TYPE_TO_CLASS = {
  [TAB]: "vt-crossfade",
  [NAV_FORWARD]: "vt-forward",
  [NAV_BACK]: "vt-back",
  [ENTER_COOK]: "vt-enter-cook",
  [EXIT_COOK]: "vt-exit-cook",
  default: "none",
} as const;

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={TYPE_TO_CLASS} exit={TYPE_TO_CLASS} default="none">
      {children}
    </ViewTransition>
  );
}
