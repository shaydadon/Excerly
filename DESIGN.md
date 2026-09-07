---
name: Excerly
description: A calm, clarity-first home stretching & fitness journal — dark by default, one teal voice.
colors:
  bg: "#0e1116"
  bg-soft: "#161b22"
  card: "#1b2230"
  card-2: "#222c3c"
  line: "#2b3648"
  text: "#eaf0f7"
  muted: "#9aa7b8"
  accent: "#35d0a5"
  accent-2: "#4aa3ff"
  accent-warm: "#ffb454"
  danger: "#ef5f6b"
  accent-ink: "#06231c"
  fig: "#cdd8e6"
typography:
  display:
    fontFamily: '"Segoe UI", "Assistant", "Rubik", system-ui, -apple-system, sans-serif'
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: '"Segoe UI", "Assistant", "Rubik", system-ui, -apple-system, sans-serif'
    fontSize: "21px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.2px"
  title:
    fontFamily: '"Segoe UI", "Assistant", "Rubik", system-ui, -apple-system, sans-serif'
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: '"Segoe UI", "Assistant", "Rubik", system-ui, -apple-system, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: '"Segoe UI", "Assistant", "Rubik", system-ui, -apple-system, sans-serif'
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  pill: "999px"
  lg: "18px"
  md: "14px"
  sm: "12px"
  xs: "10px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-ghost:
    backgroundColor: "{colors.card-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  input:
    backgroundColor: "{colors.card-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "11px 12px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.card-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "5px 11px"
  tab-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "7px 4px"
---

# Design System: Excerly

## Overview

**Creative North Star: "The Quiet Dashboard"**

Excerly is a personal health console you can read in a glance. It is dark by default,
built as a single thumb-width column, and it earns trust through precision rather than
personality: numbers are legible, states are unambiguous, and color is spent
carefully. Every screen is a surface for a task — the day's stretches, a BMI reading,
a food log, a streak — so the interface stays quiet and lets the data speak. Where
delight appears (a springy tap, an animated stretch figure, a celebratory check) it is
a reward for action, never decoration for its own sake.

The palette is a cool, dark neutral base carrying **one primary voice — Signal Teal** —
with Azure and Amber reserved for information and attention. This restraint is the
brand: a screen that lights up teal in exactly one place tells you where to go. The
system supports full **Hebrew (RTL) and English (LTR)** with logical properties
throughout, and a light theme that mirrors the dark one for daylight use.

Content surfaces sit flat on tonal layers; only true overlays — the daily bottom
sheet, the guided player, toasts — and the single primary action per view lift off the
page with a defined shadow. Depth is a signal, not a texture.

**Key Characteristics:**
- Dark-first, cool-neutral, single-column mobile console (max 620px).
- One saturated accent (Signal Teal) carries the primary/interactive meaning.
- Tabular, high-weight numerals for every metric.
- Flat at rest, lifted only for overlays and the primary CTA.
- Fully bidirectional (RTL/LTR) via logical properties.
- Motion is functional feedback (tap-scale, sheet slide, progress) and always
  respects `prefers-reduced-motion`.

## Colors

A cool, dark neutral field that reads **almost monochrome**, with a single teal voice
used sparingly and two supporting signals held in reserve; color is rationed hard so
the accent always means "act here."

### Primary
- **Signal Teal** (`#35d0a5`): the one interactive/brand color. Active tab, primary
  CTA gradient origin, focus borders, progress rings, completed states, key metric
  numbers, links-that-matter. On teal fills, text is **Deep Teal Ink** (`#06231c`).

### Secondary
- **Azure** (`#4aa3ff`): information and non-primary emphasis — secondary metrics,
  the "week/plan" chips, AI-quota notes, the target-weight range, macro "carbs." Use
  sparingly; when a value is merely secondary rather than *informational*, let Muted
  Steel carry it instead of Azure.

### Tertiary
- **Amber** (`#ffb454`): attention and rest/gym state — rest-day chips, gym markers,
  the tip callout, "lose weight" status, chart target line. Reserve for genuine
  state or warning, never decoration.

### Neutral
- **Midnight Ink** (`#0e1116`): app background (also the manifest `theme_color`).
- **Deep Slate** (`#161b22`): raised background for overlays (bottom sheet, sheet head).
- **Panel Navy** (`#1b2230`): the default card surface.
- **Raised Navy** (`#222c3c`): nested surfaces — inputs, inner boxes, secondary chips.
- **Hairline Steel** (`#2b3648`): borders, dividers, dashed separators, chart grid.
- **Cloud White** (`#eaf0f7`): primary text.
- **Muted Steel** (`#9aa7b8`): secondary text, labels, captions, inactive icons.
- **Figure Silver** (`#cdd8e6`): the exercise SVG figures (constant across themes).

### Semantic
- **Coral Red** (`#ef5f6b`): destructive only — delete buttons, error borders.

