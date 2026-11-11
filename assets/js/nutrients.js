/* =============================================================
   Excerly – חישוב מיקרו/מאקרו ממקור רשמי
   כמות במנה = ערך ל-100 גרם × גרמים / 100
   null / חוסר ≠ 0. אפס שדווח במקור נשמר כאפס.
   ============================================================= */
(function (global) {
  'use strict';

  // מזהי נוטריינט רשמיים של FoodData Central (nutrient.id)
  const CATALOG = [
    { key: 'energy', id: 1008, he: 'אנרגיה', en: 'Energy', fallbackUnit: 'kcal' },
    { key: 'protein', id: 1003, he: 'חלבון', en: 'Protein', fallbackUnit: 'g' },
    { key: 'carbs', id: 1005, he: 'פחמימות', en: 'Carbohydrate', fallbackUnit: 'g' },
    { key: 'sugar', id: 2000, altId: 1063, he: 'סוכרים', en: 'Sugars', fallbackUnit: 'g' },
    { key: 'fat', id: 1004, he: 'שומן', en: 'Fat', fallbackUnit: 'g' },
    { key: 'satFat', id: 1258, he: 'שומן רווי', en: 'Saturated fat', fallbackUnit: 'g' },
    { key: 'fiber', id: 1079, he: 'סיבים', en: 'Fiber', fallbackUnit: 'g' },
    { key: 'calcium', id: 1087, he: 'סידן', en: 'Calcium', fallbackUnit: 'mg' },
    { key: 'iron', id: 1089, he: 'ברזל', en: 'Iron', fallbackUnit: 'mg' },
    { key: 'magnesium', id: 1090, he: 'מגנזיום', en: 'Magnesium', fallbackUnit: 'mg' },
    { key: 'potassium', id: 1092, he: 'אשלגן', en: 'Potassium', fallbackUnit: 'mg' },
    { key: 'sodium', id: 1093, he: 'נתרן', en: 'Sodium', fallbackUnit: 'mg' },
    { key: 'zinc', id: 1095, he: 'אבץ', en: 'Zinc', fallbackUnit: 'mg' },
    { key: 'vitaminA', id: 1106, he: 'ויטמין A', en: 'Vitamin A', fallbackUnit: 'µg' },
    { key: 'vitaminE', id: 1109, he: 'ויטמין E', en: 'Vitamin E', fallbackUnit: 'mg' },
    { key: 'vitaminD', id: 1114, he: 'ויטמין D', en: 'Vitamin D', fallbackUnit: 'µg' },
    { key: 'vitaminC', id: 1162, he: 'ויטמין C', en: 'Vitamin C', fallbackUnit: 'mg' },
    { key: 'thiamin', id: 1165, he: 'תיאמין (B1)', en: 'Thiamin (B1)', fallbackUnit: 'mg' },
    { key: 'riboflavin', id: 1166, he: 'ריבופלאבין (B2)', en: 'Riboflavin (B2)', fallbackUnit: 'mg' },
    { key: 'niacin', id: 1167, he: 'ניאצין (B3)', en: 'Niacin (B3)', fallbackUnit: 'mg' },
    { key: 'vitaminB6', id: 1175, he: 'ויטמין B6', en: 'Vitamin B6', fallbackUnit: 'mg' },
    { key: 'folate', id: 1190, altId: 1177, he: 'פולאט', en: 'Folate', fallbackUnit: 'µg' },
    { key: 'vitaminB12', id: 1178, he: 'ויטמין B12', en: 'Vitamin B12', fallbackUnit: 'µg' },
    { key: 'vitaminK', id: 1185, he: 'ויטמין K', en: 'Vitamin K', fallbackUnit: 'µg' }
  ];

  const MACRO_IDS = { kcal: 1008, protein: 1003, carbs: 1005, fat: 1004 };

  function isFiniteNumber(v) {
    return typeof v === 'number' && isFinite(v);
  }

  function displayUnit(unit) {
    const u = String(unit || '').trim().toLowerCase();
    if (u === 'ug' || u === 'µg' || u === 'mcg' || u === 'μg') return 'µg';
    if (u === 'mg') return 'mg';
    if (u === 'g') return 'g';
    if (u === 'kcal') return 'kcal';
    if (u === 'iu') return 'IU';
    return unit ? String(unit) : '';
  }

  // כמות במנה. null נשאר null. 0 נשאר 0.
  function scaleAmount(per100g, grams) {
    if (per100g == null) return null;
    const g = Number(grams);
    const p = Number(per100g);
    if (!isFinite(g) || g < 0 || !isFinite(p)) return null;
    return p * g / 100;
  }

  function roundKcal(amount) {
    if (amount == null || !isFinite(amount)) return null;
    return Math.round(amount);
  }
  function roundMacro(amount) {
    if (amount == null || !isFinite(amount)) return null;
    return Math.round(amount * 10) / 10;
  }
  function roundMicro(amount) {
    if (amount == null || !isFinite(amount)) return null;
    if (Math.abs(amount) >= 10) return Math.round(amount * 100) / 100;
    if (Math.abs(amount) >= 1) return Math.round(amount * 100) / 100;
    return Math.round(amount * 1000) / 1000;
  }

  function indexFoodNutrients(food) {
    const map = {};
    const list = (food && food.foodNutrients) || [];
    for (let i = 0; i < list.length; i++) {
      const n = list[i] || {};
      const nut = n.nutrient || {};
      const id = nut.id != null ? nut.id : n.nutrientId;
      if (id == null) continue;
      const key = String(id);
      const name = nut.name || n.nutrientName || '';
      const unit = nut.unitName || n.unitName || '';
      const raw = n.amount !== undefined ? n.amount : n.value;
      let amount = null;
      if (raw != null && raw !== '') {
        const num = Number(raw);
        amount = isFinite(num) ? num : null;
      }
      if (map[key] && map[key].amount != null) continue;
      map[key] = { amount: amount, unit: unit, name: name };
    }
    return map;
  }

  // GovIL: כל הרכיבים שבקטלוג, כולל ויטמינים ומינרלים. חוסר נשאר חוסר.
  function per100FromGovil(food) {
    const G = global.ExcerlyGovil;
    if (G && G.per100) return G.per100(food);
    return null;
  }

  // צמרת: רק מאקרו/נתרן/סוכר/סיבים. אין ויטמינים — לא ממלאים 0.
  function per100FromTzameret(food) {
    if (!food) return null;
    const row = (id, name, unit, val) => ({ amount: val == null || val === '' || !isFinite(Number(val)) ? null : Number(val), unit: unit, name: name });
    return {
      '1008': row(1008, 'Energy', 'kcal', food.kcal),
      '1003': row(1003, 'Protein', 'g', food.prot),
      '1005': row(1005, 'Carbohydrate', 'g', food.carb),
      '1004': row(1004, 'Fat', 'g', food.fat),
      '1079': row(1079, 'Fiber', 'g', food.fib),
      '2000': row(2000, 'Sugars', 'g', food.sug),
      '1093': row(1093, 'Sodium', 'mg', food.na)
    };
  }

  function pickEntry(per100, spec) {
    const primary = per100[String(spec.id)];
    if (primary && primary.amount != null) return { id: spec.id, entry: primary };
    if (primary && !spec.altId) return { id: spec.id, entry: primary };
    if (spec.altId) {
      const alt = per100[String(spec.altId)];
      if (primary && primary.amount != null) return { id: spec.id, entry: primary };
      if (alt) return { id: spec.altId, entry: alt };
      if (primary) return { id: spec.id, entry: primary };
    }
    return null;
  }

  function scaleCatalog(per100, grams) {
    const out = {};
    for (let i = 0; i < CATALOG.length; i++) {
      const spec = CATALOG[i];
      const picked = pickEntry(per100, spec);
      if (!picked) {
        out[spec.key] = { key: spec.key, id: spec.id, nameHe: spec.he, nameEn: spec.en, amount: null, per100g: null, unit: spec.fallbackUnit, status: 'missing' };
        continue;
      }
      const scaled = scaleAmount(picked.entry.amount, grams);
      out[spec.key] = {
        key: spec.key,
        id: picked.id,
        nameHe: spec.he,
        nameEn: spec.en,
        amount: scaled,
        per100g: picked.entry.amount,
        unit: displayUnit(picked.entry.unit || spec.fallbackUnit),
        status: scaled == null ? 'missing' : 'known'
      };
    }
    return out;
  }

  function mealFromOfficial(per100, grams, meta) {
    meta = meta || {};
    const g = Number(grams);
    const scaled = scaleCatalog(per100 || {}, g);
    const kcal = roundKcal(scaled.energy && scaled.energy.amount);
    const protein = roundMacro(scaled.protein && scaled.protein.amount);
    const carbs = roundMacro(scaled.carbs && scaled.carbs.amount);
    const fat = roundMacro(scaled.fat && scaled.fat.amount);
    const nutrients = {};
    Object.keys(scaled).forEach(k => {
      const s = scaled[k];
      nutrients[k] = { id: s.id, amount: s.amount, per100g: s.per100g, unit: s.unit, status: s.status };
    });
    return {
      name: meta.name || meta.description || '',
      kcal: kcal,
      carbs: carbs,
      protein: protein,
      fat: fat,
      grams: g,
      source: meta.source || 'fdc',
      code: meta.tzameretCode || meta.code || null,
      slot: meta.slot || null,
      provenance: {
        source: meta.source || 'fdc',
        fdcId: meta.fdcId || null,
        govilCode: meta.govilCode || null,
        sml: meta.sml || null,
        tzameretCode: meta.tzameretCode || meta.govilCode || null,
        description: meta.description || meta.name || '',
        dataType: meta.dataType || null,
        grams: g,
        gramsConfirmed: true,
        unit: 'g',
        per100g: per100,
        nutrients: nutrients,
        retrievedAt: meta.retrievedAt || new Date().toISOString(),
        dataset: meta.dataset || (meta.source === 'govil' || meta.source === 'tzameret' ? 'משרד הבריאות — מאגר התזונה הלאומי הישראלי' : 'USDA FoodData Central')
      }
    };
  }

  function applyGramEdit(meal, grams) {
    const g = Number(grams);
    if (!isFinite(g) || g <= 0) return { ok: false, reason: 'grams' };
    const p = meal && meal.provenance;
    if (!p || !p.per100g) {
      const copy = Object.assign({}, meal, { grams: g });
      copy.quantityNote = 'unscaled';
      return { ok: true, meal: copy, recomputed: false };
    }
    const next = mealFromOfficial(p.per100g, g, {
      name: meal.name,
      source: p.source,
      fdcId: p.fdcId,
      govilCode: p.govilCode,
      sml: p.sml,
      tzameretCode: p.tzameretCode,
      description: p.description,
      dataType: p.dataType,
      dataset: p.dataset,
      slot: meal.slot || null,
      retrievedAt: p.retrievedAt
    });
    next.id = meal.id;
    return { ok: true, meal: next, recomputed: true };
  }

  function knownKcal(meals) {
    let sum = 0, missing = 0;
    (meals || []).forEach(m => {
      const has = m && m.kcal != null && isFinite(Number(m.kcal));
      if (has) sum += Number(m.kcal);
      const open = m && (m.kcalIncomplete || m.status === 'pending' || m.status === 'partial');
      if (!has || open) missing++;
    });
    return { total: Math.round(sum), missing: missing, incomplete: missing > 0 };
  }

  function summarizeDay(meals) {
    const list = meals || [];
    const acc = {};
    CATALOG.forEach(spec => {
      acc[spec.key] = {
        key: spec.key, id: spec.id, nameHe: spec.he, nameEn: spec.en,
        amount: null, unit: spec.fallbackUnit, knownMeals: 0, missingMeals: 0, status: 'missing'
      };
    });
    let fdcMeals = 0;
    list.forEach(m => {
      const incompleteMeal = m && (m.status === 'pending' || m.status === 'partial' || m.kcalIncomplete);
      const official = m && m.provenance && m.provenance.per100g && (m.provenance.source === 'fdc' || m.provenance.source === 'tzameret' || m.provenance.source === 'govil' || m.provenance.source === 'mixed');
      if (m && m.provenance && (m.provenance.source === 'fdc' || m.provenance.source === 'govil') && !incompleteMeal) fdcMeals++;
      CATALOG.forEach(spec => {
        const bucket = acc[spec.key];
        const n = m && m.provenance && m.provenance.nutrients && m.provenance.nutrients[spec.key];
        if (incompleteMeal) {
          if (n && n.amount != null && n.status !== 'missing') {
            if (bucket.amount == null) bucket.amount = 0;
            bucket.amount += Number(n.amount);
            bucket.unit = n.unit || bucket.unit;
            bucket.knownMeals++;
          }
          bucket.missingMeals++;
          return;
        }
        if (!official || !n || n.status === 'missing' || n.amount == null) {
          bucket.missingMeals++;
          return;
        }
        if (bucket.amount == null) bucket.amount = 0;
        bucket.amount += Number(n.amount);
        bucket.unit = n.unit || bucket.unit;
        bucket.knownMeals++;
      });
    });
    const nutrients = CATALOG.map(spec => {
      const b = acc[spec.key];
      let status = 'missing';
      if (b.knownMeals > 0 && b.missingMeals > 0) status = 'partial';
      else if (b.knownMeals > 0 && b.missingMeals === 0) status = 'complete';
      else status = 'missing';
      const display = b.amount == null ? null : (spec.key === 'energy' ? roundKcal(b.amount) : ['protein', 'carbs', 'fat', 'fiber', 'sugar', 'satFat'].indexOf(spec.key) !== -1 ? roundMacro(b.amount) : roundMicro(b.amount));
      return {
        key: b.key, id: b.id, nameHe: b.nameHe, nameEn: b.nameEn,
        amount: b.amount == null ? null : display,
        raw: b.amount,
        unit: displayUnit(b.unit),
        knownMeals: b.knownMeals,
        missingMeals: b.missingMeals,
        status: status
      };
    });
    const kcal = knownKcal(list);
    return {
      meals: list.length,
      fdcMeals: fdcMeals,
      coverage: list.length ? fdcMeals / list.length : 0,
      incomplete: list.length === 0 ? false : fdcMeals !== list.length,
      kcal: kcal,
      nutrients: nutrients
    };
  }

  function legacyMeal(meal) {
    return !meal || !meal.provenance || !meal.provenance.per100g;
  }

  global.ExcerlyNutrients = {
    CATALOG: CATALOG,
    MACRO_IDS: MACRO_IDS,
    displayUnit: displayUnit,
    scaleAmount: scaleAmount,
    roundKcal: roundKcal,
    roundMacro: roundMacro,
    roundMicro: roundMicro,
    indexFoodNutrients: indexFoodNutrients,
    per100FromTzameret: per100FromTzameret,
    per100FromGovil: per100FromGovil,
    scaleCatalog: scaleCatalog,
    mealFromOfficial: mealFromOfficial,
    applyGramEdit: applyGramEdit,
    knownKcal: knownKcal,
    summarizeDay: summarizeDay,
    legacyMeal: legacyMeal
  };
})(typeof window !== 'undefined' ? window : globalThis);
