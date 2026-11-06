/* =============================================================
   Excerly – לקוח FoodData Central
   המפתח נשאר בשרת (פרוקסי מקומי או Cloudflare Worker).
   הדפדפן לא קורא ל-api.nal.usda.gov ולא מחזיק מפתח.
   ============================================================= */
(function (global) {
  'use strict';

  const N = () => global.ExcerlyNutrients;

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

  function endpoints() {
    const list = ['/api/fdc'];
    try {
      const cfg = JSON.parse(localStorage.getItem('excerly.ai') || 'null');
      if (cfg && cfg.proxyUrl) list.push(String(cfg.proxyUrl).replace(/\/$/, ''));
    } catch (e) {}
    return list;
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

  async function searchFoods(query, queryEn) {
    const q = String(queryEn || query || '').trim().slice(0, 120);
    if (!q) return { ok: false, error: 'empty', foods: [] };
    const r = await call('fdc_search', { query: q, pageSize: 6 });
    if (!r.ok) return { ok: false, error: r.error || 'http', status: r.status, foods: [] };
    return {
      ok: true,
      foods: candidatesFrom(r.data, queryEn ? '' : query),
      keyMode: r.data.keyMode || null,
      totalHits: r.data.totalHits || 0
    };
  }

  async function foodDetail(fdcId) {
    const id = parseInt(fdcId, 10);
    if (!id) return { ok: false, error: 'bad_id' };
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
      keyMode: r.data.keyMode || null,
      retrievedAt: new Date().toISOString()
    };
  }

  global.ExcerlyUsda = {
    searchFoods: searchFoods,
    foodDetail: foodDetail,
    hasHebrew: hasHebrew
  };
})(typeof window !== 'undefined' ? window : globalThis);