**Light theme (mirror).** A `prefers-color-scheme: light` block remaps the same token
names to a daylight set (bg `#eef2f7`, card `#ffffff`, card-2 `#f2f5fa`, line
`#dde4ee`, text `#16202e`, muted `#5b6b80`) while the three accents and semantics stay
constant. Design to the tokens, never to raw hex, so both themes track automatically.

### Named Rules
**The Single Voice Rule.** Signal Teal is rationed to **≤10% of any screen** — ideally
a single element: the one primary action, the active tab, or the metric that matters
most right now. Everything secondary defaults to Cloud White or Muted Steel; reach for
Azure only for genuinely *informational* emphasis and Amber only for rest/gym or
warnings, both sparingly. Coral is destruction only. The target is a calm, near-
monochrome screen with one teal focal point; two saturated accents competing for the
eye is the failure.

**The Constant Figure Rule.** Exercise figures use Figure Silver and a fixed
`--work: #ff9a3d` highlight in *both* themes; illustration color does not follow the
UI theme.

## Typography

**Body & Display Font:** system UI stack — `"Segoe UI", "Assistant", "Rubik",
system-ui, -apple-system, sans-serif`. No web fonts are loaded; Assistant and Rubik
are named so Hebrew renders in a matched Hebrew face where installed.

**Character:** neutral, legible, and fast — the type never performs. Personality comes
from **weight and number treatment**, not from a display typeface. Emphasis lives at
700–800; regular reading text sits at 400–600.

### Hierarchy
- **Display** (800, 44px, line-height 1): the guided-player countdown and hero
  metrics; always `tabular-nums`. Big numerics are the closest thing to a hero here.
- **Headline** (800, 20–22px): screen and sheet titles (`app-title`, `detail-name`,
  `sheet-title`, `player-name`).
- **Title** (800, 16–17px): card titles and section headers (`card-title`,
  `cal-month`, `menu-title`).
- **Body** (400–600, 14–15px, line-height ~1.55): inputs, instructions, list rows,
  notes. Keep long reading measures comfortable.
- **Label** (700, 11–13px): tab labels, field labels, chips, badges, captions — the
  small, dense signposting. Often colored Muted Steel.

### Named Rules
**The Tabular Metric Rule.** Every number a user reads or compares (timer, calories,
BMI value, target range, macros) uses `font-variant-numeric: tabular-nums` so digits
don't jitter as they change.

**The Weight-Not-Size Rule.** Establish hierarchy with weight (800 vs 600 vs 400) and
color (text vs muted) before reaching for larger sizes; the scale is tight on purpose.

## Layout

A single centered column, `max-width: 620px`, with `18px 16px` padding and a
bottom-fixed tab bar (space reserved via `env(safe-area-inset-bottom)` and ~84px
bottom padding). Vertical rhythm is card-based: cards are separated by 16px, internal
gaps run on a 6/8/10/12/16 scale. Dense sub-grids use `repeat(2, 1fr)` (profile) and
`repeat(3, 1fr)` (macros, history stats); the calendar is `repeat(7, 1fr)` with
`aspect-ratio: 1`. Everything is authored with **logical properties**
(`inset-inline-*`, `margin-inline`, `text-align: start/end`) so RTL and LTR share one
layout. Breakpoints are narrow-phone refinements, not desktop layouts: `≤460px`
(stack email row), `≤360px` (hide hero figures).

**The Single Column Rule.** One 620px column with a thumb-reachable bottom nav; do not
introduce multi-column desktop layouts or side navigation.

## Elevation & Depth

Hybrid, but disciplined: surfaces are **flat at rest**, separated by tonal layering
(bg → card → card-2) and 1px Hairline Steel borders. Real shadow is reserved for
things that genuinely float. The body also carries two faint fixed radial glows (teal
top-right, azure top-left, ~0.10–0.12 alpha) as atmosphere behind the flat content.

### Shadow Vocabulary
- **Card / floating** (`box-shadow: 0 14px 40px rgba(0,0,0,.45)`): the `--shadow`
  token — the default card lift and the toast.
- **Tab bar** (`box-shadow: 0 -6px 24px rgba(0,0,0,.16)` + `backdrop-filter: blur(10px)`):
  the frosted bottom bar separating from scrolling content.
- **State ring** (`box-shadow: 0 0 0 1px/2px var(--accent) inset`): today's calendar
  cell, drag-over target, focus emphasis — an inset teal ring, not a drop shadow.

### Named Rules
**The Flat-Rest, Lifted-Overlay Rule.** Content cards may carry the ambient
`--shadow`, but rely first on tonal layers + borders. Reserve pronounced elevation and
`backdrop-filter` for true overlays — the daily bottom sheet, the guided player, the
toast — and for the single primary CTA. State (today, selected, focus) is shown with an
**inset teal ring**, never a colored drop shadow.

## Shapes

A soft-rounded but consistent radius scale: **pill (`999px`)** for switches, chips,
badges, language/range toggles and progress bars; **lg (`18px`)** for cards and the
detail stage; **md (`14px`)** for exercise rows, tab buttons and thumbnails; **sm
(`12px`)** for inputs, buttons, calendar cells and inner boxes; **xs (`10px`)** for the
smallest rows. The daily sheet uses a `22px 22px 0 0` top radius. Borders are a single
1px Hairline Steel; separators inside cards are often `1px dashed var(--line)`. Icons
are line/emoji-based; interactive circles (finish toggle, add-item, player controls)
are true `50%` circles.

