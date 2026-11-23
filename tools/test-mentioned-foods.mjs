#!/usr/bin/env node
/* Misspelled speech must keep every food. Cheese fat % comes from words like תשע אחוז. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assembleMeal, candidatesFor, handleTranscribe } from '../worker/parse-meal-route.js';
import { normalizeMealText } from '../worker/portions.mjs';

const doc = JSON.parse(readFileSync(new URL('../assets/data/govil-foods.json', import.meta.url), 'utf8'));
const byCode = {};
for (const f of doc.foods) byCode[f.c] = f;
const pack = { byCode, byCodeList: doc.foods, nutrients: doc.meta.nutrients };

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + (e && e.stack || e)); }
}

const TYPO = 'חביתה משני בצים מתוגנת בכף שמן זית וגבייה גבילה לבנה 9%';
const VOICE = 'חביתה מטוגנת בכף שמן זית, עם גבייה גבינה לבנה';
const SPOKEN = 'חביתה, משתי ביצים, מתוגנת, בקו שמן זית וגבייה, גבינה לבנה, תשע אחוז';

await test('number words, בקו, and cheese misspellings normalize', () => {
  const s = normalizeMealText(SPOKEN);
  assert.match(s, /9%/);
  assert.match(s, /בכף שמן זית/);
  assert.match(s, /מטוגנת/);
  assert.equal(s.includes('גבייה'), false);
  assert.match(s, /גבינה לבנה/);
  assert.equal(normalizeMealText('יוגורט חמישה אחוז'), 'יוגורט 5%');
  assert.equal(normalizeMealText('חלב שלוש אחוז'), 'חלב 3%');
  assert.equal(normalizeMealText('גבינה חמש אחוז'), 'גבינה 5%');
});

await test('typo sentence keeps cheese at 9% and two eggs at 110 g', () => {
  const meal = assembleMeal({
    dishEn: 'omelette fried in olive oil with white cheese',
    note: 'White cheese fat content specified as 9%',
    ingredients: [
      { nameHe: 'חביתה', nameEn: 'omelette', grams: 100, count: 2 },
      { nameHe: 'שמן זית', nameEn: 'olive oil', grams: 13.5, unit: 'כף' }
    ]
  }, pack, TYPO);
  const cheese = meal.items.find(i => /גבינה/.test(i.nameHe));
  const eggs = meal.items.find(i => /חבית|ביצ/.test(i.nameHe));
  const oil = meal.items.find(i => /שמן/.test(i.nameHe));
  assert.ok(cheese, 'cheese was dropped');
  assert.equal(cheese.govilCode, 542);
  assert.match(cheese.description, /9%/);
  assert.equal(cheese.grams, 100);
  assert.equal(eggs.grams, 110);
  assert.equal(eggs.kcal, 178);
  assert.equal(oil.gramsStated, 13.5);
  assert.equal(oil.grams, 5.4);
  assert.equal(oil.role, 'frying_oil');
  assert.equal(meal.items.length, 3);
  assert.equal(meal.status, 'confirmed');
});

await test('voice line without a percent still keeps the cheese', () => {
  const meal = assembleMeal({
    dishEn: 'fried omelette with olive oil and white cheese',
    note: 'white cheese',
    ingredients: [
      { nameHe: 'חביתה', nameEn: 'omelette', grams: 100 }
    ]
  }, pack, VOICE);
  const cheese = meal.items.find(i => /גבינה לבנה/.test(i.nameHe));
  const oil = meal.items.find(i => /שמן/.test(i.nameHe));
  assert.ok(cheese, 'cheese dropped');
  assert.ok(cheese.kcal != null);
  assert.equal(oil.gramsStated, 13.5);
  assert.equal(oil.grams, 5.4);
});

await test('תשע אחוז and בקו pick 9% cheese, not 3% Tara', () => {
  const meal = assembleMeal({
    dishEn: 'omelette with white cheese',
    note: 'cheese',
    ingredients: [
      { nameHe: 'חביתה', nameEn: 'omelette', grams: 100, count: 2 },
      { nameHe: 'שמן זית', nameEn: 'olive oil', grams: 10 },
      { nameHe: 'גבינה לבנה', nameEn: 'white cheese', grams: 45 }
    ]
  }, pack, SPOKEN);
  const cheese = meal.items.find(i => /גבינה/.test(i.nameHe));
  const eggs = meal.items.find(i => /חבית|ביצ/.test(i.nameHe));
  const oil = meal.items.find(i => /שמן/.test(i.nameHe));
  assert.equal(cheese.govilCode, 542);
  assert.match(cheese.description, /9%/);
  assert.equal(cheese.description.includes('3%'), false);
  assert.equal(cheese.grams, 45);
  assert.equal(cheese.kcal, 57);
  assert.equal(eggs.grams, 110);
  assert.equal(oil.gramsStated, 13.5);
  assert.equal(oil.grams, 5.4);
});

await test('fat percent ranks yogurt and milk', () => {
  const fake = { byCodeList: [
    { c: 1, n: 'יוגורט 3% שומן' },
    { c: 2, n: 'יוגורט 5% שומן' },
    { c: 3, n: 'חלב 1% שומן' },
    { c: 4, n: 'חלב 3% שומן' }
  ] };
  assert.equal(candidatesFor(fake, 'יוגורט', 'yogurt', 'יוגורט חמישה אחוז')[0].code, 2);
  assert.equal(candidatesFor(fake, 'חלב', 'milk', 'חלב שלוש אחוז')[0].code, 4);
});

await test('paprika copied at 150 g becomes a 1 g seasoning and does not block', () => {
  const meal = assembleMeal({
    ingredients: [
      { nameHe: 'חזה עוף', nameEn: 'chicken breast', grams: 150 },
      { nameHe: 'פפריקה', nameEn: 'paprika', grams: 150 }
    ]
  }, pack, 'חזה עוף עם פפריקה');
  const spice = meal.items.find(i => /פפריקה/.test(i.nameHe));
  assert.equal(spice.role, 'seasoning');
  assert.equal(spice.grams, 1);
  assert.equal(spice.kcal, 3);
  assert.equal(spice.source, 'estimate');
  assert.equal(meal.status, 'confirmed');
  assert.ok(meal.items.every(i => i.kcal != null));
});

await test('a thanks hallucination is not a food and is not estimated', () => {
  const meal = assembleMeal({
    note: 'thank you',
    dishEn: 'meal',
    ingredients: [{ nameHe: 'תודה רבה', nameEn: 'thank you', grams: 150 }]
  }, pack, 'תודה רבה');
  assert.equal(meal.items.length, 0);
  assert.equal(meal.kcal, null);
  const kept = assembleMeal({
    ingredients: [
      { nameHe: 'חביתה', nameEn: 'omelette', grams: 110, count: 2 },
      { nameHe: 'תודה רבה', nameEn: 'thank you', grams: 150 }
    ]
  }, pack, 'חביתה, תודה רבה');
  assert.equal(kept.items.some(i => /תודה|thank/i.test(i.nameHe + i.nameEn)), false);
  assert.ok(kept.items.some(i => /חבית|ביצ/.test(i.nameHe)));
});

await test('an unknown food is an estimate, not a missing row', () => {
  const meal = assembleMeal({
    ingredients: [{ nameHe: 'מזון לא מוכר xyz', nameEn: 'unknown food', grams: 0 }]
  }, pack, 'מזון לא מוכר xyz');
  assert.equal(meal.items.length, 1);
  assert.equal(meal.items[0].source, 'estimate');
  assert.ok(meal.items[0].kcal > 0);
});

await test('whisper text turns תשע אחוז and בקו into 9% and בכף', async () => {
  const raw = SPOKEN;
  const out = await handleTranscribe({ audio: 'abc', lang: 'he' }, { AI: { run: async () => ({ text: raw }) } });
  assert.equal(out.error, false);
  assert.match(out.parsed.text, /9%/);
  assert.match(out.parsed.text, /בכף שמן זית/);
  assert.match(out.parsed.text, /מטוגנת/);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all mentioned-food tests passed');
