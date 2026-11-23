#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { spokenGrams } from '../worker/portions.mjs';

const root = new URL('..', import.meta.url);
const ctx = {};
ctx.window = ctx;
ctx.global = ctx;
vm.createContext(ctx);
for (const f of ['govil.js', 'foodmap.js', 'nutrients.js', 'nutrition.js', 'mealcard.js']) {
  vm.runInContext(readFileSync(new URL('assets/js/' + f, root), 'utf8'), ctx);
}
ctx.ExcerlyGovil.setData(
  JSON.parse(readFileSync(new URL('assets/data/govil-foods.json', root), 'utf8')),
  JSON.parse(readFileSync(new URL('assets/data/govil-portions.json', root), 'utf8')),
  JSON.parse(readFileSync(new URL('assets/data/govil-map.json', root), 'utf8'))
);
ctx.ExcerlyFoodMap.attachGovil(JSON.parse(readFileSync(new URL('assets/data/govil-map.json', root), 'utf8')).map);

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}

test('Hebrew spoken grams override the rice cup default', async () => {
  assert.equal(spokenGrams('300 גרם אורז', { nameHe: 'אורז' }), 300);
  const meal = await ctx.ExcerlyMealCard.resolveMeal(
    ctx.ExcerlyMealCard.createPending({ id: 'r', text: '300 גרם אורז', slot: 'lunch' }),
    { search: async () => { throw new Error('usda'); }, govil: ctx.ExcerlyGovil },
    ctx.ExcerlyNutrients
  );
  const rice = meal.components[0];
  assert.equal(rice.grams, 300);
  assert.equal(rice.candidate.govilCode, 2721);
  assert.ok(Math.abs(rice.kcal - 390) <= 5, 'kcal ' + rice.kcal);
});

test('English spoken grams override a chicken default', () => {
  assert.equal(spokenGrams('400 grams of chicken', { nameEn: 'chicken' }), 400);
  assert.equal(ctx.ExcerlyMealCard.spokenGram('400 grams of chicken breast', 'chicken breast'), 400);
});

test('plain פרגית is a skinless thigh, and פרגית אסייתית is an estimate with calories', async () => {
  const api = { search: async () => { throw new Error('usda'); }, govil: ctx.ExcerlyGovil };
  const plain = await ctx.ExcerlyMealCard.resolveMeal(ctx.ExcerlyMealCard.createPending({ id: 'p', text: 'פרגית', slot: 'lunch' }), api, ctx.ExcerlyNutrients);
  assert.equal(plain.components[0].candidate.govilCode, 8186);
  assert.ok(plain.kcal > 0);
  assert.equal(plain.components[0].estimate, undefined);
  const dish = await ctx.ExcerlyMealCard.resolveMeal(ctx.ExcerlyMealCard.createPending({ id: 'd', text: 'פרגית אסייתית', slot: 'lunch' }), api, ctx.ExcerlyNutrients);
  assert.equal(dish.components[0].estimate, true);
  assert.equal(dish.components[0].options.length, 0);
  assert.ok(dish.kcal > 0, 'kcal ' + dish.kcal);
  const soup = await ctx.ExcerlyMealCard.resolveMeal(ctx.ExcerlyMealCard.createPending({ id: 's', text: 'מרק', slot: 'dinner' }), api, ctx.ExcerlyNutrients);
  assert.notEqual(soup.components[0].questionKey, 'whichFood');
  assert.equal((soup.components[0].options || []).length, 0);
  assert.equal(soup.components[0].matchState, 'matched');
});

test('an old 1437 kcal dinner with no parseVer re-resolves under the current parser', async () => {
  const text = 'כריך מלחמניה לבנה עם ארבע פרוסות חזה עוף במרינדה עם טחינה ועמבה';
  const stale = { id: 'old', name: text, text: text, kcal: 1437, protein: 222.8, status: 'confirmed', parseVer: null, slot: 'dinner' };
  assert.equal(stale.parseVer, null);
  const fresh = await ctx.ExcerlyMealCard.resolveMeal(
    ctx.ExcerlyMealCard.createPending({ id: stale.id, text: stale.text, slot: stale.slot }),
    { search: async () => ({ ok: false, foods: [] }), govil: ctx.ExcerlyGovil },
    ctx.ExcerlyNutrients
  );
  assert.equal(fresh.parseVer, 1);
  assert.ok(fresh.kcal < 800, 'kcal ' + fresh.kcal);
  assert.notEqual(fresh.kcal, 1437);
  assert.ok(fresh.protein < 80);
});

test('תודה רבה is not saved as a 150 g / 270 kcal dish', async () => {
  const api = { search: async () => ({ ok: false, foods: [] }), govil: ctx.ExcerlyGovil };
  assert.equal(ctx.ExcerlyMealCard.splitComponents('תודה רבה').length, 0);
  assert.equal(ctx.ExcerlyMealCard.splitComponents('thank you').length, 0);
  const mixed = ctx.ExcerlyMealCard.splitComponents('חביתה, תודה רבה');
  assert.equal(mixed.length, 1);
  assert.match(mixed[0].name, /חביתה/);
  const meal = await ctx.ExcerlyMealCard.resolveMeal(
    ctx.ExcerlyMealCard.createPending({ id: 'thanks', text: 'תודה רבה', slot: 'breakfast' }),
    api,
    ctx.ExcerlyNutrients
  );
  assert.equal(meal.components.length, 0);
  assert.equal(meal.kcal, null);
});

if (failed) process.exit(1);
console.log('spoken tests passed');
