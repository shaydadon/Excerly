#!/usr/bin/env node
/* =============================================================
   build-govil.mjs — מוריד את מאגר התזונה הלאומי (data.gov.il)
   לקבצים קומפקטיים לשימוש אופליין ב-Excerly.

   הרצה:  node tools/build-govil.mjs
   מקור:  משרד הבריאות — מאגר התזונה הלאומי הישראלי (רישיון Other-Open)
          https://data.gov.il/dataset/nutrition-database
          יש לציין את משרד הבריאות כמקור.
   ============================================================= */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOODS_ID = 'c3cb0630-0650-46c1-a068-82d575c094b2';
const WEIGHTS_ID = '755d28c0-75f7-40e1-9c8c-ecdd106f9b2d';
const UNITS_ID = '98fb46fe-e8de-4067-94d2-b0a8ea4269da';
const BASE = 'https://data.gov.il/api/3/action/datastore_search';
const PAGE = 1000;

// Catalog nutrients only (24). Units confirmed against known USDA twins
// (olive oil vit E 14.4 mg, vit K 60.2 µg; mayo vit D 0.2 µg).
const NUTRIENT_FIELDS = [
  ['energy', 'food_energy'],
  ['protein', 'protein'],
  ['fat', 'total_fat'],
  ['satFat', 'saturated_fat'],
  ['carbs', 'carbohydrates'],
  ['sugar', 'total_sugars'],
  ['fiber', 'total_dietary_fiber'],
  ['sodium', 'sodium'],
  ['calcium', 'calcium'],
  ['iron', 'iron'],
  ['magnesium', 'magnesium'],
  ['potassium', 'potassium'],
  ['zinc', 'zinc'],
  ['vitaminA', 'vitamin_a_re'], // µg RE (not IU)
  ['vitaminE', 'vitamin_e'],
  ['vitaminD', 'vitamin_d'],
  ['vitaminC', 'vitamin_c'],
  ['thiamin', 'thiamin'],
  ['riboflavin', 'riboflavin'],
  ['niacin', 'niacin'],
  ['vitaminB6', 'vitamin_b6'],
  ['folate', 'folate'],
  ['vitaminB12', 'vitamin_b12'],
  ['vitaminK', 'vitamin_k']
];

// GovIL unit codes → our unit kinds. Canonical codes preferred when several map to one kind.
const UNIT_TO_KIND = {
  100: 'unit', 102: 'unitSmall', 103: 'unit', 104: 'unitLarge', 105: 'unitLarge',
  200: 'cup', 201: 'cup',
  300: 'tbsp', 301: 'tbsp', 302: 'tbsp', 308: 'tbsp',
  400: 'tsp', 401: 'tsp', 402: 'tsp',
  500: 'slice', 501: 'thinSlice', 502: 'slice', 503: 'slice',
  1203: 'leaf',
  1224: 'unit', // לחמניה
  1226: 'unit', 1227: 'unit' // פיתה
};
const KIND_PREFERRED_UNIT = {
  unit: [103, 100, 1224, 1226, 1227, 102, 104, 105],
  unitSmall: [102],
  unitLarge: [104, 105],
  cup: [200, 201],
  tbsp: [300, 301, 308, 302],
  tsp: [400, 401, 402],
  slice: [500, 502, 503],
  thinSlice: [501],
  leaf: [1203]
};

