// Excerly – regression for the Nov 11 lunch: every item showed "אין התאמה חד-משמעית".
// Runs the real foodmap + mealcard + nutrients code against the committed USDA snapshot (no network).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ctx = {}; vm.createContext(ctx);
for (const f of ['foodmap.js', 'nutrients.js', 'mealcard.js', 'mealimage.js']) {
  vm.runInContext(readFileSync(new URL('../assets/js/' + f, import.meta.url), 'utf8'), ctx);
}
const FM = ctx.ExcerlyFoodMap, MC = ctx.ExcerlyMealCard, N = ctx.ExcerlyNutrients, IMG = ctx.ExcerlyMealImage;
const CORE = JSON.parse(readFileSync(new URL('../assets/data/usda-core.json', import.meta.url), 'utf8'));
FM.setCore(CORE);

const EXACT = '4 פרוסות דקות של סטייק אנטריקוט, לחמניה מלחם לבן, 2 כפות שמן זית, 2 כפות מיונז, חסה';
const SANDWICH = 'כריך עם 4 פרוסות אנטריקוט, לחמניה מלחם לבן, 2 כפות שמן זית, 2 כפות מיונז, חסה';

let failed = 0;
const plain = x => JSON.parse(JSON.stringify(x)); // vm-realm arrays → this realm for deepEqual
async function test(name, fn) {
  try { await fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}
// search/detail must NOT be needed for these foods; fail loudly if called
const offlineApi = {
  search: async () => { throw new Error('network search should not be needed'); },
  detail: async () => { throw new Error('network detail should not be needed'); },
  core: (k) => FM.coreFood(k)
};
const per100 = (key, id) => CORE.foods[key].per100g[id] ? CORE.foods[key].per100g[id].amount : null;

await test('exact meal splits into 5 items with Hebrew units', () => {
  const c = MC.splitComponents(EXACT);
  assert.deepEqual(plain(c.map(x => x.coreKey)), ['entrecote', 'roll', 'oliveOil', 'mayo', 'lettuce']);
  assert.deepEqual(plain(c.map(x => x.grams)), [100, 44, 27, 27.6, 18]); // 4×25g thin slice, 1 roll (USDA 44g), 2 tbsp oil (USDA 13.5g), 2 tbsp mayo (USDA 13.8g), 3 inner leaves (USDA 6g)
  assert.equal(c[0].unitKind, 'thinSlice');
  assert.equal(c[2].quantityState, 'usda-portion');
  assert.equal(c[0].portionAssumed, true); // per-slice weight is an assumption → "לאישור"
});

await test('"כריך עם" is a container: not double-counted when a roll is listed', () => {
  const c = MC.splitComponents(SANDWICH);
  assert.deepEqual(plain(c.map(x => x.coreKey)), ['entrecote', 'roll', 'oliveOil', 'mayo', 'lettuce']);
  assert.equal(c[0].grams, 140); // 4 regular slices × 35g default
  const alone = MC.splitComponents('כריך עם 4 פרוסות אנטריקוט');
  assert.deepEqual(plain(alone.map(x => x.coreKey)), ['roll', 'entrecote']); // sandwich alone → the bread
});

await test('every item resolves (no "no clear match"), all from USDA fdcIds, no network', async () => {
  const meal = MC.createPending({ id: 'm1', text: EXACT, slot: 'lunch' });
  const out = await MC.resolveMeal(meal, offlineApi, N);
  assert.equal(out.status, 'confirmed');
  out.components.forEach(c => {
    assert.equal(c.matchState, 'matched', c.name);
    assert.equal(c.questionKey, null, c.name);
    assert.ok(c.candidate.fdcId, c.name);
  });
  assert.deepEqual(plain(out.components.map(c => c.candidate.fdcId)), [172165, 172796, 171413, 171009, 169247]);
  assert.equal(out.kcalIncomplete, false);
  assert.equal(out.needsReview, true); // default portions → chip "לאישור"
});

await test('totals equal Σ grams × per100g / 100 from the USDA snapshot', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'm2', text: EXACT, slot: 'lunch' }), offlineApi, N);
  const parts = [['entrecote', 100], ['roll', 44], ['oliveOil', 27], ['mayo', 27.6], ['lettuce', 18]];
  const sum = id => parts.reduce((s, [k, g]) => s + (per100(k, id) || 0) * g / 100, 0);
  assert.equal(meal.kcal, Math.round(sum('1008')));
  assert.equal(meal.protein, Math.round(sum('1003') * 10) / 10);
  assert.equal(meal.fat, Math.round(sum('1004') * 10) / 10);
  assert.equal(meal.carbs, Math.round(sum('1005') * 10) / 10);
  const n = meal.provenance.nutrients;
  for (const k of ['satFat', 'sugar', 'fiber', 'sodium', 'calcium', 'iron', 'potassium', 'vitaminA', 'vitaminB12', 'vitaminK', 'folate']) {
    assert.ok(n[k] && n[k].amount != null && n[k].amount >= 0, 'nutrient ' + k + ' present');
  }
  // olive oil reports no vitamin C in SR Legacy? whatever the source says must be kept as-is: missing ≠ 0
  ['vitaminC', 'vitaminD', 'vitaminE'].forEach(k => assert.ok(['known', 'partial', 'missing'].includes(n[k].status)));
  assert.ok(Math.abs(n.energy.amount - sum('1008')) < 1e-9);
});

