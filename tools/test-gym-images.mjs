#!/usr/bin/env node
/* Name → image mapping: every audited exercise name maps to an existing file,
   unless it is an intentional gap (no fitting photo, or ambiguous). */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ctx = { console, window: {}, document: { readyState: 'complete' } };
ctx.window = ctx;
ctx.ExcerlyI18n = { lang: 'he', L: o => o && o.he };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/workout.js'), 'utf8'), ctx);
const W = ctx.ExcerlyWorkout;
const D = ctx.ExcerlyData;
if (!W || !W.resolveGymId || !W.resolveVisual || !D) {
  console.error('resolver or data not exported');
  process.exit(1);
}

const app = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
const m = app.match(/const GYM_FILE = \{([\s\S]*?)\n  \};/);
const GYM_FILE = {};
if (m) for (const pair of m[1].matchAll(/(\w+):\s*'([^']+)'/g)) GYM_FILE[pair[1]] = pair[2];

function stemsFor(visual) {
  if (!visual) return [];
  if (visual.kind === 'gym') {
    const f = GYM_FILE[visual.id];
    return f ? [f + '-m.jpg', f + '-f.jpg'] : [];
  }
  return [visual.id + '-m.jpg', visual.id + '-f.jpg'];
}
function filesExist(visual) {
  const dir = path.join(root, 'assets/exercise-img');
  const stems = stemsFor(visual);
  if (!stems.length) return false;
  return stems.every(s => fs.existsSync(path.join(dir, s)));
}

let failed = 0;
function check(label, got, want) {
  const ok = (typeof want === 'function') ? want(got) : Object.is(got, want) ||
    (got && want && typeof want === 'object' && got.id === want.id && got.kind === want.kind);
  if (!ok) {
    console.error('FAIL', label, '→', got, 'expected', want);
    failed++;
  }
}

// --- directed cases (previous 25 + new keys) ---
const gymCases = [
  [{ id: 'legPress', name: 'other' }, 'legPress'],
  [{ name: 'לחיצת רגליים (מכונה)' }, 'legPress'],
  [{ name: 'Leg press (machine)' }, 'legPress'],
  [{ name: 'לחיצת רגליים במכונה' }, 'legPress'],
  [{ name: 'לחיצת חזה בשיפוע במשקולות' }, 'inclineDb'],
  [{ name: 'הרחקת כתף בצדדים עם משקולות' }, 'lateral'],
  [{ name: 'כפיפת מרפקים בכבל' }, 'curl'],
  [{ name: 'מתח בעזרת מכונת סיוע / פולי עליון' }, 'pulldown'],
  [{ name: 'Incline DB chest press' }, 'inclineDb'],
  [{ name: 'DB lateral raise' }, 'lateral'],
  [{ name: 'Cable curls' }, 'curl'],
  [{ name: 'חימום: אופניים נייחים + סיבובי כתפיים' }, 'warmup'],
  [{ name: 'דדליפט רומני עם משקולות' }, 'rdl'],
  [{ name: 'Romanian deadlift with dumbbells' }, 'rdl'],
  [{ name: 'Warm-up: stationary bike + shoulder circles' }, 'warmup'],
  // shoulder rolls must NOT map to the bike warm-up
  [{ name: 'סיבובי כתפיים' }, null],
  [{ name: 'Shoulder rolls' }, null],
  [{ name: 'חימום: הליכה במסילה + מתיחות דינמיות' }, 'cardio'],
  [{ name: 'סקוואט במכונת סמית' }, 'smith'],
  [{ name: 'כפיפת ברכיים במכונה' }, 'legCurl'],
  [{ name: 'פשיטת ברכיים במכונה' }, 'legExt'],
  [{ name: 'לחיצת כתפיים במכונה' }, 'ohp'],
  [{ name: 'Smith machine squat' }, 'smith'],
  [{ name: 'חימום' }, null],
  [null, null],
  [{ name: 'לחיצת חזה במכונה' }, 'chestPress'],
  [{ name: 'לחיצת חזה' }, 'bench'],
  [{ name: 'machine chest press' }, 'chestPress'],
  [{ name: 'deadlift' }, 'deadlift'],
  [{ name: 'דדליפט' }, 'deadlift'],
  [{ name: 'דדליפט רומני' }, 'rdl'],
  [{ name: 'pull-up' }, 'pullup'],
  [{ name: 'מתח' }, 'pullup'],
  [{ name: 'assisted pull-up' }, 'pulldown'],
  [{ name: 'dips' }, 'dips'],
  [{ name: 'מקבילים' }, 'dips'],
  [{ name: 'elliptical' }, 'elliptical'],
  [{ name: 'אליפטיקל' }, 'elliptical'],
  [{ name: 'חימום: אליפטיקל' }, 'elliptical'],
  [{ name: 'קרדיו קל לסיום' }, 'cardio'],
  [{ name: 'crunch' }, 'crunch'],
  [{ name: 'כפיפות בטן' }, 'crunch'],
  [{ name: 'push-up' }, 'pushup'],
  [{ name: 'שכיבות סמיכה' }, 'pushup'],
  [{ name: 'bent over row' }, 'bentRow'],
  [{ name: 'חתירה עם מוט' }, 'bentRow'],
  [{ name: 'חתירה בישיבה' }, 'row'],
  [{ name: 'פרפר במכונה' }, 'fly'],
  [{ name: 'pec deck' }, 'fly'],
  [{ name: 'פרפר' }, null],
  [{ name: 'hack squat' }, 'legPress'],
  [{ name: 'bulgarian split squat' }, 'lunge'],
  [{ name: 'front squat' }, 'squat'],
];
for (const [input, want] of gymCases) {
  check(['resolveGymId', input], W.resolveGymId(input), want);
}