// Hand-picked codes for foods in the owner's acceptance meal and the 29-food map.
// Auto suggestions are written to govil-map.json for review; curated wins.
const CURATED = {
  entrecote: { code: 610, why: 'grilled rib-eye / אנטריקוט צלוי — cooked, matches a lunch steak' },
  roll: { code: 10124, why: 'לחמניה לבנה (not toasted). No unit weight in GovIL; app keeps a labelled default.' },
  iceberg: { code: 3807, why: 'חסה אייסברג' },
  wheatBread: { code: 1995, why: 'לחם מחיטה מלאה, אנגל / לחם חי — common whole-wheat loaf, not toasted' },
  whiteBread: { code: 1919, why: 'לחם לבן, ברמן/אנג׳ל — not the toasted variant the auto-ranker preferred' },
  pita: { code: 1946, why: 'פיתה, אנג׳ל/עינת — standard pita 100 g, not toasted' },
  oliveOil: { code: 4443, why: 'exact name שמן זית, generic (not FFQ, not virgin-only)' },
  mayo: { code: 4466, why: 'מיונז רגיל — generic ingredient, not "egg salad with mayo"' },
  lettuce: { code: 3588, why: 'romaine / חסה ערבית, matches previous mapping' },
  potato: { code: 3453, why: 'תפוחי אדמה אפויים, קליפה לא נאכלה — baked, matches the usual logged potato' },
  banana: { code: 3225, why: 'בננה טריה בלי קליפה — not banana chips' },
  apple: { code: 3201, why: 'תפוח עץ עם קליפה ללא ליבה — raw, not candied' },
  eggFried: { code: 1572, why: 'ביצה או חביתה מטוגנת בשמן קנולה — typical fried egg; no separate "עין" row' },
  eggScrambled: { code: 9176, why: 'ביצה או חביתה עם חלב בשמן קנולה — closest to scrambled; no מקושקשת row' },
  omelet: { code: 1573, why: 'ביצה או חביתה מטוגנת ללא שמן — plain omelet' },
  eggBoiled: { code: 1564, why: 'ביצה קשה שלמה ללא קליפה' },
  chicken: { code: 805, why: 'חזה עוף צלוי, ללא עור — roasted skinless breast' },
  rice: { code: 2721, why: 'אורז לבן מבושל ללא תוספת שומן — not raw brown rice' },
  cottage: { code: 494, why: "קוטג' 5% תנובה — the common Israeli tub" },
  tomato: { code: 3663, why: 'עגבניה טריה' },
  cucumber: { code: 3793, why: 'מלפפון טרי עם קליפה' },
  avocado: { code: 3223, why: 'אבוקדו, generic edible portion' },
  hummus: { code: 1640, why: 'סלט חומוס ביתי — the spread, not dried chickpeas' },
  tahini: { code: 1898, why: 'טחינה גולמית לא מדוללת — the paste (15 g per tbsp)' },
  salmon: { code: 1308, why: 'סלמון מבושל במים או אדים — cooked, not smoked' },
  tuna: { code: 1360, why: 'טונה משומר במים' },
  pasta: { code: 8552, why: 'פסטה/אטריות חיטה מבושלות ללא שמן — not dry gluten-free corn pasta' },
  yogurt: { code: 62, why: 'יוגורט 3% תנובה, טבעי — common plain yogurt' },
  feta: { code: 436, why: 'גבינה בולגרית 16% גד — typical table cheese, not 24%' }
};

// Aliases used both to seed the map and to auto-suggest remaining keys (same list as foodmap.js).
const FOOD_ALIASES = {
  entrecote: ['סטייק אנטריקוט', 'אנטריקוט', 'אנטרקוט'],
  roll: ['לחמניה לבנה', 'לחמנייה לבנה', 'לחמניה'],
  iceberg: ['חסה אייסברג', 'אייסברג'],
  wheatBread: ['לחם מלא', 'לחם חיטה מלאה'],
  whiteBread: ['לחם לבן'],
  pita: ['פיתה'],
  oliveOil: ['שמן זית'],
  mayo: ['מיונז'],
  lettuce: ['חסה'],
  potato: ['תפוח אדמה אפוי', 'תפוח אדמה'],
  banana: ['בננה'],
  apple: ['תפוח עץ', 'תפוח'],
  eggFried: ['ביצה מטוגנת', 'ביצת עין'],
  eggScrambled: ['ביצה מקושקשת', 'ביצים מקושקשות'],
  omelet: ['חביתה'],
  eggBoiled: ['ביצה קשה'],
  chicken: ['חזה עוף צלוי', 'חזה עוף'],
  rice: ['אורז לבן מבושל', 'אורז מבושל', 'אורז'],
  cottage: ['קוטג'],
  tomato: ['עגבניה', 'עגבנייה'],
  cucumber: ['מלפפון'],
  avocado: ['אבוקדו'],
  hummus: ['חומוס'],
  tahini: ['טחינה'],
  salmon: ['סלמון צלוי', 'סלמון מבושל', 'סלמון'],
  tuna: ['טונה במים', 'טונה'],
  pasta: ['פסטה מבושלת', 'פסטה'],
  yogurt: ['יוגורט טבעי', 'יוגורט'],
  feta: ['גבינה בולגרית', 'בולגרית']
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'assets', 'data');

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

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