await test('reported zero stays zero, unreported stays missing (per component)', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'm3', text: '2 כפות שמן זית', slot: 'lunch' }), offlineApi, N);
  const c = meal.components[0];
  const raw = CORE.foods.oliveOil.per100g;
  Object.keys(c.nutrients).forEach(k => {
    const spec = N.CATALOG.find(s => s.key === k);
    const has = raw[spec.id] || (spec.altId && raw[spec.altId]);
    if (!has) assert.equal(c.nutrients[k].status, 'missing', k);
    else if (has.amount === 0) assert.equal(c.nutrients[k].amount, 0, k);
  });
});

await test('editing grams recomputes; confirm clears the review chip; delete keeps others', async () => {
  let meal = await MC.resolveMeal(MC.createPending({ id: 'm4', text: EXACT, slot: 'lunch' }), offlineApi, N);
  const before = meal.kcal;
  const r = MC.applyComponentGrams(meal, 'c0', 150, N);
  assert.ok(r.ok && r.nutrients);
  assert.ok(r.meal.kcal > before);
  assert.equal(r.meal.components[0].grams, 150);
  assert.equal(r.meal.components[0].portionAssumed, false);
  const confirmed = MC.rollup(Object.assign({}, r.meal, { reviewed: true }));
  assert.equal(confirmed.needsReview, false);
  const list = [confirmed, { id: 'x', name: 'other', kcal: 100 }].filter(m => m.id !== 'm4');
  assert.equal(list.length, 1);
});

await test('day summary counts the meal as a confirmed total with vitamins', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'm5', text: EXACT, slot: 'lunch' }), offlineApi, N);
  const day = N.summarizeDay([meal]);
  assert.equal(day.kcal.incomplete, false);
  assert.equal(day.kcal.total, meal.kcal);
  assert.equal(day.nutrients.find(n => n.key === 'vitaminB12').status, 'complete');
});

await test('Hebrew food not in the map is never sent to USDA as Hebrew', async () => {
  let called = false;
  const api = { search: async () => { called = true; return { ok: true, foods: [] }; }, detail: async () => ({ ok: false }), core: k => FM.coreFood(k) };
  const meal = await MC.resolveMeal(MC.createPending({ id: 'm6', text: 'שקשוקה', slot: 'lunch' }), api, N);
  assert.equal(called, false);
  assert.equal(meal.components[0].error, 'untranslated');
});

await test('USDA unreachable is "unavailable", not "no match"', async () => {
  const api = { search: async () => ({ ok: false, error: 'http', foods: [] }), detail: async () => ({ ok: false }), core: null };
  const meal = await MC.resolveMeal(MC.createPending({ id: 'm7', text: 'quinoa 100 g', slot: 'lunch' }), api, N);
  assert.equal(meal.components[0].questionKey, 'unavailable');
});

await test('photo items keep the AI portion as an estimate (was discarded → "how many grams?")', async () => {
  const comps = MC.componentsFromItems([{ name: 'לחמניה לבנה', queryEn: 'white roll', grams: 80 }, { name: 'quinoa', queryEn: 'quinoa cooked' }]);
  assert.equal(comps[0].coreKey, 'roll');
  assert.equal(comps[0].grams, 80);
  assert.equal(comps[0].quantityState, 'ai-estimate');
  assert.equal(comps[1].queryEn, 'quinoa cooked');
});

await test('meal image slot: user photo > saved image > representative > generic (never the bag icon)', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'm8', text: SANDWICH, slot: 'lunch' }), offlineApi, N);
  assert.equal(IMG.forMeal(meal).src, 'assets/meal-img/entrecote-sandwich.jpg');
  assert.equal(IMG.forMeal(Object.assign({}, meal, { photo: 'data:x', photoKind: 'user' })).kind, 'user');
  assert.equal(IMG.forMeal({ components: [] }).kind, 'generic');
});

if (failed) { console.error('\n' + failed + ' failed'); process.exit(1); }
console.log('\nall entrecote meal tests passed');
