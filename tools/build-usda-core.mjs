/**
 * Excerly – בונה את assets/data/usda-core.json מתוך USDA FoodData Central.
 * ערכים ל-100 גרם ומנות סטנדרטיות, מזוהים ב-fdcId (נתונים ציבוריים, public domain).
 *   FDC_API_KEY=... node tools/build-usda-core.mjs   (ללא מפתח: DEMO_KEY המתועד)
 * המפתח נקרא מהסביבה בלבד ואינו נכתב לקובץ.
 */
import fs from 'node:fs';

const KEY = (process.env.FDC_API_KEY || '').trim() || 'DEMO_KEY';
// מזהי הנוטריינטים שהאפליקציה מציגה (תואם ExcerlyNutrients.CATALOG)
const IDS = [1008, 1003, 1005, 1004, 1258, 1079, 2000, 1063, 1093, 1087, 1089, 1090, 1092, 1095,
  1106, 1109, 1114, 1162, 1165, 1166, 1167, 1175, 1190, 1177, 1178, 1185, 1253];
export const FOODS = [
  { key: 'entrecote', fdcId: 172165 }, { key: 'roll', fdcId: 172796 }, { key: 'whiteBread', fdcId: 174924 },
  { key: 'wheatBread', fdcId: 172686 }, { key: 'pita', fdcId: 174915 }, { key: 'oliveOil', fdcId: 171413 },
  { key: 'mayo', fdcId: 171009 }, { key: 'lettuce', fdcId: 169247 }, { key: 'iceberg', fdcId: 169248 },
  { key: 'banana', fdcId: 173944 }, { key: 'apple', fdcId: 171688 }, { key: 'eggBoiled', fdcId: 173424 },
  { key: 'eggFried', fdcId: 173423 }, { key: 'omelet', fdcId: 172185 }, { key: 'eggScrambled', fdcId: 172187 },
  { key: 'chicken', fdcId: 171477 }, { key: 'rice', fdcId: 169757 }, { key: 'cottage', fdcId: 172182 },
  { key: 'tomato', fdcId: 170457 }, { key: 'cucumber', fdcId: 168409 }, { key: 'avocado', fdcId: 171705 },
  { key: 'hummus', fdcId: 174289 }, { key: 'tahini', fdcId: 170189 }, { key: 'salmon', fdcId: 175168 },
  { key: 'tuna', fdcId: 173709 }, { key: 'pasta', fdcId: 169737 }, { key: 'potato', fdcId: 170093 },
  { key: 'yogurt', fdcId: 171284 }, { key: 'feta', fdcId: 173420 }
];

async function bulk(ids) {
  const r = await fetch('https://api.nal.usda.gov/fdc/v1/foods?api_key=' + encodeURIComponent(KEY), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fdcIds: ids, format: 'full' })
  });
  if (!r.ok) throw new Error('FDC ' + r.status);
  return r.json();
}

const out = { dataset: 'USDA FoodData Central', retrievedAt: new Date().toISOString(), note: 'per100g by nutrient.id; null/absent = not reported (not zero)', foods: {} };
for (let i = 0; i < FOODS.length; i += 20) {
  const part = FOODS.slice(i, i + 20);
  const data = await bulk(part.map(f => f.fdcId));
  for (const food of data) {
    const spec = part.find(f => f.fdcId === food.fdcId);
    const per100 = {};
    for (const n of food.foodNutrients || []) {
      const nut = n.nutrient || {};
      if (!IDS.includes(nut.id) || n.amount == null) continue;
      per100[nut.id] = { amount: n.amount, unit: nut.unitName, name: nut.name };
    }
    const portions = (food.foodPortions || []).filter(p => p.gramWeight > 0).map(p => ({
      amount: p.amount || 1, modifier: p.modifier || p.portionDescription || '', gramWeight: p.gramWeight
    }));
    out.foods[spec.key] = { fdcId: food.fdcId, description: food.description, dataType: food.dataType, per100g: per100, portions };
  }
}
const missing = FOODS.filter(f => !out.foods[f.key]);
if (missing.length) throw new Error('missing ' + missing.map(f => f.key).join(','));
fs.writeFileSync(new URL('../assets/data/usda-core.json', import.meta.url), JSON.stringify(out));
console.log('wrote', Object.keys(out.foods).length, 'foods');
