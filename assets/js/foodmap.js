/* =============================================================
   Excerly – מילון מזון עברי → USDA FoodData Central
   כינויים בעברית, יחידות (פרוסה/כף/כפית/כוס/יחידה) ומנות ברירת מחדל.
   ערכים ומנות: קודם מאגר התזונה הלאומי (GovIL). USDA core נשאר כגיבוי.
   מנה "govil"/"usda" = משקל יחידה רשמי מהמאגר; מנה "default" = הנחה סבירה שהמשתמש מאשר/עורך.
   ============================================================= */
(function (global) {
  'use strict';

  // portions: גרמים ליחידה. src: 'usda' (מתוך foodPortions) או 'default' (הנחה, ניתנת לעריכה)
  const FOODS = [
    { key: 'entrecote', he: ['סטייק אנטריקוט', 'אנטריקוט', 'אנטרקוט', 'ריב איי', 'סטייק'], en: 'beef rib eye steak cooked grilled',
      portions: { slice: { g: 35, src: 'default' }, thinSlice: { g: 25, src: 'default' }, unit: { g: 150, src: 'default' } }, def: 'unit' },
    { key: 'roll', he: ['לחמנייה', 'לחמניה', 'לחמניות', 'לחמנית', 'בגט', 'באגט', 'כריך', 'סנדוויץ׳', "סנדוויץ'", 'סנדביץ׳', "סנדביץ'"], en: 'roll white plain',
      // GovIL 10124 has no unit weight. Fixed at 80 g (was the 44 g USDA roll).
      portions: { unit: { g: 80, src: 'default' } }, def: 'unit' },
    { key: 'iceberg', he: ['חסה אייסברג', 'אייסברג'], en: 'lettuce iceberg raw',
      portions: { leaf: { g: 15, src: 'usda' }, cup: { g: 72, src: 'usda' }, unit: { g: 15, src: 'usda' } }, def: 'leaf', defCount: 2 },
    { key: 'wheatBread', he: ['לחם מלא', 'לחם חיטה מלאה', 'לחם חיטה'], en: 'bread whole wheat',
      portions: { slice: { g: 29, src: 'usda' }, unit: { g: 29, src: 'usda' } }, def: 'slice', defCount: 2 },
    { key: 'whiteBread', he: ['לחם לבן', 'לחם', 'טוסט'], en: 'bread white commercially prepared',
      portions: { slice: { g: 29, src: 'usda' }, thinSlice: { g: 20, src: 'usda' }, unit: { g: 29, src: 'usda' } }, def: 'slice', defCount: 2 },
    { key: 'pita', he: ['פיתה', 'פיתות'], en: 'pita white',
      portions: { unit: { g: 60, src: 'usda' } }, def: 'unit' },
    { key: 'oliveOil', he: ['שמן זית', 'שמן'], en: 'olive oil',
      portions: { tbsp: { g: 13.5, src: 'usda' }, tsp: { g: 4.5, src: 'usda' }, cup: { g: 216, src: 'usda' } }, def: 'tbsp', defCount: 1 },
    { key: 'mayo', he: ['מיונז', 'מיונית'], en: 'mayonnaise regular',
      portions: { tbsp: { g: 13.8, src: 'usda' }, tsp: { g: 4.6, src: 'default' }, unit: { g: 10, src: 'usda' } }, def: 'tbsp', defCount: 1 },
    { key: 'lettuce', he: ['חסה', 'עלי חסה', 'עלה חסה'], en: 'lettuce romaine raw',
      portions: { leaf: { g: 6, src: 'usda' }, cup: { g: 47, src: 'usda' }, unit: { g: 6, src: 'usda' } }, def: 'leaf', defCount: 3 },
    { key: 'potato', he: ['תפוח אדמה', 'תפוחי אדמה', 'תפו"א', 'תפו״א'], en: 'potato baked',
      portions: { unit: { g: 173, src: 'usda' } }, def: 'unit' },
    { key: 'banana', he: ['בננה', 'בננות'], en: 'banana raw', portions: { unit: { g: 118, src: 'usda' } }, def: 'unit' },
    { key: 'apple', he: ['תפוח', 'תפוחים'], en: 'apple raw', portions: { unit: { g: 182, src: 'usda' } }, def: 'unit' },
    { key: 'eggFried', he: ['ביצת עין', 'ביצי עין', 'ביצה מטוגנת', 'ביצים מטוגנות'], en: 'egg fried', portions: { unit: { g: 46, src: 'usda' } }, def: 'unit' },
    { key: 'eggScrambled', he: ['ביצים מקושקשות', 'ביצה מקושקשת'], en: 'egg scrambled', portions: { unit: { g: 61, src: 'usda' } }, def: 'unit', defCount: 2 },
    { key: 'omelet', he: ['חביתה', 'חביתת', 'אומלט'], en: 'egg omelet', portions: { unit: { g: 61, src: 'usda' } }, def: 'unit', defCount: 2 },
    { key: 'eggBoiled', he: ['ביצה קשה', 'ביצים קשות', 'ביצה', 'ביצים'], en: 'egg hard boiled', portions: { unit: { g: 50, src: 'usda' } }, def: 'unit' },
    { key: 'chicken', he: ['חזה עוף', 'עוף'], en: 'chicken breast roasted', portions: { slice: { g: 35, src: 'default' }, thinSlice: { g: 25, src: 'default' }, unit: { g: 172, src: 'usda' } }, def: 'unit' },
    { key: 'rice', he: ['אורז'], en: 'rice white cooked', portions: { cup: { g: 158, src: 'usda' }, tbsp: { g: 10, src: 'default' } }, def: 'cup' },
    { key: 'cottage', he: ["קוטג'", 'קוטג׳', 'קוטג'], en: 'cottage cheese', portions: { unit: { g: 250, src: 'default' }, tbsp: { g: 15, src: 'default' }, cup: { g: 226, src: 'usda' } }, def: 'tbsp', defCount: 3 },
    { key: 'tomato', he: ['עגבנייה', 'עגבניה', 'עגבניות', 'עגבניית'], en: 'tomato raw', portions: { unit: { g: 123, src: 'usda' }, slice: { g: 20, src: 'usda' } }, def: 'unit' },
    { key: 'cucumber', he: ['מלפפון', 'מלפפונים'], en: 'cucumber raw', portions: { unit: { g: 150, src: 'default' } }, def: 'unit' },
    { key: 'avocado', he: ['אבוקדו'], en: 'avocado raw', portions: { unit: { g: 201, src: 'usda' }, slice: { g: 25, src: 'default' }, tbsp: { g: 15, src: 'default' } }, def: 'unit', defCount: 0.5 },
    { key: 'hummus', he: ['חומוס'], en: 'hummus', portions: { tbsp: { g: 15, src: 'usda' }, cup: { g: 246, src: 'usda' } }, def: 'tbsp', defCount: 4 },
    { key: 'tahini', he: ['טחינה'], en: 'tahini', portions: { tbsp: { g: 15, src: 'usda' } }, def: 'tbsp', defCount: 2 },
    { key: 'amba', he: ['עמבה'], en: 'amba pickled mango', portions: { tbsp: { g: 11, src: 'default' }, tsp: { g: 3.7, src: 'default' } }, def: 'tbsp', defCount: 1 },
    { key: 'soySauce', he: ['רוטב סויה'], en: 'soy sauce',
      portions: { tbsp: { g: 11, src: 'default' }, tsp: { g: 4, src: 'default' } }, def: 'tbsp' },
    { key: 'mustard', he: ['חרדל'], en: 'mustard prepared',
      portions: { tbsp: { g: 14, src: 'default' }, tsp: { g: 5, src: 'default' } }, def: 'tbsp' },
    { key: 'salmon', he: ['סלמון'], en: 'salmon cooked', portions: { unit: { g: 150, src: 'default' } }, def: 'unit' },
    { key: 'tuna', he: ['טונה'], en: 'tuna canned in water', portions: { unit: { g: 112, src: 'default' }, tbsp: { g: 15, src: 'default' } }, def: 'unit' },
    { key: 'pasta', he: ['פסטה', 'ספגטי'], en: 'pasta cooked', portions: { cup: { g: 124, src: 'usda' } }, def: 'cup', defCount: 1.5 },
    { key: 'yogurt', he: ['יוגורט'], en: 'yogurt plain whole milk', portions: { unit: { g: 170, src: 'usda' }, cup: { g: 245, src: 'usda' } }, def: 'unit' },
    { key: 'feta', he: ['גבינה בולגרית', 'בולגרית', 'פטה'], en: 'feta cheese', portions: { unit: { g: 38, src: 'usda' }, tbsp: { g: 10, src: 'default' } }, def: 'unit' }
  ];

  const NUM_WORDS = { 'חצי': 0.5, 'אחד': 1, 'אחת': 1, 'שני': 2, 'שתי': 2, 'שניים': 2, 'שתיים': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5, 'שש': 6, 'שישה': 6 };
  const UNIT_RX = [
    { unit: 'grams', rx: /(\d+(?:[.,]\d+)?)\s*(?:גרם|גר׳|גר'|גר״|גר|ג׳|ג'|g\b|gr\b)/i },
    { unit: 'kg', rx: /(\d+(?:[.,]\d+)?)\s*(?:ק"ג|ק״ג|קילו|kg\b)/i },
    { unit: 'tsp', rx: /כפיות|כפית|tsp|teaspoon/i },
    { unit: 'tbsp', rx: /כפות|כף|tbsp|tablespoon/i },
    { unit: 'cup', rx: /כוסות|כוס|cup/i },
    { unit: 'slice', rx: /פרוסות|פרוסה|פרוסת|slices?/i },
    { unit: 'slice', rx: /חתיכות|חתיכה|נתחים|נתח(?!\s*של)/i },
    { unit: 'leaf', rx: /עלים|עלה|עלי|leaf|leaves/i },
    { unit: 'unit', rx: /יחידות|יחידה|units?|pieces?/i }
  ];
  // מילות "מכל" — כריך/סנדוויץ' הם לחמנייה רק אם אין פריט לחם אחר בארוחה
  const CONTAINER = /^(?:ה|ב|ו)?(?:כריך|סנדוויץ׳|סנדוויץ'|סנדביץ׳|סנדביץ')$/;

  function normalize(s) {
    return String(s || '').replace(/[\u0591-\u05C7]/g, '').replace(/״/g, '"').replace(/׳/g, "'").replace(/\s+/g, ' ').trim();
  }

  // מוצא מזון לפי כינוי (הארוך ביותר קודם), מתיר אות שימוש אחת לפני המילה (ו/ב/מ/ה/ל/ש/כ)
  const ALIASES = [];
  FOODS.forEach(f => f.he.forEach(a => ALIASES.push({ alias: normalize(a), food: f })));
  ALIASES.sort((a, b) => b.alias.length - a.alias.length);
  // הכינוי שמופיע ראשון בטקסט קובע ("לחמניה מלחם לבן" = לחמנייה); בתיקו — הארוך ביותר
  function findFood(text) {
    const s = ' ' + normalize(text) + ' ';
    let best = null;
    for (let i = 0; i < ALIASES.length; i++) {
      const a = ALIASES[i].alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp('[\\s,(](?:[ובמהלשכ]{0,2})' + a + '(?=[\\s,.)!?]|$)');
      const m = rx.exec(s);
      if (!m) continue;
      if (!best || m.index < best.index || (m.index === best.index && ALIASES[i].alias.length > best.len)) {
        best = { index: m.index, len: ALIASES[i].alias.length, food: ALIASES[i].food };
      }
    }
    return best ? best.food : null;
  }

  function parseQuantity(text) {
    const s = normalize(text);
    let unit = null, grams = null;
    for (let i = 0; i < UNIT_RX.length; i++) {
      const m = s.match(UNIT_RX[i].rx);
      if (!m) continue;
      unit = UNIT_RX[i].unit;
      if (unit === 'grams') grams = parseFloat(m[1].replace(',', '.'));
      if (unit === 'kg') { grams = parseFloat(m[1].replace(',', '.')) * 1000; unit = 'grams'; }
      break;
    }
    const num = s.match(/(\d+(?:[.,]\d+)?)/);
    let count = num && unit !== 'grams' ? parseFloat(num[1].replace(',', '.')) : null;
    if (count == null) {
      const words = s.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const w = words[i].replace(/^[ומב]/, '') in NUM_WORDS ? words[i].replace(/^[ומב]/, '') : words[i];
        if (NUM_WORDS[w] != null) { count = (count || 0) + NUM_WORDS[w]; if (w !== 'חצי') break; }
      }
    }
    if (/וחצי/.test(s) && count != null && count % 1 === 0) count += 0.5;
    const thin = /דק|דקות|דקה|thin/i.test(s);
    return { unit: unit, count: count, grams: grams, thin: thin };
  }

  function portionOf(food, unit) {
    const G = global.ExcerlyGovil;
    const govilOn = !!(G && G.ready && G.ready());
    const code = food && (food.govil || (G && G.mapCode && G.mapCode(food.key)));
    if (govilOn && G.portion && code) {
      const g = G.portion(code, unit);
      if (g != null) return { g: g, src: 'govil' };
      // Official Israeli weight is missing — cite a USDA/default gram weight only as an assumption.
      if (food.portions && food.portions[unit]) return { g: food.portions[unit].g, src: 'default' };
    }
    return (food && food.portions && food.portions[unit]) || null;
  }
  function attachGovil(map) {
    FOODS.forEach(f => {
      const code = map && (map[f.key] && (map[f.key].code || map[f.key]));
      if (code) f.govil = Number(code);
    });
  }

  // תוצאה: { food, grams, count, unit, portionSrc: 'explicit'|'govil'|'usda'|'default' } או null כשהמזון לא מוכר
  function resolve(text) {
    const food = findFood(text);
    const q = parseQuantity(text);
    if (!food) return { food: null, quantity: q };
    if (q.grams != null && q.grams > 0) return { food: food, grams: Math.round(q.grams), count: null, unit: 'g', portionSrc: 'explicit', countAssumed: false, quantity: q };
    let unit = q.unit && q.unit !== 'grams' ? q.unit : null;
    if (unit === 'slice' && q.thin && (portionOf(food, 'thinSlice') || food.portions.thinSlice)) unit = 'thinSlice';
    if (unit && !portionOf(food, unit)) {
      if (unit === 'tsp' && portionOf(food, 'tbsp')) { const p = portionOf(food, 'tbsp'); return finish(food, (q.count || 1), { g: p.g / 3, src: p.src === 'govil' ? 'govil' : 'default' }, 'tsp', q); }
      // "פרוסה" is not a whole fruit/breast/fillet. A missing slice weight is a labelled default, never the item's unit weight.
      if (unit === 'slice' || unit === 'thinSlice') {
        return finish(food, (q.count || 1), { g: unit === 'thinSlice' ? 25 : 35, src: 'default' }, unit, q);
      }
      unit = portionOf(food, 'unit') ? 'unit' : null;
    }
    if (!unit) unit = q.count != null && portionOf(food, 'unit') ? 'unit' : food.def;
    const portion = portionOf(food, unit) || portionOf(food, food.def) || food.portions[unit] || food.portions[food.def];
    const count = q.count != null ? q.count : (!q.unit && unit === food.def && food.defCount ? food.defCount : 1);
    return finish(food, count, portion, unit, q);
  }
  function finish(food, count, portion, unit, q) {
    const grams = Math.round(portion.g * count * 10) / 10;
    // portionSrc: משקל ליחידה מ-USDA ('usda') או הנחה ('default'). countAssumed: המשתמש לא ציין כמות.
    return { food: food, grams: grams, count: count, unit: unit, portionSrc: portion.src, perUnit: portion.g,
      countAssumed: q.count == null && q.unit == null && !(unit === 'unit' && !food.defCount), quantity: q };
  }

  function isContainer(text) { return CONTAINER.test(normalize(text)); }

  let corePromise = null;
  function loadCore(fetcher) {
    if (!corePromise) {
      const f = fetcher || (typeof fetch !== 'undefined' ? (u) => fetch(u).then(r => { if (!r.ok) throw new Error('core ' + r.status); return r.json(); }) : null);
      corePromise = f ? Promise.resolve(f('assets/data/usda-core.json')).catch(e => { corePromise = null; throw e; }) : Promise.reject(new Error('no fetch'));
    }
    return corePromise;
  }
  function setCore(data) { corePromise = Promise.resolve(data); }
  async function coreFood(key) {
    const core = await loadCore();
    const f = core && core.foods && core.foods[key];
    if (!f) return { ok: false, error: 'not_in_core' };
    return { ok: true, fdcId: f.fdcId, description: f.description, dataType: f.dataType, per100g: f.per100g, portions: f.portions, retrievedAt: core.retrievedAt, dataset: core.dataset };
  }

  global.ExcerlyFoodMap = {
    FOODS: FOODS, normalize: normalize, findFood: findFood, parseQuantity: parseQuantity,
    resolve: resolve, isContainer: isContainer, loadCore: loadCore, setCore: setCore, coreFood: coreFood,
    portionOf: portionOf, attachGovil: attachGovil
  };
})(typeof window !== 'undefined' ? window : globalThis);
