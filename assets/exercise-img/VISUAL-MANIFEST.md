# Excerly visual manifest

Reviewed 6 Nov 2026 on branch `cursor/nutrition-meal-cards-4811`, then updated 11 Nov 2026 (preview only, not published): spinal-twist photographs replace the twist diagrams; shoulder-roll diagrams are unreferenced and not shown in the app. A missing label is not a pass. Verdicts are pass only when the still matches the exercise definition.

Palette stays paper `#F2EADC`, charcoal `#24211F`, terracotta `#B96D50`. The photographs stay the warm dark-gym photos. Illustration gender is `localStorage excerly.fig` (`male` default), independent of profile/BMI gender.

## Shoulder rolls and spinal twist

Shoulder-roll motion diagrams (`shoulders-m.jpg` / `shoulders-f.jpg` and their SVG sources) must not appear in the app, the service-worker precache, or `EXIMG`. The exercise and its instructions stay; the UI uses the no-image fallback (dark tile + icon), never a cream or empty gray box.

Spinal twist uses approved realistic photos in `twist-m.jpg` and `twist-f.jpg` (owner-approved a3, 11 Nov 2026). Diagram JPEG/SVG sources for twist are unreferenced and removed.

| File | What is visible | Verdict |
| --- | --- | --- |
| `shoulders-m.jpg` / `shoulders-f.jpg` | Not shown. No verified photo yet. | UNREFERENCED |
| `twist-m.jpg` | Approved realistic photo, male standing spinal twist (a3). | PENDING LIVE (preview) |
| `twist-f.jpg` | Approved realistic photo, female standing spinal twist (a3). | PENDING LIVE (preview) |

## Home stretches (photographs)

| File | What is visible | Verdict |
| --- | --- | --- |
| `neck-m.jpg` | Standing, eyes closed, head tilted toward one shoulder, shoulders down. | PASS |
| `neck-f.jpg` | Same lateral neck tilt, eyes closed. | PASS |
| `arms-m.jpg` | Both arms extended horizontally, the arm-circle still. | PASS |
| `arms-f.jpg` | Both arms extended horizontally. | PASS |
| `sidebend-m.jpg` | Standing lateral bend, one arm overhead, feet planted. | PASS |
| `sidebend-f.jpg` | Standing lateral bend, one arm overhead. | PASS |
| `forwardfold-m.jpg` | Standing hip hinge, hands toward the feet. | PASS |
| `forwardfold-f.jpg` | Standing hip hinge, hands toward the shoes. | PASS |
| `hamstring-m.jpg` | Seated, one leg extended, hands on the shin. | PASS |
| `hamstring-f.jpg` | Seated, both legs extended, reaching toward the feet. | PASS |
| `butterfly-m.jpg` | Seated, soles together, knees out. | PASS |
| `butterfly-f.jpg` | Seated, soles together, knees out, hands on the feet. | PASS |
| `quad-m.jpg` | Standing, one heel pulled to the glute. | PASS |
| `quad-f.jpg` | Half-kneeling heel-to-glute. Same stretch, different base. | PASS |
| `hipflexor-m.jpg` | Half-kneeling lunge, torso upright, arms free. | PASS |
| `hipflexor-f.jpg` | Half-kneeling lunge, torso upright. | PASS |
| `calf-m.jpg` | Hands on a wall, both feet on the floor, back heel down, front knee bent. | PASS |
| `calf-f.jpg` | Same wall calf stretch. Hood is up; the pose is still the wall stretch. | PASS |
| `catcow-m.jpg` | Hands and knees, back rounded (cat). | PASS |
| `catcow-f.jpg` | Hands and knees, back rounded. | PASS |
| `cobra-m.jpg` | Prone, chest lifted, hips down, arms supporting. | PASS |
| `cobra-f.jpg` | Prone, chest lifted, hips down. | PASS |
| `child-m.jpg` | Knees folded, hips back, arms forward, head down. | PASS |
| `child-f.jpg` | Knees folded, hips back, arms forward, head down. | PASS |

## Gym photographs

Every `workout.js` exercise id has a `GYM_FILE` entry and both gender files.

