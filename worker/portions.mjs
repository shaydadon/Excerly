/* Fixed household weights and absorbed-fraction rules.
   Nutrition always uses the absorbed grams. The stated amount is what was written.

   Marinade retention: about 20–30% of a thin sauce remains on meat after a home
   soak or brush; the rest is discarded. Default 25%.
   Smith & Acton, "Marination, cooking, and curing of meat" in Meat Science and
   Applications (2001); Alvarado & Sams, Poultry Science 2003, tumble-marinated
   poultry typically retains well under half of the applied liquid.

   Pan-frying oil: for lean strips in a shallow pan, about 30–50% of the spooned
   oil stays with the food; the rest stays in the pan. Default 40%. This is not
   deep-frying. Bouchon, "Understanding oil absorption during deep-fat frying"
   (Advances in Food and Nutrition Research, 2009); USDA frying notes treat
   leftover pan oil as not consumed.
*/
export const ABSORB = { marinade: 0.25, frying_oil: 0.4 };

/* GovIL household weights (assets/data/govil-portions.json), except the white
   roll: code 10124 has no gram weight in GovIL. The fixed white-roll weight is 80 g
   (a typical Israeli לחמניה; the older USDA roll figure was 44 g).
   A chicken piece is the labelled 35 g slice, not the 164 g whole breast. */
export const UNIT_G = {
  10124: { unit: 80 },
  1898: { tbsp: 15, tsp: 5 },
  3267: { tbsp: 11, tsp: 11 / 3 },
  1706: { tbsp: 11, tsp: 4 },
  4273: { tbsp: 14, tsp: 5 },
  4443: { tbsp: 13.5, tsp: 4.5, cup: 216 },
  805: { piece: 35, slice: 35 }
};

export function measureKind(ing) {
  const blob = String((ing && (ing.unit || '')) + ' ' + (ing.nameHe || '') + ' ' + (ing.nameEn || ''));
  if (/כפית|כפיות|teaspoon|\btsp\b/i.test(blob) && !/כפות/.test(blob)) return 'tsp';
  if (/כף|כפות|tablespoon|\btbsp\b/i.test(blob)) return 'tbsp';
  if (/כוס|כוסות|\bcups?\b/i.test(blob)) return 'cup';
  if (/חתיכ|נתח|piece|slice/i.test(blob)) return 'piece';
  if (/לחמני|\broll\b/i.test(blob)) return 'unit';
  if (/גרם|גר׳|\bg\b/i.test(String(ing && ing.unit || ''))) return 'g';
  return null;
}

export function fixedGrams(ing) {
  const code = Number(ing && (ing.govilCode || ing.code));
  const table = UNIT_G[code];
  if (!table) return null;
  const kind = measureKind(ing);
  if (kind === 'g') return null;
  const resolved = kind || (table.unit && /לחמני|\broll\b/i.test(String(ing.nameHe || '') + String(ing.nameEn || '')) ? 'unit' : null);
  const each = resolved ? table[resolved] : null;
  if (!each) return null;
  let count = Number(ing.count);
  if (!isFinite(count) || count <= 0) {
    const m = String(ing.nameHe || '').match(/(\d+(?:[.,]\d+)?)/);
    count = m ? parseFloat(m[1].replace(',', '.')) : 1;
  }
  return Math.round(each * count * 10) / 10;
}

const HEB_NUM = {
  אחד: 1, אחת: 1, שתיים: 2, שניים: 2, שני: 2, שתי: 2,
  שלוש: 3, שלושה: 3, ארבע: 4, ארבעה: 4, חמש: 5, חמישה: 5,
  שש: 6, שישה: 6, שבע: 7, שבעה: 7, שמונה: 8, תשע: 9, תשעה: 9,
  עשר: 10, עשרה: 10
};

/* Dry seasonings, per 100 g. A pinch the speaker did not weigh is 1 g,
   never the grams of the food next to it. */
