# Savor — Design System (`design.md`)

> Calm cooking, beautifully designed.
> A condensed, source-of-truth reference for designers and engineers building Savor surfaces.

---

## 1. Brand essence

**Voice.** Calm, supportive, present-tense. We guide; we never rush.
**Don't.** No emoji, no urgency language ("Hurry!", "Don't miss!"), no exclamation stacks, no bouncy motion.
**Do.** Plain language, sensory verbs (*simmer*, *fold*, *rest*), short sentences, generous whitespace.

Sample copy:
- ✅ "Saved for later."
- ✅ "Cook the pasta until al dente."
- ❌ "🔥 Don't miss this trending recipe!!"

---

## 2. Logo & marks

| File | Use |
|---|---|
| `assets/savor-logo-primary.png` | Primary lockup — wordmark + tagline |
| `assets/savor-logo-horizontal.png` | Horizontal lockup — for headers and narrow containers |
| `assets/savor-icon-mark.png` | Pot-and-leaf mark on transparent — for favicons, app heads, watermarks |
| `assets/savor-app-icon-primary.png` | Forest green app icon (rounded square) |
| `assets/savor-app-icon-cream.png` | Cream variant |
| `assets/savor-app-icon-sage.png` | Sage variant |
| `assets/savor-app-icon-neutral.png` | Neutral variant |

**Clear space.** Reserve at least the height of the leaf finial around any lockup.
**Minimum sizes.** Primary: 96px wide. Horizontal: 120px wide. Icon mark: 24px.
**Don't** recolor the mark; don't stretch; don't place on busy photography without a scrim.

---

## 3. Color tokens

All tokens live in `colors_and_type.css`. Reference by CSS variable.

### Primary
| Token | Hex | Notes |
|---|---|---|
| `--savor-forest` | `#1F4D3A` | Anchor — primary buttons, brand moments |
| `--savor-forest-deep` | `#173B2C` | Hover / pressed |
| `--savor-sage` | `#7A9A7E` | Accents, illustrations |
| `--savor-sage-mist` | `#D7E2D5` | Active chips, soft pills |

### Neutrals
| Token | Hex | Use |
|---|---|---|
| `--savor-cream` | `#F6EFE0` | App background |
| `--savor-linen` | `#EDE3CF` | Hover surface, subtle dividers |
| `--savor-paper` | `#FFFCF6` | Cards, surfaces |
| `--savor-ink` | `#2A2520` | Primary foreground |
| `--savor-stone` | `#7A7268` | Secondary text |

### Semantic
| Token | Hex | Use |
|---|---|---|
| `--bg-app` | cream | Default app surface |
| `--bg-surface` | paper | Cards |
| `--bg-brand` | forest | Primary fills |
| `--bg-brand-hover` | forest-deep | Hover |
| `--fg-1` | ink | Primary text |
| `--fg-2` | stone | Secondary text |
| `--fg-3` | `#A29A8E` | Tertiary text, dividers |
| `--fg-brand` | forest | Brand text |
| `--fg-on-brand` | cream | Text on forest |
| `--border-hairline` | `#E6E1D6` | Card outlines |

> **Rule of thirds.** Cream/paper dominate (≥60% of any frame), forest anchors (≤20%), accents and ink fill the rest.

---

## 4. Typography

Two families. No exceptions.

| Family | Weights | Use |
|---|---|---|
| **Playfair Display** | 400, 500, 600, 700 | Headings, recipe titles, eyebrows of importance |
| **Inter** | 400, 500, 600 | Body, UI, captions, eyebrows |

### Type scale
| Role | Family | Size / Line | Weight |
|---|---|---|---|
| Display | Playfair | 40 / 1.15 | 600 |
| H1 | Playfair | 32 / 1.2 | 600 |
| H2 | Playfair | 24 / 1.25 | 600 |
| H3 | Playfair | 19 / 1.3 | 600 |
| Body | Inter | 16 / 1.55 | 400 |
| Small | Inter | 14 / 1.5 | 500 |
| Caption | Inter | 12 / 1.5 | 400 |
| **Eyebrow** | Inter | 12 / 1, `0.18em` tracking, uppercase, forest | **600** |

### Rules
- Recipe titles always use Playfair.
- Numerics in metadata (time, servings) use Inter `tabular-nums`.
- Body line-length cap: ~62ch. Use `text-wrap: pretty` on paragraphs.

---

## 5. Spacing, radii, shadows, motion

