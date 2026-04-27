# Savor Design System

> A calm cooking app. Editorial typography on warm cream surfaces, a deep forest-green anchor, and the minimum elements needed to cook well.

Savor helps users find and follow recipes without the clutter of typical recipe websites. It pulls the top eight relevant results for a search, strips away commentary/ads/visual noise, and presents each recipe in a clear sequence: ingredients → actionable steps → a guided **Start Cooking** mode that walks through one step at a time.

The design language follows from the product's intent: **reduce noise, guide attention, support sequencing, readable first, warm restraint.**

---

## Sources

- `uploads/SavorBrandSystem.png` — full brand sheet (logo, palette, type, iconography, UI preview, voice & tone, photography). Re-saved at `assets/brand-system-reference.png` for reference.
- Brand guideline notes pasted in conversation (Sections 3–13 covering personality, logo system, color, typography, iconography, UI principles, components, imagery, voice, accessibility).

There is no Figma file or codebase attached to this project; all visual decisions are derived from the brand sheet and notes above.

---

## Index

```
README.md                    — this file
SKILL.md                     — agent skill manifest (cross-compatible w/ Claude Code)
colors_and_type.css          — CSS tokens for color, type, spacing, radius, shadow, motion

assets/
  brand-system-reference.png — original brand sheet
  savor-logo-primary.svg     — pot+leaf icon stacked over wordmark + tagline
  savor-logo-horizontal.svg  — pot+leaf icon left of wordmark
  savor-icon-mark.svg        — pot+leaf only
  savor-app-icon.svg         — rounded-square forest tile with reversed mark
  photography/               — placeholder image guidance + slots

preview/                     — Design System tab cards (typography, palettes,
                               components, etc.) registered as assets
ui_kits/
  savor-app/                 — Mobile UI kit (5 screens) — index.html + JSX
```

---

## CONTENT FUNDAMENTALS

Voice is **calm, clear, supportive, never pushy**. Read the brand sheet's micro-copy and you'll feel the rhythm: short sentences, present tense, a quiet first-person plural ("Let's get cooking").

**Person & address.** Speak to the user as **"you"**; the app speaks as a gentle host using **"let's"** when guiding ("Let's get cooking", "Ready for the next step?"). Never "I". Never "we" in the corporate sense.

**Casing.** Sentence case for everything: buttons, headings, nav, toasts. Title case is reserved for the wordmark and proper nouns. Eyebrows ("ABOUT THE BRAND", "OUR MISSION") are the one place we use uppercase — Inter semibold, wide tracking, small (12px). All-caps is structural, never shouting.

**Pronouns & possessives.** "Your recipes", "your timer", "saved for later" — possessive feels personal without being clingy.

**Tense.** Present and immediate. "Cook the pasta" not "You will need to cook the pasta". Steps are imperative; meta-copy is gentle.

**Length.** Buttons: 1–3 words ("Start cooking", "View steps", "Save for later"). Headings: under 8 words. Body: short paragraphs, generous line-height, no walls of text.

