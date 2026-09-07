/* =============================================================
   Excerly – Cloudflare Worker proxy ל-Claude
   מחזיק את מפתח ה-Anthropic כסוד בצד השרת, כך שהאפליקציה הסטטית
   יכולה להשתמש ב-AI בלי לחשוף את המפתח בדפדפן.

   פריסה:
     1) npm i -g wrangler
     2) wrangler secret put ANTHROPIC_API_KEY   (מדביקים sk-ant-...)
     3) wrangler deploy
   ראו worker/README.md להוראות מלאות.

   ── מכסות AI לכל משתמש (רשות; בקרת עלויות) ──────────────────────
   כדי לאכוף מכסה יומית לכל משתמש מחובר, הגדירו:
     [vars]   SUPABASE_URL = "https://<ref>.supabase.co"
     wrangler secret put SUPABASE_ANON            (anon key — לאימות ה-JWT)
     wrangler secret put SUPABASE_SERVICE_ROLE    (service_role — לספירת שימוש)
     [vars]   AI_DAILY_LIMIT = "25"               (בקשות ליום; ברירת מחדל 25)
     [vars]   AI_REQUIRE_LOGIN = "1"              (רשות — לחסום AI משותף ללא התחברות)
   וכן להריץ ב-Supabase את טבלת ai_usage והפונקציה increment_ai_usage (ראו README).
   ללא SUPABASE_SERVICE_ROLE — לא נאכפת מכסה (התנהגות כמו קודם).
   ============================================================= */

// דומיינים שמורשים לקרוא ל-proxy (CORS). עדכנו לפי הצורך.
const ALLOWED_ORIGINS = [
  'https://shaydadon.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173'
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) }
  });
}

const RL_LIMIT = 12, RL_WINDOW_MS = 60000;

// גיבוי: הגבלת קצב בזיכרון (לכל isolate מפה משלו – פחות אמין, אך תמיד עובד).
const rlHits = new Map(); // ip -> [timestamps]
function memRateLimited(ip) {
  const now = Date.now();
  const arr = (rlHits.get(ip) || []).filter(ts => now - ts < RL_WINDOW_MS);
  arr.push(now);
  rlHits.set(ip, arr);
  if (rlHits.size > 5000) rlHits.clear(); // ניקוי הגנתי
  return arr.length > RL_LIMIT;
}

const ESTIMATE_SYSTEM =
  'אתה מנתח תזונה מדויק. קבל תיאור חופשי (בעברית או בכל שפה) של מה שאדם אכל, ' +
  'כולל כמויות לא פורמליות כמו "קופסת טונה", "3 כפות מיונז", "2 לחמניות", "צלחת פסטה". ' +
  'הערך בצורה מציאותית את סך הקלוריות לפי מנות נפוצות (העדף אומדן ישראלי). ' +
  'החזר JSON בלבד, ללא טקסט לפני או אחרי, במבנה: ' +
  '{"total": number, "items": [{"name": string, "kcal": number, "carbs": number, "protein": number, "fat": number}], "note": string}. ' +
  'carbs, protein, fat הם גרמים לאותו פריט. name בעברית, note הוא משפט קצר בעברית. אם פריט לא ברור, שערך בזהירות וציין זאת ב-note.';

const MENU_SYSTEM =
  'אתה תזונאי. בנה תפריט יומי מגוון ומאוזן בעברית ליעד קלוריות נתון: ' +
  'ארוחת בוקר, צהריים, ערב וחטיף אחד או שניים, עם מנות מציאותיות. ' +
  'סך הקלוריות צריך להתקרב ליעד (בטווח של כ-10%). ' +
  'החזר JSON בלבד, ללא טקסט נוסף, במבנה: ' +
  '{"meals": [{"label": string, "name": string, "kcal": number}], "total": number, "note": string}.';

const WORKOUT_SYSTEM =
  'You are a certified strength & conditioning coach. Build a safe, personalized GYM workout program ' +
  'from the user\'s profile and preferences. Use standard gym exercises (machines, free weights, cables, ' +
  'bodyweight) suited to the stated equipment and experience level. Split the requested number of training ' +
  'days sensibly (full-body / upper-lower / push-pull-legs). For each exercise give sets, a rep range and ' +
  'rest. Keep each session within the requested minutes, include a brief warm-up, and respect any stated ' +
  'limitations/injuries. In note add one short weekly progression tip. ' +
  'Return JSON only, no text before or after: ' +
  '{"title": string, "note": string, "days": [{"name": string, "focus": string, ' +
  '"exercises": [{"name": string, "sets": string, "reps": string, "rest": string, "note": string}]}]}.';