## Components

Components read as crisp, bordered surfaces. They lean on the token scale for radius
and color, give clear tactile press feedback, and keep decoration minimal.

### Buttons
- **Shape:** rounded rectangle, `12px` (`--radius-sm`); full-width variant `.btn-block`.
- **Primary:** teal→azure gradient (`linear-gradient(135deg, var(--accent), var(--accent-2))`)
  with Deep Teal Ink text; padding `12px 16px`, weight 700. Reserve for the one main
  action per view.
- **Ghost/Secondary:** Raised Navy background, Cloud White text, 1px Hairline border.
- **States:** hover brightens the primary (`filter: brightness(1.05)`); every button
  presses with `transform: scale(.97)` on `:active`.
- **Google/OAuth button:** white surface, dark text, inline SVG mark — the one
  intentionally light control.

### Chips
- **Style:** pill, Raised Navy background, 1px Hairline border, Muted Steel label
  (12px/600). Semantic tints recolor text only: `.rest`/`.gym` → Amber, `.week` → Azure.

### Cards / Containers
- **Corner:** `18px` (`--radius`). **Background:** Panel Navy. **Border:** 1px Hairline
  Steel. **Shadow:** ambient `--shadow` (see Elevation). **Padding:** `16px`. Nested
  boxes (target-weight, calorie, plan-day) drop to Raised Navy + `12px`.
- **Entry motion:** `.card.tab-in` fades/slides up 10px on tab switch (disabled under
  reduced-motion).

### Inputs / Fields
- **Style:** Raised Navy background, 1px Hairline border, Cloud White text, `12px`
  radius, `11px 12px` padding, `15px` text. Field labels are 12.5px Muted Steel above.
- **Focus:** border shifts to Signal Teal (`border-color: var(--accent)`), no glow.
  Checkboxes/toggles use `accent-color: var(--accent)`.

### Navigation (bottom tab bar)
- **Style:** fixed, frosted (`color-mix` card at 92% + `blur(10px)`), 1px top border,
  upward shadow. Tabs are icon-over-label columns, 11px/700 Muted Steel.
- **Active:** Signal Teal text on a 12%-teal tint pill; icon un-grayscales and nudges
  up. Press feedback `scale(.94)`.

### Signature Components
- **Daily Bottom Sheet:** slides from the bottom (`translateY` + cubic-bezier
  `.22,1,.36,1`), Deep Slate surface, `22px` top radius, grip handle, sticky head over
  a dimmed blurred backdrop. The core interaction pattern of the app.
- **Guided Player:** full-screen overlay with a large `tabular-nums` timer, an SVG
  progress ring (teal on Hairline track), circular controls, and a big teal primary.
- **Calendar Cell:** square (`aspect-ratio: 1`), `12px` radius, Raised Navy; today gets
  an inset teal ring; status dots (done=teal, planned=azure, rest=muted, gym=amber);
  supports drag-and-drop rescheduling with teal drop-target rings.
- **BMI Gauge:** conic-gradient ring driven by `--p`, animated via a transitioned
  custom property, with a centered `tabular-nums` value.
- **Exercise Figures:** inline SVG characters with per-exercise CSS keyframe
  animations, a pulsing `.work-zone` highlight, and a soft ground shadow — all silenced
  under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** design to tokens (`var(--card)`, `var(--accent)`, `--radius`) so both themes
  and RTL/LTR track automatically.
- **Do** ration Signal Teal to ≤10% of a screen — ideally one element — and default
  secondary content to Cloud White / Muted Steel before reaching for Azure or Amber
  (The Single Voice Rule).
- **Do** give every changing number `tabular-nums` and an 800 weight.
- **Do** use logical properties (`inset-inline-*`, `text-align: start/end`,
  `margin-inline`) for anything positional.
- **Do** reserve real shadows and `backdrop-filter` for overlays and the single
  primary CTA; separate resting surfaces with tonal layers + 1px borders.
- **Do** pair every animation with a `prefers-reduced-motion: reduce` fallback and
  give taps a `scale(.94–.97)` press.
- **Do** keep exercise illustrations on Figure Silver + the fixed work-highlight in
  both themes.

### Don't:
- **Don't** spend a second saturated accent where one teal would do, or use Coral for
  anything but destructive actions.
- **Don't** add desktop multi-column or sidebar layouts; stay in the 620px column with
  bottom nav.
- **Don't** introduce web fonts or a display typeface — hierarchy comes from weight,
  color, and number treatment.
- **Don't** show state with a colored drop shadow; use the inset teal ring.
- **Don't** hard-code hex values, physical `left/right`, or fixed pixel colors that
  break the light theme or RTL.
- **Don't** let decoration outrank legibility — this is a dashboard, not a poster.
