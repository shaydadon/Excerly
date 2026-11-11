// Regression: Shay's Nov 11 dinner
// 'כריך מלחמניה לבנה עם ארבע פרוסות חזה עוף במרינדה עם טחינה ועמבה'
// Live v56 treated 4 slices as 4 USDA whole breasts (172 g × 4 = 688 g) → 1437 kcal, 222.8 g protein.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DINNER = 'כריך מלחמניה לבנה עם ארבע פרוסות חזה עוף במרינדה עם טחינה ועמבה';
const mode = process.argv[2] || 'govil';
const base = process.argv[3] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ctx = {};
vm.createContext(ctx);
const files = mode === 'govil'
  ? ['govil.js', 'foodmap.js', 'nutrients.js', 'mealcard.js', 'mealimage.js']
  : ['foodmap.js', 'nutrients.js', 'mealcard.js', 'mealimage.js'];
for (const f of files) {
  vm.runInContext(readFileSync(base + '/assets/js/' + f, 'utf8'), ctx);
}
const FM = ctx.ExcerlyFoodMap, MC = ctx.ExcerlyMealCard, N = ctx.ExcerlyNutrients, IMG = ctx.ExcerlyMealImage;
const CORE = JSON.parse(readFileSync(base + '/assets/data/usda-core.json', 'utf8'));
FM.setCore(CORE);
let G = null;
if (mode === 'govil') {
  G = ctx.ExcerlyGovil;
  G.setData(
    JSON.parse(readFileSync(base + '/assets/data/govil-foods.json', 'utf8')),
    JSON.parse(readFileSync(base + '/assets/data/govil-portions.json', 'utf8')),
    JSON.parse(readFileSync(base + '/assets/data/govil-map.json', 'utf8'))
  );
  FM.attachGovil(JSON.parse(readFileSync(base + '/assets/data/govil-map.json', 'utf8')).map);
}

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}

const api = {
  search: async (q) => { throw new Error('USDA search should not be called: ' + q); },
  detail: async (id) => { throw new Error('USDA detail should not be called: ' + id); },
  core: (k) => FM.coreFood(k),
  govil: G
};

await test('splits into roll, 4 chicken slices, tahini, amba — not a double-counted sandwich', () => {
  const c = MC.splitComponents(DINNER);
  assert.equal(c.length, 4);
  assert.equal(c[0].coreKey, 'roll');
  assert.equal(c[1].coreKey, 'chicken');
  assert.equal(c[2].coreKey, 'tahini');
  if (mode === 'govil') assert.equal(c[3].coreKey, 'amba');
  else assert.equal(c[3].coreKey, null);
});

await test('"ארבע פרוסות" is 4 labelled 35 g slices, never 4 whole breasts', () => {
  const c = MC.splitComponents(DINNER);
  const chicken = c[1];
  assert.equal(chicken.unitKind, 'slice');
  assert.equal(chicken.count, 4);
  assert.equal(chicken.grams, 140); // 4 × 35 g default, same convention as entrecote
  assert.equal(chicken.quantityState, 'default-portion');
  assert.equal(chicken.portionAssumed, true);
  const r = FM.resolve(chicken.name);
  assert.ok(r.perUnit === 35);
  assert.ok(r.portionSrc === 'default');
  assert.ok(r.grams !== 688 && r.grams !== 656, 'must not use whole-breast unit × 4, got ' + r.grams);
});

await test('tahini with no amount stays a labelled 2-tbsp default', () => {
  const c = MC.splitComponents(DINNER)[2];
  assert.equal(c.coreKey, 'tahini');
  assert.equal(c.grams, 30);
  assert.equal(c.portionAssumed, true);
});

await test('resolves with sane totals; 222.8 g protein / 1437 kcal must not recur', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'd1', text: DINNER, slot: 'dinner' }), api, N);
  const chicken = meal.components[1];
  assert.equal(chicken.matchState, 'matched');
  assert.equal(chicken.grams, 140);
  assert.ok(meal.protein < 80, 'protein too high: ' + meal.protein);
  assert.ok(meal.kcal < 800, 'kcal too high: ' + meal.kcal);
  assert.notEqual(meal.protein, 222.8);
  assert.notEqual(meal.kcal, 1437);
  if (mode === 'v56') {
    // Roll 80 g + chicken 140 g + tahini 30 g from USDA core; amba unmatched (not in core).
    assert.equal(meal.status, 'partial');
    assert.equal(meal.components[3].questionKey, 'noMatch');
    // Partial rollup uses rounded per-item kcal (tahini 178.5 → 179) so the header is 533;
    // the unrounded nutrient table energy is 532.26 → displayed 532.
    assert.equal(meal.kcal, 633);
    assert.equal(meal.protein, 56.3);
    assert.equal(meal.carbs, 46.5);
    assert.equal(meal.fat, 24.2);
    assert.ok(Math.abs(meal.provenance.nutrients.energy.amount - 632.7) < 0.05);
    const na = meal.provenance.nutrients.sodium.amount;
    assert.ok(Math.abs(na - 533.3) < 0.05, na);
  } else {
    const amba = meal.components[3];
    assert.equal(amba.coreKey, 'amba');
    assert.equal(amba.matchState, 'matched');
    assert.equal(amba.candidate.govilCode, 3267);
    assert.equal(amba.grams, 11); // official GovIL tbsp
    assert.equal(amba.quantityState, 'default-portion');
    assert.equal(meal.status, 'confirmed');
    assert.equal(meal.kcalIncomplete, false);
    assert.equal(meal.provenance.source, 'govil');
    // 140 g chicken 805 + 80 g roll 10124 + 30 g tahini 1898 + 11 g amba 3267
    assert.equal(meal.kcal, 649);
    assert.equal(meal.protein, 56.1);
    assert.equal(meal.carbs, 43);
    assert.equal(meal.fat, 26);
  }
});

await test('meal photo is not the unrelated generic-plate dish', async () => {
  const meal = await MC.resolveMeal(MC.createPending({ id: 'd2', text: DINNER, slot: 'dinner' }), api, N);
  const img = IMG.forMeal(meal);
  assert.ok(!img.src || !/generic-plate/.test(img.src), img);
  assert.notEqual(img.kind, 'generic');
  assert.equal(img.kind, 'placeholder');
});

await test('an entrecote sandwich still gets its representative photo (no regression)', async () => {
  const text = 'כריך עם 4 פרוסות אנטריקוט, לחמניה מלחם לבן, 2 כפות שמן זית, 2 כפות מיונז, חסה';
  const meal = await MC.resolveMeal(MC.createPending({ id: 'd3', text, slot: 'lunch' }), api, N);
  const img = IMG.forMeal(meal);
  assert.equal(img.src, 'assets/meal-img/entrecote-sandwich.jpg');
  assert.equal(img.kind, 'representative');
});

if (failed) { console.error('\n' + failed + ' failed'); process.exit(1); }
console.log('\nall dinner-sandwich ' + mode + ' tests passed');
