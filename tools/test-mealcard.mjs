import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function load(file, name) {
  const src = readFileSync(new URL(file, import.meta.url), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(src, context);
  return context[name];
}
const M = load('../assets/js/mealcard.js', 'ExcerlyMealCard');
const N = load('../assets/js/nutrients.js', 'ExcerlyNutrients');

let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}

const TEXT = 'חביתה מ 2 ביצים עם גביע קוטג׳ 9 אחוז ופרוסת לחם קל';

test('splits the screenshot meal into three components', () => {
  const parts = M.splitComponents(TEXT);
  assert.equal(parts.length, 3);
  assert.match(parts[0].name, /חביתה/);
  assert.equal(parts[0].count, 2);
  assert.equal(parts[0].queryEn, 'egg omelet cooked');
  assert.equal(parts[0].grams, null);
  assert.match(parts[1].name, /קוטג/);
  assert.equal(parts[1].quantityState, 'container');
  assert.equal(parts[1].grams, null);
  assert.match(parts[2].name, /לחם/);
  assert.equal(parts[2].unitKind, 'slice');
});

test('breakfast slot in the morning and separate cards per log', () => {
  assert.equal(M.slotForHour(7), 'breakfast');
  assert.equal(M.slotForHour(13), 'lunch');
  assert.equal(M.slotForHour(18), 'dinner');
  assert.equal(M.slotForHour(22), 'snack');
  const a = M.createPending({ id: 'a', text: TEXT, slot: 'breakfast' });
  const b = M.createPending({ id: 'b', text: 'תפוח 150 גרם', slot: 'breakfast' });
  assert.equal(a.slot, 'breakfast');
  assert.equal(b.slot, 'breakfast');
  assert.notEqual(a.id, b.id);
  assert.equal(a.kcal, null);
  assert.equal(a.photoKind, 'placeholder');
  assert.equal(a.status, 'pending');
});

test('drops unrelated tofu and fries and prefers omelet', () => {
  const foods = [
    { fdcId: 1, description: 'Egg, whole, cooked, omelet', dataType: 'SR Legacy' },
    { fdcId: 2, description: 'Egg, whole, cooked, fried', dataType: 'SR Legacy' },
    { fdcId: 3, description: 'Tofu, fried', dataType: 'SR Legacy' },
    { fdcId: 4, description: "APPLEBEE'S, french fries", dataType: 'SR Legacy' }
  ];
  const d = M.decideMatch('egg omelet cooked', foods);
  assert.equal(d.state, 'matched');
  assert.equal(d.food.fdcId, 1);
  assert.equal(M.scoreMatch('egg omelet cooked', 'Tofu, fried'), 0);
  assert.equal(M.scoreMatch('egg omelet cooked', "APPLEBEE'S, french fries"), 0);
});

test('ambiguous close matches do not auto-pick', () => {
  const foods = [
    { fdcId: 10, description: 'Bread, white', dataType: 'SR Legacy' },
    { fdcId: 11, description: 'Bread, wheat', dataType: 'SR Legacy' }
  ];
  const d = M.decideMatch('bread', foods);
  assert.equal(d.state, 'ambiguous');
  assert.equal(d.options.length, 0);
});

test('explicit grams scale USDA values and missing stays null', () => {
  const per = {
    '1008': { amount: 89, unit: 'kcal', name: 'Energy' },
    '1162': { amount: 8.7, unit: 'mg', name: 'Vitamin C' },
    '1114': { amount: 0, unit: 'µg', name: 'Vitamin D' }
  };
  const meal = M.createPending({ id: 'm', text: 'בננה 118 גרם', slot: 'snack' });
  meal.components[0].queryEn = 'banana raw';
  meal.components[0].matchState = 'matched';
  meal.components[0].candidate = { fdcId: 173944, description: 'Bananas, raw' };
  meal.components[0].per100g = per;
  const out = M.applyComponentGrams(meal, meal.components[0].id, 118, N);
  assert.equal(out.nutrients, true);
  assert.equal(out.meal.kcal, 105);
  assert.equal(out.meal.status, 'confirmed');
  assert.equal(out.meal.components[0].nutrients.vitaminC.amount, 8.7 * 1.18);
  assert.equal(out.meal.components[0].nutrients.vitaminD.amount, 0);
  const half = M.applyComponentGrams(out.meal, out.meal.components[0].id, 59, N);
  assert.equal(half.meal.kcal, Math.round(89 * 0.59));
});

test('pending and partial are not confirmed full totals', () => {
  const pending = M.createPending({ id: 'p', text: TEXT, slot: 'breakfast' });
  const day = N.summarizeDay([pending]);
  assert.equal(day.kcal.total, 0);
  assert.equal(day.kcal.incomplete, true);
  assert.equal(day.fdcMeals, 0);
  assert.equal(day.nutrients.find(n => n.key === 'vitaminC').amount, null);
  const known = M.createPending({ id: 'k', text: 'בננה 100 גרם', slot: 'lunch' });
  known.components[0].matchState = 'matched';
  known.components[0].candidate = { fdcId: 1, description: 'Bananas, raw' };
  known.components[0].per100g = { '1008': { amount: 89, unit: 'kcal', name: 'Energy' }, '1162': { amount: 8.7, unit: 'mg', name: 'Vitamin C' } };
  const confirmed = M.applyComponentGrams(known, known.components[0].id, 100, N).meal;
  const mixed = N.summarizeDay([pending, confirmed]);
  assert.equal(mixed.kcal.total, 89);
  assert.equal(mixed.kcal.incomplete, true);
  assert.equal(mixed.fdcMeals, 1);
  const vit = mixed.nutrients.find(n => n.key === 'vitaminC');
  assert.equal(vit.status, 'partial');
  assert.notEqual(vit.amount, 0);
});

test('legacy meal is not assigned a slot or vitamins', () => {
  const legacy = { id: 'old', name: 'ארוחה ישנה', kcal: 400, carbs: 40, protein: 20, fat: 10 };
  assert.equal(legacy.components, undefined);
  assert.equal(legacy.slot, undefined);
  const day = N.summarizeDay([legacy]);
  assert.equal(day.nutrients.find(n => n.key === 'vitaminC').amount, null);
  assert.equal(day.kcal.total, 400);
  assert.equal(day.kcal.incomplete, false);
});

test('usda portion grams only when a single official portion matches', () => {
  const grams = M.portionGrams([{ gramWeight: 50, amount: 1, modifier: 'large', portionDescription: '1 large egg' }], 'egg', 2);
  assert.equal(grams, 100);
  assert.equal(M.portionGrams([{ gramWeight: 50, amount: 1, modifier: 'cup' }], 'egg', 2), null);
  assert.equal(M.portionGrams([
    { gramWeight: 44, amount: 1, modifier: 'medium egg' },
    { gramWeight: 50, amount: 1, modifier: 'large egg' }
  ], 'egg', 2), null);
});

test('delete removes one card and leaves the other', () => {
  const a = M.createPending({ id: 'a', text: TEXT, slot: 'breakfast' });
  const b = M.createPending({ id: 'b', text: 'יוגורט', slot: 'breakfast' });
  const left = [a, b].filter(m => m.id !== 'a');
  assert.deepEqual(left.map(m => m.id), ['b']);
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall meal-card tests passed');