async function fetchPage(resourceId, offset, retries = 4) {
  const url = `${BASE}?resource_id=${resourceId}&limit=${PAGE}&offset=${offset}`;
  let last;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status} at offset ${offset}`);
      const j = await r.json();
      if (!j.success) throw new Error('CKAN error: ' + JSON.stringify(j.error).slice(0, 200));
      return j.result;
    } catch (e) {
      last = e;
      await new Promise(res => setTimeout(res, 400 * (i + 1)));
    }
  }
  throw last;
}

async function fetchAll(resourceId, label) {
  let offset = 0, total = Infinity;
  const rows = [];
  while (offset < total) {
    const res = await fetchPage(resourceId, offset);
    total = res.total;
    rows.push(...res.records);
    offset += res.records.length;
    if (res.records.length === 0) break;
    process.stdout.write(`\r${label}: ${rows.length}/${total}`);
  }
  process.stdout.write('\n');
  return rows;
}

function isFfq(rec) {
  const n = rec.shmmitzrach || rec.n || '';
  const s = num(rec.smlmitzrach != null ? rec.smlmitzrach : rec.s);
  return /^FFQ/i.test(n) || (s != null && s >= 90000000);
}

function compactFood(rec) {
  const c = num(rec.Code);
  const s = num(rec.smlmitzrach);
  const n = (rec.shmmitzrach || '').trim();
  if (!c || !n) return null;
  const v = NUTRIENT_FIELDS.map(([_, field]) => num(rec[field]));
  const row = { c, s, n, m: num(rec.makor), v };
  const en = (rec.english_name || '').trim();
  if (en) row.e = en;
  if (isFfq(rec)) row.ffq = 1;
  return row;
}

function buildPortions(weightRows) {
  // code → kind → { g, unit }
  const raw = new Map();
  for (const r of weightRows) {
    const code = num(r.mmitzrach);
    const unit = num(r.mida);
    let g = num(r.mishkal);
    if (!code || !unit || g == null || g <= 0) continue;
    g = Math.round(g * 10) / 10;
    if (unit === 700 || unit === 2000) continue; // 1 g / 1 kg
    const kind = UNIT_TO_KIND[unit];
    if (!kind) continue;
    if (!raw.has(code)) raw.set(code, []);
    raw.get(code).push({ unit, kind, g });
  }
  const portions = {};
  for (const [code, list] of raw) {
    const byKind = {};
    for (const kind of Object.keys(KIND_PREFERRED_UNIT)) {
      const preferred = KIND_PREFERRED_UNIT[kind];
      let best = null;
      for (const u of preferred) {
        const hit = list.find(x => x.unit === u && x.kind === kind);
        if (hit) { best = hit; break; }
      }
      if (!best) {
        const hit = list.find(x => x.kind === kind);
        if (hit) best = hit;
      }
      if (best) byKind[kind] = best.g;
    }
    if (!byKind.unit) {
      if (byKind.unitLarge) byKind.unit = byKind.unitLarge;
      else if (byKind.unitSmall) byKind.unit = byKind.unitSmall;
    }
    if (Object.keys(byKind).length) portions[String(code)] = byKind;
  }
  return portions;
}

function rankQuery(query, foods) {
  const q = normalize(query);
  if (!q) return [];
  const qTokens = q.split(/\s+/).filter(w => w.length >= 2);
  const out = [];
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    const n = normalize(f.n);
    if (!n) continue;
    let score = 0;
    if (n === q) score = 1000;
    else if (n.startsWith(q + ' ') || n.startsWith(q + ',') || n.startsWith(q)) score = 850;
    else if (qTokens.length && qTokens.every(t => n.includes(t))) score = 600;
    else continue;
    const extra = n.split(/\s+/).filter(w => w.length >= 2 && !qTokens.includes(w)).length;
    score -= extra * 35;
    score -= Math.min(n.length, 80) * 0.5;
    if (f.ffq) score -= 400;
    if (f.m === 4) score -= 80;       // recipes
    if (f.m === 2 || f.m === 3) score -= 10; // branded, slight
    if (f.m === 1 || f.m == null) score += 15;
    // prefer cooked when query has צלוי/מבושל/קשה/מטוגן; prefer simple otherwise
    out.push({ food: f, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

function suggestMap(foods) {
  const map = {};
  for (const [key, aliases] of Object.entries(FOOD_ALIASES)) {
    if (CURATED[key]) {
      const f = foods.find(x => x.c === CURATED[key].code);
      map[key] = {
        code: CURATED[key].code,
        via: 'curated',
        why: CURATED[key].why,
        name: f ? f.n : null,
        english: f ? f.e || null : null
      };
      continue;
    }
    let best = null;
    for (const alias of aliases) {
      const ranked = rankQuery(alias, foods);
      if (ranked.length && (!best || ranked[0].score > best.score)) {
        best = { alias, ...ranked[0], options: ranked.slice(0, 4).map(r => ({ code: r.food.c, name: r.food.n, score: Math.round(r.score) })) };
      }
    }
    if (best) {
      map[key] = {
        code: best.food.c,
        via: 'auto',
        alias: best.alias,
        name: best.food.n,
        english: best.food.e || null,
        score: Math.round(best.score),
        options: best.options
      };
    } else {
      map[key] = { code: null, via: 'missing', aliases };
    }
  }
  return map;
}

function coverage(foods) {
  const totals = { foods: foods.length, ffq: 0 };
  const missing = {};
  NUTRIENT_FIELDS.forEach(([k]) => { missing[k] = 0; });
  for (const f of foods) {
    if (f.ffq) totals.ffq++;
    NUTRIENT_FIELDS.forEach(([k], i) => { if (f.v[i] == null) missing[k]++; });
  }
  return { totals, missing };
}

async function main() {
  const [foodRows, weightRows, unitRows] = await Promise.all([
    fetchAll(FOODS_ID, 'foods'),
    fetchAll(WEIGHTS_ID, 'weights'),
    fetchAll(UNITS_ID, 'units')
  ]);

  const foods = [];
  for (const r of foodRows) {
    const f = compactFood(r);
    if (f) foods.push(f);
  }
  const portions = buildPortions(weightRows);
  const units = {};
  for (const r of unitRows) {
    const id = String(r.smlmida);
    units[id] = r.shmmida;
  }
  const map = suggestMap(foods);
  const cov = coverage(foods);
  const fetchedAt = new Date().toISOString();
  const meta = {
    source: 'משרד הבריאות — מאגר התזונה הלאומי הישראלי',
    sourceUrl: 'https://data.gov.il/dataset/nutrition-database',
    license: 'Other (Open)',
    credit: 'יש לציין את משרד הבריאות כמקור',
    package: 'nutrition-database',
    per: '100g',
    dataUpdated: '2022-10-26',
    fetchedAt,
    count: foods.length
  };

  mkdirSync(DATA, { recursive: true });
  const foodsOut = {
    meta: Object.assign({}, meta, { resource: FOODS_ID, nutrients: NUTRIENT_FIELDS.map(([k]) => k) }),
    foods
  };
  const portionsOut = {
    meta: Object.assign({}, meta, { resource: WEIGHTS_ID, count: Object.keys(portions).length }),
    units,
    portions
  };
  const mapOut = {
    meta: Object.assign({}, meta, { note: 'curated codes win over auto-rank suggestions' }),
    map
  };

  const foodsPath = join(DATA, 'govil-foods.json');
  const portionsPath = join(DATA, 'govil-portions.json');
  const mapPath = join(DATA, 'govil-map.json');
  writeFileSync(foodsPath, JSON.stringify(foodsOut));
  writeFileSync(portionsPath, JSON.stringify(portionsOut));
  writeFileSync(mapPath, JSON.stringify(mapOut, null, 2));

  const fs = await import('node:fs');
  const kb = p => Math.round(fs.statSync(p).size / 1024);
  console.log(`wrote ${foods.length} foods (${kb(foodsPath)} KB) -> ${foodsPath}`);
  console.log(`wrote ${Object.keys(portions).length} portion maps (${kb(portionsPath)} KB) -> ${portionsPath}`);
  console.log(`wrote map (${kb(mapPath)} KB) -> ${mapPath}`);
  console.log('coverage (null vitamin/mineral fields):');
  console.log(JSON.stringify(cov, null, 2));
  console.log('\nfood map:');
  for (const [k, v] of Object.entries(map)) {
    console.log(`  ${k}: ${v.code || '-'} [${v.via}] ${v.name || ''} ${v.why || v.alias || ''}`);
  }
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
