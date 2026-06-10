// Activate the React "canary" type declarations project-wide. The
// `<ViewTransition>` component (used in app/template.tsx for page transitions)
// ships in React's canary channel and is typed in @types/react/canary.d.ts,
// which isn't loaded by default. This single reference makes the types
// available everywhere — see the activation note at the top of that file.
//
// Runtime support is already present: Next aliases `react` to its compiled
// build, which exports ViewTransition, and `experimental.viewTransition`
// does not require the experimental React channel.
/// <reference types="react/canary" />

export {};
