/* =============================================================
   Excerly – לקוח FoodData Central
   המפתח נשאר בשרת (פרוקסי מקומי או Cloudflare Worker).
   הדפדפן לא קורא ל-api.nal.usda.gov ולא מחזיק מפתח.
   ============================================================= */
(function (global) {
  'use strict';

  const N = () => global.ExcerlyNutrients;
  const CORE_PATH = 'assets/data/usda-core.json';
  // Quantity / generic English words ignored when matching a core food by query.
  const SKIP = {
    g: 1, gram: 1, grams: 1, kg: 1, ml: 1, cup: 1, cups: 1,
    tbsp: 1, tsp: 1, slice: 1, slices: 1, cooked: 1, raw: 1, fresh: 1,
    plain: 1, regular: 1, whole: 1
  };

  function hasHebrew(s) {
    return /[\u0590-\u05FF]/.test(String(s || ''));
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data: data };
  }

  // סדר: כתובת שהמשתמש הגדיר → כתובת ה-Worker מ-config.js → ‎api/fdc‎ יחסי רק בשרת מקומי/Docker (nginx).
  // ב-GitHub Pages ‎/api/fdc‎ (וגם הנתיב היחסי תחת /Excerly/) מחזיר 405 כי האחסון סטטי.
  function endpoints() {
    const list = [];
    try {
      const cfg = JSON.parse(localStorage.getItem('excerly.ai') || 'null');
      if (cfg && cfg.proxyUrl) list.push(String(cfg.proxyUrl).replace(/\/$/, ''));
    } catch (e) {}
    const conf = global.EXCERLY_CONFIG || {};
    if (conf.fdcProxy) list.push(String(conf.fdcProxy).replace(/\/$/, ''));
    const host = (global.location && global.location.hostname) || '';
    if (!/\.github\.io$/.test(host)) list.push('api/fdc');
    return list.filter((u, i) => u && list.indexOf(u) === i);
  }

  async function call(action, payload) {
    const urls = endpoints();
    let last = { ok: false, error: 'offline', status: 0 };
    for (let i = 0; i < urls.length; i++) {
      try {
        const r = await postJSON(urls[i], Object.assign({ action: action }, payload));
        if (r.ok && r.data && !r.data.error) {
          return { ok: true, data: r.data, via: urls[i] };
        }
        const err = (r.data && r.data.error) || 'http';
        last = { ok: false, error: err, status: r.status, detail: r.data && r.data.detail };
        if (err === 'rate_limited' || r.status === 429) {
          return { ok: false, error: 'rate_limited', status: r.status };
        }
      } catch (e) {
        last = { ok: false, error: 'offline', status: 0 };
      }
    }
    return last;
  }

  function candidatesFrom(data, query) {
    const foods = (data && data.foods) || [];
    const uncertain = hasHebrew(query) && !(data && data.queryEn);
    return foods.map(f => ({
      fdcId: f.fdcId,
      description: f.description || '',
      dataType: f.dataType || '',
      brand: f.brandOwner || f.brandName || '',
      matchUncertain: !!uncertain
    })).filter(f => f.fdcId);
  }

  let corePromise = null;
  function loadCore() {
    if (corePromise) return corePromise;
    if (global.EXCERLY_USDA_CORE) {
      corePromise = Promise.resolve(global.EXCERLY_USDA_CORE);
      return corePromise;
    }
    if (typeof fetch !== 'function') {
      corePromise = Promise.resolve(null);
      return corePromise;
    }
    corePromise = fetch(CORE_PATH)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (data) { return data && data.foods ? data : null; });
    return corePromise;
  }

  function foodsOf(core) {
    if (!core || !core.foods) return [];
    return Object.keys(core.foods).map(function (key) {
      return Object.assign({ key: key }, core.foods[key]);
    });
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function keyPhrase(key) {
    return String(key || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }

  function hasWord(hay, token) {
    const words = hay.split(' ');
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w === token) return true;
      if (token.length >= 4 && w.length >= 4 && (w.indexOf(token) === 0 || token.indexOf(w) === 0)) return true;
    }
    return false;
  }

  function queryTokens(q) {
    const raw = norm(q).split(' ').filter(Boolean);
    const meaningful = raw.filter(function (t) {
      return !SKIP[t] && !/^\d+(\.\d+)?$/.test(t);
    });
    return meaningful.length ? meaningful : raw;
  }

  function matchCore(core, query) {
    if (!core || hasHebrew(query)) return [];
    const q = norm(query);
    if (!q) return [];
    const use = queryTokens(q);
    const hits = [];
    const list = foodsOf(core);
    for (let i = 0; i < list.length; i++) {
      const food = list[i];
      if (q === String(food.fdcId)) { hits.push(food); continue; }
      const phrase = keyPhrase(food.key);
      const desc = norm(food.description);
      const inKey = use.every(function (t) { return hasWord(phrase, t); });
      const inDesc = use.every(function (t) { return hasWord(desc, t); });
      const keyInQuery = phrase.split(' ').filter(Boolean).every(function (t) { return hasWord(q, t); });
      if (inKey || inDesc || keyInQuery) hits.push(food);
    }
    return hits;
  }

  function findCoreById(core, id) {
    const list = foodsOf(core);
    for (let i = 0; i < list.length; i++) {
      if (list[i].fdcId === id) return list[i];
    }
    return null;
  }

  function fromCoreSearch(hits) {
    return {
      ok: true,
      foods: hits.map(function (f) {
        return {
          fdcId: f.fdcId,
          description: f.description || '',
          dataType: f.dataType || '',
          brand: '',
          matchUncertain: false
        };
      }),
      keyMode: 'core',
      totalHits: hits.length,
      via: 'core'
    };
  }

  function fromCoreDetail(food) {
    return {
      ok: true,
      fdcId: food.fdcId,
      description: food.description || '',
      dataType: food.dataType || '',
      per100g: food.per100g,
      portions: food.portions || [],
      keyMode: 'core',
      retrievedAt: new Date().toISOString(),
      via: 'core'
    };
  }

  async function searchFoods(query, queryEn) {
    const q = String(queryEn || query || '').trim().slice(0, 120);
    if (!q) return { ok: false, error: 'empty', foods: [] };
    const core = await loadCore();
    const hits = matchCore(core, q);
    if (hits.length) return fromCoreSearch(hits);
    const r = await call('fdc_search', { query: q, pageSize: 6 });
    if (!r.ok) return { ok: false, error: r.error || 'http', status: r.status, foods: [] };
    return {
      ok: true,
      foods: candidatesFrom(r.data, queryEn ? '' : query),
      keyMode: r.data.keyMode || null,
      totalHits: r.data.totalHits || 0,
      via: r.via
    };
  }

  async function foodDetail(fdcId) {
    const id = parseInt(fdcId, 10);
    if (!id) return { ok: false, error: 'bad_id' };
    const core = await loadCore();
    const hit = findCoreById(core, id);
    if (hit) return fromCoreDetail(hit);
    const r = await call('fdc_food', { fdcId: id });
    if (!r.ok) return { ok: false, error: r.error || 'http', status: r.status };
    const food = r.data.food || r.data;
    const per100 = N().indexFoodNutrients(food);
    return {
      ok: true,
      fdcId: food.fdcId || id,
      description: food.description || '',
      dataType: food.dataType || '',
      per100g: per100,
      portions: food.foodPortions || [],
      keyMode: r.data.keyMode || null,
      retrievedAt: new Date().toISOString(),
      via: r.via
    };
  }

  global.ExcerlyUsda = {
    searchFoods: searchFoods,
    foodDetail: foodDetail,
    hasHebrew: hasHebrew
  };
})(typeof window !== 'undefined' ? window : globalThis);
