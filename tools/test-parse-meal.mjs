import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseWithMock, applyOfficial } from '../prototype/parse-meal.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const mocks = JSON.parse(fs.readFileSync(path.join(ROOT, 'prototype/mock-llm.json'), 'utf8'));
const v57 = JSON.parse(fs.readFileSync(path.join(ROOT, 'logs/v57-diagnosis.json'), 'utf8'));

let passed = 0, failed = 0;
function eq(a, b) { return Object.is(a, b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 0.05); }
function test(name, fn) {
  try { fn(); passed++; console.log('  ok:', name); }
  catch (e) { failed++; console.error('  FAIL:', name, '\n   ', e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function assertEq(a, b, msg) { if (!eq(a, b)) throw new Error((msg || '') + ` expected ${b}, got ${a}`); }

console.log('v57 live-dinner diagnosis (rule-based)');
test('reproduces 1466 kcal / 208.5 g protein / 54.4 g fat / 3404.7 mg sodium / partial', () => {
  const m = v57.dinner.meal;
  assertEq(m.kcal, 1466, 'kcal');
  assertEq(m.protein, 208.5, 'protein');
  assertEq(m.fat, 54.4, 'fat');
  assert(Math.abs(m.sodium - 3404.74) < 0.05, 'sodium ' + m.sodium);
  assertEq(m.status, 'partial', 'status');
  assertEq(m.image && m.image.kind, 'placeholder', 'image');
});
test('4 חתיכות mapped to 4 whole GovIL chicken units (656 g)', () => {
  const c = v57.dinner.components.find(x => /פילה עוף/.test(x.name));
  assert(c, 'chicken chunk');
  assertEq(c.grams, 656, 'grams');
  assertEq(c.count, 4, 'count');
  assertEq(c.unitKind, 'unit', 'unit');
  assertEq(c.kcal, 1050, 'chicken kcal');
  assertEq(c.protein, 197.5, 'chicken protein');
  assert(c.sodium && Math.abs(c.sodium.amount - 3234.08) < 0.1, 'chicken sodium dominates the 3404 mg');
});
test('soy sauce was not split out of the chicken chunk', () => {
  assert(!v57.dinner.components.some(c => /סויה/.test(c.name) && !/פילה/.test(c.name)), 'no soy row');
});
test('mustard is unmatched (not in FoodMap) → partial', () => {
  const m = v57.dinner.components.find(c => /חרדל/.test(c.name));
  assert(m, 'mustard row');
  assertEq(m.matchState, 'ambiguous', 'match');
  assertEq(m.grams, null, 'grams');
  assertEq(m.kcal, null, 'kcal');
});
test('tahini, amba tsp/tbsp, oil, roll parsed correctly', () => {
  const by = n => v57.dinner.components.find(c => c.name.includes(n));
  assertEq(by('טחינה').grams, 30, 'tahini');
  assertEq(by('כף עמבה').grams, 11, 'amba tbsp');
  assertEq(by('כפית עמבה').grams, 3.7, 'amba tsp');
  assertEq(by('שמן זית').grams, 10, 'oil');
  assertEq(by('לחמניה').grams, 44, 'roll');
});

console.log('\nprototype LLM→GovIL (nutrition never from the model)');
const dinner = parseWithMock(mocks.newDinner);
const lunch = parseWithMock(mocks.entrecoteLunch);
const oldD = parseWithMock(mocks.oldChickenSandwich);

test('new dinner is 596 kcal after absorbing the soy marinade and the frying oil (was 654 / 54.6 g protein / 35.5 g fat / 1624 mg sodium)', () => {
  assertEq(dinner.status, 'confirmed');
  assertEq(dinner.kcal, 596);
  assertEq(dinner.protein, 53.9);
  assertEq(dinner.carbs, 25.1);
  assertEq(dinner.fat, 29.4);
  assertEq(dinner.sodium, 1173.5);
  assertEq(dinner.items.length, 7);
});
test('chicken is 4 pieces × 35 g = 140 g of GovIL 805, not 656 g', () => {
  const c = dinner.items.find(i => i.govilCode === 805);
  assert(c, 'code 805');
  assertEq(c.grams, 140);
  assertEq(c.kcal, 224);
  assertEq(c.protein, 42.1);
});
test('soy sauce and mustard are their own GovIL rows', () => {
  const soy = dinner.items.find(i => i.govilCode === 1706);
  const must = dinner.items.find(i => i.govilCode === 4273);
  assert(soy && must, 'both present');
  assertEq(soy.gramsStated, 11);
  assertEq(soy.grams, 2.8);
  assertEq(soy.role, 'marinade');
  assertEq(must.grams, 14);
  const oil = dinner.items.find(i => i.govilCode === 4443);
  assertEq(oil.gramsStated, 10);
  assertEq(oil.grams, 4);
  assertEq(oil.role, 'frying_oil');
  assertEq(soy.source, 'govil');
  assertEq(must.source, 'govil');
});
test('entrecote lunch stays 674 kcal (old meals not recalculated into a new truth)', () => {
  assertEq(lunch.status, 'confirmed');
  assertEq(lunch.kcal, 674);
  assert(Math.abs(lunch.protein - 24.5) < 0.15, 'protein ' + lunch.protein);
  assertEq(lunch.fat, 53.5);
});
test('earlier chicken sandwich stays ~549–550 kcal / 53.1 g protein', () => {
  assertEq(oldD.status, 'confirmed');
  assert(oldD.kcal === 549 || oldD.kcal === 550, 'kcal ' + oldD.kcal);
  assertEq(oldD.protein, 53.1);
  assertEq(oldD.fat, 24.8);
});
test('LLM-supplied kcal/protein are ignored; GovIL wins', () => {
  const poisoned = parseWithMock({
    ingredients: [
      { nameHe: 'עמבה', nameEn: 'amba', grams: 11, unit: 'tbsp', kcal: 9999, protein: 888 }
    ]
  });
  assertEq(poisoned.items[0].kcal, 5, 'amba is 5 kcal from GovIL, not 9999');
  assertEq(poisoned.items[0].protein, 0.1);
  assertEq(poisoned.items[0].govilCode, 3267);
});
test('unknown food stays unmatched, no invented numbers', () => {
  const r = applyOfficial([{ nameHe: 'quinoa xyz-unknown-food', nameEn: '', grams: 100 }]);
  const it = r.items[0];
  assert(it.matchState !== 'matched' || it.govilCode == null, 'should not invent a code for nonsense');
  if (it.matchState !== 'matched') {
    assertEq(it.kcal, null, 'no invented kcal');
  }
});

console.log('\n' + passed + ' passed,' + failed + ' failed');
if (failed) process.exit(1);
console.log('all parse-meal tests passed');
