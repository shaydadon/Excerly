/**
 * בדיקות אריתמטיקה / יחידות / אפס מול חוסר / כיסוי / עריכת כמות / מחיקה /
 * תאימות סנכרון וארוחות ישנות. ללא רשת, מול צילום אמיתי של FDC.
 * הרצה: node tools/test-nutrients.mjs
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const src = readFileSync(new URL('../assets/js/nutrients.js', import.meta.url), 'utf8');
const context = { console, globalThis: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(src, context);
const M = context.ExcerlyNutrients;
assert.ok(M && M.scaleAmount, 'nutrients module loaded');

const fixture = JSON.parse(readFileSync(new URL('./fixtures/fdc-banana-173944.min.json', import.meta.url), 'utf8'));
const per100 = M.indexFoodNutrients(fixture);

let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + (e && e.stack || e)); }
}

test('banana fixture is the captured FDC food', () => {
  assert.equal(fixture.fdcId, 173944);
  assert.equal(fixture.description, 'Bananas, raw');
  assert.equal(per100['1162'].amount, 8.7);
  assert.equal(per100['1162'].unit.toLowerCase(), 'mg');
  assert.equal(per100['1008'].amount, 89);
});

test('scale 100g equals per-100g and 118g is linear', () => {
  assert.equal(M.scaleAmount(8.7, 100), 8.7);
  assert.equal(M.scaleAmount(89, 118), 89 * 118 / 100);
  assert.equal(M.scaleAmount(8.7, 0), 0);
  const meal = M.mealFromOfficial(per100, 118, {
    name: 'בננה', source: 'fdc', fdcId: 173944, description: 'Bananas, raw', dataType: 'SR Legacy'
  });
  assert.equal(meal.kcal, Math.round(89 * 1.18));
  assert.equal(meal.provenance.nutrients.vitaminC.amount, 8.7 * 118 / 100);
  assert.equal(meal.provenance.nutrients.vitaminC.unit, 'mg');
  assert.equal(meal.provenance.fdcId, 173944);
  assert.equal(meal.provenance.grams, 118);
  assert.equal(meal.provenance.unit, 'g');
});

test('reported zero stays zero; missing stays null', () => {
  assert.equal(per100['1114'].amount, 0);
  assert.equal(M.scaleAmount(0, 118), 0);
  assert.equal(M.scaleAmount(null, 118), null);
  assert.equal(M.scaleAmount(undefined, 50), null);
  const meal = M.mealFromOfficial(per100, 118, { name: 'בננה', source: 'fdc', fdcId: 173944 });
  assert.equal(meal.provenance.nutrients.vitaminD.amount, 0);
  assert.equal(meal.provenance.nutrients.vitaminD.status, 'known');
  assert.equal(meal.provenance.nutrients.vitaminB12.amount, 0);
  const nullId = Object.keys(per100).find(k => per100[k].amount == null);
  assert.ok(nullId, 'fixture includes a null amount');
  assert.equal(M.scaleAmount(per100[nullId].amount, 100), null);
});

test('units: µg and mg are not swapped; IU is not converted', () => {
  assert.equal(M.displayUnit('UG'), 'µg');
  assert.equal(M.displayUnit('µg'), 'µg');
  assert.equal(M.displayUnit('MG'), 'mg');
  assert.equal(M.displayUnit('IU'), 'IU');
  assert.equal(M.displayUnit('KCAL'), 'kcal');
  const meal = M.mealFromOfficial(per100, 100, { name: 'בננה', source: 'fdc', fdcId: 173944 });
  assert.equal(meal.provenance.nutrients.vitaminA.unit, 'µg');
  assert.equal(meal.provenance.nutrients.vitaminC.unit, 'mg');
  assert.equal(meal.provenance.nutrients.vitaminD.unit, 'µg');
});

test('quantity edit recomputes from per-100g; delete drops the meal', () => {
  const meal = M.mealFromOfficial(per100, 100, { name: 'בננה', source: 'fdc', fdcId: 173944 });
  meal.id = 'm1';
  const edited = M.applyGramEdit(meal, 50);
  assert.equal(edited.ok, true);
  assert.equal(edited.recomputed, true);
  assert.equal(edited.meal.provenance.nutrients.vitaminC.amount, 8.7 * 0.5);
  assert.equal(edited.meal.kcal, Math.round(89 * 0.5));
  assert.equal(edited.meal.provenance.grams, 50);
  assert.equal(edited.meal.id, 'm1');
  const bad = M.applyGramEdit(meal, 0);
  assert.equal(bad.ok, false);
  const other = M.mealFromOfficial(per100, 50, { name: 'חצי', source: 'fdc', fdcId: 173944 });
  other.id = 'm2';
  let meals = [meal, other];
  meals = meals.filter(m => m.id !== 'm1');
  const day = M.summarizeDay(meals);
  assert.equal(day.meals, 1);
  assert.equal(day.nutrients.find(n => n.key === 'vitaminC').amount, M.roundMicro(8.7 * 0.5));
  assert.equal(meals.some(m => m.id === 'm1'), false);
});

test('legacy meals do not become zero micros and coverage stays incomplete', () => {
  const legacy = { id: 'old', name: 'ארוחה ישנה', kcal: 400, carbs: 40, protein: 20, fat: 12 };
  assert.equal(M.legacyMeal(legacy), true);
  const unscaled = M.applyGramEdit(legacy, 80);
  assert.equal(unscaled.recomputed, false);
  assert.equal(unscaled.meal.kcal, 400);
  assert.ok(!unscaled.meal.provenance);
  const official = M.mealFromOfficial(per100, 100, { name: 'בננה', source: 'fdc', fdcId: 173944 });
  const day = M.summarizeDay([legacy, official]);
  assert.equal(day.meals, 2);
  assert.equal(day.fdcMeals, 1);
  assert.equal(day.incomplete, true);
  const vit = day.nutrients.find(n => n.key === 'vitaminC');
  assert.equal(vit.status, 'partial');
  assert.notEqual(vit.amount, 0);
  assert.ok(vit.amount > 0);
  const empty = M.summarizeDay([legacy]);
  const vit0 = empty.nutrients.find(n => n.key === 'vitaminC');
  assert.equal(vit0.amount, null);
  assert.equal(vit0.status, 'missing');
  assert.notEqual(vit0.amount, 0);
});

test('tzameret per-100g has macros and sodium but vitamins stay missing', () => {
  const tz = M.per100FromTzameret({ c: 1, n: 'בננה', kcal: 89, prot: 1.1, carb: 23, fat: 0.3, fib: 2.6, sug: 12, na: 1 });
  assert.equal(tz['1008'].amount, 89);
  assert.equal(tz['1093'].amount, 1);
  const meal = M.mealFromOfficial(tz, 100, { name: 'בננה', source: 'tzameret', tzameretCode: 1, dataset: 'MOH Tzameret' });
  assert.equal(meal.provenance.nutrients.vitaminC.status, 'missing');
  assert.equal(meal.provenance.nutrients.vitaminC.amount, null);
  assert.equal(meal.provenance.nutrients.sodium.amount, 1);
  const day = M.summarizeDay([meal]);
  assert.equal(day.fdcMeals, 0);
  assert.equal(day.incomplete, true);
});

test('null kcal is not summed as zero; known kcal still totals', () => {
  const k = M.knownKcal([
    { kcal: 100 },
    { kcal: null },
    { kcal: 0 },
    { kcal: 50 }
  ]);
  assert.equal(k.total, 150);
  assert.equal(k.missing, 1);
  assert.equal(k.incomplete, true);
});

test('cloud snapshot keeps provenance inside the meals document', () => {
  const meal = M.mealFromOfficial(per100, 118, { name: 'בננה', source: 'fdc', fdcId: 173944, description: 'Bananas, raw' });
  meal.id = 'm9';
  const store = { 'excerly.meals': JSON.stringify({ '2026-11-05': [meal] }), 'excerly.ai': '{"key":"secret"}', 'excerly.dirty': '1' };
  const SKIP = { 'excerly.ai': 1, 'excerly.dirty': 1 };
  const snap = {};
  Object.keys(store).forEach(k => { if (k.indexOf('excerly.') === 0 && !SKIP[k]) snap[k] = store[k]; });
  assert.ok(!snap['excerly.ai']);
  const parsed = JSON.parse(snap['excerly.meals']);
  const back = parsed['2026-11-05'][0];
  assert.equal(back.provenance.fdcId, 173944);
  assert.equal(back.provenance.grams, 118);
  assert.equal(back.provenance.nutrients.vitaminC.per100g, 8.7);
  assert.equal(back.kcal, Math.round(89 * 1.18));
  const legacy = { id: 'L', name: 'ישן', kcal: 10 };
  parsed['2026-11-04'] = [legacy];
  const again = JSON.parse(JSON.stringify(parsed));
  assert.equal(again['2026-11-04'][0].kcal, 10);
  assert.equal(again['2026-11-04'][0].provenance, undefined);
});

test('folate prefers DFE 1190 over total 1177 so they are not double counted', () => {
  const meal = M.mealFromOfficial(per100, 100, { name: 'בננה', source: 'fdc', fdcId: 173944 });
  assert.equal(meal.provenance.nutrients.folate.id, 1190);
  assert.equal(meal.provenance.nutrients.folate.amount, 20);
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall nutrient tests passed');