const visualCases = [
  [{ name: 'סיבובי כתפיים' }, { id: 'shoulders', kind: 'home' }],
  [{ name: 'Shoulder rolls' }, { id: 'shoulders', kind: 'home' }],
  [{ name: 'גלגול כתפיים' }, { id: 'shoulders', kind: 'home' }],
  [{ name: 'חימום: אופניים נייחים + סיבובי כתפיים' }, { id: 'warmup', kind: 'gym' }],
  [{ name: 'מתיחת צוואר' }, { id: 'neck', kind: 'home' }],
  [{ name: 'Butterfly stretch' }, { id: 'butterfly', kind: 'home' }],
  [{ name: 'פרפר' }, null],
  [{ name: 'לחיצת חזה במכונה' }, { id: 'chestPress', kind: 'gym' }],
  [{ name: 'סקוואט במכונת סמית' }, { id: 'smith', kind: 'gym' }],
];
for (const [input, want] of visualCases) {
  check(['resolveVisual', input], W.resolveVisual(input), want);
}

// Every GYM_FILE / EXIMG key has both gender files; every bank id is registered.
for (const id of Object.keys(W.EX)) {
  if (!GYM_FILE[id]) {
    console.error('FAIL bank id missing GYM_FILE', id);
    failed++;
    continue;
  }
  if (!filesExist({ id, kind: 'gym' })) {
    console.error('FAIL missing gym files for', id, GYM_FILE[id]);
    failed++;
  }
}
for (const id of Object.keys(D.EXERCISES)) {
  if (!D.EXIMG[id]) {
    console.error('FAIL home exercise missing EXIMG', id);
    failed++;
    continue;
  }
  if (!filesExist({ id, kind: 'home' })) {
    console.error('FAIL missing home files for', id);
    failed++;
  }
}

