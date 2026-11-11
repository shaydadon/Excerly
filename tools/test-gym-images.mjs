#!/usr/bin/env node
/* Checks gym name→id mapping and that hidden/unmapped names do not resolve. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'assets/js/workout.js'), 'utf8');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx);
const { resolveGymId, EX } = ctx.ExcerlyWorkout;
if (!resolveGymId || !EX) {
  console.error('resolveGymId was not exported');
  process.exit(1);
}

const expect = [
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
  [{ name: 'סיבובי כתפיים' }, null],
  [{ name: 'Shoulder rolls' }, null],
  [null, null]
];

let failed = 0;
for (const [input, want] of expect) {
  const got = resolveGymId(input);
  if (got !== want) {
    console.error('FAIL', input, '→', got, 'expected', want);
    failed++;
  }
}
if (failed) {
  console.error(failed, 'failures');
  process.exit(1);
}
console.log('ok', expect.length, 'cases,', Object.keys(EX).length, 'bank ids');
