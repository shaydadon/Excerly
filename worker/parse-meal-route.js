/* =============================================================
   Excerly – parse_meal worker route.
   Claude returns ingredients, grams, method, and a GovIL code chosen from candidates.
   Nutrition is scaled from that code. No image generation and no new secret.
   ============================================================= */

const PARSE_MODEL_DEFAULT = 'claude-haiku-4-5'; // cheap, Hebrew is strong; override with env.PARSE_MODEL

const PARSE_SYSTEM =
  'You parse a free-text Hebrew (or mixed) meal description into ingredients. ' +
  'Return JSON only, no text before or after, in the shape ' +
  '{"dishEn":string,"ingredients":[{"nameHe":string,"nameEn":string,"grams":number,"count":number|null,"unit":string|null,"cookingMethod":string|null,"confidence":number}],"note":string}. ' +
  'dishEn is one English sentence under 25 words naming the concrete foods, cooking method, and plating. ' +
  'nameEn is a short English food name for that ingredient. Both must be English, never Hebrew. ' +
  'Do not output calories, protein, carbs, fat, sodium, or vitamin values. Nutrition is computed later from a food database. ' +
  'Rules: split compound phrases — "4 חתיכות של פילה עוף מרינדת כף רוטב סויה" is chicken pieces AND 1 tbsp soy sauce. ' +
  '"מרינדה/מרינדת/במרינדה" is a method, not a food. "מטוגנים בכף שמן זית" is 1 tbsp olive oil plus a fried cookingMethod on the food. ' +
  '"חתיכה/חתיכות/נתח" of chicken, turkey or fish is a piece of about 35 g, never a whole breast (150–170 g). "פרוסה" is also ~35 g (25 g if דקה). ' +
  '"כף" is a tablespoon, "כפית" is a teaspoon — never treat כפית as כף. ' +
  'If a roll/bread/pita is already named, "כריך/סנדוויץ" is only a container, not a second bread. ' +
  'Estimate grams for household measures. Do not invent ingredients that are not in the text.';

const PICK_SYSTEM =
  'You pick a food-database code for each ingredient from the candidate list only. ' +
  'Return JSON only: {"picks":[{"i":number,"code":number|null}]}. ' +
  'Use null when no candidate is a reasonable match. Never invent a code that is not in that ingredient\'s candidates. ' +
  'Prefer a plain, unbranded, cooked-form match that fits the cookingMethod (fried/grilled/roasted). ' +
  'Do not return nutrition values.';

// Haiku 4.5 rejects output_config.effort ("This model does not support the effort parameter").
// Do not send effort, output_config, or thinking on this route.
export function anthropicMessagesBody(model, system, user, maxTokens) {
  return {
    model,
    max_tokens: maxTokens || 1024,
    system,
    messages: [{ role: 'user', content: user }]
  };
}

async function callJsonModel(env, model, system, user, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(anthropicMessagesBody(model, system, user, maxTokens))
  });
  const raw = await res.text();
  if (!res.ok) return { error: true, status: res.status, detail: raw.slice(0, 400) };
  const data = JSON.parse(raw);
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { error: true, status: 502, detail: 'no JSON in model output' };
  try { return { error: false, parsed: JSON.parse(match[0]) }; }
  catch (e) { return { error: true, status: 502, detail: 'invalid JSON from model' }; }
}

function stripNutrition(ing) {
  return {
    nameHe: String(ing.nameHe || ing.name || '').slice(0, 80),
    nameEn: String(ing.nameEn || '').slice(0, 80),
    grams: Number(ing.grams),
    count: ing.count == null ? null : Number(ing.count),
    unit: ing.unit ? String(ing.unit).slice(0, 20) : null,
    cookingMethod: ing.cookingMethod ? String(ing.cookingMethod).slice(0, 20) : null,
    confidence: ing.confidence == null ? null : Number(ing.confidence)
  };
}

// Minimal GovIL search using the bundled pack POSTed by the client, or a cached copy
// loaded like loadTz. In production, load assets/data/govil-*.json from Pages
// (same pattern as TZAMERET_URL) so the worker does not need a new secret.
async function loadGovil(env) {
  if (loadGovil._pack && Date.now() - loadGovil._at < 24 * 60 * 60 * 1000) return loadGovil._pack;
  const base = (env && env.GOVIL_BASE) || 'https://shaydadon.github.io/Excerly/assets/data';
  const [foods, portions, map] = await Promise.all([
    fetch(base + '/govil-foods.json', { cf: { cacheTtl: 86400, cacheEverything: true } }).then(r => r.json()),
    fetch(base + '/govil-portions.json', { cf: { cacheTtl: 86400, cacheEverything: true } }).then(r => r.json()),
    fetch(base + '/govil-map.json', { cf: { cacheTtl: 86400, cacheEverything: true } }).then(r => r.json())
  ]);
  loadGovil._pack = { foods, portions, map };
  loadGovil._at = Date.now();
  return loadGovil._pack;
}