// --- full audit list ---
const AI = [
  'חימום: הליכה במסילה + מתיחות דינמיות',
  'סקוואט במכונת סמית', 'כפיפת ברכיים במכונה',
  'Smith machine squat', 'smith squat', 'סקוואט סמית',
  'leg curl', 'lying leg curl', 'seated leg curl', 'כפיפת ברך במכונה',
  'leg extension', 'פשיטת ברכיים במכונה', 'פשיטת ברך',
  'leg press', 'לחיצת רגליים', 'לחיצת רגליים במכונה',
  'lat pulldown', 'lat pull-down', 'משיכת פולי עליון', 'פולי עליון',
  'cable fly', 'cable flyes', 'pec deck', 'פרפר בכבלים', 'פרפר במכונה',
  'dumbbell lunges', 'walking lunge', 'מספריים', 'מספריים עם משקולות', 'lunges',
  'bulgarian split squat', 'סקוואט בולגרי',
  'hip thrust', 'barbell hip thrust', 'היפ תראסט', 'היפ ת׳ראסט',
  'calf raise', 'standing calf raise', 'seated calf raise', 'הרמות עקב', 'הרמת שוקיים',
  'treadmill', 'treadmill walk', 'הליכה במסילה', 'הליכון',
  'stationary bike', 'upright bike', 'אופניים נייחים', 'חימום: אופניים נייחים + סיבובי כתפיים',
  'elliptical', 'אליפטיקל', 'קרוס טריינר', 'cross trainer',
  'Warm-up: treadmill walk + dynamic stretches',
  'חימום אליפטיקל', 'חימום: אליפטיקל',
  'bench press', 'barbell bench press', 'לחיצת חזה', 'לחיצת חזה במוט',
  'incline dumbbell press', 'לחיצת חזה בשיפוע',
  'machine chest press', 'לחיצת חזה במכונה', 'chest press',
  'shoulder press', 'overhead press', 'military press', 'לחיצת כתפיים', 'לחיצת כתפיים במכונה',
  'seated cable row', 'cable row', 'חתירה בישיבה', 'חתירה בכבלים',
  'bent over row', 'barbell row', 'חתירה בעמידה', 'חתירה עם מוט',
  'face pull', 'משיכת פנים',
  'pull-up', 'pull ups', 'chin-up', 'מתח', 'מתח רחב', 'assisted pull-up',
  'dip', 'dips', 'מקבילים', 'שקיעות במקבילים',
  'biceps curl', 'cable curl', 'כפיפת מרפק', 'כפיפת מרפקים בכבל',
  'hammer curl', 'כפיפת פטיש',
  'triceps pushdown', 'פשיטת מרפק בפולי',
  'overhead tricep extension', 'פשיטת מרפק מעל הראש', 'skull crusher',
  'lateral raise', 'הרחקות צד', 'הרחקת כתף',
  'rear delt fly', 'פרפר הפוך',
  'romanian deadlift', 'dumbbell rdl', 'דדליפט רומני',
  'deadlift', 'conventional deadlift', 'דדליפט', 'דדליפט קנוונציונלי', 'דדליפט עם מוט',
  'back squat', 'barbell squat', 'סקוואט', 'סקוואט מוט', 'סקוואט חופשי',
  'front squat', 'סקוואט קדמי',
  'goblet squat', 'סקוואט גובלט',
  'hack squat',
  'plank', 'front plank', 'פלאנק',
  'crunch', 'crunches', 'sit-up', 'sit ups', 'כפיפות בטן',
  'push-up', 'push ups', 'שכיבות סמיכה',
  'shoulder rolls', 'shoulder roll', 'סיבובי כתפיים', 'גלגול כתפיים',
  'neck stretch', 'מתיחת צוואר', 'הטיית ראש',
  'arm circles', 'סיבובי ידיים',
  'side bend', 'כפיפה הצידה',
  'spinal twist', 'סיבוב עמוד שדרה',
  'forward fold', 'כפיפה קדימה',
  'hamstring stretch', 'מתיחת מיתרים',
  'butterfly stretch',
  'quad stretch', 'מתיחת ארבע ראשי',
  'hip flexor stretch', 'מתיחת מכופפי ירך',
  'calf stretch', 'מתיחת שוק',
  'cat cow', 'חתול-פרה', 'חתול פרה',
  'cobra', 'קוברה',
  "child's pose", 'תנוחת הילד',
  'pec deck',
  'close grip bench',
  'preacher curl',
  'light finisher cardio', 'קרדיו קל לסיום',
];

// Official bank names
const official = [];
for (const [id, ex] of Object.entries(W.EX)) {
  official.push(ex.he, ex.en);
}
for (const [id, ex] of Object.entries(D.EXERCISES)) {
  official.push(ex.name.he, ex.name.en);
}

const GAPS = new Set([
  'פרפר', // ambiguous: cable fly vs butterfly stretch
  'חימום', // too generic
  'טוויסט',
  'ילד',
  'כרית בטן',
  'shrug', 'shrugs', 'הרמת כתפיים', 'שראגים',
  'hanging leg raise', 'הרמת רגליים בתלייה',
  'russian twist', 'טוויסט רוסי',
  'farmer carry', 'farmers walk',
  'kettlebell swing', 'נדנדת קטלבל',
  'step up', 'step-ups',
  'hip abduction', 'הרחקת ירך',
  'good morning',
  'back extension', 'hyperextension', 'פשיטת גב',
  'cable woodchop',
  'jump rope', 'חבל',
  'rowing machine', 'מכשיר חתירה',
]);

const audited = [...new Set([...official, ...AI])];
let auditedOk = 0;
for (const name of audited) {
  if (GAPS.has(name)) {
    const v = W.resolveVisual({ name });
    if (v) {
      console.error('FAIL gap name unexpectedly mapped', name, v);
      failed++;
    }
    continue;
  }
  const v = W.resolveVisual({ name });
  if (!v) {
    console.error('FAIL audited name unmapped', name);
    failed++;
    continue;
  }
  if (!filesExist(v)) {
    console.error('FAIL audited name maps to missing file', name, v);
    failed++;
    continue;
  }
  auditedOk++;
}

if (failed) {
  console.error(failed, 'failures');
  process.exit(1);
}
console.log('ok', gymCases.length, 'gym cases,', visualCases.length, 'visual cases,',
  auditedOk, 'audited names with files,', Object.keys(W.EX).length, 'gym bank ids,',
  Object.keys(D.EXERCISES).length, 'home bank ids, cache expected excerly-v62');
