/* =============================================================
   Excerly – מאגר התזונה הלאומי (data.gov.il / משרד הבריאות)
   טבלאות אופליין ב-assets/data/govil-*.json. USDA נשאר רק כגיבוי.
   רישיון Other (Open) — יש לציין את משרד הבריאות כמקור.
   ============================================================= */
(function (global) {
  'use strict';

  const NUTRIENTS = [
    'energy', 'protein', 'fat', 'satFat', 'carbs', 'sugar', 'fiber', 'sodium',
    'calcium', 'iron', 'magnesium', 'potassium', 'zinc',
    'vitaminA', 'vitaminE', 'vitaminD', 'vitaminC', 'thiamin', 'riboflavin',
    'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'vitaminK'
  ];
  // Same FDC ids the rest of the app already uses, so scaleCatalog stays unchanged.
  const FDC_IDS = {
    energy: 1008, protein: 1003, fat: 1004, satFat: 1258, carbs: 1005, sugar: 2000, fiber: 1079, sodium: 1093,
    calcium: 1087, iron: 1089, magnesium: 1090, potassium: 1092, zinc: 1095,
    vitaminA: 1106, vitaminE: 1109, vitaminD: 1114, vitaminC: 1162, thiamin: 1165, riboflavin: 1166,
    niacin: 1167, vitaminB6: 1175, folate: 1190, vitaminB12: 1178, vitaminK: 1185
  };
  const UNITS = {
    energy: 'kcal', protein: 'g', fat: 'g', satFat: 'g', carbs: 'g', sugar: 'g', fiber: 'g', sodium: 'mg',
    calcium: 'mg', iron: 'mg', magnesium: 'mg', potassium: 'mg', zinc: 'mg',
    vitaminA: 'µg', vitaminE: 'mg', vitaminD: 'µg', vitaminC: 'mg', thiamin: 'mg', riboflavin: 'mg',
    niacin: 'mg', vitaminB6: 'mg', folate: 'µg', vitaminB12: 'µg', vitaminK: 'µg'
  };
  const DATASET = 'משרד הבריאות — מאגר התזונה הלאומי הישראלי';
  const SOURCE_URL = 'https://data.gov.il/dataset/nutrition-database';

  const STOP = { עם: 1, של: 1, או: 1, וה: 1, בלי: 1, ללא: 1, כולל: 1 };

  let pack = null;      // { foods, byCode, portions, map, meta, nutrients }
  let loadPromise = null;

  function normalize(s) {
    return String(s || '')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/[״""]/g, '"')
      .replace(/[׳']/g, "'")
      .replace(/[.,;:()\-/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function tokens(s) {
    return normalize(s).split(/\s+/).filter(w => w.length >= 2 && !STOP[w]);
  }
  function firstSegment(name) {
    return normalize((name || '').split(',')[0]);
  }
  function ready() { return !!(pack && pack.foods && pack.foods.length); }

  function setData(foodsDoc, portionsDoc, mapDoc) {
    const foods = (foodsDoc && foodsDoc.foods) || [];
    const byCode = Object.create(null);
    for (let i = 0; i < foods.length; i++) byCode[foods[i].c] = foods[i];
    const map = {};
    const raw = (mapDoc && mapDoc.map) || mapDoc || {};
    Object.keys(raw).forEach(k => {
      const row = raw[k];
      const code = row && typeof row === 'object' ? row.code : row;
      if (code) map[k] = Number(code);
    });
    pack = {
      foods: foods,
      byCode: byCode,
      portions: (portionsDoc && portionsDoc.portions) || {},
      map: map,
      meta: (foodsDoc && foodsDoc.meta) || {},
      nutrients: (foodsDoc && foodsDoc.meta && foodsDoc.meta.nutrients) || NUTRIENTS
    };
    if (global.ExcerlyFoodMap && global.ExcerlyFoodMap.attachGovil) {
      global.ExcerlyFoodMap.attachGovil(pack.map);
    }
    return pack;
  }

  function load(fetcher) {
    if (ready()) return Promise.resolve(pack);
    if (loadPromise) return loadPromise;
    const f = fetcher || (typeof fetch !== 'undefined'
      ? (u) => fetch(u).then(r => { if (!r.ok) throw new Error('govil ' + r.status); return r.json(); })
      : null);
    if (!f) return Promise.reject(new Error('no fetch'));
    loadPromise = Promise.all([
      f('assets/data/govil-foods.json'),
      f('assets/data/govil-portions.json'),
      f('assets/data/govil-map.json')
    ]).then(([foods, portions, map]) => setData(foods, portions, map))
      .catch(e => { loadPromise = null; throw e; });
    return loadPromise;
  }

  function food(code) {
    if (!ready() || code == null) return null;
    return pack.byCode[Number(code)] || null;
  }
  function mapCode(key) {
    if (!pack || !key) return null;
    return pack.map[key] || null;
  }
  function portion(code, unitKind) {
    if (!ready() || code == null || !unitKind) return null;
    const row = pack.portions[String(code)];
    if (!row) return null;
    const g = row[unitKind];
    return g != null && isFinite(Number(g)) && Number(g) > 0 ? Number(g) : null;
  }
  function per100(item) {
    const f = item && item.v ? item : food(item);
    if (!f) return null;
    const keys = pack && pack.nutrients ? pack.nutrients : NUTRIENTS;
    const out = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const amount = f.v[i];
      if (amount == null) continue;
      const id = FDC_IDS[key];
      if (!id) continue;
      out[String(id)] = { amount: amount, unit: UNITS[key], name: key };
    }
    return out;
  }

  // Penalize prepared dishes / wrong form unless the query asked for them.
  const PENALIZE = [
    { rx: /קלוי|קלויה|קלויים|toasted/i, unless: /קלוי|קלויה|toast/i, n: 220 },
    { rx: /צ'יפס|ציפס|chips/i, unless: /צ'יפס|ציפס|chips/i, n: 260 },
    { rx: /מסוכר|candied/i, unless: /מסוכר|סוכר|candied/i, n: 200 },
    { rx: /לא מבושל|יבש(?!.*מבושל)|uncooked|raw(?!, cooked)/i, unless: /לא מבושל|חי|טרי|raw/i, n: 160 },
    { rx: /מעושן|smoked/i, unless: /מעושן|smoked/i, n: 140 },
    { rx: /ללא גלוטן|gluten-free/i, unless: /גלוטן|gluten/i, n: 80 }
  ];

  function scoreFood(query, f) {
    const q = normalize(query);
    if (!q) return 0;
    const n = normalize(f.n);
    const head = firstSegment(f.n);
    const qTokens = tokens(query);
    let score = 0;
    if (n === q) score = 1050;
    else if (head === q) {
      // "מיונז, תלמה" — first segment is exact, but the rest is usually a brand
      score = 930 - tokens(n.slice(head.length)).length * 45;
    } else if (head.startsWith(q + ' ') || n.startsWith(q + ' ') || n.startsWith(q)) {
      score = 880;
      if (/(?:^|\s)(רגיל|טרי|חי|לבן|מבושל|קשה)$/.test(head)) score += 80;
    } else if (qTokens.length && qTokens.every(t => n.indexOf(t) !== -1)) score = 560;
    else return 0;
    const extra = tokens(f.n).filter(w => qTokens.indexOf(w) === -1).length;
    score -= extra * 35;
    score -= Math.min(n.length, 80) * 0.4;
    if (f.ffq) score -= 450;
    if (f.m === 4) score -= 90;
    if (f.m === 2 || f.m === 3) score -= 8;
    if (f.m === 1) score += 20;
    for (let i = 0; i < PENALIZE.length; i++) {
      const p = PENALIZE[i];
      if (p.rx.test(f.n) && !p.unless.test(query)) score -= p.n;
    }
    // Prefer a name that begins with the query over one that only contains it later ("עם מיונז")
    if (score > 0 && !head.startsWith(q) && n.indexOf(q) > 0) score -= 180;
    return score;
  }

  function search(query, limit) {
    if (!ready()) return [];
    const cap = limit || 8;
    const ranked = [];
    const foods = pack.foods;
    for (let i = 0; i < foods.length; i++) {
      const s = scoreFood(query, foods[i]);
      if (s > 0) ranked.push({ food: foods[i], score: s });
    }
    ranked.sort((a, b) => b.score - a.score || a.food.n.length - b.food.n.length);
    return ranked.slice(0, cap);
  }

  function decide(query, limit) {
    const ranked = search(query, limit || 8);
    if (!ranked.length) return { state: 'none', options: [], food: null };
    const top = ranked[0];
    const second = ranked[1];
    const clear = top.score >= 800 && (!second || top.score - second.score >= 80);
    const unique = ranked.length === 1 && top.score >= 600;
    if (clear || unique) return { state: 'matched', food: top.food, score: top.score, options: [] };
    if (top.score >= 500) {
      return {
        state: 'ambiguous',
        food: null,
        options: ranked.slice(0, 4).map(r => ({
          id: 'govil:' + r.food.c,
          code: r.food.c,
          sml: r.food.s,
          description: r.food.n,
          english: r.food.e || '',
          source: 'govil',
          score: Math.round(r.score)
        }))
      };
    }
    return { state: 'none', options: [], food: null };
  }

  global.ExcerlyGovil = {
    NUTRIENTS: NUTRIENTS,
    FDC_IDS: FDC_IDS,
    DATASET: DATASET,
    SOURCE_URL: SOURCE_URL,
    normalize: normalize,
    load: load,
    setData: setData,
    ready: ready,
    food: food,
    mapCode: mapCode,
    portion: portion,
    per100: per100,
    search: search,
    scoreFood: scoreFood,
    decide: decide,
    pack: () => pack
  };

  if (typeof document !== 'undefined') {
    const start = () => { load().catch(() => {}); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
