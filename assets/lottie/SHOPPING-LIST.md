# Lottie shopping list — Excerly exercises

Tick each one off as you buy/download a licensed animation and drop the JSON in
this folder. Anything you don't have a clip for keeps its built-in SVG figure,
so you can do these in any order and ship partially.

**File format to buy:** Lottie JSON (not GIF, not `.lottie`/dotLottie).
**License:** must allow use in a **published/distributed app**. Keep the receipt.
**Do NOT use** the three Runna `.webm` files — they're copyrighted.

| ✓ | # | Exercise | key (`animation`) | Target area | Motion | Search term |
|---|---|----------|-------------------|-------------|--------|-------------|
| ☐ | 1 | Neck stretch | `neck` | Neck & shoulders | hold 20s | "neck stretch" |
| ☐ | 2 | Shoulder rolls | `shoulders` | Shoulders | looping | "shoulder rolls / shoulder stretch" |
| ☐ | 3 | Arm circles | `arms` | Shoulders & arms | looping | "arm circles" |
| ☐ | 4 | Side bend | `sidebend` | Waist & torso | hold 15s | "standing side bend stretch" |
| ☐ | 5 | Spinal twist | `twist` | Lower back & torso | hold 10s | "standing torso twist" |
| ☐ | 6 | Forward fold | `forwardfold` | Lower back & hamstrings | hold 25s | "standing forward fold / toe touch" |
| ☐ | 7 | Seated hamstring stretch | `hamstring` | Hamstrings | hold 30s | "seated hamstring stretch" |
| ☐ | 8 | Butterfly stretch | `butterfly` | Groin & inner thigh | hold 30s | "butterfly stretch seated" |
| ☐ | 9 | Quad stretch | `quad` | Quadriceps | hold 25s | "standing quad stretch" |
| ☐ | 10 | Hip flexor stretch | `hipflexor` | Hips & back | hold 30s | "low lunge / hip flexor stretch" |
| ☐ | 11 | Calf stretch | `calf` | Calves | hold 25s | "wall calf stretch" |
| ☐ | 12 | Cat-Cow | `catcow` | Spine | looping | "cat cow stretch" |
| ☐ | 13 | Cobra pose | `cobra` | Abs & lower back | hold 20s | "cobra pose" |
| ☐ | 14 | Child's pose | `child` | Back & shoulders | hold 40s | "child's pose" |

## Where to buy

- **Vector Fit Exercises** (male + female, purpose-built): https://vectorfitexercises.com
  - Free samples first: https://vectorfitexercises.com/test-animations
  - Per-pack pricing: https://vectorfitexercises.com/pack-pricing
  - Contact for individual/stretching pricing: vectorfitexercises@gmail.com
- **LottieFiles marketplace** (cheaper, per pack):
  - Men Upper Body Stretching: https://lottiefiles.com/marketplace/men-upper-body-stretching-exercises
  - Workout Routine (male + female): https://lottiefiles.com/marketplace/workout-routine
  - Gym & Fitness: https://lottiefiles.com/marketplace/gym-and-fitness-49_303942
- **IconScout** (per-clip, some free — check license): https://iconscout.com/lottie-animations/stretching-workout

## How to install a clip (once downloaded)

1. Put the JSON here, named by key, e.g. `assets/lottie/neck.json`
   (or a male/female pair: `neck-m.json` / `neck-f.json`).
2. Register it in `assets/js/data.js` → the `LOTTIE` map:
   ```js
   const LOTTIE = {
     neck: 'assets/lottie/neck.json',
     arms: { male: 'assets/lottie/arms-m.json', female: 'assets/lottie/arms-f.json' },
   };
   ```
3. Add each file to `sw.js` (the `ASSETS` array) and bump the cache version.
4. Commit + push. It shows on the exercise detail screen and in the guided player.

> Or just send the files to Claude and it'll do steps 2–4 for you.

See `README.md` in this folder for the full guide.
