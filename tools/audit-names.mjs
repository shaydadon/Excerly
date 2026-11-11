// Audit every name the app can show, plus common AI-plan wording.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = process.argv[2] || '/workspace/excerly-all-images/tree';
const ctx = { console, window: {}, document: { readyState: 'complete' } };
ctx.window = ctx; ctx.ExcerlyI18n = { lang: 'he', L: o => o && o.he };
vm.createContext(ctx);
vm.runInContext(readFileSync(root + '/assets/js/workout.js', 'utf8'), ctx);
vm.runInContext(readFileSync(root + '/assets/js/data.js', 'utf8'), ctx);
const W = ctx.ExcerlyWorkout, D = ctx.ExcerlyData;

// GYM_FILE must be read from app.js
const app = readFileSync(root + '/assets/js/app.js', 'utf8');
const m = app.match(/const GYM_FILE = \{([\s\S]*?)\n  \};/);
const GYM_FILE = {};
if (m) {
  for (const pair of m[1].matchAll(/(\w+):\s*'([^']+)'/g)) GYM_FILE[pair[1]] = pair[2];
}

function fileFor(id, kind) {
  if (kind === 'home') return `assets/exercise-img/${id}-m.jpg`; // existence checked both later
  const f = GYM_FILE[id];
  return f ? `assets/exercise-img/${f}-m.jpg` : null;
}

const names = [];
const add = (name, source, lang='he') => names.push({ name, source, lang });

// Home official names + weekly program
for (const [id, ex] of Object.entries(D.EXERCISES)) {
  add(ex.name.he, 'home-bank:' + id, 'he');
  add(ex.name.en, 'home-bank:' + id, 'en');
}
for (const day of D.WEEKLY_PROGRAM) {
  for (const id of day.exercises || []) add('id:' + id, 'home-plan-d' + day.day);
}

// Gym bank official names
for (const [id, ex] of Object.entries(W.EX)) {
  add(ex.he, 'gym-bank:' + id, 'he');
  add(ex.en, 'gym-bank:' + id, 'en');
  add('id:' + id, 'gym-id');
}

