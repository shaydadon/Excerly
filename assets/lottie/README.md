# Upgrading exercise avatars to Lottie (professional animations)

The app ships with **built-in SVG figures** for every exercise, so it works
with zero setup. When you want a premium, studio-quality look, you can swap any
exercise for a **Lottie** animation — the same JSON-based format used by most
fitness apps. The app auto-detects your files and falls back to the SVG figure
for any exercise you haven't replaced, so you can upgrade them one at a time.

Lottie files are shown on the **big screens** (exercise detail + the guided
player). The small list thumbnails always use the lightweight SVG, so the list
stays fast.

---

## What a Lottie file is

A `.json` file that describes a vector animation (exported from After Effects
via the *Bodymovin* plugin, or downloaded from a marketplace). It plays as
crisp vectors at any size and is usually only tens of KB.

---

## Step 1 — Get the animations (licensing matters)

Pick **one** source. Whatever you choose, confirm the licence allows use in an
app you may publish.

- **LottieFiles marketplace** — https://lottiefiles.com
  Search e.g. "stretching", "yoga", "workout", "exercise". Filter to the style
  you like. Free items exist; many good fitness sets are paid. Download as
  **Lottie JSON** (not `.lottie`, not GIF).
- **Commission an animator** — Fiverr/Upwork "Lottie animation" gigs, or a
  motion designer, to produce a matching set of ~14 clips in one style.
- **Make them yourself** — Adobe After Effects + the free **Bodymovin /
  LottieFiles** plugin → *Export → Lottie JSON*.

> ⚠️ Do **not** rip animations out of another commercial app — that's a
> copyright violation. Use licensed or original assets only.

Aim for a consistent style across all 14 so the app looks like one product.
Loop-able clips (a few seconds, seamless) look best in the player.

## Step 2 — Add the files to the project

Drop the JSON files into this folder (`assets/lottie/`). Name them by exercise
so they're easy to track, e.g.:

```
assets/lottie/
  neck.json
  shoulders.json
  arms.json
  ...
```

The exercise keys (the `animation` field) are:

```
neck  shoulders  arms  sidebend  twist  forwardfold  hamstring
butterfly  quad  hipflexor  calf  catcow  cobra  child
```

If you have separate male/female clips, name them e.g. `arms-m.json` /
`arms-f.json`.

## Step 3 — Register them

Open `assets/js/data.js`, find the `LOTTIE` map, and list only the exercises
you've replaced. One file, or a male/female pair:

```js
const LOTTIE = {
  neck: 'assets/lottie/neck.json',
  arms: {
    male:   'assets/lottie/arms-m.json',
    female: 'assets/lottie/arms-f.json'
  },
  // ...add more as you get them; the rest keep the built-in SVG figure
};
```

## Step 4 — Cache the new files (PWA)

So the app serves them offline and picks up the change, add each file to the
precache list in `sw.js` (the `ASSETS` array) **and bump the cache version**
(e.g. `excerly-v14` → `excerly-v15`). Bumping the version is what forces
installed phones to pull the update.

```js
const CACHE = 'excerly-v15';
const ASSETS = [
  // ...existing entries...
  'assets/lottie/neck.json',
  'assets/lottie/arms-m.json',
  'assets/lottie/arms-f.json'
];
```

## Step 5 — Deploy

Commit and push to your branch. GitHub Pages redeploys automatically. On the
phone, reopen the app (or pull-to-refresh) — the new cache version pulls the
Lottie files in.

---

## How it works internally (no code changes needed)

- `assets/js/app.js` reads `D.LOTTIE`. On the detail + player screens it renders
  `<div class="ex-lottie" data-lottie="KEY">` when a file is registered,
  otherwise the SVG figure.
- The `lottie-web` player library is **lazy-loaded from a CDN only when at least
  one Lottie file is actually shown** — so if the map is empty there's zero
  extra download.
- `mountLottie()` initialises each player after it's added to the page. Files
  are same-origin, so they're covered by the service-worker cache once listed
  in Step 4.

## Testing one file quickly

1. Put a single JSON in this folder, e.g. `arms.json`.
2. Add `arms: 'assets/lottie/arms.json',` to the `LOTTIE` map.
3. Open the app, tap today's workout → the **Arm stretch** → its detail screen.
   You should see the Lottie animation instead of the SVG figure. Start the
   guided workout to see it in the player too.

If it doesn't appear: open the browser dev-tools console. A 404 means the path
or filename is wrong; a JSON parse error means the file isn't valid Lottie JSON
(re-export as *Lottie JSON*, not `.lottie`/dotLottie).
