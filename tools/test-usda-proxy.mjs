/**
 * Routing and offline-core tests for the narrow USDA proxy 405 fix.
 *   node tools/test-usda-proxy.mjs
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const usdaSrc = readFileSync(new URL('../assets/js/usda.js', import.meta.url), 'utf8');
const configSrc = readFileSync(new URL('../assets/js/config.js', import.meta.url), 'utf8');
const core = JSON.parse(readFileSync(new URL('../assets/data/usda-core.json', import.meta.url), 'utf8'));

const WORKER = 'https://excerly.shaydadon.workers.dev';

function load({ hostname, proxyUrl, fdcProxy, coreData, fetchImpl, nutrients } = {}) {
  const store = {};
  if (proxyUrl) store['excerly.ai'] = JSON.stringify({ proxyUrl });
  const posts = [];
  const gets = [];
  const fetchFn = fetchImpl || (async (url, opts) => {
    const method = (opts && opts.method) || 'GET';
    if (method === 'POST') posts.push({ url: String(url), body: opts && opts.body, headers: (opts && opts.headers) || {} });
    else gets.push(String(url));
    throw new Error('network disabled in test');
  });
  const context = {
    fetch: fetchFn,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    location: { hostname: hostname || 'shaydadon.github.io' },
    console,
    Date
  };
  context.window = context;
  context.globalThis = context;
  if (fdcProxy !== undefined) context.EXCERLY_CONFIG = fdcProxy ? { fdcProxy } : {};
  if (coreData !== undefined) context.EXCERLY_USDA_CORE = coreData;
  context.ExcerlyNutrients = nutrients || {
    indexFoodNutrients: (food) => (food && food.per100g) || { '1008': { amount: 42, unit: 'kcal', name: 'Energy' } }
  };
  vm.createContext(context);
  if (fdcProxy === undefined) vm.runInContext(configSrc, context);
  vm.runInContext(usdaSrc, context);
  return { api: context.ExcerlyUsda, posts, gets, context };
}

let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log('ok  ' + name);
  } catch (e) {
    failed++;
    console.error('FAIL ' + name + '\n' + (e && e.stack || e));
  }
}

await test('config.js points at the existing Cloudflare Worker and holds no key', () => {
  const { context } = load({ coreData: core, hostname: 'example.com', fdcProxy: undefined });
  assert.equal(context.EXCERLY_CONFIG.fdcProxy, WORKER);
  const cfg = readFileSync(new URL('../assets/js/config.js', import.meta.url), 'utf8');
  const usda = readFileSync(new URL('../assets/js/usda.js', import.meta.url), 'utf8');
  // The header comment may mention api.nal.usda.gov to say the browser must not call it.
  // There must be no key material and no request to USDA from the client.
  assert.doesNotMatch(cfg, /FDC_API_KEY|DEMO_KEY|api_key\s*=/i);
  assert.doesNotMatch(usda, /FDC_API_KEY|DEMO_KEY|api_key\s*=/i);
  assert.match(usda, /לא מחזיק מפתח/);
});

await test('on github.io a non-core search posts only to the worker, never /api/fdc', async () => {
  const { api, posts, gets } = load({ hostname: 'shaydadon.github.io', coreData: core });
  const r = await api.searchFoods('quinoa cooked');
  assert.equal(r.ok, false);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, WORKER);
  assert.equal(JSON.parse(posts[0].body).action, 'fdc_search');
  assert.equal(JSON.parse(posts[0].body).query, 'quinoa cooked');
  assert.ok(!('x-api-key' in Object.fromEntries(Object.entries(posts[0].headers).map(([k, v]) => [k.toLowerCase(), v]))));
  assert.doesNotMatch(posts[0].body, /api_key|FDC_API_KEY/i);
  assert.ok(posts.every(p => !/api\/fdc/.test(p.url)));
  assert.ok(posts.every(p => !/github\.io/.test(p.url)));
  assert.equal(gets.length, 0);
});

await test('the user proxyUrl setting overrides the default worker URL', async () => {
  let seen = [];
  const fetchImpl = async (url, opts) => {
    seen.push(String(url));
    if (String(url) === 'https://example.test/proxy') {
      return {
        ok: true, status: 200,
        json: async () => ({ foods: [{ fdcId: 999, description: 'Quinoa, cooked' }], totalHits: 1 })
      };
    }
    throw new Error('should not fall through to ' + url);
  };
  const { api } = load({
    hostname: 'shaydadon.github.io',
    proxyUrl: 'https://example.test/proxy/',
    coreData: core,
    fetchImpl
  });
  const r = await api.searchFoods('quinoa cooked');
  assert.equal(r.ok, true);
  assert.equal(r.via, 'https://example.test/proxy');
  assert.equal(r.foods[0].fdcId, 999);
  assert.deepEqual(seen, ['https://example.test/proxy']);
  assert.ok(seen.every(u => !/api\/fdc/.test(u)));
});

await test('off github.io, api/fdc is only a last-resort local endpoint after the worker', async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(String(url));
    return { ok: false, status: 405, json: async () => ({ error: 'Method not allowed' }) };
  };
  const { api } = load({ hostname: 'localhost', coreData: core, fetchImpl });
  await api.searchFoods('quinoa cooked');
  assert.deepEqual(seen, [WORKER, 'api/fdc']);
  assert.ok(seen.every(u => u !== '/api/fdc'));
});

await test('core fallback returns banana values offline, with no network', async () => {
  const { api, posts, gets } = load({ hostname: 'shaydadon.github.io', coreData: core });
  const search = await api.searchFoods('banana');
  assert.equal(search.ok, true);
  assert.equal(search.via, 'core');
  assert.equal(search.keyMode, 'core');
  assert.ok(search.foods.some(f => f.fdcId === 173944));
  const detail = await api.foodDetail(173944);
  assert.equal(detail.ok, true);
  assert.equal(detail.via, 'core');
  assert.equal(detail.description, 'Bananas, raw');
  assert.equal(detail.per100g['1008'].amount, 89);
  assert.equal(detail.per100g['1162'].amount, 8.7);
  assert.equal(posts.length, 0);
  assert.equal(gets.length, 0);
});

await test('core lookup is English query or fdcId only: Hebrew does not hit the table', async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(String(url));
    throw new Error('offline');
  };
  const { api } = load({ hostname: 'shaydadon.github.io', coreData: core, fetchImpl });
  const r = await api.searchFoods('בננה');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'offline');
  assert.deepEqual(seen, [WORKER]);
});

await test('core still returns values when the worker is unreachable', async () => {
  const fetchImpl = async () => { throw new Error('offline'); };
  const { api } = load({ hostname: 'shaydadon.github.io', coreData: core, fetchImpl });
  const olive = await api.searchFoods('olive oil');
  assert.equal(olive.ok, true);
  assert.equal(olive.via, 'core');
  const det = await api.foodDetail(171413);
  assert.equal(det.ok, true);
  assert.equal(det.via, 'core');
  assert.ok(det.per100g['1008'].amount > 0);
});

await test('core has 29 foods and omelet is resolved by English query', async () => {
  assert.equal(Object.keys(core.foods).length, 29);
  const { api } = load({ hostname: 'shaydadon.github.io', coreData: core });
  const r = await api.searchFoods('egg omelet cooked');
  assert.equal(r.ok, true);
  assert.equal(r.foods[0].fdcId, 172185);
  const det = await api.foodDetail(172185);
  assert.equal(det.per100g['1008'].amount, 154);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all ' + 8 + ' usda-proxy tests ok');
