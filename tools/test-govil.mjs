// Excerly – GovIL (data.gov.il) is the primary source for Hebrew meals.
// USDA must not be called for foods that exist in the Israeli database.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ctx = {};
vm.createContext(ctx);
for (const f of ['govil.js', 'foodmap.js', 'nutrients.js', 'mealcard.js', 'mealimage.js']) {
  vm.runInContext(readFileSync(new URL('../assets/js/' + f, import.meta.url), 'utf8'), ctx);
}
const G = ctx.ExcerlyGovil, FM = ctx.ExcerlyFoodMap, MC = ctx.ExcerlyMealCard, N = ctx.ExcerlyNutrients, IMG = ctx.ExcerlyMealImage;
const FOODS = JSON.parse(readFileSync(new URL('../assets/data/govil-foods.json', import.meta.url), 'utf8'));
const PORTIONS = JSON.parse(readFileSync(new URL('../assets/data/govil-portions.json', import.meta.url), 'utf8'));
const MAP = JSON.parse(readFileSync(new URL('../assets/data/govil-map.json', import.meta.url), 'utf8'));
const CORE = JSON.parse(readFileSync(new URL('../assets/data/usda-core.json', import.meta.url), 'utf8'));
G.setData(FOODS, PORTIONS, MAP);
FM.setCore(CORE);
FM.attachGovil(MAP.map);

const EXACT = '4 פרוסות דקות של סטייק אנטריקוט, לחמניה מלחם לבן, 2 כפות שמן זית, 2 כפות מיונז, חסה';
const SANDWICH = 'כריך עם 4 פרוסות אנטריקוט, לחמניה מלחם לבן, 2 כפות שמן זית, 2 כפות מיונז, חסה';