// Common AI / realistic Hebrew + English names (gym and home)
const AI = [
  // the three reported
  'חימום: הליכה במסילה + מתיחות דינמיות',
  'סקוואט במכונת סמית', 'כפיפת ברכיים במכונה',
  'Smith machine squat', 'smith squat', 'סקוואט סמית',
  'leg curl', 'lying leg curl', 'seated leg curl', 'כפיפת ברך במכונה',
  'leg extension', 'פשיטת ברכיים במכונה', 'פשיטת ברך',
  'leg press', 'לחיצת רגליים', 'לחיצת רגליים במכונה',
  'lat pulldown', 'lat pull-down', 'משיכת פולי עליון', 'פולי עליון',
  'cable fly', 'cable flyes', ' pec deck', 'פרפר בכבלים', 'פרפר במכונה',
  'dumbbell lunges', 'walking lunge', 'מספריים', 'מספריים עם משקולות', 'lunges',
  'bulgarian split squat', 'סקוואט בולגרי',
  'hip thrust', 'barbell hip thrust', 'היפ תראסט', 'היפ ת׳ראסט',
  'calf raise', 'standing calf raise', 'seated calf raise', 'הרמות עקב', 'הרמת שוקיים',
  'treadmill', 'treadmill walk', 'הליכה במסילה', 'הליכון',
  'stationary bike', 'upright bike', 'אופניים נייחים', 'חימום: אופניים נייחים + סיבובי כתפיים',
  'elliptical', 'אליפטיקל', 'קרוס טריינר', 'cross trainer',
  'Warm-up: treadmill walk + dynamic stretches',
  'חימום אליפטיקל', 'חימום: אליפטיקל',
  // presses / pulls
  'bench press', 'barbell bench press', 'לחיצת חזה', 'לחיצת חזה במוט',
  'incline dumbbell press', 'לחיצת חזה בשיפוע',
  'machine chest press', 'לחיצת חזה במכונה', 'chest press',
  'shoulder press', 'overhead press', 'military press', 'לחיצת כתפיים', 'לחיצת כתפיים במכונה',
  'seated cable row', 'cable row', 'חתירה בישיבה', 'חתירה בכבלים',
  'bent over row', 'barbell row', 'חתירה בעמידה', 'חתירה עם מוט',
  'face pull', 'משיכת פנים',
  'pull-up', 'pull ups', 'chin-up', 'מתח', 'מתח רחב', 'assisted pull-up',
  'dip', 'dips', 'מקבילים', 'שקיעות במקבילים',
  // arms / isolation
  'biceps curl', 'cable curl', 'כפיפת מרפק', 'כפיפת מרפקים בכבל',
  'hammer curl', 'כפיפת פטיש',
  'triceps pushdown', 'פשיטת מרפק בפולי',
  'overhead tricep extension', 'פשיטת מרפק מעל הראש', 'skull crusher',
  'lateral raise', 'הרחקות צד', 'הרחקת כתף',
  'rear delt fly', 'פרפר הפוך',
  'shrug', 'shrugs', 'שраг', 'הרמת כתפיים', 'שראגים',
  // hinge / posterior
  'romanian deadlift', 'dumbbell rdl', 'דדליפט רומני',
  'deadlift', 'conventional deadlift', 'דדליפט', 'דדליפט קנוונציונלי', 'דדליפט עם מוט',
  'good morning',
  'back extension', 'hyperextension', 'פשיטת גב',
  // squat variants
  'back squat', 'barbell squat', 'סקוואט', 'סקוואט מוט', 'סקוואט חופשי',
  'front squat', 'סקוואט קדמי',
  'goblet squat', 'סקוואט גובלט',
  'hack squat',
  // core / condition
  'plank', 'front plank', 'פלאנק',
  'crunch', 'crunches', 'sit-up', 'sit ups', 'כפיפות בטן', 'כרית בטן',
  'hanging leg raise', 'הרמת רגליים בתלייה',
  'russian twist', 'טוויסט רוסי',
  'push-up', 'push ups', 'שכיבות סמיכה',
  // home stretches (AI or user wording)
  'shoulder rolls', 'shoulder roll', 'סיבובי כתפיים', 'גלגול כתפיים',
  'neck stretch', 'מתיחת צוואר', 'הטיית ראש',
  'arm circles', 'סיבובי ידיים',
  'side bend', 'כפיפה הצידה',
  'spinal twist', 'סיבוב עמוד שדרה', 'טוויסט',
  'forward fold', 'כפיפה קדימה',
  'hamstring stretch', 'מתיחת מיתרים',
  'butterfly stretch', 'פרפר',
  'quad stretch', 'מתיחת ארבע ראשי',
  'hip flexor stretch', 'מתיחת מכופפי ירך',
  'calf stretch', 'מתיחת שוק',
  'cat cow', 'חתול-פרה', 'חתול פרה',
  'cobra', 'קוברה',
  "child's pose", 'ילד', 'תנוחת הילד',
  // misc common
  'farmer carry', 'farmers walk',
  'kettlebell swing', 'נדנדת קטלבל',
  'step up', 'step-ups',
  'hip abduction', 'הרחקת ירך',
  'pec deck', ' pec-deck',
  'close grip bench',
  'preacher curl',
  'cable woodchop',
  'jump rope', 'חבל',
  'rowing machine', 'מכשיר חתירה',
  'light finisher cardio', 'קרדיו קל לסיום',
];
for (const n of AI) add(n.trim(), 'ai-common');

// Resolve
function resolveOne(row) {
  if (row.name.startsWith('id:')) {
    const id = row.name.slice(3);
    if (D.EXERCISES[id]) {
      return { ...row, mapped: id, kind: 'home', via: 'id', file: `assets/exercise-img/${id}` };
    }
    if (W.EX[id]) {
      return { ...row, mapped: id, kind: 'gym', via: 'id', file: GYM_FILE[id] ? `assets/exercise-img/${GYM_FILE[id]}` : null };
    }
    return { ...row, mapped: null, kind: null, via: 'id-unknown', file: null };
  }
  const vis = W.resolveVisual({ name: row.name });
  if (vis && vis.kind === 'gym') {
    return { ...row, mapped: vis.id, kind: 'gym', via: 'resolveVisual', file: GYM_FILE[vis.id] ? `assets/exercise-img/${GYM_FILE[vis.id]}` : null };
  }
  if (vis && vis.kind === 'home') {
    return { ...row, mapped: vis.id, kind: 'home', via: 'resolveVisual', file: `assets/exercise-img/${vis.id}` };
  }
  return { ...row, mapped: null, kind: null, via: 'unmapped', file: null };
}

const rows = names.map(resolveOne);
const uniq = [];
const seen = new Set();
for (const r of rows) {
  const k = r.source + '|' + r.name;
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(r);
}

const unmapped = uniq.filter(r => !r.mapped);
const mappedNoFile = uniq.filter(r => r.mapped && !r.file);
console.log('audited unique', uniq.length);
console.log('unmapped', unmapped.length);
unmapped.forEach(r => console.log('  UNMAPPED', r.name, '(' + r.source + ')'));
console.log('mapped but no GYM_FILE/EXIMG file key', mappedNoFile.length);
mappedNoFile.forEach(r => console.log('  NOFILE', r.mapped, r.name));

writeFileSync('/tmp/audit-raw.json', JSON.stringify(uniq, null, 2));
