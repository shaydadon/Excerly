/* =============================================================
   Excerly – parse_meal worker route.
   Claude returns ingredients, grams, method, and a GovIL code chosen from candidates.
   Nutrition is scaled from that code. No image generation and no new secret.
   ============================================================= */

import {
  stabilizeIngredient, describeDish, normalizeMealText, statedFatPercent,
  prepareIngredient, ensureMentioned, seasoningOf, isNonFood, stripNonFood
} from './portions.mjs';

const PARSE_MODEL_DEFAULT = 'claude-haiku-4-5'; // cheap, Hebrew is strong; override with env.PARSE_MODEL

const PARSE_SYSTEM =
  'You parse a free-text Hebrew (or mixed) meal description into ingredients. ' +
  'Return JSON only, no text before or after, in the shape ' +
  '{"dishEn":string,"ingredients":[{"nameHe":string,"nameEn":string,"grams":number,"count":number|null,"unit":string|null,"role":"food"|"marinade"|"frying_oil","cookingMethod":string|null,"confidence":number}],"note":string}. ' +
  'dishEn is under 25 English words and must describe preparation and plating, not a bare shopping list. ' +
  'Example: "pan-fried soy-marinated chicken fillet strips, not breaded, in a white roll with tahini and amba visible". ' +
  'If the text does not say breaded, schnitzel, or coated, dishEn must say the chicken is not breaded. ' +
  'nameEn is a short English food name. Both must be English, never Hebrew. ' +
  'Each ingredient has role "food", "marinade", or "frying_oil". A sauce used as מרינדה is role marinade. Oil used for מטוגנים ב is role frying_oil. ' +
  'Do not output calories, protein, carbs, fat, sodium, or vitamin values. Nutrition is computed later from a food database. ' +
  'Rules: split compound phrases — "4 חתיכות של פילה עוף מרינדת כף רוטב סויה" is chicken pieces AND 1 tbsp soy sauce. ' +
  '"מרינדה/מרינדת/במרינדה" is a method, not a food. "מטוגנים בכף שמן זית" is 1 tbsp olive oil plus a fried cookingMethod on the food. ' +
  '"חתיכה/חתיכות/נתח" of chicken, turkey or fish is a piece of about 35 g, never a whole breast (150–170 g). "פרוסה" is also ~35 g (25 g if דקה). ' +
  '"כף" is a tablespoon, "כפית" is a teaspoon — never treat כפית as כף. ' +
  'If a roll/bread/pita is already named, "כריך/סנדוויץ" is only a container, not a second bread. ' +
  'Estimate grams for household measures. A tablespoon (כף, tbsp) of olive oil is about 13.5 g, a teaspoon (כפית, tsp) about 4.5 g, and a cup (כוס) is the food\'s cup weight. ' +
  'The text may be a speech transcript. Fix obvious food misspellings into the intended food (for example "גבייה גבילה לבנה" means גבינה לבנה, and "חביתה" means omelette). Never invent a food that was not said. ' +
  'nameEn must be the English food: חביתה = omelette, ביצים = whole egg, מרק גולש = goulash soup, שמן זית = olive oil, גבינה לבנה = white cheese. ' +
  'Do not invent ingredients that are not in the text.';

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
    temperature: 0,
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
    cookingMethod: ing.cookingMethod ? String(ing.cookingMethod).slice(0, 40) : null,
    role: ing.role ? String(ing.role).slice(0, 20) : null,
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
  ['פילה עוף', 805], ['חזה עוף', 805], ['פרגיות', 8186], ['פרגית', 8186], ['ירך עוף', 8186],
  ['רוטב סויה', 1706], ['חרדל', 4273],
  ['ביצה שלמה', 1561], ['חביתה', 1573], ['אומלט', 1573], ['ביצים', 1561], ['ביצה', 1561],
  ['שמן זית', 4443], ['סטייק אנטריקוט', 610], ['מיונז', 4466], ['חסה', 3588],
  ['אורז לבן מבושל', 2721], ['אורז מבושל', 2721], ['אורז', 2721], ['rice', 2721]
];

export function preferredCode(name, cookingMethod, sourceText) {
  const n = String(name || '');
  const pct = statedFatPercent(n + ' ' + String(sourceText || '') + ' ' + String(cookingMethod || ''));
  if (/גבינה לבנה|white cheese/i.test(n)) {
    if (pct === 9) return 542;
    if (pct === 5) return 532;
    if (pct === 3) return 530;
    if (pct === 0.5) return 525;
  }
  let best = null, len = 0;
  for (const [key, code] of PREFERRED) {
    if (n.toLowerCase().includes(String(key).toLowerCase()) && key.length > len) { best = code; len = key.length; }
  }
  const raw = /raw|uncooked|dry|לא מבושל|יבש/.test(String(cookingMethod || '') + ' ' + n);
  if (best === 2721 && raw) return 2726;
  if ((best === 1561 || best === 1573) && /שמן זית|olive oil/.test(String(cookingMethod || '') + ' ' + n)) return 1570;
  return best;
}