const IMAGE_SYSTEM =
  'אתה מנתח תזונה מדויק. קיבלת תמונה של ארוחה. זהה את הפריטים שבתמונה והערך את סך הקלוריות ' +
  'בצורה מציאותית לפי מנות נפוצות (העדף אומדן ישראלי), תוך התחשבות בגודל המנה הנראה. ' +
  'החזר JSON בלבד, ללא טקסט נוסף: ' +
  '{"total": number, "items": [{"name": string, "kcal": number, "carbs": number, "protein": number, "fat": number}], "note": string}. ' +
  'carbs, protein, fat הם גרמים לאותו פריט. name בעברית, note משפט קצר בעברית. אם התמונה אינה של אוכל או אינה ברורה, החזר total=0 וציין זאת ב-note.';

// content יכול להיות מחרוזת (טקסט) או מערך בלוקים (למשל תמונה + טקסט)
async function callAnthropic(env, system, content, maxTokens) {
  const model = env.MODEL || 'claude-opus-5';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content }]
    })
  });
  const raw = await res.text();
  if (!res.ok) {
    return { error: true, status: res.status, detail: raw.slice(0, 400) };
  }
  const data = JSON.parse(raw);
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { error: true, status: 502, detail: 'no JSON in model output' };
  try { return { error: false, parsed: JSON.parse(match[0]) }; }
  catch (e) { return { error: true, status: 502, detail: 'invalid JSON from model' }; }
}

/* =============================================================
   מאגר התזונה הלאומי (צמרת) — פירוק ארוחה למרכיבים והרכב מדויק
   הכלי lookup_food מחפש מצרכים בתמונת-מצב של מאגר משרד הבריאות,
   ו-Claude בוחר לכל מרכיב את הקוד והכמות; השרת מחשב את המאקרו מהקוד.
   ============================================================= */
const TZ_TTL_MS = 24 * 60 * 60 * 1000;
let TZ = null, TZ_AT = 0;

const numOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v); return Number.isFinite(n) ? n : null;
};
// נורמליזציה לחיפוש עברי/אנגלי: הסרת ניקוד, איחוד אותיות סופיות, פיסוק, אותיות קטנות
function normHe(s) {
  return String(s || '')
    .replace(/[֑-ׇ]/g, '')
    .replace(/["'`.,()\/\-]/g, ' ')
    .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
async function loadTz(env) {
  if (TZ && Date.now() - TZ_AT < TZ_TTL_MS) return TZ;
  const url = (env && env.TZAMERET_URL) || 'https://shaydadon.github.io/Excerly/assets/data/tzameret.json';
  try {
    const r = await fetch(url, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!r.ok) throw new Error('tz http ' + r.status);
    const j = await r.json();
    const foods = (j.foods || []).map(f => (f._s = normHe(f.n) + ' ' + (f.e ? f.e.toLowerCase() : ''), f));
    const byCode = new Map(foods.map(f => [f.c, f]));
    TZ = { foods, byCode }; TZ_AT = Date.now();
    return TZ;
  } catch (e) { return TZ; /* stale (or null on first failure) */ }
}
function searchFood(tz, query, max) {
  if (!tz) return [];
  const q = normHe(query);
  const toks = q.split(' ').filter(w => w.length >= 2);
  if (!toks.length) return [];
  const scored = [];
  for (const f of tz.foods) {
    let sc = 0;
    for (const w of toks) if (f._s.indexOf(w) !== -1) sc++;
    if (sc > 0) {
      if (f._s.indexOf(toks[0]) === 0) sc += 0.5;      // מתחיל במונח העיקרי
      scored.push([sc - Math.min(f.n.length, 80) / 400, f]); // העדפה לשם קצר/ספציפי
    }
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, max || 6).map(([, f]) => ({
    code: f.c, name: f.n, english: f.e || undefined,
    per100g: { kcal: f.kcal, carb: f.carb, prot: f.prot, fat: f.fat, sugars: f.sug, fiber: f.fib, sodium: f.na }
  }));
}
const LOOKUP_TOOL = {
  name: 'lookup_food',
  description: 'חיפוש מצרך במאגר התזונה הלאומי (צמרת) של משרד הבריאות. מחזיר מצרכים מתאימים עם הרכב תזונתי ל-100 גרם. יש לקרוא לכלי עבור כל מרכיב במנה ולבחור את הקוד המתאים ביותר.',
  input_schema: { type: 'object', properties: { query: { type: 'string', description: 'שם המרכיב לחיפוש בעברית (למשל: "לחם מלא", "חזה עוף", "תפוח עץ")' } }, required: ['query'] }
};
const ESTIMATE_TOOL_SYSTEM =
  'אתה מנתח תזונה מדויק המשתמש במאגר התזונה הלאומי (צמרת) של משרד הבריאות. פרק את תיאור הארוחה למרכיבים בודדים, ולכל מרכיב הערך כמות בגרמים לפי מנות נפוצות (העדף אומדן ישראלי). ' +
  'לכל מרכיב קרא ל-lookup_food ובחר את ה-code המתאים ביותר מהתוצאות. אם אין התאמה טובה, סמן source=estimate וספק בעצמך kcal,carbs,protein,fat. ' +
  'בסיום החזר JSON בלבד, ללא טקסט לפני או אחרי: {"items":[{"name":string,"code":number|null,"grams":number,"source":"tzameret"|"estimate","kcal":number,"carbs":number,"protein":number,"fat":number}],"note":string}. ' +
  'עבור source=tzameret אין צורך לחשב מאקרו (השרת יחשב מה-code והגרמים); עבור source=estimate ספק את הערכים. name בעברית, note משפט קצר.';
const IMAGE_TOOL_SYSTEM =
  'אתה מנתח תזונה מדויק המשתמש במאגר התזונה הלאומי (צמרת) של משרד הבריאות. קיבלת תמונה של ארוחה. זהה את הפריטים והערך לכל אחד כמות בגרמים לפי הנראה בתמונה. ' +
  'לכל פריט קרא ל-lookup_food ובחר את ה-code המתאים ביותר. אם אין התאמה טובה, סמן source=estimate וספק בעצמך kcal,carbs,protein,fat. ' +
  'בסיום החזר JSON בלבד: {"items":[{"name":string,"code":number|null,"grams":number,"source":"tzameret"|"estimate","kcal":number,"carbs":number,"protein":number,"fat":number}],"note":string}. ' +
  'עבור source=tzameret אין צורך לחשב מאקרו; עבור source=estimate ספק ערכים. אם אינה תמונת אוכל, החזר items=[] ו-note מתאים.';

async function callRaw(env, system, messages, tools, maxTokens) {
  const model = env.MODEL || 'claude-opus-5';
  const body = { model, max_tokens: maxTokens, output_config: { effort: 'low' }, system, messages };
  if (tools) body.tools = tools;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body)
  });
  const raw = await res.text();
  if (!res.ok) return { error: true, status: res.status, detail: raw.slice(0, 400) };
  try { return { error: false, data: JSON.parse(raw) }; }
  catch (e) { return { error: true, status: 502, detail: 'invalid API JSON' }; }
}
// לולאת שימוש-בכלי: Claude מחפש כל מרכיב במאגר עד שמחזיר JSON סופי
async function toolLoop(env, system, userContent, tz) {
  const messages = [{ role: 'user', content: userContent }];
  for (let step = 0; step < 6; step++) {
    const r = await callRaw(env, system, messages, [LOOKUP_TOOL], 1500);
    if (r.error) return r;
    const content = r.data.content || [];
    messages.push({ role: 'assistant', content });
    const toolUses = content.filter(b => b.type === 'tool_use');
    if (!toolUses.length) {
      const text = content.filter(b => b.type === 'text').map(b => b.text).join('');
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) return { error: true, status: 502, detail: 'no JSON in model output' };
      try { return { error: false, parsed: JSON.parse(m[0]) }; }
      catch (e) { return { error: true, status: 502, detail: 'invalid JSON from model' }; }
    }
    messages.push({
      role: 'user',
      content: toolUses.map(tu => ({
        type: 'tool_result', tool_use_id: tu.id,
        content: JSON.stringify(searchFood(tz, (tu.input && tu.input.query) || '', 6))
      }))
    });
  }
  return { error: true, status: 504, detail: 'tool loop exceeded' };
}
// חישוב המאקרו הסופי: לפריטי צמרת מחושב מהקוד×גרמים; לפריטי הערכה נלקח כפי שהוא
function finalizeItems(parsed, tz) {
  const items = [];
  for (const it of (parsed.items || [])) {
    const grams = numOrNull(it.grams);
    const code = numOrNull(it.code);
    const dbf = (it.source === 'tzameret' && code != null && tz) ? tz.byCode.get(code) : null;
    if (dbf && grams) {
      const k = grams / 100;
      items.push({
        name: it.name || dbf.n, grams: Math.round(grams), code: dbf.c, source: 'tzameret',
        kcal: Math.round((dbf.kcal || 0) * k), carbs: Math.round((dbf.carb || 0) * k),
        protein: Math.round((dbf.prot || 0) * k), fat: Math.round((dbf.fat || 0) * k)
      });
    } else {
      items.push({
        name: it.name || '', grams: grams ? Math.round(grams) : undefined, source: 'estimate',
        kcal: Math.round(numOrNull(it.kcal) || 0), carbs: Math.round(numOrNull(it.carbs) || 0),
        protein: Math.round(numOrNull(it.protein) || 0), fat: Math.round(numOrNull(it.fat) || 0)
      });
    }
  }
  const total = items.reduce((s, i) => s + (i.kcal || 0), 0);
  const anyDb = items.some(i => i.source === 'tzameret');
  const allDb = items.length && items.every(i => i.source === 'tzameret');
  return { total, items, note: parsed.note || '', source: allDb ? 'tzameret' : (anyDb ? 'mixed' : 'estimate') };
}

