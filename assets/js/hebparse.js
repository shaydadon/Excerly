/* Excerly – try the worker parse_meal route, then fall back to the rule-based parser.
   Nutrition in the response must already be computed from GovIL; we still re-scale
   locally from govilCode + grams so a bad worker cannot inject invented macros. */
(function (global) {
  'use strict';

  async function parseViaProxy(text, url) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'parse_meal', text: text, lang: /[\u0590-\u05FF]/.test(text) ? 'he' : 'en' })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !Array.isArray(data.items || data.ingredients)) return { ok: false, error: (data && data.error) || res.status };
    return { ok: true, data: data };
  }

  function toMeal(data, Nutrients, Govil, mealId, slot, sourceText) {
    const G = Govil || global.ExcerlyGovil;
    const N = Nutrients || global.ExcerlyNutrients;
    const MC = global.ExcerlyMealCard;
    const items = (data.items || []).filter(it => !(MC && MC.isNonFood && (MC.isNonFood(it.nameHe) || MC.isNonFood(it.nameEn))));
    const components = items.map((it, i) => {
      let grams = Number(it.grams);
      const spoken = MC && MC.spokenGram ? MC.spokenGram(sourceText, (it.nameHe || '') + ' ' + (it.nameEn || '')) : null;
      if (spoken != null) grams = spoken;
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
        const plain = (it.candidates || []).slice().sort((a, b) => {
          const score = (c) => (/^ביצה שלמה|^חביתה|^ביצה או חביתה|omelet|omelette/i.test(c.name || '') ? 0 : /סלט|מרק|חמין/.test(c.name || '') ? 2 : 1);
          return score(a) - score(b) || String(a.name || '').length - String(b.name || '').length;
        });
        comp.options = plain.map(c => ({ id: 'govil:' + c.code, code: c.code, description: c.name, source: 'govil' }))
          .concat([{ id: 'estimate', description: 'none-of-these', estimate: true }]);
        const first = plain[0];
        const food = first && G && G.food ? G.food(first.code) : null;
        if (food && isFinite(grams) && grams > 0 && N) {
          const per100 = G.per100(food);
          const built = N.mealFromOfficial(per100, grams, {
            name: comp.name, source: 'govil', govilCode: food.c, sml: food.s,
            description: food.n, dataset: G.DATASET, via: 'plain-first'
          });
          comp.matchState = 'matched';
          comp.kcal = built.kcal;
          comp.protein = built.protein;
          comp.carbs = built.carbs;
          comp.fat = built.fat;
          comp.nutrients = built.provenance && built.provenance.nutrients;
          comp.per100g = per100;
          comp.candidate = { source: 'govil', govilCode: food.c, sml: food.s, description: food.n, dataset: G.DATASET };
          comp.questionKey = 'whichFood';
        } else {
          comp.matchState = 'ambiguous';
          comp.questionKey = 'whichFood';
        }
      } else {
        comp.matchState = 'none';
        comp.questionKey = 'noMatch';
      }
      return comp;
    });
    const pending = MC.createPending({ id: mealId, text: (data.note ? '' : '') || items.map(i => i.nameHe).join(' · '), slot: slot });
    pending.components = components;
    pending.text = sourceText || pending.name;
    if (sourceText && !/[\u0590-\u05FF]/.test(sourceText)) {
      pending.name = items.map(i => i.nameEn || i.nameHe).filter(Boolean).join(' · ') || pending.name;
      pending.lang = 'en';
    } else pending.lang = 'he';
    pending.dishEn = String(data.dishEn || '').replace(/[^\u0000-\u024F]+/g, ' ').replace(/\s+/g, ' ').trim();
    pending.parseSource = 'llm+govil';
    return MC.rollup(pending);
  }

  global.ExcerlyHebParse = { parseViaProxy: parseViaProxy, toMeal: toMeal };
})(typeof window !== 'undefined' ? window : globalThis);