function normName(s) {
  return String(s || '').replace(/[.,;:()\-/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function compositePenalty(name) {
  const n = normName(name);
  let pen = (String(name).match(/,/g) || []).length * 80;
  if (/סלט|מרק|חמין|עוגה|פשטיד|ממרח|איקרא/.test(n)) pen += 350;
  const words = n.split(' ').filter(Boolean).length;
  if (words > 4) pen += (words - 4) * 30;
  return pen;
}

function dairyHit(name, foodName, pct) {
  if (pct == null) return 0;
  const kind = /גבינה לבנה|white cheese/i.test(name) ? 'גבינה לבנה'
    : /יוגורט|yogurt/i.test(name) ? 'יוגורט'
    : /חלב|milk/i.test(name) ? 'חלב' : null;
  if (!kind || !String(foodName).startsWith(kind)) return 0;
  const got = statedFatPercent(foodName);
  if (got == null) return -200;
  return got === pct ? 700 : -500;
}

export function candidatesFor(pack, nameHe, nameEn, sourceText) {
  const q = normName(nameHe || nameEn);
  if (!q || !pack) return [];
  const egg = /ביצ|חבית|אומלט|omelet|egg/.test(q);
  const pct = statedFatPercent(String(nameHe || '') + ' ' + String(nameEn || '') + ' ' + String(sourceText || ''));
  const ranked = [];
  for (const f of pack.byCodeList) {
    const n = normName(f.n);
    const head = n.split(',')[0].trim();
    let score = 0;
    if (n === q || head === q) score = 1000;
    else if (head.startsWith(q) || n.startsWith(q)) score = 800;
    else if (q.length >= 3 && (n.includes(q) || (egg && /ביצ|חבית/.test(n)))) score = 500;
    if (!score) continue;
    if (egg && /^ביצה שלמה|^חביתה|^ביצה או חביתה/.test(f.n)) score += 450;
    score += dairyHit((nameHe || '') + ' ' + (nameEn || ''), f.n, pct);
    score -= compositePenalty(f.n);
    ranked.push({ code: f.c, name: f.n, score });
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

function scaleSeasoning(spice, grams) {
  const g = grams > 0 ? grams : 1;
  const per = spice.per100;
  const at = (v, d) => Math.round(v * g / 100 * Math.pow(10, d)) / Math.pow(10, d);
  return { grams: g, kcal: Math.round(per.kcal * g / 100), protein: at(per.protein, 1), carbs: at(per.carbs, 1), fat: at(per.fat, 1), sodium: 0 };
}

function applyOfficial(ingredients, pack, note, sourceText) {
  const items = (ingredients || []).map((ing) => {
    if (isNonFood(ing && ing.nameHe) || isNonFood(ing && ing.nameEn)) return null;
    const prepared = prepareIngredient(ing, sourceText);
    if (isNonFood(prepared.nameHe) || isNonFood(prepared.nameEn)) return null;
    const spice = seasoningOf((prepared.nameHe || '') + ' ' + (prepared.nameEn || ''));
    const cands = spice ? [] : candidatesFor(pack, prepared.nameHe, prepared.nameEn, sourceText);
    let code = spice ? null : preferredCode(prepared.nameHe || prepared.nameEn, prepared.cookingMethod, sourceText);
    let via = code ? 'preferred-map' : null;
    if (!code && !spice && ing.govilCode && cands.some(c => Number(c.code) === Number(ing.govilCode))) {
      code = Number(ing.govilCode);
      via = 'llm-pick-from-candidates';
    }
    if (!code && !spice && cands[0] && cands[0].score >= 650) {
      code = cands[0].code;
      via = 'top-candidate';
    }
    const coded = Object.assign({}, prepared, { govilCode: code });
    const stable = stabilizeIngredient(coded, sourceText);
    const grams = Number(stable.grams);
    const food = code != null && pack && pack.byCode ? pack.byCode[code] : null;
    const item = {
      nameHe: prepared.nameHe, nameEn: prepared.nameEn || '',
      grams: isFinite(grams) ? grams : null,
      gramsStated: stable.gramsStated,
      role: stable.role,
      count: prepared.count, unit: prepared.unit || stable.unit, cookingMethod: prepared.cookingMethod,
      confidence: prepared.confidence,
      portionAssumed: !!prepared.portionAssumed,
      candidates: cands.map(c => ({ code: c.code, name: c.name })),
      govilCode: food ? food.c : null,
      description: food ? food.n : null,
      matchVia: via,
      source: null,
      estimate: false,
      kcal: null, protein: null, carbs: null, fat: null, sodium: null
    };
    if (spice) {
      const scaled = scaleSeasoning(spice, grams);
      Object.assign(item, scaled, { role: 'seasoning', source: 'estimate', estimate: true, matchVia: 'seasoning-table' });
    } else if (food && isFinite(grams) && grams > 0) {
      item.source = 'govil';
      Object.assign(item, scaleFromCode(pack, food, grams));
    } else if (isFinite(grams) && grams > 0) {
      item.source = 'estimate';
      item.estimate = true;
      item.grams = grams;
      item.kcal = Math.max(1, Math.round(grams * 1.5));
      item.protein = Math.round(grams * 0.08 * 10) / 10;
      item.carbs = Math.round(grams * 0.1 * 10) / 10;
      item.fat = Math.round(grams * 0.07 * 10) / 10;
      item.sodium = 0;
      item.matchVia = 'estimate';
    }
    return item;
  }).filter(Boolean);
  const confirmed = items.filter(it => it.kcal != null);
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
  return { error: false, parsed: assembleMeal(parsed.parsed, indexed, text) };
}

export function assembleMeal(model, pack, text) {
  const normalized = stripNonFood(normalizeMealText(text));
  const note = (model && model.note) || '';
  let ingredients = ((model && model.ingredients) || [])
    .map(stripNutrition)
    .filter(i => i.nameHe);
  ingredients.forEach(ing => {
    ing.nameEn = latinOnly(ing.nameEn);
    ing.nameHe = normalizeMealText(ing.nameHe);
  });
  ingredients = ensureMentioned(normalized, ingredients);
  const meal = applyOfficial(ingredients, pack, note, normalized);
  const modelDish = latinOnly(model && model.dishEn).split(/\s+/).filter(Boolean).slice(0, 25).join(' ');
  meal.dishEn = describeDish(normalized, ingredients) || modelDish;
  meal.text = normalized;
  return meal;
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
    const grams = Number(it.grams);
    const amount = isFinite(grams) && grams > 0 ? Math.round(grams) + ' g' : '';
    return [amount, method, name].filter(Boolean).join(' ');
  }).filter(w => w.length >= 3);
  const base = dish.split(/\s+/).filter(Boolean).length >= 2 ? dish : foods.join(', ');
  const amounts = foods.filter(w => /\d+\s*g\b/i.test(w)).join(', ');
  const subject = (base + (amounts ? '. Amounts: ' + amounts : '')).slice(0, 400);
  if (!base || !/[A-Za-z]{3}/.test(base)) return null;
  const cues = [];
  if (/chicken/i.test(subject) && !/breaded|schnitzel|coated/i.test(subject)) {
    cues.push('The chicken is plain fillet strips, not breaded and not a schnitzel.');
  }
  if (/tahini|amba|mustard|sauce/i.test(subject)) {
    cues.push('The sauces are visible on the filling.');
  }
  const framing = /roll|sandwich|pita/i.test(subject)
    ? 'A realistic close-up food photograph of this sandwich with the filling visible, on a plain off-white surface: '
    : 'A realistic overhead food photograph of exactly this meal on one plain off-white plate: ';
  return (
    framing + subject + '. ' +
    cues.join(' ') + ' ' +
    'Show only those foods, cooked and plated as described. Natural window light, shallow depth of field, ' +
    'no text, no logo, no watermark, no people, no extra dishes, no garnish that was not named.'
  ).replace(/\s+/g, ' ').trim().slice(0, 2048);
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

export async function handleTranscribe(body, env) {
  if (!env || !env.AI || typeof env.AI.run !== 'function') {
    return { error: true, status: 501, detail: 'Workers AI binding missing' };
  }
  const audio = body && body.audio;
  if (!audio) return { error: true, status: 400, detail: 'missing audio' };
  const payload = typeof audio === 'string' ? audio.replace(/^data:.*?;base64,/, '') : audio;
  try {
    const lang = body && body.lang === 'en' ? 'en' : 'he';
    const initial_prompt = lang === 'he'
      ? 'חביתה, ביצים, ביצה, גבינה לבנה, תשע אחוז, בכף שמן זית, קוטג׳, לחם, אורז, עוף, פפריקה, טחינה, סלט, מרק'
      : 'omelette, eggs, white cheese, cottage cheese, bread, rice, chicken, olive oil';
    let result;
    try {
      result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
        audio: payload, task: 'transcribe', language: lang, initial_prompt
      });
    } catch (e) {
      result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: payload });
    }
    const text = stripNonFood(normalizeMealText(String((result && (result.text || result.transcription)) || '').trim()));
    const he = /[\u0590-\u05FF]/.test(text);
    return { error: false, parsed: { text, language: he ? 'he' : 'en' } };
  } catch (e) {
    return { error: true, status: 502, detail: 'transcribe_failed' };
  }
}