export const SEASONING = {
  'פפריקה': { en: 'paprika', per100: { kcal: 282, protein: 14.1, carbs: 54, fat: 12.9 } },
  'כמון': { en: 'cumin', per100: { kcal: 375, protein: 17.8, carbs: 44.2, fat: 22.3 } },
  'כורכום': { en: 'turmeric', per100: { kcal: 312, protein: 9.7, carbs: 67.1, fat: 3.3 } },
  'פלפל שחור': { en: 'black pepper', per100: { kcal: 251, protein: 10.4, carbs: 64, fat: 3.3 } },
  'פלפל לבן': { en: 'white pepper', per100: { kcal: 296, protein: 10.4, carbs: 68.6, fat: 2.1 } },
  'קינמון': { en: 'cinnamon', per100: { kcal: 247, protein: 4, carbs: 80.6, fat: 1.2 } },
  'אורגנו': { en: 'oregano', per100: { kcal: 265, protein: 9, carbs: 68.9, fat: 4.3 } },
  "צ'ילי": { en: 'chili powder', per100: { kcal: 282, protein: 13.5, carbs: 49.7, fat: 14.3 } },
  'מלח': { en: 'salt', per100: { kcal: 0, protein: 0, carbs: 0, fat: 0 } }
};

export function seasoningOf(name) {
  const n = String(name || '');
  const keys = Object.keys(SEASONING).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (n.includes(key) || n.toLowerCase().includes(SEASONING[key].en)) return Object.assign({ key }, SEASONING[key]);
  }
  return null;
}

export function normalizeMealText(text) {
  let s = String(text || '');
  s = s.replace(/גבייה/g, 'גבינה').replace(/גבילה/g, 'גבינה');
  s = s.replace(/(גבינה)(?:\s*,?\s*גבינה)+/g, 'גבינה');
  s = s.replace(/בצים/g, 'ביצים');
  s = s.replace(/מתוגנ/g, 'מטוגנ');
  s = s.replace(/בקו(?=\s*שמן)/g, 'בכף');
  const words = Object.keys(HEB_NUM).sort((a, b) => b.length - a.length).join('|');
  s = s.replace(new RegExp('(?:' + words + ')\\s+אחוז(?:ים)?', 'g'), (hit) => {
    const word = hit.replace(/\s+אחוז(?:ים)?$/, '');
    return HEB_NUM[word] + '%';
  });
  return s;
}

const NONFOOD = /^(?:תודה(?:\s+רבה)?(?:\s+לך)?|שלום(?:\s+לכם)?|להתראות|ביי|bye|goodbye|hello|hi|thank you|thanks(?:\s+for\s+watching)?|you)$/i;

