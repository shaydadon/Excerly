/* Excerly – try the worker parse_meal route, then fall back to the rule-based parser.
   Nutrition in the response must already be computed from GovIL; we still re-scale
   locally from govilCode + grams so a bad worker cannot inject invented macros. */
(function (global) {
  'use strict';

  async function parseViaProxy(text, url) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'parse_meal', text: text, lang: (global.ExcerlyI18n && ExcerlyI18n.lang) || 'he' })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !Array.isArray(data.items || data.ingredients)) return { ok: false, error: (data && data.error) || res.status };
    return { ok: true, data: data };
  }

  function toMeal(data, Nutrients, Govil, mealId, slot) {
    const G = Govil || global.ExcerlyGovil;
    const N = Nutrients || global.ExcerlyNutrients;
    const MC = global.ExcerlyMealCard;
    const items = data.items || [];
    const components = items.map((it, i) => {
      const grams = Number(it.grams);
      const comp = {
        id: 'c' + i,
        name: it.nameHe || it.name || '',
        queryEn: it.nameEn || '',
        grams: isFinite(grams) ? grams : null,
        count: it.count,
        unitKind: it.unit,
        matchState: 'pending',
        candidate: null,
        kcal: null, protein: null, carbs: null, fat: null, nutrients: null
      };
      const code = it.govilCode;
      const food = G && code != null ? G.food(code) : null;
      if (food && isFinite(grams) && grams > 0 && N) {
        const per100 = G.per100(food);
        const built = N.mealFromOfficial(per100, grams, {
          name: comp.name, source: 'govil', govilCode: food.c, sml: food.s,
          description: food.n, dataset: G.DATASET, via: 'parse_meal'
        });
        comp.matchState = 'matched';
        comp.per100g = per100;
        comp.kcal = built.kcal;
        comp.protein = built.protein;
        comp.carbs = built.carbs;
        comp.fat = built.fat;
        comp.nutrients = built.provenance && built.provenance.nutrients;
        comp.candidate = { source: 'govil', govilCode: food.c, sml: food.s, description: food.n, dataset: G.DATASET };
        if (it.gramsStated != null) comp.gramsStated = it.gramsStated;
        if (it.role) comp.role = it.role;
        if (!comp.queryEn && food.e) comp.queryEn = food.e;
      } else if (it.candidates && it.candidates.length) {
        comp.matchState = 'ambiguous';
        comp.questionKey = 'whichFood';
        comp.options = it.candidates.map(c => ({ id: 'govil:' + c.code, code: c.code, description: c.name, source: 'govil' }));
      } else {
        comp.matchState = 'none';
        comp.questionKey = 'noMatch';
      }
      return comp;
    });
    const pending = MC.createPending({ id: mealId, text: (data.note ? '' : '') || items.map(i => i.nameHe).join(' · '), slot: slot });
    pending.components = components;
    pending.dishEn = String(data.dishEn || '').replace(/[^\u0000-\u024F]+/g, ' ').replace(/\s+/g, ' ').trim();
    pending.parseSource = 'llm+govil';
    return MC.rollup(pending);
  }

  global.ExcerlyHebParse = { parseViaProxy: parseViaProxy, toMeal: toMeal };
})(typeof window !== 'undefined' ? window : globalThis);
