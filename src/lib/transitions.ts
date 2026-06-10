/**
 * View-transition type tags for navigation.
 *
 * Pass these to `<Link transitionTypes={[...]}>` or
 * `router.push(href, { transitionTypes: [...] })`. Next forwards them to
 * React's `addTransitionType`, where the `<ViewTransition>` in
 * `app/template.tsx` maps each one to a CSS class that drives the motion
 * (defined in globals.css). Navigations left untagged take no animation.
 *
 * The taxonomy mirrors how users move through the app:
 *  - TAB        peer destinations (bottom nav, in-place results refine) — crossfade
 *  - NAV_FORWARD going deeper (open a recipe, search, open a setting) — slide in from right
 *  - NAV_BACK   returning (back buttons) — mirror of forward
 *  - ENTER_COOK stepping into focus mode (nav bar disappears) — scale up + fade
 *  - EXIT_COOK  leaving focus mode — scale down + fade
 */
export const TAB = "tab";
export const NAV_FORWARD = "nav-forward";
export const NAV_BACK = "nav-back";
export const ENTER_COOK = "enter-cook";
export const EXIT_COOK = "exit-cook";
