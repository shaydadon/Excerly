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
    return { state: 'matched', food: ranked[0], options: [], autoPicked: ranked.length > 1 };
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

  // מסיר כמויות ויחידות משאילתת החיפוש ("quinoa cooked 150 g" → "quinoa cooked")
  function cleanQuery(text) {
    return String(text || '').replace(/\d+(?:[.,]\d+)?/g, ' ')
      .replace(/\b(?:g|gr|grams?|kg|ml|oz|cups?|tbsp|tsp|slices?|pieces?)\b/gi, ' ')
      .replace(/גרם|גר׳|גר'|כפות|כפיות|כף|כפית|פרוסות|פרוסה|יחידות|יחידה/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function splitComponents(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const parts = clean.split(/\s+עם\s+|\s+ו(?=\S)|\s*,\s*|\s+\+\s+|\s+and\s+|\s*מרינדת\s+|\s+במרינדה\s+|\s+מטוגנים\s+ב|\s*ב(?=כף|כפות|כפית|כפיות|כוס)/i).map(s => s.trim()).filter(Boolean);
    const FM = global.ExcerlyFoodMap;
    const BREADS = { roll: 1, whiteBread: 1, wheatBread: 1, pita: 1 };
    // "כריך" לבד הוא מכל: אם כבר יש לחם/לחמנייה בארוחה — לא סופרים אותו פעמיים
    const hasBread = FM ? parts.some(p => !FM.isContainer(p) && (FM.resolve(p).food || {}).key in BREADS) : false;
    const kept = parts.filter(p => !(FM && hasBread && FM.isContainer(p)));
    return kept.map((chunk, i) => parseChunk(chunk, i));
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
    let coreKey = null;
    let portionAssumed = false;
    const FM = global.ExcerlyFoodMap;
    const hit = FM ? FM.resolve(chunk) : null;
    if (hit && hit.food) {
      coreKey = hit.food.key;
      queryEn = hit.food.en;
      gramsValue = hit.grams;
      count = hit.count;
      unitKind = hit.unit;
      quantityState = hit.portionSrc === 'explicit' ? 'explicit'
        : (hit.portionSrc === 'usda' || hit.portionSrc === 'govil') && !hit.countAssumed ? hit.portionSrc + '-portion'
        : 'default-portion';
      portionAssumed = quantityState === 'default-portion';
    }
    if (coreKey) { /* כבר טופל דרך מילון המזון */ }
    else if (grams && qty) { gramsValue = qty; quantityState = 'explicit'; }
    else if (egg && qty) { count = qty; unitKind = 'egg'; quantityState = 'count'; }
    else if (slice) { count = qty || 1; unitKind = 'slice'; quantityState = 'slice'; }
    else if (tub) { quantityState = 'container'; }
    return {
      id: 'c' + i,
      name: chunk,
      queryEn: queryEn,
      coreKey: coreKey,
      portionAssumed: portionAssumed,
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
      fdcId: meta.fdcId || null,
      govilCode: meta.govilCode || null,
      sml: meta.sml || null,
      description: meta.description,
      dataType: meta.dataType || '',
      dataset: meta.dataset || (meta.source === 'govil' ? 'משרד הבריאות — מאגר התזונה הלאומי הישראלי' : 'USDA FoodData Central'),
      source: meta.source || (meta.govilCode ? 'govil' : 'fdc'),
      via: meta.via || 'search'
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
    // ערכים חושבו, אבל חלק מהמנות הן הנחת ברירת מחדל — מסומן "לאישור" עד שהמשתמש מאשר/עורך
    meal.needsReview = meal.status !== 'confirmed' || (!meal.reviewed && comps.some(c => c.portionAssumed || c.estimate));
    meal.parseVer = 1;
    const nutrients = {};
    if (confirmed.length && confirmed[0].nutrients) {
      Object.keys(confirmed[0].nutrients).forEach(key => {
        const sample = confirmed[0].nutrients[key];
        let amount = 0;
        let missing = false;
        confirmed.forEach(c => {
          const n = c.nutrients && c.nutrients[key];
          if (!n || n.amount == null || n.status === 'missing') missing = true;
          else amount += Number(n.amount);
        });
        const sources = confirmed.map(c => c.nutrients && c.nutrients[key] && c.nutrients[key].source).filter(Boolean);
        nutrients[key] = {
          id: sample.id,
          amount: missing && !confirmed.some(c => c.nutrients && c.nutrients[key] && c.nutrients[key].amount != null) ? null : amount,
          unit: sample.unit,
          status: missing ? (confirmed.some(c => c.nutrients && c.nutrients[key] && c.nutrients[key].amount != null) ? 'partial' : 'missing') : 'known',
          source: sources.length && sources.every(s => s === sources[0]) ? sources[0] : (sources.length ? 'mixed' : null),
          per100g: null
        };
        if (nutrients[key].status === 'missing') nutrients[key].amount = null;
      });
    }
    // סכום מדויק מהערכים הלא-מעוגלים, כדי שהכותרת והטבלה יציגו אותו מספר (837 ולא 838)
    const exact = (k, d) => nutrients[k] && nutrients[k].status === 'known' && nutrients[k].amount != null ? Math.round(nutrients[k].amount * d) / d : null;
    if (all) {
      if (exact('energy', 1) != null) meal.kcal = exact('energy', 1);
      if (exact('protein', 10) != null) meal.protein = exact('protein', 10);
      if (exact('carbs', 10) != null) meal.carbs = exact('carbs', 10);
      if (exact('fat', 10) != null) meal.fat = exact('fat', 10);
    }
    const sources = confirmed.map(c => c.candidate && c.candidate.source).filter(Boolean);
    const allGovil = all && sources.length && sources.every(s => s === 'govil');
    const allFdc = all && sources.length && sources.every(s => s === 'fdc');
    const mealSource = !confirmed.length ? null : allGovil ? 'govil' : allFdc ? 'fdc' : all ? 'mixed' : 'partial';
    const mealDataset = allGovil ? 'משרד הבריאות — מאגר התזונה הלאומי הישראלי'
      : allFdc ? 'USDA FoodData Central'
      : all ? 'מאגר משרד הבריאות + USDA FoodData Central' : null;
    meal.provenance = confirmed.length ? {
      source: mealSource,
      fdcId: confirmed.length === 1 ? confirmed[0].candidate.fdcId : null,
      govilCode: confirmed.length === 1 ? confirmed[0].candidate.govilCode : null,
      sml: confirmed.length === 1 ? confirmed[0].candidate.sml : null,
      description: confirmed.map(c => c.candidate && c.candidate.description).filter(Boolean).join('; '),
      grams: null,
      gramsConfirmed: all,
      unit: 'g',
      per100g: all ? { mixed: true } : null,
      nutrients: nutrients,
      dataset: mealDataset,
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
    comp.portionAssumed = false;
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
      source: (comp.candidate && comp.candidate.source) || (comp.candidate && comp.candidate.govilCode ? 'govil' : 'fdc'),
      fdcId: comp.candidate && comp.candidate.fdcId,
      govilCode: comp.candidate && comp.candidate.govilCode,
      sml: comp.candidate && comp.candidate.sml,
      description: comp.candidate && comp.candidate.description,
      dataType: comp.candidate && comp.candidate.dataType,
      dataset: comp.candidate && comp.candidate.dataset,
      via: comp.candidate && comp.candidate.via
    }, Nutrients);
    comp.quantityState = 'explicit';
    return { ok: true, meal: rollup(next), nutrients: true };
  }

  function applyComponentChoice(meal, compId, pick) {
    const next = Object.assign({}, meal, { components: (meal.components || []).map(c => Object.assign({}, c, { options: (c.options || []).slice() })) });
    const comp = next.components.find(c => c.id === compId);
    if (!comp) return meal;
    const key = String(pick);
    const opt = (comp.options || []).find(o =>
      String(o.id) === key ||
      String(o.fdcId) === key ||
      (o.code != null && ('govil:' + o.code) === key) ||
      (o.code != null && String(o.code) === key)
    );
    if (key === 'estimate') {
      comp.questionKey = null;
      comp.options = [];
      comp.estimate = true;
      comp.matchState = 'matched';
      const grams = comp.grams && comp.grams > 0 ? comp.grams : 50;
      comp.grams = grams;
      comp.kcal = Math.round(grams * 1.8);
      comp.quantityState = 'ai-estimate';
      return rollup(next);
    }
    if (!opt) return meal;
    const govil = !!(opt.code || (opt.source === 'govil') || (opt.id && String(opt.id).indexOf('govil:') === 0));
    comp.candidate = {
      fdcId: opt.fdcId || null,
      govilCode: opt.code || null,
      sml: opt.sml || null,
      description: opt.description,
      dataType: opt.dataType || '',
      source: govil ? 'govil' : 'fdc',
      dataset: govil ? 'משרד הבריאות — מאגר התזונה הלאומי הישראלי' : 'USDA FoodData Central'
    };
    comp.matchState = 'matched';
    comp.options = [];
    comp.questionKey = comp.grams != null ? null : 'needGrams';
    comp.nutrients = null;
    comp.kcal = null;
    return next;
  }

  function extraDishWords(name, food) {
    if (!food || !food.he) return false;
    let rest = ' ' + String(name || '') + ' ';
    const aliases = food.he.slice().sort((a, b) => b.length - a.length);
    let hit = false;
    for (let i = 0; i < aliases.length; i++) {
      const at = rest.indexOf(aliases[i]);
      if (at !== -1) { rest = rest.slice(0, at) + ' ' + rest.slice(at + aliases[i].length); hit = true; break; }
    }
    if (!hit) return false;
    const skip = { פרוסות: 1, פרוסה: 1, פרוס: 1, דקות: 1, דקה: 1, דק: 1, חתיכות: 1, חתיכה: 1, נתח: 1, נתחי: 1, של: 1, עם: 1, גרם: 1, כף: 1, כפות: 1, כפית: 1, כפיות: 1 };
    const words = rest.replace(/[\d.,]/g, ' ').split(/\s+/).filter(w => w && !skip[w]);
    return words.length > 0;
  }
  function applyDishEstimate(comp, Nutrients) {
    const N = global.ExcerlyNutrition;
    const grams = comp.grams && comp.grams > 0 ? Number(comp.grams) : 150;
    let kcal = null, protein = null, carbs = null, fat = null;
    if (N && N.estimateLocal) {
      const est = N.estimateLocal(grams + ' גרם ' + (comp.name || ''));
      if (est && est.total > 0) {
        kcal = est.total;
        protein = (est.items || []).reduce((s, it) => s + (Number(it.protein) || 0), 0);
        carbs = (est.items || []).reduce((s, it) => s + (Number(it.carbs) || 0), 0);
        fat = (est.items || []).reduce((s, it) => s + (Number(it.fat) || 0), 0);
      }
    }
    if (kcal == null) {
      kcal = Math.round(grams * 1.8);
      const m = N && N.macrosFor ? N.macrosFor(comp.name || '', kcal) : {};
      protein = m.protein; carbs = m.carbs; fat = m.fat;
    }
    const nut = (id, amount, unit) => ({ id: id, amount: amount == null ? null : amount, unit: unit, status: amount == null ? 'missing' : 'known', source: 'estimate' });
    comp.grams = grams;
    comp.kcal = Math.round(kcal);
    comp.protein = protein == null ? null : Math.round(protein * 10) / 10;
    comp.carbs = carbs == null ? null : Math.round(carbs * 10) / 10;
    comp.fat = fat == null ? null : Math.round(fat * 10) / 10;
    comp.matchState = 'matched';
    comp.estimate = true;
    comp.quantityState = 'ai-estimate';
    comp.portionAssumed = true;
    comp.questionKey = null;
    comp.options = [];
    comp.nutrients = {
      energy: nut(1008, comp.kcal, 'kcal'), protein: nut(1003, comp.protein, 'g'),
      carbs: nut(1005, comp.carbs, 'g'), fat: nut(1004, comp.fat, 'g'),
      sugar: nut(2000, null, 'g'), satFat: nut(1258, null, 'g'), fiber: nut(1079, null, 'g'), sodium: nut(1093, null, 'mg')
    };
    comp.candidate = { source: 'estimate', description: comp.name, dataset: 'הערכה' };
    return comp;
  }

  function offerEggChoice(comp, G) {
    const name = comp.name || '';
    if (!G || !G.search || !/ביצ|חבית|אומלט/.test(name)) return;
    const q = /חבית|אומלט/.test(name) ? (/שמן זית/.test(name) ? 'חביתה שמן זית' : 'חביתה') : 'ביצים';
    const ranked = G.search(q, 5);
    if (!ranked.length) return;
    comp.options = ranked.map(r => ({
      id: 'govil:' + r.food.c, code: r.food.c, description: r.food.n, source: 'govil'
    })).concat([{ id: 'estimate', description: 'none-of-these', estimate: true }]);
    comp.questionKey = 'whichFood';
  }

  async function resolveMeal(meal, api, Nutrients) {
    const next = Object.assign({}, meal, { components: (meal.components || []).map(c => Object.assign({}, c)) });
    if (!api) {
      next.components.forEach(c => { c.matchState = 'unavailable'; c.questionKey = 'unavailable'; c.error = 'offline'; });
      return rollup(next);
    }
    const G = (api && api.govil) || global.ExcerlyGovil;
    if (G && G.load) { try { await G.load(); } catch (e) {} }
    const FM = global.ExcerlyFoodMap;
    for (let i = 0; i < next.components.length; i++) {
      const comp = next.components[i];
      if (componentConfirmed(comp)) continue;
      // Refresh default/mapped portions once GovIL data is in memory.
      if (FM && G && G.ready && G.ready() && comp.quantityState !== 'explicit' && comp.quantityState !== 'ai-estimate') {
        const hit = FM.resolve(comp.name);
        if (hit && hit.food && hit.grams != null) {
          comp.coreKey = hit.food.key;
          comp.grams = hit.grams;
          comp.count = hit.count;
          comp.unitKind = hit.unit;
          comp.quantityState = hit.portionSrc === 'explicit' ? 'explicit'
            : (hit.portionSrc === 'usda' || hit.portionSrc === 'govil') && !hit.countAssumed ? hit.portionSrc + '-portion'
            : 'default-portion';
          comp.portionAssumed = comp.quantityState === 'default-portion';
          if (hit.food.en) comp.queryEn = hit.food.en;
        }
      }
      const named = FM && FM.findFood ? FM.findFood(comp.name) : null;
      if (named && named.key === 'chickenThigh' && extraDishWords(comp.name, named)) {
        applyDishEstimate(comp, Nutrients);
        continue;
      }
      // 1. GovIL mapped food or Hebrew search — no USDA call.
      let govilCode = (comp.coreKey && G && G.mapCode) ? G.mapCode(comp.coreKey) : (comp.candidate && comp.candidate.govilCode) || null;
      if (!govilCode && G && G.decide && /[\u0590-\u05FF]/.test(comp.name)) {
        const decision = G.decide(cleanQuery(comp.name));
        if (decision.state === 'matched' && decision.food) govilCode = decision.food.c;
        else if (decision.state === 'ambiguous' && decision.options && decision.options[0]) {
          govilCode = decision.options[0].code;
        }
      }
      if (govilCode && G && G.food) {
        const gf = G.food(govilCode);
        if (gf && gf.e && !comp.queryEn) comp.queryEn = gf.e;
        const srcText = next.text || next.name || '';
        if (gf && comp.grams != null && /מרינד|מושרה/.test(srcText) && /סויה/.test(comp.name || '')) {
          comp.gramsStated = comp.grams; comp.role = 'marinade';
          comp.grams = Math.round(comp.grams * 0.25 * 10) / 10;
        } else if (gf && comp.grams != null && /מטוגנ/.test(srcText) && /שמן/.test(comp.name || '')) {
          comp.gramsStated = comp.grams; comp.role = 'frying_oil';
          comp.grams = Math.round(comp.grams * 0.4 * 10) / 10;
        }
        if (gf && comp.grams != null) {
          applyOfficial(comp, G.per100(gf), comp.grams, {
            name: comp.name, source: 'govil', govilCode: gf.c, sml: gf.s,
            description: gf.n, dataset: G.DATASET, via: 'govil'
          }, Nutrients);
          offerEggChoice(comp, G);
          continue;
        }
        if (gf && comp.grams == null) {
          comp.candidate = { govilCode: gf.c, sml: gf.s, description: gf.n, source: 'govil', dataset: G.DATASET };
          comp.matchState = 'matched';
          comp.questionKey = 'needGrams';
          continue;
        }
      }
      // 2. USDA core fallback (English built-in foods, or GovIL miss).
      if (comp.coreKey && api.core && comp.grams != null) {
        let core = null;
        try { core = await api.core(comp.coreKey); } catch (e) { core = null; }
        if (core && core.ok) {
          applyOfficial(comp, core.per100g, comp.grams, {
            name: comp.name, source: 'fdc', fdcId: core.fdcId, description: core.description,
            dataType: core.dataType, dataset: core.dataset, via: 'core'
          }, Nutrients);
          continue;
        }
      }
      if (!comp.queryEn && /[\u0590-\u05FF]/.test(comp.name)) {
        if (G && G.ready && G.ready()) applyDishEstimate(comp, Nutrients);
        else {
          comp.matchState = 'none';
          comp.questionKey = 'noMatch';
          comp.error = 'untranslated';
        }
        continue;
      }
      const query = comp.queryEn || cleanQuery(comp.name);
      let found;
      try { found = await api.search(query); }
      catch (e) { found = { ok: false, error: 'offline' }; }
      if (!found || !found.ok) {
        const limited = found && (found.error === 'rate_limited' || found.status === 429);
        if (/[\u0590-\u05FF]/.test(comp.name || '')) {
          comp.usdaLimit = !!limited;
          applyDishEstimate(comp, Nutrients);
          if (limited) comp.error = 'rate_limited';
        } else {
          comp.matchState = 'unavailable';
          comp.questionKey = 'unavailable';
          comp.error = limited ? 'rate_limited' : ((found && found.error) || 'offline');
        }
        continue;
      }
      const decision = decideMatch(query, found.foods || []);
      if (decision.state === 'none') {
        if (/[\u0590-\u05FF]/.test(comp.name || '')) applyDishEstimate(comp, Nutrients);
        else { comp.matchState = 'none'; comp.questionKey = 'noMatch'; }
        continue;
      }
      if (decision.state === 'ambiguous' && decision.options && decision.options[0]) {
        decision.food = decision.options[0];
        decision.state = 'matched';
      }
      if (decision.state !== 'matched' || !decision.food) {
        applyDishEstimate(comp, Nutrients);
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

  function componentsFromItems(items) {
    const list = (items || []).filter(it => it && it.name);
    return list.map((it, i) => {
      const c = parseChunk(String(it.name), i);
      if (!c.coreKey && it.queryEn) c.queryEn = String(it.queryEn);
      const g = Number(it.grams);
      if (isFinite(g) && g > 0 && c.quantityState !== 'explicit') {
        c.grams = Math.round(g);
        c.quantityState = 'ai-estimate';
        c.portionAssumed = true;
      }
      return c;
    });
  }

  function spokenGram(text, name) {
    const names = String(name || '').toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    if (!names.length) return null;
    const hits = [];
    [ /(\d+(?:[.,]\d+)?)\s*(?:גרם|גר׳|גר')\s+(?:של\s+)?([^,.;]+)/g, /(\d+(?:[.,]\d+)?)\s*grams?\s+of\s+([^,.;]+)/gi ].forEach(re => {
      let m;
      const src = String(text || '');
      while ((m = re.exec(src))) hits.push({ grams: parseFloat(m[1].replace(',', '.')), phrase: m[2].toLowerCase() });
    });
    for (const hit of hits) {
      if (names.some(n => hit.phrase.indexOf(n) !== -1)) return hit.grams;
    }
    return null;
  }

  global.ExcerlyMealCard = {
    componentsFromItems: componentsFromItems,
    cleanQuery: cleanQuery,
    slotForHour: slotForHour,
    scoreMatch: scoreMatch,
    decideMatch: decideMatch,
    portionGrams: portionGrams,
    splitComponents: splitComponents,
    createPending: createPending,
    componentConfirmed: componentConfirmed,
    rollup: rollup,
    spokenGram: spokenGram,
    applyComponentGrams: applyComponentGrams,
    applyComponentChoice: applyComponentChoice,
    resolveMeal: resolveMeal
  };
})(typeof window !== 'undefined' ? window : globalThis);