| File | What is visible | Verdict |
| --- | --- | --- |
| `gym-squat-m.jpg` | Barbell on the upper back, knees bent. | PASS |
| `gym-squat-f.jpg` | Barbell back squat, knees bent. | PASS |
| `gym-legpress-m.jpg` | Seated on a sled, both feet on the platform. | PASS |
| `gym-legpress-f.jpg` | Seated on a sled, both feet on the platform. | PASS |
| `gym-legcurl-m.jpg` | Prone, pad behind the ankles, heels toward the glutes. | PASS |
| `gym-legcurl-f.jpg` | Prone leg curl, heels toward the glutes. | PASS |
| `gym-legext-m.jpg` | Seated, both knees straight, both feet lifted, one roller across the ankles. Barefoot. | PASS |
| `gym-legext-f.jpg` | Seated leg extension, both legs straight, one roller across the ankles. Barefoot. | PASS |
| `gym-calf-m.jpg` | Close crop, both heels raised. | PASS |
| `gym-calf-f.jpg` | Close crop, both heels raised. | PASS |
| `gym-hipthrust-m.jpg` | Upper back on a bench, bar across the hips, hips raised. | PASS |
| `gym-hipthrust-f.jpg` | Upper back on a bench, bar across the hips, hips raised. | PASS |
| `gym-lunge-m.jpg` | Dumbbell split lunge, back knee down. | PASS |
| `gym-lunge-f.jpg` | Dumbbell split lunge, back knee down. | PASS |
| `gym-bench-m.jpg` | Flat bench, barbell locked out above the chest. | PASS |
| `gym-bench-f.jpg` | Flat bench, barbell locked out above the chest. | PASS |
| `gym-inclinedb-m.jpg` | Incline bench, dumbbells pressed up. | PASS |
| `gym-inclinedb-f.jpg` | Incline bench, dumbbells at the top of the press. | PASS |
| `gym-fly-m.jpg` | Standing cable fly, handles in front of the chest. | PASS |
| `gym-fly-f.jpg` | Standing cable fly, handles meeting in front. | PASS |
| `gym-ohp-m.jpg` | Seated, dumbbells locked out overhead. | PASS |
| `gym-ohp-f.jpg` | Seated, dumbbells locked out overhead. | PASS |
| `gym-lateral-m.jpg` | Standing, dumbbells raised out to the sides. | PASS |
| `gym-lateral-f.jpg` | Standing, dumbbells raised out to the sides. | PASS |
| `gym-pushdown-m.jpg` | Cable bar pressed down, elbows at the sides. | PASS |
| `gym-pushdown-f.jpg` | Cable bar pressed down, elbows at the sides. | PASS |
| `gym-pulldown-m.jpg` | Seated lat pulldown, bar at the upper chest. | PASS |
| `gym-pulldown-f.jpg` | Seated lat pulldown, bar overhead at the start of the pull. | PASS |
| `gym-row-m.jpg` | Seated cable row, handle drawn to the torso. | PASS |
| `gym-row-f.jpg` | Seated cable row, handle drawn in, feet on the plate. | PASS |
| `gym-facepull-m.jpg` | Rope pulled toward the face, elbows high. | PASS |
| `gym-facepull-f.jpg` | Rope at the face, elbows high. | PASS |
| `gym-curl-m.jpg` | Standing dumbbell curl, palms turned up. | PASS |
| `gym-curl-f.jpg` | Standing dumbbell curl, palms turned up. | PASS |
| `gym-hammer-m.jpg` | Standing curl with a neutral grip: plates face the camera, palms toward the body. | PASS |
| `gym-hammer-f.jpg` | Standing curl with a neutral grip, palms toward the body. Distinct from the supinated curl still. | PASS |
| `gym-reardelt-m.jpg` | Hinged at the hips, dumbbells raised out to the sides. | PASS |
| `gym-reardelt-f.jpg` | Hinged at the hips, dumbbells raised out to the sides. | PASS |
| `gym-plank-m.jpg` | Forearm plank, body straight. | PASS |
| `gym-plank-f.jpg` | Forearm plank, body straight. | PASS |
| `gym-cardio-m.jpg` | Standing on a treadmill belt, both feet on the belt. Cardio, not a mid-stride run. | PASS |
| `gym-cardio-f.jpg` | Running on a treadmill belt. | PASS |

## Counts

- Home stretch files: 28 (14 exercises × 2). All 14 keys are in `EXIMG`.
- Gym files: 42 (21 exercises × 2). All 21 `workout.js` ids are in `GYM_FILE`.
- Shoulder-roll diagrams are unreferenced and not precached. Spinal twist uses approved photos. Diagram SVG sources are removed.
- Total judged images: 70. Pass: 70. Fail: 0. Missing label: not used.

## Known limits

- 72 photograph slots (66 existing + 2 approved twist photos + 4 new gym photos: rdl and warmup, male and female). Shoulder rolls have no verified photo (2 slots hidden).
- A 54px thumb shows the three-frame silhouette, not fine joint detail. The hero and the player square show the sequence; the wide detail crop shows the middle frame.
- `quad-f` is a kneeling heel-to-glute variant of the standing quad stretch.
- `gym-cardio-m` is standing on the treadmill rather than mid-stride.
- `gym-pulldown-f` is the top of the pull; `gym-pulldown-m` is the bar at the chest.
- `gym-legext` is barefoot in both photos. The machine and the straight-leg pose are still a leg extension.

## New gym photographs (preview, 11 Nov 2026)

Owner-approved additions for AI-plan names that had no image. Same dark-gym style as the existing 66 photographs. Shoulder-roll diagrams stay unreferenced.

| File | What is visible | Verdict |
| --- | --- | --- |
| `gym-rdl-m.jpg` | Male, hip hinge, flat back, slight knee bend, one dumbbell in each hand at mid-shin to knee height. | PASS (a1) |
| `gym-rdl-f.jpg` | Female, same Romanian-deadlift hinge, two dumbbells at mid-shin to knee. | PASS (a2) |
| `gym-warmup-m.jpg` | Male riding an upright stationary bike (saddle, no recumbent backrest), hands on the bars, feet on the pedals. | PASS (a2; a1 was a recumbent bike and was rejected) |
| `gym-warmup-f.jpg` | Female riding an upright stationary bike, same setup. | PASS (a1) |
