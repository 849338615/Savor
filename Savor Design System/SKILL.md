---
name: savor-design
description: Use this skill to generate well-branded interfaces and assets for Savor (a calm cooking app), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map of this skill

- `README.md` — full brand context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — the canonical token file. Import it in any HTML artifact:
  `<link rel="stylesheet" href="colors_and_type.css">`
- `assets/` — logos (primary, horizontal, mark, app-icon), brand-system reference image
- `preview/` — small per-concept cards showing tokens and components in isolation
- `ui_kits/savor-app/` — pixel-faithful mobile UI kit (5 screens, JSX components, ready to mine for components)

## Non-negotiables

- Forest Green (#1F4D3A) anchors brand moments and primary actions; Soft White / Cream dominate surfaces.
- Playfair Display for headings; Inter for everything else. Eyebrows: Inter 600, 12px, 0.18em tracking, uppercase, forest-green.
- Buttons are pill-shaped. Cards have 1px hairline borders (#E6E1D6) and shadows that are barely there.
- No emoji, no urgency language, no bouncy motion. Voice is calm, supportive, present-tense.
- Iconography is Lucide (1.75 stroke) as a flagged substitution for Savor's custom set.
