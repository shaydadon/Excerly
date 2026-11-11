#!/usr/bin/env node
/* Worker parse body has no Haiku-rejected effort field, and meal_image uses a mocked AI binding. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import {
  anthropicMessagesBody,
  handleMealImage,
  mealImagePrompt,
  mealImageKey,
  IMAGE_CACHE_VERSION,
  resetMealImageState
} from '../worker/parse-meal-route.js';

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + (e && e.stack || e)); }
}

const TINY = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUQEhIVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolGxUVITEhJSsrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAEAAIDBQYBB//EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/9k=';

await test('Haiku request body has no effort, output_config, or thinking', () => {
  const body = anthropicMessagesBody('claude-haiku-4-5', 'sys', 'user', 200);
  assert.equal(body.model, 'claude-haiku-4-5');
  assert.equal(body.temperature, 0);
  assert.equal(body.max_tokens, 200);
  assert.equal('effort' in body, false);
  assert.equal('output_config' in body, false);
  assert.equal('thinking' in body, false);
  const flat = JSON.stringify(body);
  assert.equal(flat.includes('effort'), false);
  assert.equal(flat.includes('output_config'), false);
});

await test('prompt is built from dishEn, with no Hebrew and no grams', () => {
  const prompt = mealImagePrompt({
    name: 'חזה עוף 150 גרם עם אורז',
    dishEn: 'roasted chicken breast beside a mound of white rice on a plate',
    items: [{ name: 'חזה עוף', queryEn: 'chicken breast', grams: 150, cookingMethod: 'roasted' }]
  });
  assert.match(prompt, /roasted chicken breast beside a mound of white rice/);
  assert.equal(/[\u0590-\u05FF]/.test(prompt), false);
  assert.equal(/\d+\s*g\b/i.test(prompt), false);
});

await test('Hebrew-only fallback is skipped instead of sending a wrong prompt', async () => {
  resetMealImageState();
  const r = await handleMealImage({
    name: 'שקשוקה עם לחם',
    items: [{ name: 'שקשוקה', grams: 200 }, { name: 'לחם', grams: 40 }]
  }, { AI: { run: async () => { throw new Error('should not generate'); } } }, 'ip-he');
  assert.equal(r.status, 400);
  assert.equal(r.detail, 'no English food description');
});

await test('English item names are used when dishEn is missing', () => {
  const prompt = mealImagePrompt({
    name: 'סלט טונה',
    items: [{ queryEn: 'tuna salad', grams: 120 }, { nameEn: 'boiled egg' }]
  });
  assert.match(prompt, /tuna salad/);
  assert.match(prompt, /boiled egg/);
  assert.equal(/[\u0590-\u05FF]/.test(prompt), false);
});

await test('image cache key version changed so old pictures are not reused', async () => {
  const key = await mealImageKey({ dishEn: 'chicken and rice on a plate' });
  assert.ok(key.startsWith(IMAGE_CACHE_VERSION + '-'));
});

await test('missing AI binding is a clean 501', async () => {
  resetMealImageState();
  const r = await handleMealImage({ name: 'chicken dinner', items: [{ queryEn: 'chicken', grams: 140 }] }, {}, 'ip1');
  assert.equal(r.error, true);
  assert.equal(r.status, 501);
});

await test('mocked Flux returns a data URL and the second call is cached', async () => {
  resetMealImageState();
  let calls = 0;
  const env = {
    AI: { run: async (model, input) => {
      calls++;
      assert.equal(model, '@cf/black-forest-labs/flux-1-schnell');
      assert.equal(input.steps, 6);
      assert.match(input.prompt, /chicken/);
      return { image: TINY.split(',')[1] };
    } }
  };
  const body = { name: 'dinner', items: [{ queryEn: 'roasted chicken', grams: 140, cookingMethod: 'roasted' }] };
  const a = await handleMealImage(body, env, 'ip-cache');
  const b = await handleMealImage(body, env, 'ip-cache');
  assert.equal(a.error, false);
  assert.equal(a.parsed.cached, false);
  assert.ok(a.parsed.src.startsWith('data:image/jpeg;base64,'));
  assert.equal(b.parsed.cached, true);
  assert.equal(b.parsed.src, a.parsed.src);
  assert.equal(calls, 1);
});

await test('image rate limit returns 429 without calling the model again', async () => {
  resetMealImageState();
  let calls = 0;
  const env = { MEAL_IMAGE_LIMIT: 1, AI: { run: async () => { calls++; return { image: TINY.split(',')[1] }; } } };
  const one = { name: 'plate one', items: [{ queryEn: 'rice', grams: 100 }] };
  const two = { name: 'plate two', items: [{ queryEn: 'beans', grams: 80 }] };
  const ok = await handleMealImage(one, env, 'ip-limit');
  const blocked = await handleMealImage(two, env, 'ip-limit');
  assert.equal(ok.error, false);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.detail, 'rate_limited');
  assert.equal(calls, 1);
});

await test('representative library still wins for the entrecote sandwich', () => {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../assets/js/mealimage.js', import.meta.url), 'utf8'), ctx);
  const meal = { components: [{ coreKey: 'entrecote' }, { coreKey: 'roll' }] };
  const img = ctx.ExcerlyMealImage.forMeal(meal);
  assert.equal(img.src, 'assets/meal-img/entrecote-sandwich.jpg');
  assert.equal(img.kind, 'representative');
  const empty = ctx.ExcerlyMealImage.forMeal({ components: [{ coreKey: 'chicken' }] });
  assert.equal(empty.kind, 'placeholder');
  assert.equal(empty.src, null);
  const stale = ctx.ExcerlyMealImage.forMeal({
    components: [{ coreKey: 'chicken' }],
    image: { src: 'data:image/jpeg;base64,AAAA', kind: 'generated' }
  });
  assert.equal(stale.kind, 'placeholder');
  const fresh = ctx.ExcerlyMealImage.forMeal({
    components: [{ coreKey: 'chicken' }],
    image: { src: 'data:image/jpeg;base64,BBBB', kind: 'generated', v: 2 }
  });
  assert.equal(fresh.src, 'data:image/jpeg;base64,BBBB');
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all worker-ai tests passed');