export function normalizeNonFood(text) {
  return String(text || '')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/[.""!?…,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isNonFood(text) {
  const s = normalizeNonFood(text);
  return !!s && NONFOOD.test(s);
}

export function stripNonFood(text) {
  return String(text || '')
    .split(/\s*[,.!?]\s*|\s+(?=תודה\b|שלום\b|להתראות\b|thank you\b|thanks\b)/i)
    .map(part => part.trim())
    .filter(part => part && !isNonFood(part))
    .join(', ');
}

export function statedFatPercent(text) {
  const m = normalizeMealText(text).match(/(\d+(?:[.,]\d+)?)\s*%/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

export function eggCountIn(text, ing) {
  const blob = normalizeMealText(String(text || '') + ' ' + String(ing && ing.nameHe || '') + ' ' + String(ing && ing.nameEn || ''));
  if (!/ביצ|חבית|אומלט|omelet|\beggs?\b/i.test(blob)) return null;
  const named = /ביצ|חבית|אומלט|omelet|\beggs?\b/i.test(String(ing && ing.nameHe || '') + ' ' + String(ing && ing.nameEn || ''));
  if (!named) return null;
  const digits = blob.match(/(\d+(?:[.,]\d+)?)\s*(?:ביצ|eggs?\b)/i);
  if (digits) return parseFloat(digits[1].replace(',', '.'));
  const word = blob.match(/(שתי|שתיים|שניים|שני|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|אחת|אחד)\s+ביצ/);
  if (word) return HEB_NUM[word[1]];
  const count = Number(ing && ing.count);
  if (isFinite(count) && count > 0) return count;
  return null;
}

export function prepareIngredient(ing, sourceText) {
  const text = normalizeMealText(sourceText);
  const next = Object.assign({}, ing);
  next.nameHe = normalizeMealText(next.nameHe || '');
  const spice = seasoningOf((next.nameHe || '') + ' ' + (next.nameEn || ''));
  const explicitGrams = spokenGrams(text, next) != null;
  if (spice) {
    next.role = 'seasoning';
    if (!next.nameEn) next.nameEn = spice.en;
    const measured = explicitGrams || /כף|כפית|גרם|tsp|tbsp/.test(String(next.unit || '') + ' ' + next.nameHe);
    if (!measured) {
      next.grams = 1;
      next.unit = 'g';
      next.portionAssumed = true;
    }
  }
  const eggs = eggCountIn(text, next);
  if (eggs && !explicitGrams) {
    next.count = eggs;
    next.grams = Math.round(eggs * 55 * 10) / 10;
    next.portionAssumed = true;
  }
  const cheese = /גבינה לבנה|white cheese/i.test((next.nameHe || '') + ' ' + (next.nameEn || ''));
  if (cheese) {
    const pct = statedFatPercent(text + ' ' + next.nameHe);
    if (pct != null) {
      next.nameHe = String(next.nameHe).replace(/\d+(?:[.,]\d+)?\s*%/g, ' ').replace(/\s+/g, ' ').trim();
      next.nameHe = next.nameHe.replace(/גבינה לבנה/, 'גבינה לבנה ' + pct + '%').replace(/\s+/g, ' ').trim();
    }
    const g = Number(next.grams);
    if (!isFinite(g) || g <= 0) { next.grams = 100; next.portionAssumed = true; }
  }
  const oil = /שמן זית|olive oil/i.test((next.nameHe || '') + ' ' + (next.nameEn || ''));
  if (oil && /כף|כפות|tbsp/i.test(text) && !explicitGrams) {
    const two = /(?:2|שתי|שניים)\s+כפות/.test(text);
    next.count = two ? 2 : (Number(next.count) > 0 ? Number(next.count) : 1);
    next.unit = 'כף';
    next.grams = 13.5 * next.count;
  }
  const g = Number(next.grams);
  if (!isFinite(g) || g <= 0) {
    next.grams = spice ? 1 : 100;
    next.portionAssumed = true;
    if (!spice && !cheese && !oil && !eggs) next.estimate = true;
  }
  return next;
}

export function ensureMentioned(text, ingredients) {
  const t = normalizeMealText(text);
  const list = (ingredients || []).map(ing => Object.assign({}, ing));
  const has = (re) => list.some(i => re.test(String(i.nameHe || '') + ' ' + String(i.nameEn || '')));
  if (/גבינה לבנה/.test(t) && !has(/גבינה לבנה|white cheese/i)) {
    const pct = statedFatPercent(t);
    list.push({ nameHe: 'גבינה לבנה' + (pct != null ? ' ' + pct + '%' : ''), nameEn: 'white cheese', grams: null, role: 'food' });
  }
  if (/שמן זית/.test(t) && !has(/שמן זית|olive oil/i)) {
    list.push({ nameHe: 'שמן זית', nameEn: 'olive oil', grams: null, unit: /כף/.test(t) ? 'כף' : null, role: 'food' });
  }
  if (/ביצ|חבית|אומלט/.test(t) && !has(/ביצ|חבית|אומלט|omelet|\beggs?\b/i)) {
    list.push({ nameHe: /חבית/.test(t) ? 'חביתה' : 'ביצים', nameEn: /חבית/.test(t) ? 'omelette' : 'eggs', grams: null, role: 'food' });
  }
  Object.keys(SEASONING).sort((a, b) => b.length - a.length).forEach(key => {
    if (t.includes(key) && !list.some(i => String(i.nameHe || '').includes(key) || String(i.nameEn || '').toLowerCase().includes(SEASONING[key].en))) {
      list.push({ nameHe: key, nameEn: SEASONING[key].en, grams: null, role: 'seasoning' });
    }
  });
  return list;
}

export function roleOf(ing, sourceText) {
  const text = String(sourceText || '');
  const name = String((ing && ing.nameHe) || '') + ' ' + String((ing && ing.nameEn) || '');
  const stated = String(ing && ing.role || '');
  if (stated === 'seasoning' || seasoningOf(name)) return 'seasoning';
  const soy = /סויה|soy/i.test(name);
  const oil = /שמן|olive oil|\boil\b/i.test(name);
  if (stated === 'marinade' && (soy || /מרינד|מושרה/.test(name))) return 'marinade';
  if (stated === 'frying_oil' && oil && /מטוגנ|fried/.test(text)) return 'frying_oil';
  if (/מרינד|מושרה/.test(text) && soy) return 'marinade';
  if (/מטוגנ|fried/.test(text) && oil && !/קצת/.test(text + ' ' + name)) return 'frying_oil';
  if (/מרינד|מושרה/.test(name)) return 'marinade';
  return 'food';
}

export function applyAbsorption(stated, role) {
  const fraction = ABSORB[role] || 1;
  const gramsStated = Math.round(Number(stated) * 10) / 10;
  const grams = Math.round(gramsStated * fraction * 10) / 10;
  return { gramsStated, grams, fraction, role: role || 'food' };
}

export function spokenGrams(sourceText, ing) {
  const text = String(sourceText || '');
  const names = [ing && ing.nameHe, ing && ing.nameEn, ing && ing.queryEn].filter(Boolean).map(s => String(s).toLowerCase());
  if (!names.length) return null;
  const hits = [];
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:גרם|גר׳|גר')\s+(?:של\s+)?([^,.;]+)/g,
    /(\d+(?:[.,]\d+)?)\s*grams?\s+of\s+([^,.;]+)/gi
  ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(text))) {
      hits.push({ grams: parseFloat(m[1].replace(',', '.')), phrase: m[2].toLowerCase() });
    }
  });
  for (const hit of hits) {
    if (names.some(n => hit.phrase.indexOf(n) !== -1 || n.indexOf(hit.phrase.trim()) !== -1)) return hit.grams;
  }
  return null;
}

