/* =============================================================
   Excerly – משבצת תמונה לכל ארוחה (per-meal image slot)
   סדר עדיפות: תמונת המשתמש → meal.image שכבר נשמרה (למשל מספק תמונות)
   → תמונה מייצגת מקומית לפי המנה → תמונה מייצגת כללית. אף פעם לא אייקון שקית.
   ספק בזמן ריצה: EXCERLY_CONFIG.mealImageProvider (POST {action:'meal_image', name, items})
   שמחזיר {src}. לא מוגדר כרגע (ראו worker/README.md לספק עתידי).
   ============================================================= */
(function (global) {
  'use strict';

  // תמונות מייצגות מקומיות (נוצרו לתצוגה מקדימה — לא תמונת הארוחה עצמה)
  const LIBRARY = [
    { id: 'entrecote-sandwich', src: 'assets/meal-img/entrecote-sandwich.jpg', all: ['entrecote'], any: ['roll', 'whiteBread', 'wheatBread', 'pita'] }
  ];
  const GENERIC = { id: 'generic-plate', src: 'assets/meal-img/generic-plate.jpg' };

  function keysOf(meal) {
    return (meal && meal.components || []).map(c => c.coreKey).filter(Boolean);
  }

  function representative(meal) {
    const keys = keysOf(meal);
    for (let i = 0; i < LIBRARY.length; i++) {
      const e = LIBRARY[i];
      const okAll = e.all.every(k => keys.indexOf(k) !== -1);
      const okAny = !e.any || e.any.some(k => keys.indexOf(k) !== -1);
      if (okAll && okAny) return { src: e.src, kind: 'representative', id: e.id };
    }
    return { src: GENERIC.src, kind: 'generic', id: GENERIC.id };
  }

  function forMeal(meal) {
    if (meal && meal.photoKind === 'user' && meal.photo) return { src: meal.photo, kind: 'user' };
    if (meal && meal.image && meal.image.src) return meal.image;
    return representative(meal);
  }

  // ספק חיצוני אופציונלי; כישלון = נשארים עם התמונה המייצגת
  async function requestFromProvider(meal) {
    const conf = global.EXCERLY_CONFIG || {};
    if (!conf.mealImageProvider || (meal && meal.photoKind === 'user')) return null;
    try {
      const res = await fetch(conf.mealImageProvider, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'meal_image', name: meal.name, items: (meal.components || []).map(c => c.queryEn || c.name) })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.src) return null;
      return { src: String(data.src), kind: 'generated', provider: 'runtime' };
    } catch (e) { return null; }
  }

  global.ExcerlyMealImage = { forMeal: forMeal, representative: representative, requestFromProvider: requestFromProvider, LIBRARY: LIBRARY, GENERIC: GENERIC };
})(typeof window !== 'undefined' ? window : globalThis);