let failed = 0;
const plain = x => JSON.parse(JSON.stringify(x));
async function test(name, fn) {
  try { await fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}

let usdaCalls = 0;
const api = {
  search: async () => { usdaCalls++; throw new Error('USDA search should not be called'); },
  detail: async () => { usdaCalls++; throw new Error('USDA detail should not be called'); },
  core: async () => { usdaCalls++; throw new Error('USDA core should not be called for mapped GovIL foods'); },
  govil: G
};

function per100(code, key) {
  const f = G.food(code);
  const i = G.NUTRIENTS.indexOf(key);
  return f.v[i];
}

await test('bundle has 4,500+ foods, 24 nutrients, credit and open licence', () => {
  assert.ok(FOODS.foods.length >= 4500, FOODS.foods.length);
  assert.equal(FOODS.meta.license, 'Other (Open)');
  assert.match(FOODS.meta.source, /משרד הבריאות/);
  assert.equal(FOODS.meta.nutrients.length, 24);
  assert.ok(Object.keys(PORTIONS.portions).length >= 3000);
  assert.equal(MAP.map.mayo.code, 4466);
  assert.equal(MAP.map.entrecote.code, 610);
});

await test('ranker: מיונז prefers "מיונז רגיל" over "egg salad with mayo"', () => {
  const ranked = G.search('מיונז');
  assert.ok(ranked.length, 'no hits');
  assert.equal(ranked[0].food.c, 4466, ranked[0].food.n);
  assert.ok(!/סלט/.test(ranked[0].food.n), ranked[0].food.n);
  const salad = ranked.find(r => /סלט ביצים/.test(r.food.n));
  if (salad) assert.ok(salad.score < ranked[0].score - 80);
  const d = G.decide('מיונז');
  assert.equal(d.state, 'matched');
  assert.equal(d.food.c, 4466);
});

await test('ranker: שמן זית is the oil, not a recipe fried in it', () => {
  const d = G.decide('שמן זית');
  assert.equal(d.state, 'matched');
  assert.equal(d.food.c, 4443);
  assert.equal(d.food.n, 'שמן זית');
});

await test('exact lunch splits with GovIL unit weights where they exist', () => {
  const c = MC.splitComponents(EXACT);
  assert.deepEqual(plain(c.map(x => x.coreKey)), ['entrecote', 'roll', 'oliveOil', 'mayo', 'lettuce']);
  // 4 thin slices: no GovIL thin-slice weight → labelled default 25 g
  assert.equal(c[0].grams, 100);
  assert.equal(c[0].unitKind, 'thinSlice');
  assert.equal(c[0].quantityState, 'default-portion');
  assert.equal(c[0].portionAssumed, true);
  // roll: no GovIL unit weight → labelled default 44 g
  assert.equal(c[1].grams, 44);
  assert.equal(c[1].quantityState, 'default-portion');
  // oil / mayo: GovIL tbsp weights 10 g and 16 g
  assert.equal(c[2].grams, 20);
  assert.equal(c[2].quantityState, 'govil-portion');
  assert.equal(c[3].grams, 32);
  assert.equal(c[3].quantityState, 'govil-portion');
  // lettuce: 3 default leaves × 11 g GovIL leaf, count was assumed
  assert.equal(c[4].grams, 33);
  assert.equal(c[4].quantityState, 'default-portion');
});

await test('"כריך עם" is still a container; 4 regular slices = 140 g', () => {
  const c = MC.splitComponents(SANDWICH);
  assert.deepEqual(plain(c.map(x => x.coreKey)), ['entrecote', 'roll', 'oliveOil', 'mayo', 'lettuce']);
  assert.equal(c[0].grams, 140);
  const alone = MC.splitComponents('כריך עם 4 פרוסות אנטריקוט');
  assert.deepEqual(plain(alone.map(x => x.coreKey)), ['roll', 'entrecote']);
});

await test('exact lunch resolves from GovIL: no "no clear match", no USDA calls', async () => {
  usdaCalls = 0;
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g1', text: EXACT, slot: 'lunch' }), api, N);
  assert.equal(usdaCalls, 0);
  assert.equal(meal.status, 'confirmed');
  assert.equal(meal.provenance.source, 'govil');
  meal.components.forEach(c => {
    assert.equal(c.matchState, 'matched', c.name);
    assert.equal(c.questionKey, null, c.name);
    assert.ok(c.candidate.govilCode, c.name);
    assert.equal(c.candidate.source, 'govil', c.name);
  });
  assert.deepEqual(plain(meal.components.map(c => c.candidate.govilCode)), [610, 10124, 4443, 4466, 3588]);
  assert.equal(meal.kcalIncomplete, false);
  assert.equal(meal.needsReview, true);
});

await test('totals equal Σ grams × GovIL per100g / 100 (macros, sat fat, sugars, vitamins)', async () => {
  usdaCalls = 0;
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g2', text: EXACT, slot: 'lunch' }), api, N);
  assert.equal(usdaCalls, 0);
  const parts = [[610, 100], [10124, 44], [4443, 20], [4466, 32], [3588, 33]];
  const sum = key => parts.reduce((s, [code, g]) => s + (per100(code, key) || 0) * g / 100, 0);
  assert.equal(meal.kcal, Math.round(sum('energy')));
  assert.equal(meal.protein, Math.round(sum('protein') * 10) / 10);
  assert.equal(meal.fat, Math.round(sum('fat') * 10) / 10);
  assert.equal(meal.carbs, Math.round(sum('carbs') * 10) / 10);
  const n = meal.provenance.nutrients;
  for (const k of ['satFat', 'sugar', 'fiber', 'sodium', 'calcium', 'iron', 'potassium', 'vitaminA', 'vitaminB12', 'folate', 'vitaminE']) {
    assert.ok(n[k] && n[k].amount != null, 'nutrient ' + k + ' present: ' + JSON.stringify(n[k]));
  }
  // vitamin D is null on the grilled entrecote; meal total may be partial, not silently 0
  assert.ok(['known', 'partial', 'missing'].includes(n.vitaminD.status));
  if (per100(610, 'vitaminD') == null) assert.ok(n.vitaminD.status !== 'known' || n.vitaminD.amount != null);
  assert.ok(Math.abs(n.energy.amount - sum('energy')) < 1e-9);
  console.log('    exact lunch:', meal.kcal, 'kcal  P', meal.protein, 'C', meal.carbs, 'F', meal.fat,
    'sat', Math.round(n.satFat.amount * 10) / 10, 'sugar', Math.round(n.sugar.amount * 10) / 10,
    'fiber', Math.round(n.fiber.amount * 10) / 10, 'Na', Math.round(n.sodium.amount * 10) / 10);
});

await test('sandwich phrasing also has no "no clear match" and uses GovIL', async () => {
  usdaCalls = 0;
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g3', text: SANDWICH, slot: 'lunch' }), api, N);
  assert.equal(usdaCalls, 0);
  meal.components.forEach(c => assert.equal(c.matchState, 'matched', c.name + ' ' + c.questionKey));
  assert.equal(meal.provenance.source, 'govil');
  assert.ok(meal.kcal > 0);
  console.log('    sandwich lunch:', meal.kcal, 'kcal');
});

await test('unmapped Hebrew dish (שקשוקה) is found in GovIL, never sent to USDA', async () => {
  usdaCalls = 0;
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g4', text: 'שקשוקה', slot: 'lunch' }), api, N);
  assert.equal(usdaCalls, 0);
  const c = meal.components[0];
  assert.notEqual(c.error, 'untranslated');
  assert.ok(c.matchState === 'matched' || c.matchState === 'ambiguous', c.matchState + ' ' + c.error);
  if (c.matchState === 'matched') {
    assert.match(c.candidate.description, /שקשוקה/);
    assert.equal(c.candidate.source, 'govil');
  }
});

await test('English food not in the map can still use the USDA fallback', async () => {
  let searched = 0;
  const fallback = {
    search: async (q) => { searched++; return { ok: true, foods: [{ fdcId: 1, description: 'Quinoa, cooked' }] }; },
    detail: async () => ({ ok: true, fdcId: 1, description: 'Quinoa, cooked', per100g: { '1008': { amount: 120, unit: 'kcal' }, '1003': { amount: 4, unit: 'g' }, '1004': { amount: 2, unit: 'g' }, '1005': { amount: 21, unit: 'g' } }, portions: [] }),
    core: async () => ({ ok: false }),
    govil: G
  };
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g5', text: 'quinoa cooked 150 g', slot: 'lunch' }), fallback, N);
  assert.equal(searched, 1);
  assert.equal(meal.components[0].candidate.fdcId, 1);
  assert.equal(meal.components[0].candidate.source, 'fdc');
  assert.equal(meal.kcal, 180);
});

await test('null vitamin stays missing, reported zero stays zero', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g6', text: '2 כפות שמן זית', slot: 'lunch' }), api, N);
  const c = meal.components[0];
  const oil = G.food(4443);
  // carbs of oil are 0 in GovIL — must stay 0, not missing
  assert.equal(c.nutrients.carbs.amount, 0);
  assert.equal(c.nutrients.protein.amount, 0);
  // vitamin D of olive oil is 0 (reported); vitamin fields that are null on other foods stay missing
  const dIdx = G.NUTRIENTS.indexOf('vitaminD');
  if (oil.v[dIdx] == null) assert.equal(c.nutrients.vitaminD.status, 'missing');
  else assert.equal(c.nutrients.vitaminD.amount, oil.v[dIdx] * 20 / 100);
});

await test('meal image slot still prefers the sandwich photo', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g7', text: SANDWICH, slot: 'lunch' }), api, N);
  assert.equal(IMG.forMeal(meal).src, 'assets/meal-img/entrecote-sandwich.jpg');
});

await test('day summary treats GovIL meals as official coverage', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'g8', text: EXACT, slot: 'lunch' }), api, N);
  const day = N.summarizeDay([meal]);
  assert.equal(day.kcal.incomplete, false);
  assert.equal(day.kcal.total, meal.kcal);
  assert.ok(day.fdcMeals >= 1);
});

if (failed) { console.error('\n' + failed + ' failed'); process.exit(1); }
console.log('\nall GovIL tests passed');