export function stabilizeIngredient(ing, sourceText) {
  const next = Object.assign({}, ing);
  const spoken = spokenGrams(sourceText, next);
  if (spoken != null) { next.grams = spoken; next.unit = 'g'; next.explicit = true; }
  const blob = String(sourceText || '') + ' ' + String(next.nameHe || '');
  if (/קצת/.test(blob) && /שמן/.test(blob) && !/כף|כפית|כוס|כפות|כפיות/.test(String(next.nameHe || '') + String(next.unit || ''))) {
    next.count = 1;
    next.unit = 'כפית';
  }
  const fixed = fixedGrams(next);
  if (fixed != null) next.grams = fixed;
  const role = roleOf(next, sourceText);
  const absorbed = applyAbsorption(next.grams, role);
  next.role = absorbed.role;
  next.gramsStated = absorbed.gramsStated;
  next.grams = absorbed.grams;
  next.absorbFraction = absorbed.fraction;
  return next;
}

export function stabilizeMeal(ingredients, sourceText) {
  return (ingredients || []).map(ing => stabilizeIngredient(ing, sourceText));
}

export function describeDish(text, items) {
  const blob = String(text || '') + ' ' + (items || []).map(i => (i.nameHe || '') + ' ' + (i.nameEn || '') + ' ' + (i.queryEn || '')).join(' ');
  const chicken = /עוף|chicken/i.test(blob);
  const fried = /מטוגנ|pan-fried|fried/i.test(blob);
  const soy = /סויה|soy/i.test(blob);
  const roll = /לחמני|roll/i.test(blob);
  const breaded = /פירור|שמור|breaded|schnitzel|coated/i.test(blob);
  if (!(chicken && roll)) return null;
  const chick = (fried ? 'pan-fried ' : '') + (soy ? 'soy-marinated ' : '') + 'chicken fillet strips' + (breaded ? '' : ', not breaded');
  const sauces = [/טחינה|tahini/i.test(blob) && 'tahini', /עמבה|amba/i.test(blob) && 'amba', /חרדל|mustard/i.test(blob) && 'mustard'].filter(Boolean);
  return chick + ', in a white roll' + (sauces.length ? ' with ' + sauces.join(' and ') + ' visible on the filling' : '');
}
