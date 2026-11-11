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
   roll: code 10124 has no gram weight in GovIL, so the fixed weight stays 44 g,
   the same USDA roll already used for the 674 kcal and 549 kcal meals.
   A chicken piece is the labelled 35 g slice, not the 164 g whole breast. */
export const UNIT_G = {
  10124: { unit: 44 },
  1898: { tbsp: 15, tsp: 5 },
  3267: { tbsp: 11, tsp: 11 / 3 },
  1706: { tbsp: 11, tsp: 4 },
  4273: { tbsp: 14, tsp: 5 },
  4443: { tbsp: 10, tsp: 3 },
  805: { piece: 35, slice: 35 }
};

export function measureKind(ing) {
  const blob = String((ing && (ing.unit || '')) + ' ' + (ing.nameHe || '') + ' ' + (ing.nameEn || ''));
  if (/כפית|teaspoon|\btsp\b/i.test(blob) && !/כפות/.test(blob)) return 'tsp';
  if (/כף|כפות|tablespoon|\btbsp\b/i.test(blob)) return 'tbsp';
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

export function roleOf(ing, sourceText) {
  const text = String(sourceText || '');
  const name = String((ing && ing.nameHe) || '') + ' ' + String((ing && ing.nameEn) || '');
  const stated = String(ing && ing.role || '');
  const soy = /סויה|soy/i.test(name);
  const oil = /שמן|olive oil|\boil\b/i.test(name);
  if (stated === 'marinade' && (soy || /מרינד|מושרה/.test(name))) return 'marinade';
  if (stated === 'frying_oil' && oil) return 'frying_oil';
  if (/מרינד|מושרה/.test(text) && soy) return 'marinade';
  if (/מטוגנ/.test(text) && oil) return 'frying_oil';
  if (/מרינד|מושרה/.test(name)) return 'marinade';
  return 'food';
}

export function applyAbsorption(stated, role) {
  const fraction = ABSORB[role] || 1;
  const gramsStated = Math.round(Number(stated) * 10) / 10;
  const grams = Math.round(gramsStated * fraction * 10) / 10;
  return { gramsStated, grams, fraction, role: role || 'food' };
}

export function stabilizeIngredient(ing, sourceText) {
  const next = Object.assign({}, ing);
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
