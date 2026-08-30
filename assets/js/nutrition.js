/* =============================================================
   Excerly – מעקב תזונה: הערכת קלוריות מטקסט חופשי + בניית תפריט
   מנוע מקומי (עובד תמיד, לא מקוון) + מצב AI אופציונלי (Claude, BYOK)
   ============================================================= */
(function (global) {
  'use strict';

  const D = global.ExcerlyData;

  /* ---------- מאגר מזונות מקומי (הערכה) ----------
     per100 = קק"ל ל-100 גרם | perItem = קק"ל ליחידה
     portion = גודל מנה טיפוסי בגרמים (למזון per100 ללא יחידת משקל)
     slice   = קק"ל לפרוסה */
  const FOODS = [
    { n: ['אורז'], per100: 130, portion: 150 },
    { n: ['פסטה', 'ספגטי', 'נודלס'], per100: 158, portion: 180 },
    { n: ['קינואה'], per100: 120, portion: 150 },
    { n: ['בורגול'], per100: 83, portion: 150 },
    { n: ['קוסקוס'], per100: 112, portion: 150 },
    { n: ['חזה עוף', 'עוף', 'פרגית'], per100: 165, portion: 150 },
    { n: ['הודו'], per100: 135, portion: 150 },
    { n: ['בשר', 'בקר', 'סטייק', 'אנטריקוט'], per100: 250, portion: 150 },
    { n: ['קציצה', 'קציצות'], perItem: 120 },
    { n: ['שניצל'], perItem: 300 },
    { n: ['סלמון'], per100: 208, portion: 150 },
    { n: ['דג', 'טונה טרייה', 'בקלה', 'אמנון'], per100: 130, portion: 150 },
    { n: ['טונה'], per100: 130, portion: 140 },
    { n: ['טופו'], per100: 76, portion: 150 },
    { n: ['ביצה', 'ביצים', 'ביצת', 'חביתה', 'אומלט'], perItem: 78 },
    { n: ['לחם', 'טוסט', 'פרוסת לחם'], per100: 265, slice: 70, portion: 60 },
    { n: ['פיתה'], perItem: 170 },
    { n: ['לחמנייה', 'באגט'], perItem: 200 },
    { n: ['קרקר', 'קרקרים', 'מצה'], perItem: 30 },
    { n: ['תפוח אדמה', 'תפו״א', 'פירה', 'בטטה'], per100: 90, portion: 150 },
    { n: ['ציפס', 'צ׳יפס', "צ'יפס"], per100: 312, portion: 130 },
    { n: ['סלט', 'סלט ירקות'], per100: 50, portion: 150 },
    { n: ['ירקות', 'מלפפון', 'עגבנייה', 'עגבניה', 'גזר', 'פלפל'], per100: 30, portion: 120 },
    { n: ['אבוקדו'], per100: 160, portion: 100, perItem: 240 },
    { n: ['חומוס'], per100: 170, portion: 150 },
    { n: ['פול', 'עדשים', 'שעועית', 'קטניות'], per100: 116, portion: 150 },
    { n: ['תפוח'], perItem: 95 },
    { n: ['בננה'], perItem: 105 },
    { n: ['תפוז', 'קלמנטינה'], perItem: 62 },
    { n: ['אגס'], perItem: 100 },
    { n: ['ענבים'], per100: 69, portion: 150 },
    { n: ['אבטיח', 'מלון'], per100: 32, portion: 200 },
    { n: ['תות', 'תותים'], per100: 33, portion: 150 },
    { n: ['חלב'], per100: 42, portion: 240 },
    { n: ['יוגורט', 'יופלה'], per100: 60, portion: 150 },
    { n: ['גבינה לבנה', 'קוטג', 'קוטג׳'], per100: 90, portion: 100 },
    { n: ['גבינה צהובה', 'גבינה'], per100: 350, portion: 30 },
    { n: ['שקדים', 'אגוזים', 'קשיו', 'בוטנים'], per100: 600, portion: 30 },
    { n: ['טחינה'], per100: 590, portion: 30 },
    { n: ['חמאת בוטנים'], per100: 588, portion: 30 },
    { n: ['שמן', 'שמן זית'], per100: 884, portion: 15 },
    { n: ['חמאה'], per100: 717, portion: 15 },
    { n: ['סוכר'], per100: 400, portion: 5 },
    { n: ['דבש'], per100: 304, portion: 20 },
    { n: ['שוקולד'], per100: 550, portion: 30 },
    { n: ['עוגה', 'עוגייה', 'עוגיות', 'מאפה', 'קרואסון'], perItem: 300 },
    { n: ['גלידה'], per100: 210, portion: 100 },
    { n: ['פיצה'], perItem: 285 },
    { n: ['המבורגר'], perItem: 350 },
    { n: ['שווארמה'], per100: 220, portion: 200 },
    { n: ['פלאפל'], perItem: 60 },
    { n: ['קורנפלקס', 'דגני בוקר', 'גרנולה'], per100: 380, portion: 40 },
    { n: ['שיבולת שועל', 'קוואקר', 'דייסה'], per100: 68, portion: 200 },
    { n: ['קפה'], perItem: 5 },
    { n: ['קפה הפוך', 'קפוצ׳ינו', 'לאטה'], perItem: 60 },
    { n: ['קולה', 'משקה קל', 'מיץ', 'סודה מתוקה'], per100: 42, portion: 330 },
    { n: ['בירה'], per100: 43, portion: 330 },
    { n: ['יין'], per100: 83, portion: 150 }
  ];

  // יחידות מידה → גרמים (התאמה מדויקת לפי מילה שלמה)
  const UNIT_G = {
    'גרם': 1, 'גר': 1, 'גר׳': 1, "ג'": 1, 'ג׳': 1, 'ג': 1, 'ג״ר': 1,
    'קילו': 1000, 'ק״ג': 1000, 'קג': 1000, 'קילוגרם': 1000,
    'כף': 15, 'כפות': 15, 'כפית': 5, 'כפיות': 5,
    'כוס': 240, 'כוסות': 240, 'מ״ל': 1, 'מל': 1, 'ליטר': 1000, 'ליטרים': 1000
  };
  const SLICE_UNITS = ['פרוסה', 'פרוסות', 'פרוסת'];
  const ITEM_UNITS = ['יחידה', 'יחידות', 'מנה', 'מנות', 'פיתה', 'פיתות', 'כדור', 'כדורים'];
  const NUM_WORDS = { 'חצי': 0.5, 'רבע': 0.25, 'שליש': 0.33, 'זוג': 2 };

  const clean = t => t.replace(/[.,;:!?()"']/g, '').trim();

  function findFood(segment) {
    let best = null, bestLen = 0;
    for (const f of FOODS) {
      for (const name of f.n) {
        if (segment.indexOf(name) !== -1 && name.length > bestLen) { best = f; bestLen = name.length; }
      }
    }
    return best;
  }

  // איתור כמות ויחידה מתוך מילות המקטע (התאמה מדויקת של יחידה למילה שלמה)
  function findQtyUnit(segment) {
    const tokens = segment.split(/\s+/).map(clean).filter(Boolean);
    let qty = null, unit = null;
    for (const t of tokens) {
      if (qty == null) {
        const m = t.match(/^(\d+(?:[.,]\d+)?)$/);
        if (m) { qty = parseFloat(m[1].replace(',', '.')); continue; }
        if (NUM_WORDS[t] != null) { qty = NUM_WORDS[t]; continue; }
      }
      if (!unit) {
        if (UNIT_G[t] != null) unit = { type: 'g', grams: UNIT_G[t] };
        else if (SLICE_UNITS.indexOf(t) !== -1) unit = { type: 'slice' };
        else if (ITEM_UNITS.indexOf(t) !== -1) unit = { type: 'item' };
      }
    }
    // כמות דבוקה: "150גרם"
    if (qty == null) { const m = segment.match(/(\d+(?:[.,]\d+)?)/); if (m) qty = parseFloat(m[1].replace(',', '.')); }
    return { qty, unit };
  }

  function kcalFor(food, qty, unit) {
    const perItemLike = () => food.perItem
      ? qty * food.perItem
      : (food.per100 ? qty * (food.portion / 100 * food.per100) : 0);
    if (unit && unit.type === 'g') {
      const grams = qty * unit.grams;
      return food.per100 ? grams / 100 * food.per100 : (food.perItem ? qty * food.perItem : 0);
    }
    if (unit && unit.type === 'slice') {
      return qty * (food.slice || food.perItem || (food.per100 ? food.portion / 100 * food.per100 : 0));
    }
    return perItemLike(); // יחידה / מנה / ללא יחידה
  }

  // הערכה מקומית של קלוריות מטקסט חופשי
  function estimateLocal(text) {
    // מפרידים: פסיק, שורה, +, ·, "עם", וכן וו החיבור (רווח + ו + אות)
    const segments = text
      .split(/[\n,+·]| עם |\s+ו(?=[א-ת])/)
      .map(s => s.trim()).filter(Boolean);
    const items = [];
    const unmatched = [];
    for (const seg of segments) {
      const food = findFood(seg);
      if (!food) { if (clean(seg).replace(/\d+/g, '').trim().length > 1) unmatched.push(seg); continue; }
      const { qty: qtyRaw, unit } = findQtyUnit(seg);
      const qty = qtyRaw == null ? 1 : qtyRaw;
      const kcal = Math.round(kcalFor(food, qty, unit));
      if (kcal > 0) items.push({ name: food.n[0], kcal });
    }
    const total = items.reduce((s, i) => s + i.kcal, 0);
    return { total, items, unmatched, source: 'local' };
  }

  /* ---------- מחולל תפריט יומי מקומי ---------- */
  const DISHES = {
    breakfast: [
      { name: 'חביתת 2 ביצים עם ירקות וטוסט מלא', kcal: 320 },
      { name: 'יוגורט יווני עם גרנולה ופירות', kcal: 350 },
      { name: 'דייסת שיבולת שועל עם בננה ואגוזים', kcal: 400 },
      { name: 'כריך גבינה לבנה, עגבנייה ומלפפון', kcal: 300 },
      { name: 'שייק חלבון עם בננה וחמאת בוטנים', kcal: 380 },
      { name: 'לחם מלא עם אבוקדו וביצה קשה', kcal: 420 },
      { name: 'שקשוקה עם 2 ביצים ולחם מלא', kcal: 480 },
      { name: 'פנקייק שיבולת שועל עם סילאן ופירות', kcal: 520 },
      { name: 'קוטג׳ עם קרקרים מלאים וירק חתוך', kcal: 260 }
    ],
    lunch: [
      { name: 'חזה עוף בגריל עם אורז מלא וסלט', kcal: 550 },
      { name: 'קציצות בקר עם פירה וירקות מאודים', kcal: 600 },
      { name: 'סלמון אפוי עם קינואה וברוקולי', kcal: 520 },
      { name: 'פסטה מלאה ברוטב עגבניות עם עוף', kcal: 580 },
      { name: 'מנת חומוס עם פיתה מלאה וסלט', kcal: 480 },
      { name: 'טופו מוקפץ עם אורז וירקות', kcal: 500 },
      { name: 'סטייק עוף עם תפוחי אדמה אפויים וסלט גדול', kcal: 700 },
      { name: 'בורגר בקר ביתי בלחמנייה מלאה עם ירקות', kcal: 720 },
      { name: 'מרק עדשים סמיך עם לחם מלא', kcal: 450 }
    ],
    dinner: [
      { name: 'סלט טונה גדול עם ביצה וקטניות', kcal: 400 },
      { name: 'אומלט ירקות עם פרוסת לחם מלא', kcal: 350 },
      { name: 'דג לבן בתנור עם בטטה וסלט', kcal: 450 },
      { name: 'מנת פסטה מלאה עם ירקות וגבינה', kcal: 520 },
      { name: 'טוסט גדול עם גבינה, ביצה וסלט', kcal: 500 },
      { name: 'כריך הודו בלחם מלא עם ירקות', kcal: 420 },
      { name: 'מרק ירקות עם קרוטונים וגבינה', kcal: 380 }
    ],
    snack: [
      { name: 'תפוח וכף חמאת בוטנים', kcal: 180 },
      { name: 'חופן שקדים', kcal: 160 },
      { name: 'יוגורט עם דבש', kcal: 150 },
      { name: 'פרי + כמה אגוזים', kcal: 200 },
      { name: 'שייק חלבון', kcal: 220 },
      { name: 'חופן אגוזים ופרי', kcal: 250 },
      { name: 'ירקות חתוכים עם חומוס', kcal: 140 },
      { name: 'בננה', kcal: 105 }
    ]
  };
  const SLOT_LABEL = { breakfast: 'ארוחת בוקר', lunch: 'ארוחת צהריים', dinner: 'ארוחת ערב', snack: 'חטיף' };

  function pickNear(list, targetKcal, exclude) {
    const used = Array.isArray(exclude) ? exclude : (exclude ? [exclude] : []);
    let base = list.filter(d => used.indexOf(d.name) === -1);
    if (!base.length) base = list; // אם כולם נוצלו – מאפשרים שוב
    const sorted = base
      .sort((a, b) => Math.abs(a.kcal - targetKcal) - Math.abs(b.kcal - targetKcal));
    const within = sorted.filter(d => Math.abs(d.kcal - targetKcal) <= targetKcal * 0.3);
    if (within.length) return within[Math.floor(Math.random() * within.length)]; // גיוון
    // אין התאמה קרובה – בוחרים מבין 2 הקרובים ביותר (למשל ליעד גבוה)
    const topK = sorted.slice(0, Math.min(2, sorted.length));
    return topK[Math.floor(Math.random() * topK.length)];
  }

  function generateMealPlan(target) {
    const slots = [['breakfast', 0.25], ['lunch', 0.35], ['dinner', 0.30], ['snack', 0.10]];
    const meals = slots.map(([slot, w]) => {
      const d = pickNear(DISHES[slot], target * w);
      return { slot, label: SLOT_LABEL[slot], name: d.name, kcal: d.kcal };
    });
    let total = meals.reduce((s, m) => s + m.kcal, 0);
    // השלמת הפער ליעד באמצעות חטיפים מגוונים (עד 3 נוספים)
    const usedSnacks = [];
    while (target - total > 180 && usedSnacks.length < 3) {
      const d = pickNear(DISHES.snack, target - total, usedSnacks);
      meals.push({ slot: 'snack', label: 'חטיף', name: d.name, kcal: d.kcal });
      total += d.kcal; usedSnacks.push(d.name);
    }
    return { meals, total, target, source: 'local' };
  }

  /* ---------- מצב AI אופציונלי (Claude, מפתח של המשתמש) ---------- */
  async function callClaude(key, system, userText, maxTokens) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        max_tokens: maxTokens || 1024,
        output_config: { effort: 'low' },
        system,
        messages: [{ role: 'user', content: userText }]
      })
    });
    if (!res.ok) throw new Error('AI request failed: ' + res.status);
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI returned no JSON');
    return JSON.parse(match[0]);
  }

  async function estimateAI(text, key) {
    const system = 'אתה עוזר תזונה. קבל תיאור חופשי בעברית של מה שאדם אכל, והערך את סך הקלוריות. ' +
      'החזר JSON בלבד, ללא טקסט נוסף, במבנה: ' +
      '{"total": number, "items": [{"name": string, "kcal": number}], "note": string}. ' +
      'note הוא משפט קצר בעברית. אל תוסיף הסברים מחוץ ל-JSON.';
    const out = await callClaude(key, system, text, 1024);
    return {
      total: Math.round(out.total || (out.items || []).reduce((s, i) => s + (i.kcal || 0), 0)),
      items: (out.items || []).map(i => ({ name: i.name, kcal: Math.round(i.kcal || 0) })),
      unmatched: [], note: out.note || '', source: 'ai'
    };
  }

  async function mealPlanAI(target, key) {
    const system = 'אתה תזונאי. בנה תפריט יומי מגוון בעברית לפי יעד קלוריות נתון. ' +
      'החזר JSON בלבד במבנה: {"meals": [{"label": string, "name": string, "kcal": number}], "total": number, "note": string}. ' +
      'כלול ארוחת בוקר, צהריים, ערב וחטיף אחד או שניים. סך הקלוריות צריך להתקרב ליעד. אל תוסיף טקסט מחוץ ל-JSON.';
    const out = await callClaude(key, 'יעד יומי: ' + target + ' קק"ל.\n' + system, 'בנה לי תפריט יומי ליעד של ' + target + ' קלוריות.', 1500);
    const meals = (out.meals || []).map(m => ({ label: m.label || '', name: m.name || '', kcal: Math.round(m.kcal || 0) }));
    return { meals, total: Math.round(out.total || meals.reduce((s, m) => s + m.kcal, 0)), target, note: out.note || '', source: 'ai' };
  }

  /* ---------- יעד קלוריות מהפרופיל ---------- */
  function targetCalories() {
    try {
      const p = JSON.parse(localStorage.getItem('excerly.profile') || 'null');
      if (!p || !p.age || !p.weight || !p.height) return null;
      const bmr = D.calcBMR({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender });
      const act = D.ACTIVITY_FACTORS[p.activity] || D.ACTIVITY_FACTORS.moderate;
      return Math.round(bmr * act.factor);
    } catch (e) { return null; }
  }

  function verdict(total, target) {
    const tol = Math.max(100, Math.round(target * 0.05));
    if (total > target + tol) return { key: 'over', label: 'חרגת מהיעד', delta: total - target, color: '#e74c3c' };
    if (total >= target - tol) return { key: 'met', label: 'עמדת ביעד! 🎯', delta: 0, color: '#2ecc71' };
    return { key: 'under', label: 'מתחת ליעד', delta: target - total, color: '#4aa3ff' };
  }

  global.ExcerlyNutrition = {
    estimateLocal, estimateAI, generateMealPlan, mealPlanAI,
    targetCalories, verdict, SLOT_LABEL
  };
})(window);
