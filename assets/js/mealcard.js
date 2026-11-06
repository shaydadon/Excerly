/* =============================================================
   Excerly – כרטיס ארוחה: פירוק, התאמה ברקע, סכום חלקי
   ערכים רשמיים רק כשיש מקור תואם וכמות. null אינו 0.
   ============================================================= */
(function (global) {
  'use strict';

  const STOP = { and: 1, with: 1, the: 1, cooked: 1, raw: 1, whole: 1, from: 1, food: 1 };
  const HE_EN = {
    'חביתה': 'egg omelet cooked', 'אומלט': 'egg omelet cooked', 'ביצים': 'egg omelet cooked', 'ביצה': 'egg whole cooked',
    'קוטג': 'cottage cheese', 'בננה': 'banana raw', 'יוגורט': 'yogurt plain', 'תפוח': 'apple raw',
    'לחם': 'bread', 'עוף': 'chicken breast roasted', 'אורז': 'rice white cooked'
  };
  const REJECT = ['tofu', 'french fries', 'applebee', 'chips', 'snack'];

  function slotForHour(h) {
    const hour = Number(h);
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 21) return 'dinner';
    return 'snack';
  }

  function tokens(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP[w]);
  }

  function rejected(query, description) {
    const d = String(description || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    return REJECT.some(w => d.indexOf(w) !== -1 && q.indexOf(w.split(' ')[0]) === -1);
  }

  function extraCount(query, description) {
    const q = tokens(query);
    return tokens(description).filter(x => !q.some(t => x === t || x.indexOf(t) !== -1 || t.indexOf(x) !== -1)).length;
  }

  function scoreMatch(query, description) {
    if (rejected(query, description)) return 0;
    const q = tokens(query);
    const d = tokens(description);
    if (!q.length || !d.length) return 0;
    let hit = 0;
    q.forEach(t => {
      if (d.some(x => x === t || x.indexOf(t) !== -1 || t.indexOf(x) !== -1)) hit++;
    });
    return hit / q.length;
  }

  function decideMatch(query, foods) {
    const ranked = (foods || []).map(f => ({
      fdcId: f.fdcId,
      description: f.description || '',
      dataType: f.dataType || '',
      brand: f.brand || f.brandOwner || '',
      score: scoreMatch(query, f.description || ''),
      extra: extraCount(query, f.description || '')
    })).filter(f => f.fdcId && f.score === 1)
      .sort((a, b) => a.extra - b.extra);
    if (!ranked.length) return { state: 'none', options: [] };
    if (ranked.length > 1 && (ranked[1].extra === ranked[0].extra || ranked[0].extra > 0)) {
      return { state: 'ambiguous', options: [] };
    }
    return { state: 'matched', food: ranked[0], options: [] };
  }

  function portionGrams(portions, unitKind, count) {
    const n = Number(count);
    if (!isFinite(n) || n <= 0) return null;
    const rows = portions || [];
    const text = (p) => ((p.portionDescription || '') + ' ' + (p.modifier || '') + ' ' + (p.measureUnit && (p.measureUnit.name || p.measureUnit) || '')).toLowerCase();
    const wanted = unitKind === 'egg' ? ['egg', 'large', 'omelet'] : unitKind === 'slice' ? ['slice', 'piece'] : [];
    if (!wanted.length) return null;
    const hits = rows.filter(p => p.gramWeight > 0 && wanted.some(w => text(p).indexOf(w) !== -1));
    if (hits.length !== 1) return null;
    const amount = Number(hits[0].amount) || 1;
    return Math.round((hits[0].gramWeight / amount) * n);
  }

  function splitComponents(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const parts = clean.split(/\s+עם\s+|\s+ו(?=\S)|\s*,\s*|\s+\+\s+|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    return parts.map((chunk, i) => parseChunk(chunk, i));
  }

  function parseChunk(chunk, i) {
    const num = chunk.match(/(\d+(?:[.,]\d+)?)/);
    const qty = num ? parseFloat(num[1].replace(',', '.')) : null;
    const egg = /חבית|אומלט|ביצ|omelet|egg/i.test(chunk);
    const cottage = /קוטג|cottage/i.test(chunk);
    const bread = /לחם|bread|toast/i.test(chunk);
    const grams = /גרם|גר׳|גר'|גר״|(\d)\s*g\b/i.test(chunk);
    const tub = /גביע|גביעים|container|tub/i.test(chunk);
    const slice = /פרוס|slice/i.test(chunk);
    let queryEn = null;
    if (/חבית|אומלט|omelet/i.test(chunk)) queryEn = 'egg omelet cooked';
    else if (/ביצ|egg/i.test(chunk)) queryEn = 'egg whole cooked';
    if (cottage) queryEn = 'cottage cheese';
    if (bread) queryEn = /קל|light/i.test(chunk) ? 'light bread' : 'bread';
    if (!queryEn) {
      const keys = Object.keys(HE_EN).sort((a, b) => b.length - a.length);
      for (let k = 0; k < keys.length; k++) if (chunk.indexOf(keys[k]) !== -1) { queryEn = HE_EN[keys[k]]; break; }
    }
    let quantityState = 'unknown';
    let gramsValue = null;
    let count = null;
    let unitKind = null;
    if (grams && qty) { gramsValue = qty; quantityState = 'explicit'; }
    else if (egg && qty) { count = qty; unitKind = 'egg'; quantityState = 'count'; }
    else if (slice) { count = qty || 1; unitKind = 'slice'; quantityState = 'slice'; }
    else if (tub) { quantityState = 'container'; }
    return {
      id: 'c' + i,
      name: chunk,
      queryEn: queryEn,
      grams: gramsValue,
      count: count,
      unitKind: unitKind,
      quantityState: quantityState,
      matchState: 'pending',
      questionKey: null,
      options: [],
      candidate: null,
      per100g: null,
      nutrients: null,
      kcal: null,
      carbs: null,
      protein: null,
      fat: null,
      error: null
    };
  }

  function createPending(opts) {
    opts = opts || {};
    const components = splitComponents(opts.text);
    return {
      id: opts.id,
      name: String(opts.text || '').trim(),
      slot: opts.slot || 'breakfast',
      status: 'pending',
      kcal: null,
      carbs: null,
      protein: null,
      fat: null,
      kcalIncomplete: true,
      photo: opts.photo || null,
      photoKind: opts.photo ? 'user' : 'placeholder',
      components: components,
      loggedAt: opts.loggedAt || new Date().toISOString(),
      provenance: null
    };
  }

  function componentConfirmed(c) {
    return !!(c && c.matchState === 'matched' && c.grams != null && c.nutrients && c.kcal != null);
  }

  function applyOfficial(comp, per100, grams, meta, Nutrients) {
    const built = Nutrients.mealFromOfficial(per100, grams, meta || {});
    comp.grams = grams;
    comp.quantityState = comp.quantityState === 'unknown' ? 'explicit' : comp.quantityState;
    comp.matchState = 'matched';
    comp.questionKey = null;
    comp.per100g = per100;
    comp.nutrients = built.provenance.nutrients;
    comp.kcal = built.kcal;
    comp.carbs = built.carbs;
    comp.protein = built.protein;
    comp.fat = built.fat;
    comp.candidate = {
      fdcId: meta.fdcId,
      description: meta.description,
      dataType: meta.dataType || '',
      dataset: 'USDA FoodData Central'
    };
    comp.error = null;
    return comp;
  }

  function rollup(meal) {
    const comps = meal.components || [];
    const confirmed = comps.filter(componentConfirmed);
    const sum = (key) => confirmed.reduce((s, c) => s + (Number(c[key]) || 0), 0);
    meal.kcal = confirmed.length ? Math.round(sum('kcal')) : null;
    meal.carbs = confirmed.length ? Math.round(sum('carbs') * 10) / 10 : null;
    meal.protein = confirmed.length ? Math.round(sum('protein') * 10) / 10 : null;
    meal.fat = confirmed.length ? Math.round(sum('fat') * 10) / 10 : null;
    const all = comps.length > 0 && confirmed.length === comps.length;
    meal.status = !comps.length ? 'pending' : all ? 'confirmed' : (confirmed.length ? 'partial' : 'pending');
    meal.kcalIncomplete = meal.status !== 'confirmed';
    const nutrients = {};
    if (confirmed.length && confirmed[0].nutrients) {
      Object.keys(confirmed[0].nutrients).forEach(key => {
        const sample = confirmed[0].nutrients[key];
        let amount = 0;
        let missing = false;
        comps.forEach(c => {
          const n = c.nutrients && c.nutrients[key];
          if (!componentConfirmed(c) || !n || n.amount == null || n.status === 'missing') missing = true;
          else amount += Number(n.amount);
        });
        nutrients[key] = {
          id: sample.id,
          amount: missing && !confirmed.some(c => c.nutrients && c.nutrients[key] && c.nutrients[key].amount != null) ? null : amount,
          unit: sample.unit,
          status: missing ? (confirmed.some(c => c.nutrients && c.nutrients[key] && c.nutrients[key].amount != null) ? 'partial' : 'missing') : 'known',
          per100g: null
        };
        if (nutrients[key].status === 'missing') nutrients[key].amount = null;
      });
    }
    meal.provenance = confirmed.length ? {
      source: all ? 'fdc' : 'partial',
      fdcId: confirmed.length === 1 ? confirmed[0].candidate.fdcId : null,
      description: confirmed.map(c => c.candidate && c.candidate.description).filter(Boolean).join('; '),
      grams: null,
      gramsConfirmed: all,
      unit: 'g',
      per100g: all ? { mixed: true } : null,
      nutrients: nutrients,
      dataset: 'USDA FoodData Central',
      retrievedAt: new Date().toISOString()
    } : null;
    return meal;
  }

  function applyComponentGrams(meal, compId, grams, Nutrients) {
    const g = Number(grams);
    const next = Object.assign({}, meal, { components: (meal.components || []).map(c => Object.assign({}, c)) });
    const comp = next.components.find(c => c.id === compId);
    if (!comp) return { ok: false, reason: 'component', meal: meal };
    if (!isFinite(g) || g <= 0) return { ok: false, reason: 'grams', meal: meal };
    if (!comp.per100g || !Nutrients) {
      comp.grams = g;
      comp.quantityState = 'explicit';
      comp.questionKey = comp.matchState === 'matched' ? null : (comp.questionKey || 'noMatch');
      comp.kcal = null;
      comp.nutrients = null;
      return { ok: true, meal: rollup(next), nutrients: false };
    }
    applyOfficial(comp, comp.per100g, g, {
      name: comp.name,
      source: 'fdc',
      fdcId: comp.candidate && comp.candidate.fdcId,
      description: comp.candidate && comp.candidate.description,
      dataType: comp.candidate && comp.candidate.dataType
    }, Nutrients);
    return { ok: true, meal: rollup(next), nutrients: true };
  }

  function applyComponentChoice(meal, compId, fdcId) {
    const next = Object.assign({}, meal, { components: (meal.components || []).map(c => Object.assign({}, c, { options: (c.options || []).slice() })) });
    const comp = next.components.find(c => c.id === compId);
    if (!comp) return meal;
    const opt = (comp.options || []).find(o => String(o.fdcId) === String(fdcId));
    if (!opt) return meal;
    comp.candidate = { fdcId: opt.fdcId, description: opt.description, dataType: opt.dataType || '' };
    comp.matchState = 'matched';
    comp.options = [];
    comp.questionKey = comp.grams != null ? null : 'needGrams';
    comp.nutrients = null;
    comp.kcal = null;
    return next;
  }

  async function resolveMeal(meal, api, Nutrients) {
    const next = Object.assign({}, meal, { components: (meal.components || []).map(c => Object.assign({}, c)) });
    if (!api) {
      next.components.forEach(c => { c.matchState = 'unavailable'; c.questionKey = 'unavailable'; c.error = 'offline'; });
      return rollup(next);
    }
    for (let i = 0; i < next.components.length; i++) {
      const comp = next.components[i];
      let found;
      try { found = await api.search(comp.queryEn || comp.name); }
      catch (e) { found = { ok: false, error: 'offline' }; }
      if (!found || !found.ok) {
        comp.matchState = 'unavailable';
        comp.questionKey = 'unavailable';
        comp.error = (found && found.error) || 'offline';
        continue;
      }
      const decision = decideMatch(comp.queryEn || comp.name, found.foods || []);
      if (decision.state === 'none') {
        comp.matchState = 'none';
        comp.questionKey = 'noMatch';
        continue;
      }
      if (decision.state === 'ambiguous') {
        comp.matchState = 'ambiguous';
        comp.questionKey = 'noMatch';
        comp.options = [];
        continue;
      }
      comp.candidate = { fdcId: decision.food.fdcId, description: decision.food.description, dataType: decision.food.dataType || '' };
      comp.matchState = 'matched';
      let detail = null;
      try { detail = await api.detail(decision.food.fdcId); }
      catch (e) { detail = { ok: false, error: 'offline' }; }
      if (!detail || !detail.ok) {
        comp.matchState = 'unavailable';
        comp.questionKey = 'unavailable';
        comp.error = detail && detail.error;
        continue;
      }
      comp.per100g = detail.per100g;
      let grams = comp.grams;
      if (grams == null && (comp.unitKind === 'egg' || comp.unitKind === 'slice')) {
        const fromPortion = portionGrams(detail.portions, comp.unitKind, comp.count || 1);
        if (fromPortion) {
          grams = fromPortion;
          comp.quantityState = 'usda-portion';
        }
      }
      if (grams == null) {
        comp.questionKey = 'needGrams';
        comp.kcal = null;
        comp.nutrients = null;
        continue;
      }
      applyOfficial(comp, detail.per100g, grams, {
        name: comp.name,
        source: 'fdc',
        fdcId: detail.fdcId,
        description: detail.description,
        dataType: detail.dataType
      }, Nutrients);
    }
    return rollup(next);
  }

  global.ExcerlyMealCard = {
    slotForHour: slotForHour,
    scoreMatch: scoreMatch,
    decideMatch: decideMatch,
    portionGrams: portionGrams,
    splitComponents: splitComponents,
    createPending: createPending,
    componentConfirmed: componentConfirmed,
    rollup: rollup,
    applyComponentGrams: applyComponentGrams,
    applyComponentChoice: applyComponentChoice,
    resolveMeal: resolveMeal
  };
})(typeof window !== 'undefined' ? window : globalThis);
