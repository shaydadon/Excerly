#!/usr/bin/env node
/* Same meal text must not change kcal when the model guesses different grams.
   Marinade and frying oil are counted only at the absorbed fraction. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stabilizeIngredient, describeDish } from '../worker/portions.mjs';
import { mealImagePrompt } from '../worker/parse-meal-route.js';

const TEXT = 'כריך מלחמניה לבנה עם 2 כפות טחינה , כף עמבה , 4 חתיכות של פילה עוף מרינדת 3 כפות רוטב סויה , כף חרדל ,כפית עמבה , מטוגנים בכף שמן זית';
const foods = JSON.parse(readFileSync(new URL('../assets/data/govil-foods.json', import.meta.url), 'utf8'));
const by = Object.fromEntries(foods.foods.map(f => [f.c, f]));
const keys = foods.meta.nutrients;

function per100(code, name) {
  const i = keys.indexOf(name);
  const row = by[code];
  return row && row.v[i] != null ? row.v[i] : 0;
}
function kcalOf(items) {
  return Math.round(items.reduce((s, it) => s + per100(it.govilCode, 'energy') * it.grams / 100, 0));
}

const spec = [
  { nameHe: 'לחמניה לבנה', nameEn: 'white roll', govilCode: 10124, count: 1, unit: 'unit' },
  { nameHe: '2 כפות טחינה', nameEn: 'tahini', govilCode: 1898, count: 2, unit: 'כף' },
  { nameHe: 'כף עמבה', nameEn: 'amba', govilCode: 3267, count: 1, unit: 'כף' },
  { nameHe: '4 חתיכות של פילה עוף', nameEn: 'chicken fillet', govilCode: 805, count: 4, unit: 'חתיכה' },
  { nameHe: '3 כפות רוטב סויה', nameEn: 'soy sauce', govilCode: 1706, count: 3, unit: 'כף', role: 'marinade' },
  { nameHe: 'כף חרדל', nameEn: 'mustard', govilCode: 4273, count: 1, unit: 'כף' },
  { nameHe: 'כפית עמבה', nameEn: 'amba', govilCode: 3267, count: 1, unit: 'כפית' },
  { nameHe: 'כף שמן זית', nameEn: 'olive oil', govilCode: 4443, count: 1, unit: 'כף', role: 'frying_oil' }
];

function run(guesses) {
  return spec.map((row, i) => stabilizeIngredient(Object.assign({}, row, { grams: guesses[i] }), TEXT));
}

let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + (e.stack || e)); }
}

test('repeated parses with different gram guesses produce the same kcal', () => {
  const a = run([85, 40, 20, 160, 45, 15, 5, 15]);
  const b = run([44, 30, 11, 140, 33, 14, 4, 10]);
  assert.equal(kcalOf(a), kcalOf(b));
  assert.equal(a[0].grams, 44);
  assert.equal(a[3].grams, 140);
  assert.equal(a[4].gramsStated, 33);
  assert.equal(a[4].grams, 8.3);
  assert.equal(a[4].role, 'marinade');
  assert.equal(a[7].gramsStated, 10);
  assert.equal(a[7].grams, 4);
  assert.equal(a[7].role, 'frying_oil');
  console.log('    stabilized sandwich', kcalOf(a), 'kcal');
});

test('dressing oil that is not for frying is counted in full', () => {
  const oil = stabilizeIngredient({ nameHe: '2 כפות שמן זית', nameEn: 'olive oil', govilCode: 4443, count: 2, unit: 'כף', grams: 30 }, 'חסה עם 2 כפות שמן זית');
  assert.equal(oil.role, 'food');
  assert.equal(oil.grams, 20);
});

test('dishEn describes the fried unbreaded sandwich and the prompt keeps sauces visible', () => {
  const dish = describeDish(TEXT, spec);
  assert.match(dish, /pan-fried/);
  assert.match(dish, /not breaded/);
  assert.match(dish, /tahini/);
  assert.match(dish, /amba/);
  const prompt = mealImagePrompt({ dishEn: dish, items: spec.map(s => ({ queryEn: s.nameEn })) });
  assert.match(prompt, /not breaded/);
  assert.match(prompt, /sauces are visible/);
  assert.equal(/[\u0590-\u05FF]/.test(prompt), false);
  assert.equal(/\d+\s*g\b/i.test(prompt), false);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all absorption tests passed');
