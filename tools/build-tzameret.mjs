#!/usr/bin/env node
/* =============================================================
   build-tzameret.mjs — בונה תמונת-מצב רזה של מאגר התזונה הלאומי (צמרת)
   מ-data.gov.il אל assets/data/tzameret.json, לשימוש ה-Worker בחיפוש
   מצרכים והרכב תזונתי ל-100 גרם.

   הרצה:  node tools/build-tzameret.mjs
   מקור:  משרד הבריאות — מאגר התזונה הלאומי הישראלי (רישיון Other-Open)
          https://data.gov.il/dataset/nutrition-database
   ============================================================= */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESOURCE_ID = 'c3cb0630-0650-46c1-a068-82d575c094b2'; // "רשימת המצרכים ... רכיבי התזונה ל-100 גרם"
const BASE = 'https://data.gov.il/api/3/action/datastore_search';
const FIELDS = ['smlmitzrach', 'shmmitzrach', 'english_name', 'food_energy',
  'protein', 'total_fat', 'carbohydrates', 'total_sugars', 'total_dietary_fiber', 'sodium'];
const PAGE = 1000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'assets', 'data', 'tzameret.json');

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function fetchPage(offset) {
  const url = `${BASE}?resource_id=${RESOURCE_ID}&limit=${PAGE}&offset=${offset}&fields=${encodeURIComponent(FIELDS.join(','))}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} at offset ${offset}`);
  const j = await r.json();
  if (!j.success) throw new Error('CKAN error: ' + JSON.stringify(j.error).slice(0, 200));
  return j.result;
}

async function main() {
  let offset = 0, total = Infinity;
  const foods = [];
  while (offset < total) {
    const res = await fetchPage(offset);
    total = res.total;
    for (const r of res.records) {
      const code = num(r.smlmitzrach);
      const name = (r.shmmitzrach || '').trim();
      if (!code || !name) continue;
      foods.push({
        c: code,
        n: name,
        e: (r.english_name || '').trim() || null,
        kcal: num(r.food_energy),
        carb: num(r.carbohydrates),
        prot: num(r.protein),
        fat: num(r.total_fat),
        sug: num(r.total_sugars),
        fib: num(r.total_dietary_fiber),
        na: num(r.sodium)
      });
    }
    offset += res.records.length;
    if (res.records.length === 0) break;
    process.stdout.write(`\rfetched ${foods.length}/${total}`);
  }
  process.stdout.write('\n');

  const out = {
    meta: {
      source: 'משרד הבריאות — מאגר התזונה הלאומי הישראלי (Tzameret)',
      sourceUrl: 'https://data.gov.il/dataset/nutrition-database',
      license: 'Other (Open)',
      per: '100g',
      fetchedAt: new Date().toISOString(),
      count: foods.length
    },
    foods
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`wrote ${foods.length} foods -> ${OUT}`);
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