**What we don't do.**
- ❌ No emoji in product UI. (The brand sheet shows no emoji.)
- ❌ No urgency language: *hurry, unlock, boost, crush, limited time, don't miss out.*
- ❌ No exclamation points beyond the occasional warm moment ("Saved for later." not "Saved for later!").
- ❌ No "Welcome back, friend!" trope. No mascot voice.
- ❌ No marketing puns or food-related wordplay ("souper meals", "let's get cooking" is fine — it's a real phrase).

**Sample phrases (from brand sheet, use as voice anchors):**
> "Let's get cooking."
> "Here's what you'll need."
> "Ready for the next step?"
> "Saved for later."
> "One step at a time."
> "Calm cooking. Clear steps. Less noise."

**Headlines and section titles** lean editorial — Playfair Display, slightly italic in the wordmark, normal in headings. Pair with a quiet eyebrow when grouping is helpful.

---

## VISUAL FOUNDATIONS

### Color
A two-zone palette: **warm cream/white surfaces** carry the page; **forest green** anchors brand moments and primary actions; **sage tones** support chips, filters, progress, and active states. Sand/linen are warm accents for variety; charcoal/stone handle text. Gold from the logo exploration is **presentation-only**, never primary UI.

- Surfaces: `--bg-app` (#FAF7F2 Soft White) and `--bg-cream` (#F6F1E8) dominate.
- Brand: `--savor-forest` (#1F4D3A) for logo, primary CTAs, key headings, active.
- Support: `--savor-sage` (#7BA489), `--savor-sage-mist` (#C9D8C6) for chips/progress.
- Text: `--fg-1` (#232323), `--fg-2` (#6E6B66).
- Lines: hairline `#E6E1D6`, never harsher than `--savor-mist` (#D9D5CF).

### Typography
- **Display:** Playfair Display 600/700 — for H1–H3, brand moments. Editorial, slightly elevated. Tracking sits at -0.01em on H1.
- **Body/UI:** Inter 400/500/600 — for paragraphs, controls, captions, navigation.
- **Eyebrows:** Inter 600, 12px, `0.18em` tracking, uppercase, forest-green.
- **Scale:** H1 48–56 / H2 32–40 / H3 24–28 / Body 16 / Small 14 / Caption 12.
- **Mood:** Editorial but readable, elevated but usable, warm but restrained.

### Spacing & rhythm
4px base scale (`--space-1` through `--space-20`). The system reads **calm because it is generous**: cards have 24–32px padding, sections separate by 48–80px, line-height runs 1.55–1.7 in body copy. When in doubt, add space.

### Backgrounds
- Primary: flat warm cream / soft white — no gradients.
- Photography is full-bleed only on hero or recipe-detail moments; otherwise photo cards have soft 16–20px corners and sit on cream.
- **Never:** noise textures, repeating patterns, busy illustrations, color-shift gradients. Surfaces are flat warm tones.

### Cards
- Soft white background (`#FFFFFF` on cream surfaces, or cream on white).
- Border: 1px hairline (`--border-hairline`, #E6E1D6) — present but quiet.
- Radius: `--radius-lg` (16px) default; `--radius-2xl` (28px) for hero/photo cards.
- Shadow: `--shadow-sm` (0 2px 8px rgba(35,35,35,0.05)) — barely there. Never glossy, never lifted dramatically.
- Padding: 20–32px depending on density.

### Borders & lines
1px hairlines in `#E6E1D6` separate sections. Stronger lines (`--border-strong`) only when an active control needs definition. We avoid heavy 2px+ borders except on focused inputs.

### Shadow system
Five tiers, all soft and color-tinted toward charcoal. Top: `--shadow-focus` is a forest-green ring (rgba(31,77,58,.18)) used for keyboard focus, not a hard outline.

### Corner radii
- `4–8` for inline chips and tiny pills inside text.
- `12–16` for buttons, fields, default cards.
- `20–28` for sheets, photo cards, hero surfaces.
- `pill (999)` for primary CTAs and filter chips — never on text-input boxes.

### Buttons
- **Primary:** Forest fill, cream text, full pill, 48px height, semibold body.
- **Secondary:** Cream/white fill, forest text, 1px forest stroke, same shape.
- **Tertiary:** Text-only forest, no chrome, used inline.

### States
- **Hover (web):** subtle `opacity: 0.92` or one shade darker (e.g. `--bg-brand-hover` = #1A4131). Never lighten.
- **Pressed (mobile/web):** scale 0.98 + slightly darker (`--bg-brand-pressed` = #143527). Never bouncy.
- **Active (selected chip / nav):** sage-mist fill, forest text. Or solid forest fill + cream text.
- **Disabled:** 40% opacity on the element. Never gray-out by changing color tokens.
- **Focus:** soft forest ring, 3px outer.

### Transparency & blur
Used sparingly. Cook-mode top bar may use `backdrop-filter: blur(12px)` on `rgba(250,247,242,0.7)` to keep the photo behind it visible. Otherwise solid surfaces.

### Motion
- **Easing:** `cubic-bezier(0.2, 0, 0.2, 1)` (standard) or `(0.16, 1, 0.3, 1)` (out-soft for entrances).
- **Duration:** 140ms (micro), 220ms (default), 360ms (entrances).
- **No bounce, no spring.** Transitions glide; they don't perform. Modals fade-and-slide-up 8px. Step transitions in cook mode are a 220ms cross-fade.

### Layout rules
- Mobile: 16–24px gutter, 24–32px between major sections.
- Cook mode: full-bleed top photo, single primary action visible above the fold, large step number anchor.
- Bottom tab bar: cream surface, 4 tabs (Home, Saved, Cook, Profile), active uses forest icon + label.

### Imagery
Bright natural light, neutral backgrounds, real ingredients on wood/linen, simple props. Warm color cast, never cool. No filters, no glossy ad sheen, no influencer-styled hero plates. Imagery should feel **organized, believable, quiet**.

### Visual motifs to AVOID (anti-patterns)
- ❌ Bluish-purple gradients
- ❌ Emoji as iconography or in marketing
- ❌ Glossy drop shadows or neumorphism
- ❌ Cards with a single bright left-border accent
- ❌ Saturated photo filters
- ❌ Hard 2px black borders
- ❌ Trend-chasing visual flourishes (glassmorphism, brutalist mixes, etc.)

---

## ICONOGRAPHY

The brand sheet specifies **minimal line icons, consistent stroke weight, rounded corners, low visual noise, outline-by-default**. Pair icons with labels when clarity matters. Icons support clarity, **not decoration**.

**Substitution flagged:** the brand sheet ships its own custom icon set on the cover, but no icon font / SVG sprite was provided. We use **[Lucide](https://lucide.dev/)** as the closest match — same minimal stroke style, rounded line caps, outline-first, and it covers every named icon (Search, Timer, Leaf, Bookmark, Heart, Utensils, ListChecks, Users, ShoppingCart, User, ArrowLeft, Check, Play, Pause, MoreHorizontal). Stroke `1.75` is the closest visual match to the brand-sheet weight.

> **🚩 Ask the user:** if you have the official Savor icon SVGs, drop them into `assets/icons/` and we will swap Lucide out everywhere.

**Rules of use**
- Default size: 20px in body UI, 24px for nav, 28–32px for hero/cook-mode actions.
- Stroke: `1.75` always. Never mix weights in one screen.
- Color: inherits text color (`currentColor`). Forest for active, stone for inactive.
- **Pair with labels** for any destructive, ambiguous, or low-frequency action.
- **No emoji** anywhere in product UI or marketing.
- **No unicode-character icons** (★ ✓ ▶) — always real SVG.
- App-icon and marketing materials may use the pot-and-leaf mark only.

**Logos available**
- `assets/savor-logo-primary.png` — official primary lockup with wordmark + tagline.
- `assets/savor-logo-horizontal.png` — official horizontal lockup.
- `assets/savor-icon-mark.png` — official pot-and-leaf mark.
- `assets/savor-app-icon-primary.png` / `-cream.png` / `-sage.png` / `-neutral.png` — official app icon variants (forest, cream, sage, neutral).

> All logos and icons are now the official assets supplied by the brand.

---

## CAVEATS & ASKS

**🚩 Things to verify with the user**

1. **Logos are SVG redraws** of the brand sheet — original vector files weren't supplied. Spirit (pot, lid finial, leaf, italic Playfair wordmark, forest green) is preserved, but please drop in the official files when available.
2. **Icons substitute Lucide** (closest match: minimal line, rounded caps, 1.75 stroke). If you have the official Savor icon set, drop them in `assets/icons/` and we'll replace usage everywhere.
3. **Recipe photography is gradient-stand-in.** The brand sheet specifies bright natural light and real ingredients — we have no photo library yet. Please share the photography library when ready.
4. **No fonts shipped locally.** Playfair Display + Inter load from Google Fonts CDN. If you need offline-safe assets, supply licensed `.ttf` / `.woff2` and we'll move them into `fonts/`.
5. **Voice samples** are pulled from the brand guideline notes; if you have a fuller copywriting style guide, we can expand the Content Fundamentals section.

**🙏 Help us iterate to perfection**

The strongest moves you can make right now:
- Send the **official logo SVGs and icon SVGs** so we can swap out the redraws.
- Share **3–5 hero food photos** so we can replace the gradient placeholders in the UI kit.
- Tell us if you want a **marketing site UI kit** alongside the mobile app kit — we built mobile only, since that's what the brand sheet previewed.
