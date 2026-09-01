/* =============================================================
   Excerly – מעקב תזונה: הערכת קלוריות מטקסט חופשי + בניית תפריט
   מנוע מקומי (עובד תמיד, לא מקוון) + מצב AI אופציונלי (Claude, BYOK)
   ============================================================= */
(function (global) {
  'use strict';

  const D = global.ExcerlyData;
  const I = () => global.ExcerlyI18n;
  const curLang = () => (I() ? I().lang : 'he');

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
    { n: ['לחם לבן', 'לחם מלא', 'פרוסת לחם', 'לחם', 'טוסט'], per100: 265, slice: 70, portion: 60 },
    { n: ['פיתה', 'פיתות'], perItem: 170 },
    { n: ['לחמניות', 'לחמנייה', 'לחמניה', 'באגט'], perItem: 200 },
    { n: ['מיונז', 'מיונית'], per100: 680, portion: 15 },
    { n: ['דוריטוס', 'ביסלי', 'במבה', 'חטיף', 'אפרופו', 'צ׳יפס תירס', 'תפוצ׳יפס'], per100: 520, portion: 50 },
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

  // תוויות אנגלית לתצוגה (לפי השם העברי הקנוני של המזון)
  const EN_FOOD = {
    'אורז': 'Rice', 'פסטה': 'Pasta', 'קינואה': 'Quinoa', 'בורגול': 'Bulgur', 'קוסקוס': 'Couscous',
    'חזה עוף': 'Chicken', 'הודו': 'Turkey', 'בשר': 'Beef', 'קציצה': 'Meatballs', 'שניצל': 'Schnitzel',
    'סלמון': 'Salmon', 'דג': 'Fish', 'טונה': 'Tuna', 'טופו': 'Tofu', 'ביצה': 'Egg',
    'לחם לבן': 'Bread', 'פיתה': 'Pita', 'לחמניות': 'Roll', 'מיונז': 'Mayonnaise', 'דוריטוס': 'Chips/snack',
    'קרקר': 'Crackers', 'תפוח אדמה': 'Potato', 'ציפס': 'Fries', 'סלט': 'Salad', 'ירקות': 'Vegetables',
    'אבוקדו': 'Avocado', 'חומוס': 'Hummus', 'פול': 'Legumes', 'תפוח': 'Apple', 'בננה': 'Banana',
    'תפוז': 'Orange', 'אגס': 'Pear', 'ענבים': 'Grapes', 'אבטיח': 'Watermelon', 'תות': 'Strawberries',
    'חלב': 'Milk', 'יוגורט': 'Yogurt', 'גבינה לבנה': 'Cottage cheese', 'גבינה צהובה': 'Cheese',
    'שקדים': 'Nuts', 'טחינה': 'Tahini', 'חמאת בוטנים': 'Peanut butter', 'שמן': 'Oil', 'חמאה': 'Butter',
    'סוכר': 'Sugar', 'דבש': 'Honey', 'שוקולד': 'Chocolate', 'עוגה': 'Cake/pastry', 'גלידה': 'Ice cream',
    'פיצה': 'Pizza', 'המבורגר': 'Burger', 'שווארמה': 'Shawarma', 'פלאפל': 'Falafel',
    'קורנפלקס': 'Cereal', 'שיבולת שועל': 'Oatmeal', 'קפה': 'Coffee', 'קפה הפוך': 'Latte',
    'קולה': 'Soft drink', 'בירה': 'Beer', 'יין': 'Wine'
  };
  const foodLabel = food => (curLang() === 'en' && EN_FOOD[food.n[0]]) ? EN_FOOD[food.n[0]] : food.n[0];

  // יחידות מידה → גרמים (התאמה מדויקת לפי מילה שלמה) — עברית + אנגלית
  const UNIT_G = {
    'גרם': 1, 'גר': 1, 'גר׳': 1, "ג'": 1, 'ג׳': 1, 'ג': 1, 'ג״ר': 1,
    'קילו': 1000, 'ק״ג': 1000, 'קג': 1000, 'קילוגרם': 1000,
    'כף': 15, 'כפות': 15, 'כפית': 5, 'כפיות': 5,
    'כוס': 240, 'כוסות': 240, 'מ״ל': 1, 'מל': 1, 'ליטר': 1000, 'ליטרים': 1000,
    'g': 1, 'gr': 1, 'gram': 1, 'grams': 1, 'kg': 1000,
    'tbsp': 15, 'tablespoon': 15, 'tablespoons': 15, 'tsp': 5, 'teaspoon': 5, 'teaspoons': 5,
    'cup': 240, 'cups': 240, 'ml': 1, 'l': 1000, 'liter': 1000, 'litre': 1000
  };
  const SLICE_UNITS = ['פרוסה', 'פרוסות', 'פרוסת', 'slice', 'slices'];
  const ITEM_UNITS = ['יחידה', 'יחידות', 'מנה', 'מנות', 'פיתה', 'פיתות', 'כדור', 'כדורים',
    'piece', 'pieces', 'serving', 'servings', 'unit', 'units'];
  const NUM_WORDS = { 'חצי': 0.5, 'רבע': 0.25, 'שליש': 0.33, 'זוג': 2, 'half': 0.5, 'quarter': 0.25 };

  const clean = t => t.replace(/[.,;:!?()"'״׳]/g, '').trim().toLowerCase();
  const PREPS = ['ב', 'ל', 'ה', 'מ', 'ו', 'כ', 'ש'];
  const stripPrep = w => (w.length > 3 && PREPS.indexOf(w[0]) !== -1) ? w.slice(1) : w;

  // התאמת מזון למחרוזת (מילה או צמד מילים); מחזיר את המזון והשם שהותאם
  function matchFood(str) {
    let best = null, bestSyn = '', bl = 0;
    const variants = [str, stripPrep(str)];
    for (const f of FOODS) {
      for (const s of f.n) {
        for (const v of variants) {
          if ((v === s || v.indexOf(s) === 0) && s.length > bl) { best = f; bestSyn = s; bl = s.length; }
        }
      }
    }
    return best ? { food: best, syn: bestSyn } : null;
  }

  // פירוק לטוקנים תוך הפרדת מספרים דבוקים ("150גרם" → "150","גרם")
  function tokenize(text) {
    return text.split(/[\s,+\n·]+/).filter(Boolean)
      .reduce((acc, tok) => acc.concat(tok.match(/\d+(?:[.,]\d+)?|[^\d]+/g) || [tok]), [])
      .map(clean).filter(Boolean);
  }

  function kcalFor(food, qty, unit) {
    const perItemLike = () => food.perItem
      ? qty * food.perItem
      : (food.per100 ? qty * (food.portion / 100 * food.per100) : 0);
    if (unit && unit.type === 'g') {
      const grams = qty * unit.grams;
      if (food.per100) return grams / 100 * food.per100;
      // מזון הנספר ביחידות שקיבל משקל: מעריכים ~120 גרם ליחידה
      if (food.perItem) return food.perItem * Math.max(1, Math.round(grams / 120));
      return 0;
    }
    if (unit && unit.type === 'slice') {
      return qty * (food.slice || food.perItem || (food.per100 ? food.portion / 100 * food.per100 : 0));
    }
    return perItemLike(); // יחידה / מנה / ללא יחידה
  }

  // הערכה מקומית של קלוריות מטקסט חופשי – סורק פריט אחר פריט על פני המשפט כולו,
  // כך שגם רשימה ללא פסיקים ("טונה 3 כפות מיונז 2 לחמניות פיתה שווארמה") מפורקת נכון.
  /* ---------- הערכת מקרו-נוטריאנטים (חלבון/פחמימה/שומן) ----------
     המאגר המקומי מכיל רק קלוריות, ולכן נאמדים לפי סיווג המזון והתפלגות
     אנרגיה טיפוסית (4 קק"ל/ג׳ לפחמימה וחלבון, 9 קק"ל/ג׳ לשומן). מצב AI
     מחזיר ערכים מדויקים יותר. */
  const MACRO_SPLIT = { // [carb%, protein%, fat%] מתוך הקלוריות
    carb: [0.75, 0.13, 0.12], protein: [0.10, 0.55, 0.35], fat: [0.10, 0.10, 0.80],
    veg: [0.60, 0.20, 0.20], fruit: [0.90, 0.05, 0.05], dairy: [0.40, 0.30, 0.30],
    legume: [0.55, 0.25, 0.20], mixed: [0.50, 0.20, 0.30]
  };
  function macroClass(name) {
    const s = String(name || '').toLowerCase();
    const has = (...w) => w.some(x => s.indexOf(x) !== -1);
    if (has('אורז', 'פסטה', 'ספגטי', 'נודלס', 'קינואה', 'בורגול', 'קוסקוס', 'לחם', 'טוסט', 'פיתה', 'לחמני', 'באגט', 'קרקר', 'מצה', 'תפוח אדמה', 'פירה', 'בטטה', 'ציפס', 'צ׳יפס', "צ'יפס", 'דגני', 'גרנולה', 'שיבולת', 'דייס', 'פנקייק', 'טורטיה', 'סוכר', 'דבש', 'סילאן')) return 'carb';
    if (has('עוף', 'פרגית', 'הודו', 'בשר', 'בקר', 'סטייק', 'אנטריקוט', 'קציצ', 'שניצל', 'סלמון', 'דג', 'טונה', 'טופו', 'ביצה', 'ביצים', 'חביתה', 'אומלט')) return 'protein';
    if (has('גבינה צהובה', 'שמן', 'חמאה', 'טחינה', 'מיונ', 'חמאת בוטנים', 'שקד', 'אגוז', 'קשיו', 'בוטנים', 'אבוקדו')) return 'fat';
    if (has('חלב', 'יוגורט', 'יופלה', 'קוטג', 'גבינה לבנה')) return 'dairy';
    if (has('חומוס', 'עדשים', 'שעועית', 'פול', 'קטני')) return 'legume';
    if (has('סלט', 'ירק', 'מלפפון', 'עגבני', 'גזר', 'פלפל', 'ברוקולי', 'חסה', 'כרוב')) return 'veg';
    if (has('תפוח', 'בננה', 'תפוז', 'קלמנטינ', 'אגס', 'ענבים', 'אבטיח', 'מלון', 'תות', 'פרי')) return 'fruit';
    return 'mixed';
  }
  function macrosFor(name, kcal) {
    const sp = MACRO_SPLIT[macroClass(name)] || MACRO_SPLIT.mixed;
    return { carbs: Math.round(kcal * sp[0] / 4), protein: Math.round(kcal * sp[1] / 4), fat: Math.round(kcal * sp[2] / 9) };
  }

  function estimateLocal(text) {
    const tokens = tokenize(text);
    const items = [];
    const unmatched = [];
    let qty = null, unit = null, i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      // מספר
      const nm = t.match(/^(\d+(?:[.,]\d+)?)$/);
      if (nm) { qty = parseFloat(nm[1].replace(',', '.')); i++; continue; }
      if (NUM_WORDS[t] != null) { qty = NUM_WORDS[t]; i++; continue; }
      // יחידת מידה
      if (UNIT_G[t] != null) { unit = { type: 'g', grams: UNIT_G[t] }; i++; continue; }
      if (SLICE_UNITS.indexOf(t) !== -1) { unit = { type: 'slice' }; i++; continue; }
      if (ITEM_UNITS.indexOf(t) !== -1) { unit = { type: 'item' }; i++; continue; }
      // מזון – קודם צמד מילים (רק אם השם המותאם מכיל רווח), אחרת מילה בודדת
      let m = null, consumed = 1;
      if (i + 1 < tokens.length) {
        const mm = matchFood(t + ' ' + tokens[i + 1]);
        if (mm && mm.syn.indexOf(' ') !== -1) { m = mm; consumed = 2; }
      }
      if (!m) m = matchFood(t);
      if (m) {
        let q = qty, u = unit, j = i + consumed;
        // כמות אחרי המזון ("עוף 150 גרם") – רק אם אחריה לא בא מזון אחר,
        // כדי שכמות מובילה ("3 כפות מיונז") תשויך למזון שאחריה
        if (q == null && tokens[j] && /^\d+(?:[.,]\d+)?$/.test(tokens[j])) {
          const nx = tokens[j + 1];
          const trailUnit = nx && (UNIT_G[nx] != null ? { type: 'g', grams: UNIT_G[nx] }
            : SLICE_UNITS.indexOf(nx) !== -1 ? { type: 'slice' }
              : ITEM_UNITS.indexOf(nx) !== -1 ? { type: 'item' } : null);
          const after = tokens[j + 2];
          const afterIsFood = after && !/^\d/.test(after) && !!matchFood(after);
          if (trailUnit && !afterIsFood) { q = parseFloat(tokens[j].replace(',', '.')); u = trailUnit; j += 2; }
        }
        const kcal = Math.round(kcalFor(m.food, q == null ? 1 : q, u));
        if (kcal > 0) { const nm2 = foodLabel(m.food); items.push(Object.assign({ name: nm2, kcal }, macrosFor(nm2, kcal))); }
        qty = null; unit = null; i = j;
      } else {
        if (t.length > 1) unmatched.push(t); // מילה לא מזוהה (תיאור/מזון חסר)
        i++;
      }
    }
    const total = items.reduce((s, i) => s + i.kcal, 0);
    return { total, items, unmatched, source: 'local' };
  }

  /* ---------- מחולל תפריט יומי מקומי ---------- */
  const DISHES = {
    breakfast: [
      { he: 'חביתת 2 ביצים עם ירקות וטוסט מלא', en: '2-egg omelette with veggies & whole-grain toast', kcal: 320 },
      { he: 'יוגורט יווני עם גרנולה ופירות', en: 'Greek yogurt with granola & fruit', kcal: 350 },
      { he: 'דייסת שיבולת שועל עם בננה ואגוזים', en: 'Oatmeal with banana & nuts', kcal: 400 },
      { he: 'כריך גבינה לבנה, עגבנייה ומלפפון', en: 'Cottage cheese sandwich with tomato & cucumber', kcal: 300 },
      { he: 'שייק חלבון עם בננה וחמאת בוטנים', en: 'Protein shake with banana & peanut butter', kcal: 380 },
      { he: 'לחם מלא עם אבוקדו וביצה קשה', en: 'Whole-grain bread with avocado & boiled egg', kcal: 420 },
      { he: 'שקשוקה עם 2 ביצים ולחם מלא', en: 'Shakshuka with 2 eggs & whole-grain bread', kcal: 480 },
      { he: 'פנקייק שיבולת שועל עם סילאן ופירות', en: 'Oat pancakes with date syrup & fruit', kcal: 520 },
      { he: 'קוטג׳ עם קרקרים מלאים וירק חתוך', en: 'Cottage cheese with whole-grain crackers & veggies', kcal: 260 }
    ],
    lunch: [
      { he: 'חזה עוף בגריל עם אורז מלא וסלט', en: 'Grilled chicken breast with brown rice & salad', kcal: 550 },
      { he: 'קציצות בקר עם פירה וירקות מאודים', en: 'Beef meatballs with mashed potato & steamed veggies', kcal: 600 },
      { he: 'סלמון אפוי עם קינואה וברוקולי', en: 'Baked salmon with quinoa & broccoli', kcal: 520 },
      { he: 'פסטה מלאה ברוטב עגבניות עם עוף', en: 'Whole-grain pasta in tomato sauce with chicken', kcal: 580 },
      { he: 'מנת חומוס עם פיתה מלאה וסלט', en: 'Hummus plate with whole-grain pita & salad', kcal: 480 },
      { he: 'טופו מוקפץ עם אורז וירקות', en: 'Stir-fried tofu with rice & vegetables', kcal: 500 },
      { he: 'סטייק עוף עם תפוחי אדמה אפויים וסלט גדול', en: 'Chicken steak with roasted potatoes & a big salad', kcal: 700 },
      { he: 'בורגר בקר ביתי בלחמנייה מלאה עם ירקות', en: 'Homemade beef burger in a whole-grain bun with veggies', kcal: 720 },
      { he: 'מרק עדשים סמיך עם לחם מלא', en: 'Hearty lentil soup with whole-grain bread', kcal: 450 }
    ],
    dinner: [
      { he: 'סלט טונה גדול עם ביצה וקטניות', en: 'Large tuna salad with egg & legumes', kcal: 400 },
      { he: 'אומלט ירקות עם פרוסת לחם מלא', en: 'Veggie omelette with a slice of whole-grain bread', kcal: 350 },
      { he: 'דג לבן בתנור עם בטטה וסלט', en: 'Baked white fish with sweet potato & salad', kcal: 450 },
      { he: 'מנת פסטה מלאה עם ירקות וגבינה', en: 'Whole-grain pasta with vegetables & cheese', kcal: 520 },
      { he: 'טוסט גדול עם גבינה, ביצה וסלט', en: 'Big toast with cheese, egg & salad', kcal: 500 },
      { he: 'כריך הודו בלחם מלא עם ירקות', en: 'Turkey sandwich on whole-grain bread with veggies', kcal: 420 },
      { he: 'מרק ירקות עם קרוטונים וגבינה', en: 'Vegetable soup with croutons & cheese', kcal: 380 }
    ],
    snack: [
      { he: 'תפוח וכף חמאת בוטנים', en: 'Apple with a tbsp of peanut butter', kcal: 180 },
      { he: 'חופן שקדים', en: 'A handful of almonds', kcal: 160 },
      { he: 'יוגורט עם דבש', en: 'Yogurt with honey', kcal: 150 },
      { he: 'פרי + כמה אגוזים', en: 'Fruit + a few nuts', kcal: 200 },
      { he: 'שייק חלבון', en: 'Protein shake', kcal: 220 },
      { he: 'חופן אגוזים ופרי', en: 'A handful of nuts & fruit', kcal: 250 },
      { he: 'ירקות חתוכים עם חומוס', en: 'Cut vegetables with hummus', kcal: 140 },
      { he: 'בננה', en: 'Banana', kcal: 105 }
    ]
  };
  const SLOT_KEY = { breakfast: 'slotBreakfast', lunch: 'slotLunch', dinner: 'slotDinner', snack: 'slotSnack' };
  const slotLabel = slot => (I() ? I().t(SLOT_KEY[slot]) : slot);
  const dishName = d => (I() ? I().L(d) : d.he);

  function pickNear(list, targetKcal, exclude) {
    const used = Array.isArray(exclude) ? exclude : (exclude ? [exclude] : []);
    let base = list.filter(d => used.indexOf(d.he) === -1);
    if (!base.length) base = list; // אם כולם נוצלו – מאפשרים שוב
    const sorted = base
      .sort((a, b) => Math.abs(a.kcal - targetKcal) - Math.abs(b.kcal - targetKcal));
    const within = sorted.filter(d => Math.abs(d.kcal - targetKcal) <= targetKcal * 0.3);
    if (within.length) return within[Math.floor(Math.random() * within.length)]; // גיוון
    const topK = sorted.slice(0, Math.min(2, sorted.length));
    return topK[Math.floor(Math.random() * topK.length)];
  }

  function generateMealPlan(target) {
    const slots = [['breakfast', 0.25], ['lunch', 0.35], ['dinner', 0.30], ['snack', 0.10]];
    const meals = slots.map(([slot, w]) => {
      const d = pickNear(DISHES[slot], target * w);
      return { slot, label: slotLabel(slot), name: dishName(d), kcal: d.kcal };
    });
    let total = meals.reduce((s, m) => s + m.kcal, 0);
    const usedSnacks = [];
    while (target - total > 180 && usedSnacks.length < 3) {
      const d = pickNear(DISHES.snack, target - total, usedSnacks);
      meals.push({ slot: 'snack', label: slotLabel('snack'), name: dishName(d), kcal: d.kcal });
      total += d.kcal; usedSnacks.push(d.he);
    }
    return { meals, total, target, source: 'local' };
  }

  /* ---------- נירמול תשובות ה-AI למבנה אחיד ---------- */
  function normalizeEstimate(out) {
    const items = (out.items || []).map(i => {
      const kcal = Math.round(i.kcal || 0);
      // אם ה-AI לא החזיר מקרו — נאמד מקומית לפי שם המזון
      const hasMacro = i.carbs != null || i.protein != null || i.fat != null;
      const mac = hasMacro
        ? { carbs: Math.round(i.carbs || 0), protein: Math.round(i.protein || 0), fat: Math.round(i.fat || 0) }
        : macrosFor(i.name, kcal);
      return Object.assign({ name: i.name, kcal }, mac);
    });
    return {
      total: Math.round(out.total || items.reduce((s, i) => s + i.kcal, 0)),
      items, unmatched: [], note: out.note || '', source: 'ai'
    };
  }
  function normalizeMenu(out, target) {
    const meals = (out.meals || []).map(m => ({ label: m.label || '', name: m.name || '', kcal: Math.round(m.kcal || 0) }));
    return {
      meals, total: Math.round(out.total || meals.reduce((s, m) => s + m.kcal, 0)),
      target, note: out.note || '', source: 'ai'
    };
  }

  /* ---------- מצב AI דרך שרת proxy (מומלץ – בלי מפתח בדפדפן) ---------- */
  async function callProxy(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('proxy failed: ' + res.status);
    const data = await res.json();
    if (data && data.error) throw new Error('proxy error: ' + data.error);
    return data;
  }
  async function estimateViaProxy(text, url) {
    return normalizeEstimate(await callProxy(url, { action: 'estimate', text, lang: curLang() }));
  }
  async function mealPlanViaProxy(target, url) {
    return normalizeMenu(await callProxy(url, { action: 'menu', target, lang: curLang() }), target);
  }

  /* ---------- מצב AI ישיר (Claude, מפתח של המשתמש – BYOK) ---------- */
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

  // הנחיית שפת התשובה לפי שפת הממשק
  const langLine = () => curLang() === 'en'
    ? ' Respond in English (name and note in English).'
    : ' החזר את name ואת note בעברית.';

  const IMAGE_SYSTEM_BASE =
    'You are a precise nutrition analyzer. You received a photo of a meal. Identify the items and ' +
    'realistically estimate the total calories based on common portion sizes, considering the visible portion. ' +
    'Return JSON only, no text before or after: ' +
    '{"total": number, "items": [{"name": string, "kcal": number, "carbs": number, "protein": number, "fat": number}], "note": string}. ' +
    'carbs, protein and fat are grams for that item. note is a short sentence. If the image is not food or is unclear, return total=0 and say so in note.';

  const imageContent = (image) => ([
    { type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } },
    { type: 'text', text: 'This is a photo of my meal. Identify the dishes and estimate the total calories.' }
  ]);

  async function estimateImageViaProxy(image, url) {
    return normalizeEstimate(await callProxy(url, { action: 'estimate_image', image, lang: curLang() }));
  }
  async function estimateImageAI(image, key) {
    return normalizeEstimate(await callClaude(key, IMAGE_SYSTEM_BASE + langLine(), imageContent(image), 1024));
  }

  async function estimateAI(text, key) {
    const system = 'You are a nutrition assistant. Given a free-text description (in any language) of what ' +
      'someone ate, realistically estimate the total calories and macronutrients. Return JSON only, no extra text: ' +
      '{"total": number, "items": [{"name": string, "kcal": number, "carbs": number, "protein": number, "fat": number}], "note": string}. ' +
      'carbs, protein and fat are grams for that item.' + langLine();
    return normalizeEstimate(await callClaude(key, system, text, 1024));
  }

  async function mealPlanAI(target, key) {
    const system = 'You are a dietitian. Build a varied, balanced daily menu for a given calorie goal: ' +
      'breakfast, lunch, dinner and one or two snacks, with realistic dishes. The total should be within ' +
      '~10% of the goal. Return JSON only: ' +
      '{"meals": [{"label": string, "name": string, "kcal": number}], "total": number, "note": string}.' + langLine();
    const out = await callClaude(key, 'Daily goal: ' + target + ' kcal.\n' + system,
      'Build me a daily menu for a goal of ' + target + ' calories.', 1500);
    return normalizeMenu(out, target);
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
    if (total > target + tol) return { key: 'over', delta: total - target, color: '#e74c3c' };
    if (total >= target - tol) return { key: 'met', delta: 0, color: '#2ecc71' };
    return { key: 'under', delta: target - total, color: '#4aa3ff' };
  }

  global.ExcerlyNutrition = {
    estimateLocal, generateMealPlan,
    estimateAI, mealPlanAI, estimateImageAI,         // BYOK ישיר
    estimateViaProxy, mealPlanViaProxy, estimateImageViaProxy, // דרך שרת proxy
    targetCalories, verdict, macrosFor
  };
})(window);