const PREFERRED = [
  ['לחמניה מלחם לבן', 10124], ['לחמניה לבנה', 10124], ['טחינה', 1898], ['עמבה', 3267],
  ['פילה עוף', 805], ['חזה עוף', 805], ['רוטב סויה', 1706], ['חרדל', 4273],
  ['שמן זית', 4443], ['סטייק אנטריקוט', 610], ['מיונז', 4466], ['חסה', 3588]
];

function preferredCode(name) {
  const n = String(name || '');
  let best = null, len = 0;
  for (const [key, code] of PREFERRED) {
    if (n.includes(key) && key.length > len) { best = code; len = key.length; }
  }
  return best;
}

function normName(s) {
  return String(s || '').replace(/[.,;:()\-/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function candidatesFor(pack, nameHe, nameEn) {
  const q = normName(nameHe || nameEn);
  if (!q || !pack) return [];
  const ranked = [];
  for (const f of pack.byCodeList) {
    const n = normName(f.n);
    const head = n.split(',')[0].trim();
    let score = 0;
    if (n === q || head === q) score = 1000;
    else if (head.startsWith(q) || n.startsWith(q)) score = 800;
    else if (q.length >= 3 && n.includes(q)) score = 500;
    if (score) ranked.push({ code: f.c, name: f.n, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.name.length - b.name.length);
  return ranked.slice(0, 6);
}

function scaleFromCode(pack, food, grams) {
  const keys = pack.nutrients;
  const at = (name, digits) => {
    const i = keys.indexOf(name);
    if (i < 0 || !food.v || food.v[i] == null) return null;
    const v = food.v[i] * grams / 100;
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
  };
  const energy = at('energy', 1);
  return {
    kcal: energy == null ? null : Math.round(energy),
    protein: at('protein', 1),
    carbs: at('carbs', 1),
    fat: at('fat', 1),
    sodium: at('sodium', 1)
  };
}

function applyOfficial(ingredients, pack, note) {
  const items = (ingredients || []).map((ing) => {
    const grams = Number(ing.grams);
    const cands = candidatesFor(pack, ing.nameHe, ing.nameEn);
    let code = preferredCode(ing.nameHe);
    let via = code ? 'preferred-map' : null;
    if (!code && ing.govilCode && cands.some(c => Number(c.code) === Number(ing.govilCode))) {
      code = Number(ing.govilCode);
      via = 'llm-pick-from-candidates';
    }
    if (!code && cands[0] && cands[0].score >= 800) {
      code = cands[0].code;
      via = 'top-candidate';
    }
    const food = code != null ? pack.byCode[code] : null;
    const item = {
      nameHe: ing.nameHe, nameEn: ing.nameEn || '',
      grams: isFinite(grams) ? grams : null,
      count: ing.count, unit: ing.unit, cookingMethod: ing.cookingMethod,
      confidence: ing.confidence,
      candidates: cands.map(c => ({ code: c.code, name: c.name })),
      govilCode: food ? food.c : null,
      description: food ? food.n : null,
      matchVia: via,
      source: food && isFinite(grams) && grams > 0 ? 'govil' : null,
      kcal: null, protein: null, carbs: null, fat: null, sodium: null
    };
    if (food && isFinite(grams) && grams > 0) Object.assign(item, scaleFromCode(pack, food, grams));
    return item;
  });
  const confirmed = items.filter(it => it.source === 'govil' && it.kcal != null);
  const sum = (k, d) => confirmed.length
    ? Math.round(confirmed.reduce((s, it) => s + (Number(it[k]) || 0), 0) * Math.pow(10, d)) / Math.pow(10, d)
    : null;
  const all = items.length > 0 && confirmed.length === items.length;
  return {
    source: 'govil',
    status: !items.length ? 'pending' : all ? 'confirmed' : (confirmed.length ? 'partial' : 'pending'),
    kcal: sum('kcal', 0), protein: sum('protein', 1), carbs: sum('carbs', 1), fat: sum('fat', 1), sodium: sum('sodium', 1),
    items, note: note || '', dishEn: ''
  };
}

export const IMAGE_CACHE_VERSION = 'v2';
const IMAGE_STEPS = 6;

export function latinOnly(s) {
  return String(s || '')
    .replace(/[^\u0000-\u024F]+/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:g|gr|grams?|kg|ml|oz)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function handleParseMeal(body, env) {
  const text = String((body && body.text) || '').slice(0, 2000).trim();
  if (!text) return { error: true, status: 400, detail: 'missing text' };
  if (!env || !env.ANTHROPIC_API_KEY) return { error: true, status: 500, detail: 'Server missing ANTHROPIC_API_KEY' };
  const model = (env && env.PARSE_MODEL) || PARSE_MODEL_DEFAULT;
  const parsed = await callJsonModel(env, model, PARSE_SYSTEM, 'ארוחה:\n' + text, 1024);
  if (parsed.error) return parsed;
  let pack;
  try { pack = await loadGovil(env); }
  catch (e) { return { error: true, status: 502, detail: 'govil pack unavailable' }; }
  const foods = (pack.foods && pack.foods.foods) || [];
  const byCode = {};
  for (const f of foods) byCode[f.c] = f;
  const indexed = {
    byCode, byCodeList: foods,
    nutrients: (pack.foods && pack.foods.meta && pack.foods.meta.nutrients) || []
  };
  const ingredients = (parsed.parsed.ingredients || []).map(stripNutrition).filter(i => i.nameHe && i.grams > 0);
  ingredients.forEach(ing => { ing.nameEn = latinOnly(ing.nameEn); });
  const meal = applyOfficial(ingredients, indexed, parsed.parsed.note || '');
  meal.dishEn = latinOnly(parsed.parsed.dishEn).split(/\s+/).filter(Boolean).slice(0, 25).join(' ');
  return { error: false, parsed: meal };
}

const imageHits = [];
const imageMem = new Map();

export function resetMealImageState() {
  imageHits.length = 0;
  imageMem.clear();
}

export function mealImagePrompt(body) {
  const dish = latinOnly(body && (body.dishEn || ''));
  const items = Array.isArray(body && body.items) ? body.items.slice(0, 12) : [];
  const foods = items.map(it => {
    if (it == null || typeof it === 'string') return latinOnly(typeof it === 'string' ? it : '');
    const method = latinOnly(it.cookingMethod || it.method || '');
    const name = latinOnly(it.queryEn || it.nameEn || '');
    return [method, name].filter(Boolean).join(' ');
  }).filter(w => w.length >= 3);
  const subject = (dish.split(/\s+/).filter(Boolean).length >= 2 ? dish : foods.join(', ')).slice(0, 400);
  if (!subject || !/[A-Za-z]{3}/.test(subject)) return null;
  return (
    'A realistic overhead food photograph of exactly this meal on one plain off-white plate: ' + subject + '. ' +
    'Show only those foods, cooked and plated as described. Natural window light, shallow depth of field, ' +
    'no text, no logo, no watermark, no people, no extra dishes, no garnish that was not named.'
  ).slice(0, 2048);
}

export async function mealImageKey(body) {
  const text = mealImagePrompt(body);
  if (!text) return null;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(IMAGE_CACHE_VERSION + '\n' + text));
  return IMAGE_CACHE_VERSION + '-' + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function imageLimited(ip, limit, windowMs) {
  const now = Date.now();
  const max = limit || 6;
  const win = windowMs || 10 * 60 * 1000;
  for (let i = imageHits.length - 1; i >= 0; i--) if (now - imageHits[i].t > win) imageHits.splice(i, 1);
  if (imageHits.filter(h => h.ip === ip).length >= max) return true;
  imageHits.push({ ip, t: now });
  return false;
}

function asDataUrl(image) {
  if (!image) return null;
  if (typeof image === 'string') {
    if (image.startsWith('data:image/')) return image;
    return 'data:image/jpeg;base64,' + image.replace(/\s/g, '');
  }
  return null;
}

export async function handleMealImage(body, env, ip) {
  const who = ip || 'anon';
  const limit = env && env.MEAL_IMAGE_LIMIT ? parseInt(env.MEAL_IMAGE_LIMIT, 10) : 6;
  if (!env || !env.AI || typeof env.AI.run !== 'function') {
    return { error: true, status: 501, detail: 'Workers AI binding missing' };
  }
  const prompt = mealImagePrompt(body);
  if (!prompt) return { error: true, status: 400, detail: 'no English food description' };
  const key = await mealImageKey(body);
  if (imageMem.has(key)) return { error: false, parsed: { src: imageMem.get(key), cached: true } };
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      const hit = await caches.default.match('https://excerly-meal-image.local/' + key);
      if (hit) {
        const src = await hit.text();
        imageMem.set(key, src);
        return { error: false, parsed: { src, cached: true } };
      }
    }
  } catch (e) {}
  if (imageLimited(who, limit)) return { error: true, status: 429, detail: 'rate_limited' };
  let result;
  try {
    result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, steps: IMAGE_STEPS });
  } catch (e) {
    return { error: true, status: 502, detail: 'image_failed' };
  }
  const src = asDataUrl(result && (result.image || result));
  if (!src) return { error: true, status: 502, detail: 'image_failed' };
  imageMem.set(key, src);
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      await caches.default.put('https://excerly-meal-image.local/' + key, new Response(src, {
        headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=86400' }
      }));
    }
  } catch (e) {}
  return { error: false, parsed: { src, cached: false } };
}

