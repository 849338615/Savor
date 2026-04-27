# Savor App — UI Kit

A pixel-faithful recreation of the Savor mobile app, derived from the brand sheet's UI preview.

## Screens (clickable prototype)

1. **Home / Search** — search bar, interest chips, top-8 recipe results
2. **Recipe detail** — hero image, Ingredients / Steps tab strip, servings stepper, ingredient checklist
3. **Steps view** — numbered, spacious, with optional inline timer chips
4. **Cook mode** — one step at a time, hero photo, large type, prev/next navigation, timer chip
5. **Saved + Profile** — bookmark list and quiet settings page

## Files

- `index.html` — entry; loads React + components in order
- `styles.css` — local styles, layered on top of `colors_and_type.css`
- `Icons.jsx` — Lucide-style inline SVG icon components
- `data.jsx` — sample recipe data + food gradient placeholders (no real photography is in the project; gradients stand in)
- `Screens.jsx` — `HomeScreen`, `RecipeDetail`, `CookMode`, `SavedScreen`, `ProfileScreen`, `TabBar`
- `App.jsx` — top-level state machine wiring screens together
- `ios-frame.jsx` — iPhone bezel (starter component)

## Try it

Open `index.html`. Tap a recipe → check off ingredients → switch to **Steps** → tap **Start cooking** → step through.

## Known gaps & flags

- **Food photography** is rendered as warm gradients. The brand sheet calls for "bright natural light, neutral backgrounds, real ingredients" — swap in real shots when available.
- **Icons** use Lucide-equivalents (1.75 stroke). Replace with the official Savor icon set if/when supplied.
- Only Recipe #1 has full ingredients/steps data; others show titles and meta only.
