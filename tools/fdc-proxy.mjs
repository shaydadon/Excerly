/**
 * Excerly – פרוקסי מקומי ל-USDA FoodData Central.
 * המפתח נקרא מהסביבה בלבד ולא נשלח לדפדפן ולא נרשם ללוג.
 *
 *   FDC_API_KEY   מפתח data.gov פרטי (מומלץ לייצור)
 *   אם אין מפתח פרטי, נעשה שימוש ב-DEMO_KEY המתועד:
 *   https://fdc.nal.usda.gov/api-guide/
 *
 *   POST /fdc   { action: "fdc_search", query, pageSize }
 *   POST /fdc   { action: "fdc_food", fdcId }
 *   POST /api/fdc  אותו גוף (תואם nginx)
 */
import http from 'node:http';

const PORT = parseInt(process.env.PORT || '8787', 10);
const BASE = 'https://api.nal.usda.gov/fdc/v1';
const DEMO = 'DEMO_KEY';
const cache = new Map();
const hits = [];

function apiKey() {
  const k = (process.env.FDC_API_KEY || '').trim();
  if (k) return { key: k, keyMode: 'private' };
  return { key: DEMO, keyMode: 'demo' };
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = hits.filter(h => h.ip === ip && now - h.t < 60000);
  for (let i = hits.length - 1; i >= 0; i--) if (now - hits[i].t > 60000) hits.splice(i, 1);
  if (recent.length >= 40) return true;
  hits.push({ ip, t: now });
  return false;
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store'
  });
  res.end(body);
}

async function fdc(pathAndQuery) {
  if (cache.has(pathAndQuery)) return cache.get(pathAndQuery);
  const r = await fetch(BASE + pathAndQuery);
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = { error: 'bad_json', detail: text.slice(0, 180) }; }
  const out = { status: r.status, data };
  if (r.ok) cache.set(pathAndQuery, out);
  return out;
}

async function handle(body) {
  const { key, keyMode } = apiKey();
  if (body.action === 'fdc_search') {
    const q = String(body.query || '').trim().slice(0, 120);
    if (!q) return { status: 400, obj: { error: 'missing_query' } };
    const pageSize = Math.max(1, Math.min(10, parseInt(body.pageSize, 10) || 6));
    const qs = `?query=${encodeURIComponent(q)}&pageSize=${pageSize}&dataType=${encodeURIComponent('Foundation,SR Legacy')}&api_key=${encodeURIComponent(key)}`;
    const r = await fdc('/foods/search' + qs);
    if (r.status === 429) return { status: 429, obj: { error: 'rate_limited', keyMode } };
    if (r.status !== 200) return { status: 502, obj: { error: 'upstream', status: r.status, keyMode } };
    const foods = (r.data.foods || []).map(f => ({
      fdcId: f.fdcId,
      description: f.description,
      dataType: f.dataType,
      brandOwner: f.brandOwner || null,
      brandName: f.brandName || null
    }));
    return { status: 200, obj: { foods, totalHits: r.data.totalHits || foods.length, keyMode } };
  }
  if (body.action === 'fdc_food') {
    const id = parseInt(body.fdcId, 10);
    if (!id) return { status: 400, obj: { error: 'bad_id' } };
    const r = await fdc(`/food/${id}?api_key=${encodeURIComponent(key)}`);
    if (r.status === 429) return { status: 429, obj: { error: 'rate_limited', keyMode } };
    if (r.status !== 200) return { status: 502, obj: { error: 'upstream', status: r.status, keyMode } };
    return { status: 200, obj: { food: r.data, keyMode } };
  }
  return { status: 400, obj: { error: 'unknown_action' } };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const path = (req.url || '').split('?')[0];
  if (req.method !== 'POST' || (path !== '/fdc' && path !== '/api/fdc')) {
    return send(res, 404, { error: 'not_found' });
  }
  const ip = req.socket.remoteAddress || 'local';
  if (rateLimited(ip)) return send(res, 429, { error: 'rate_limited' });
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body;
  try { body = JSON.parse(raw || '{}'); }
  catch (e) { return send(res, 400, { error: 'bad_json' }); }
  try {
    const out = await handle(body);
    send(res, out.status, out.obj);
  } catch (e) {
    send(res, 502, { error: 'offline', detail: 'fdc_unreachable' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const mode = apiKey().keyMode;
  console.log('fdc-proxy listening on ' + PORT + ' keyMode=' + mode);
});
