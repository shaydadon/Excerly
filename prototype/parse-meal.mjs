/* Excerly – Hebrew meal parse engine (prototype)
   LLM (or mock) returns ingredients + grams only.
   Nutrition and food codes always come from GovIL (USDA core as fallback).
   The model never supplies kcal / macros / micros. */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V57 = process.env.EXCERLY_V57 || path.resolve(HERE, '..');

function loadEngine() {
  const ctx = { console };
  ctx.globalThis = ctx;
  ctx.window = ctx;
  const load = (rel) => vm.runInNewContext(fs.readFileSync(path.join(V57, rel), 'utf8'), ctx, { filename: rel });
  load('assets/js/govil.js');
  load('assets/js/foodmap.js');
  load('assets/js/nutrients.js');
  ctx.ExcerlyGovil.setData(
    JSON.parse(fs.readFileSync(path.join(V57, 'assets/data/govil-foods.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(V57, 'assets/data/govil-portions.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(V57, 'assets/data/govil-map.json'), 'utf8'))
  );
  ctx.ExcerlyFoodMap.setCore(JSON.parse(fs.readFileSync(path.join(V57, 'assets/data/usda-core.json'), 'utf8')));
  return ctx;
}

const PREFERRED = {
  'לחמניה לבנה': 10124,
  'לחמניה מלחם לבן': 10124,
  'טחינה': 1898,
  'עמבה': 3267,
  'פילה עוף': 805,
  'חזה עוף': 805,
  'רוטב סויה': 1706,
  'חרדל': 4273,
  'שמן זית': 4443,
  'סטייק אנטריקוט': 610,
  'מיונז': 4466,
  'חסה': 3588
};

const MICRO_KEYS = ['sodium'];

function scale(per100, grams) {
  if (!per100 || grams == null) return null;
  const k = Number(grams) / 100;
  const out = {};
  for (const [id, row] of Object.entries(per100)) {
    if (!row || row.amount == null) continue;
    out[id] = { amount: row.amount * k, unit: row.unit, name: row.name, id: Number(id) };
  }
  return out;
}
function macro(scaled, name, digits) {
  const ids = { energy: '1008', protein: '1003', fat: '1004', carbs: '1005', sodium: '1093' };
  const row = scaled && scaled[ids[name]];
  if (!row || row.amount == null) return null;
  const f = Math.pow(10, digits);
  return Math.round(row.amount * f) / f;
}

function candidatesFor(G, nameHe, nameEn, limit) {
  const q = String(nameHe || '').trim();
  let ranked = G.search(q, limit || 6);
  if ((!ranked || !ranked.length) && nameEn) ranked = G.search(nameEn, limit || 6);
  return (ranked || []).map(r => ({
    code: r.food.c, sml: r.food.s, name: r.food.n, english: r.food.e || '', score: Math.round(r.score)
  }));
}

function pickCode(G, ing, cands) {
  const preferred = PREFERRED[ing.nameHe];
  if (preferred && G.food(preferred)) {
    return { code: preferred, via: 'preferred-map', food: G.food(preferred) };
  }
  const hit = G.decide(ing.nameHe);
  if (hit && hit.state === 'matched' && hit.food) {
    return { code: hit.food.c, via: 'govil-decide', food: hit.food };
  }
  // LLM (or a later worker step) may pick a code from the candidate list only.
  if (ing.govilCode && cands.some(c => Number(c.code) === Number(ing.govilCode))) {
    return { code: Number(ing.govilCode), via: 'llm-pick-from-candidates', food: G.food(ing.govilCode) };
  }
  if (cands.length && cands[0].score >= 800) {
    return { code: cands[0].code, via: 'top-candidate', food: G.food(cands[0].code) };
  }
  if (hit && hit.state === 'ambiguous' && hit.options && hit.options[0]) {
    return { code: hit.options[0].code, via: 'ambiguous-top', food: G.food(hit.options[0].code), needsReview: true };
  }
  return { code: null, via: 'none', food: null, needsReview: true };
}

export function applyOfficial(ingredients, opts) {
  const ctx = (opts && opts.ctx) || loadEngine();
  const G = ctx.ExcerlyGovil;
  const N = ctx.ExcerlyNutrients;
  const items = (ingredients || []).map((ing, i) => {
    const grams = Number(ing.grams);
    const cands = candidatesFor(G, ing.nameHe, ing.nameEn, 6);
    const pick = pickCode(G, ing, cands);
    const item = {
      id: 'c' + i,
      nameHe: ing.nameHe,
      nameEn: ing.nameEn || '',
      grams: isFinite(grams) ? grams : null,
      count: ing.count ?? null,
      unit: ing.unit || null,
      cookingMethod: ing.cookingMethod || null,
      confidence: ing.confidence ?? null,
      candidates: cands,
      govilCode: pick.code,
      sml: pick.food && pick.food.s,
      description: pick.food && pick.food.n,
      matchVia: pick.via,
      matchState: pick.food && isFinite(grams) ? 'matched' : (cands.length ? 'ambiguous' : 'none'),
      needsReview: !!pick.needsReview || !(pick.food && isFinite(grams)),
      source: null,
      kcal: null, protein: null, carbs: null, fat: null, sodium: null
    };
    if (pick.food && isFinite(grams) && grams > 0) {
      const per100 = G.per100(pick.food);
      const scaled = scale(per100, grams);
      const built = N.mealFromOfficial(per100, grams, {
        name: ing.nameHe, source: 'govil', govilCode: pick.food.c, sml: pick.food.s,
        description: pick.food.n, dataset: G.DATASET, via: pick.via
      });
      item.source = 'govil';
      item.kcal = built.kcal;
      item.protein = built.protein;
      item.carbs = built.carbs;
      item.fat = built.fat;
      item.sodium = macro(scaled, 'sodium', 1);
      item.nutrients = built.provenance && built.provenance.nutrients;
    }
    // Strip any nutrition the LLM might have smuggled in — already ignored; we never read ing.kcal.
    return item;
  });
  const confirmed = items.filter(it => it.matchState === 'matched' && it.kcal != null);
  const sum = (k, d) => confirmed.length ? Math.round(confirmed.reduce((s, it) => s + (Number(it[k]) || 0), 0) * Math.pow(10, d)) / Math.pow(10, d) : null;
  const all = items.length > 0 && confirmed.length === items.length;
  return {
    source: 'govil',
    status: !items.length ? 'pending' : all ? 'confirmed' : (confirmed.length ? 'partial' : 'pending'),
    kcal: sum('kcal', 0),
    protein: sum('protein', 1),
    carbs: sum('carbs', 1),
    fat: sum('fat', 1),
    sodium: sum('sodium', 1),
    items,
    note: (opts && opts.note) || ''
  };
}

export function parseWithMock(mock) {
  if (!mock || !mock.ingredients) throw new Error('mock missing ingredients');
  // Guard: reject nutrition fields from the model
  const clean = mock.ingredients.map(ing => {
    const { kcal, protein, carbs, fat, sodium, nutrients, ...rest } = ing;
    if (kcal != null || protein != null) {
      /* ignored on purpose */
    }
    return rest;
  });
  return applyOfficial(clean, { note: mock.note || '' });
}

export { loadEngine, PREFERRED, candidatesFor };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mocks = JSON.parse(fs.readFileSync(path.join(HERE, 'mock-llm.json'), 'utf8'));
  const out = {};
  for (const [k, mock] of Object.entries(mocks)) out[k] = parseWithMock(mock);
  const dest = path.join(HERE, '..', 'logs', 'prototype-meals.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  for (const [k, meal] of Object.entries(out)) {
    console.log(k, meal.status, meal.kcal, 'kcal', 'P', meal.protein, 'C', meal.carbs, 'F', meal.fat, 'Na', meal.sodium);
    for (const it of meal.items) {
      console.log('  -', it.nameHe, it.grams + 'g', 'code', it.govilCode, it.description, '→', it.kcal, 'kcal', 'P', it.protein, 'via', it.matchVia, it.matchState);
    }
  }
}