### Spacing scale (4-base)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 80`

### Radii
| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Chips, inputs |
| `--radius-md` | 12px | Tiles, secondary buttons |
| `--radius-lg` | 16px | Cards |
| `--radius-xl` | 24px | Hero, modals |
| `--radius-pill` | 999px | Primary CTAs |

### Shadows (whisper, never shout)
- `--shadow-1`: `0 1px 2px rgba(40,28,12,0.04)` — resting card
- `--shadow-2`: `0 6px 18px rgba(40,28,12,0.06)` — raised card
- `--shadow-3`: `0 18px 48px rgba(40,28,12,0.10)` — sheet, modal

### Motion
| Token | Duration | Easing |
|---|---|---|
| `--duration-fast` | 120ms | `--ease-standard` |
| `--duration-base` | 220ms | `--ease-standard` |
| `--duration-slow` | 360ms | `--ease-out-soft` |

`--ease-standard: cubic-bezier(.2,.8,.2,1)`
`--ease-out-soft: cubic-bezier(.16,1,.3,1)`

> No bounce, no overshoot. Slide and fade are the only allowed transforms for content.

---

## 6. Components

### Buttons
- **Primary:** forest fill, cream text, pill radius, 14×24 padding. Hover → `forest-deep`. Pressed → scale 0.99.
- **Secondary:** transparent fill, forest text, 1.5px forest border, pill radius.
- **Ghost:** no border, forest text, hover linen background.
- **Disabled:** 50% opacity, no hover.

### Filter chips
- 8px radius (flat squircle), 8×14 padding, no shadow, no border.
- **Default:** cream surface, ink text, 500.
- **Hover:** linen surface.
- **Active:** sage-mist surface, forest text, 600.
- **Add filter (solid):** forest fill, cream text.

### Cards
- 1px hairline border (`--border-hairline`), 16px radius, paper surface, `--shadow-1` at rest.
- Recipe card photo: 5:3 aspect for hero rows, 1:1 for compact grids.

### Recipe grid (Top-N)
Three layouts (tweakable):
1. **`card`** — 2-column grid, square photo, single-line title, time + level.
2. **`tight`** — photo + meta side-by-side, 2-column.
3. **`row`** — single-column list rows with 44px thumbs.

### Search bar
- 12px radius, 1px hairline border, 14×16 padding, leading search icon, focus ring = 2px sage outline.

### Tab bar (mobile)
- Cream background, 1px top hairline, 5 max items, 22px icons, label 11px, active = forest, inactive = stone. Add 34px bottom padding to clear iOS home indicator.

### Step rows / cook mode
- Numeric badge (forest circle, cream digit), 16px gap, body copy in Inter 16/1.55.
- Cook mode timer: Playfair 56, tabular-nums, forest.

---

## 7. Iconography

- **Style:** Lucide line set, 1.75 stroke, rounded caps and joins, 24px default. (Substituted until official Savor icon set lands.)
- **Color:** `currentColor` — let the parent choose; never hardcode.
- **Sizes:** 16, 18, 20, 24. Avoid arbitrary sizes.

---

## 8. iOS layout safe areas

- **Top:** 64px before content (clears status bar + dynamic island).
- **Bottom (with tab bar):** tab bar adds 34px home-indicator pad; scroll-area ends at 110px from bottom.
- **Hit targets:** never below 44×44.

---

## 9. Photography (when available)

- Bright natural light, real ingredients, top-down or 3/4 angle.
- Background neutrals: linen, oak, weathered ceramic. No glossy props.
- Crop tight; food fills 70%+ of frame.
- (Currently using warm sage/sand gradient placeholders — replace with library when supplied.)

---

## 10. File map

```
colors_and_type.css           # all tokens
README.md                     # full brand brief
design.md                     # this file (condensed reference)
SKILL.md                      # agent invocation guide

assets/                       # logos, marks, icons
preview/                      # 1 file per design-system card
ui_kits/savor-app/            # 5-screen mobile prototype
  index.html, App.jsx, Screens.jsx, Icons.jsx, data.jsx,
  styles.css, ios-frame.jsx, tweaks-panel.jsx
```

---

## 11. Working with this system

1. **Always import** `colors_and_type.css` — never hand-pick hex values.
2. **Always reference** by token (`var(--fg-brand)`), never by raw hex.
3. **Match the voice** before shipping copy — reread §1.
4. **When in doubt, breathe.** More whitespace, lighter shadow, slower easing.
