/* =============================================================
   Excerly – Cloudflare Worker proxy ל-Claude
   מחזיק את מפתח ה-Anthropic כסוד בצד השרת, כך שהאפליקציה הסטטית
   יכולה להשתמש ב-AI בלי לחשוף את המפתח בדפדפן.

   פריסה:
     1) npm i -g wrangler
     2) wrangler secret put ANTHROPIC_API_KEY   (מדביקים sk-ant-...)
     3) wrangler deploy
   ראו worker/README.md להוראות מלאות.
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

const ESTIMATE_SYSTEM =
  'אתה מנתח תזונה מדויק. קבל תיאור חופשי (בעברית או בכל שפה) של מה שאדם אכל, ' +
  'כולל כמויות לא פורמליות כמו "קופסת טונה", "3 כפות מיונז", "2 לחמניות", "צלחת פסטה". ' +
  'הערך בצורה מציאותית את סך הקלוריות לפי מנות נפוצות (העדף אומדן ישראלי). ' +
  'החזר JSON בלבד, ללא טקסט לפני או אחרי, במבנה: ' +
  '{"total": number, "items": [{"name": string, "kcal": number}], "note": string}. ' +
  'name בעברית, note הוא משפט קצר בעברית. אם פריט לא ברור, שערך בזהירות וציין זאת ב-note.';

const MENU_SYSTEM =
  'אתה תזונאי. בנה תפריט יומי מגוון ומאוזן בעברית ליעד קלוריות נתון: ' +
  'ארוחת בוקר, צהריים, ערב וחטיף אחד או שניים, עם מנות מציאותיות. ' +
  'סך הקלוריות צריך להתקרב ליעד (בטווח של כ-10%). ' +
  'החזר JSON בלבד, ללא טקסט נוסף, במבנה: ' +
  '{"meals": [{"label": string, "name": string, "kcal": number}], "total": number, "note": string}.';

const IMAGE_SYSTEM =
  'אתה מנתח תזונה מדויק. קיבלת תמונה של ארוחה. זהה את הפריטים שבתמונה והערך את סך הקלוריות ' +
  'בצורה מציאותית לפי מנות נפוצות (העדף אומדן ישראלי), תוך התחשבות בגודל המנה הנראה. ' +
  'החזר JSON בלבד, ללא טקסט נוסף: ' +
  '{"total": number, "items": [{"name": string, "kcal": number}], "note": string}. ' +
  'name בעברית, note משפט קצר בעברית. אם התמונה אינה של אוכל או אינה ברורה, החזר total=0 וציין זאת ב-note.';

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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'Server missing ANTHROPIC_API_KEY' }, 500, origin);

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: 'Bad JSON body' }, 400, origin); }

    let out;
    if (body.action === 'estimate') {
      const text = String(body.text || '').slice(0, 2000).trim();
      if (!text) return json({ error: 'missing text' }, 400, origin);
      out = await callAnthropic(env, ESTIMATE_SYSTEM, text, 1024);
    } else if (body.action === 'menu') {
      const target = Math.max(800, Math.min(6000, parseInt(body.target, 10) || 2000));
      const user = 'יעד יומי: ' + target + ' קק"ל. בנה לי תפריט יומי מתאים.';
      out = await callAnthropic(env, MENU_SYSTEM, user, 1500);
    } else if (body.action === 'estimate_image') {
      const img = body.image;
      if (!img || !img.data || !img.media_type) return json({ error: 'missing image' }, 400, origin);
      const content = [
        { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
        { type: 'text', text: 'זו תמונה של הארוחה שלי. זהה את המנות והערך את סך הקלוריות.' }
      ];
      out = await callAnthropic(env, IMAGE_SYSTEM, content, 1024);
    } else {
      return json({ error: 'unknown action' }, 400, origin);
    }

    if (out.error) return json({ error: 'upstream', status: out.status, detail: out.detail }, 502, origin);
    return json(out.parsed, 200, origin);
  }
};