/* =============================================================
   מכסות AI לכל משתמש (בקרת עלויות)
   מזהים את המשתמש דרך ה-JWT של Supabase, סופרים שימוש יומי בטבלה,
   וחוסמים מעל המכסה. משתמש עם מפתח אישי (BYOK) לא עובר דרך כאן כלל.
   ============================================================= */
async function verifyUser(env, token) {
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON) return null;
  try {
    const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: env.SUPABASE_ANON, Authorization: 'Bearer ' + token }
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u.id : null;
  } catch (e) { return null; }
}
async function getUsage(env, userId, day) {
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/ai_usage?user_id=eq.${userId}&day=eq.${day}&select=count`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE }
    });
    if (!r.ok) return 0;
    const rows = await r.json();
    return (rows[0] && rows[0].count) || 0;
  } catch (e) { return 0; }
}
async function incrementUsage(env, userId, day) {
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/increment_ai_usage`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE, 'content-type': 'application/json' },
      body: JSON.stringify({ p_user: userId, p_day: day })
    });
    if (!r.ok) return null;
    return await r.json(); // הספירה החדשה
  } catch (e) { return null; }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

    // הגבלת קצב לכל כתובת IP (מגן על המפתח מפני שימוש-יתר).
    // עדיפות ל-Durable Object (מונה עקבי בכל הקצה); גיבוי – הגבלה בזיכרון.
    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    let limited = false;
    if (env.RATE_LIMITER_DO) {
      try {
        const stub = env.RATE_LIMITER_DO.get(env.RATE_LIMITER_DO.idFromName(ip));
        const r = await stub.fetch('https://rl/hit');
        limited = (await r.json()).limited;
      } catch (e) { limited = memRateLimited(ip); }
    } else {
      limited = memRateLimited(ip);
    }
    if (limited) return json({ error: 'rate_limited', detail: 'Too many requests. Please wait a minute and try again.' }, 429, origin);

    if (!env.ANTHROPIC_API_KEY) return json({ error: 'Server missing ANTHROPIC_API_KEY' }, 500, origin);

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: 'Bad JSON body' }, 400, origin); }

    // ----- מכסת AI לכל משתמש -----
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || body.token || '';
    const userId = await verifyUser(env, token);
    const enforce = userId && env.SUPABASE_SERVICE_ROLE;
    const day = new Date().toISOString().slice(0, 10);
    const limit = parseInt(env.AI_DAILY_LIMIT || '25', 10);
    if (enforce) {
      const used = await getUsage(env, userId, day);
      if (used >= limit) return json({ error: 'quota_exceeded', used, limit }, 429, origin);
    } else if (!userId && env.AI_REQUIRE_LOGIN === '1') {
      return json({ error: 'login_required' }, 401, origin);
    }

    // הנחיית שפת התשובה לפי שפת הממשק
    const lang = body.lang === 'en' ? 'en' : 'he';
    const withLang = (system) => system + (lang === 'en'
      ? ' Respond in English (all name/label/note fields in English).'
      : ' החזר את כל השדות name/label/note בעברית.');

    let out;
    if (body.action === 'estimate') {
      const text = String(body.text || '').slice(0, 2000).trim();
      if (!text) return json({ error: 'missing text' }, 400, origin);
      const tz = await loadTz(env);
      if (tz) {
        const r = await toolLoop(env, withLang(ESTIMATE_TOOL_SYSTEM), text, tz);
        out = r.error ? await callAnthropic(env, withLang(ESTIMATE_SYSTEM), text, 1024)
                      : { error: false, parsed: finalizeItems(r.parsed, tz) };
      } else {
        out = await callAnthropic(env, withLang(ESTIMATE_SYSTEM), text, 1024);
      }
    } else if (body.action === 'menu') {
      const target = Math.max(800, Math.min(6000, parseInt(body.target, 10) || 2000));
      const user = 'Daily goal: ' + target + ' kcal. Build me a suitable daily menu.';
      out = await callAnthropic(env, withLang(MENU_SYSTEM), user, 1500);
    } else if (body.action === 'workout_plan') {
      const p = body.plan || {};
      const user =
        'Build a personalized gym program.\n' +
        'Goal: ' + String(p.goal || 'general fitness') + '\n' +
        'Training emphasis (quality): ' + String(p.style || 'hypertrophy') + '\n' +
        'Body focus: ' + String(p.focusArea || 'full body') + '\n' +
        'Training days per week: ' + (parseInt(p.days, 10) || 3) + '\n' +
        'Minutes per session: ' + (parseInt(p.minutes, 10) || 45) + '\n' +
        'Experience level: ' + String(p.level || 'beginner') + '\n' +
        'Cardio preference: ' + String(p.cardio || 'none') + '\n' +
        'Equipment: ' + String(p.equipment || 'full gym') + '\n' +
        'Trainee: age ' + (parseInt(p.age, 10) || '-') + ', weight ' + (p.weight || '-') + ' kg, height ' +
        (p.height || '-') + ' cm, sex ' + String(p.gender || '-') + '.\n' +
        'Notes/limitations: ' + (String(p.notes || '').slice(0, 300) || 'none') + '.';
      out = await callAnthropic(env, withLang(WORKOUT_SYSTEM), user, 2600);
    } else if (body.action === 'estimate_image') {
      const img = body.image;
      if (!img || !img.data || !img.media_type) return json({ error: 'missing image' }, 400, origin);
      const content = [
        { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
        { type: 'text', text: 'This is a photo of my meal. Identify the items and estimate calories using the food database.' }
      ];
      const tz = await loadTz(env);
      if (tz) {
        const r = await toolLoop(env, withLang(IMAGE_TOOL_SYSTEM), content, tz);
        out = r.error ? await callAnthropic(env, withLang(IMAGE_SYSTEM), content, 1024)
                      : { error: false, parsed: finalizeItems(r.parsed, tz) };
      } else {
        out = await callAnthropic(env, withLang(IMAGE_SYSTEM), content, 1024);
      }
    } else {
      return json({ error: 'unknown action' }, 400, origin);
    }

    if (out.error) return json({ error: 'upstream', status: out.status, detail: out.detail }, 502, origin);
    // סופרים רק בקשה שהצליחה, ומחזירים ללקוח את המצב
    let quota = null;
    if (enforce) {
      const n = await incrementUsage(env, userId, day);
      quota = { used: (typeof n === 'number' ? n : null), limit };
    }
    return json(quota ? Object.assign({ _quota: quota }, out.parsed) : out.parsed, 200, origin);
  }
};

// Durable Object – מונה בקשות עקבי לכל כתובת IP (חלון קבוע של 60 שניות).
// גרסת SQLite (new_sqlite_classes) כדי לעבוד גם בתוכנית החינמית.
export class RateLimiter {
  constructor(state) { this.state = state; }
  async fetch() {
    const now = Date.now();
    let d = await this.state.storage.get('d');
    if (!d || now - d.start >= RL_WINDOW_MS) d = { start: now, count: 0 };
    d.count++;
    await this.state.storage.put('d', d);
    return new Response(JSON.stringify({ limited: d.count > RL_LIMIT }),
      { headers: { 'content-type': 'application/json' } });
  }
}
