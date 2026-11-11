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
  // No unmatched meal may inherit a photo of a different dish (generic-plate is grilled vegetables + buckwheat + arugula).
  const GENERIC = { id: 'no-photo', src: null, kind: 'placeholder' };

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
    return { src: GENERIC.src, kind: GENERIC.kind || 'placeholder', id: GENERIC.id };
  }

  function forMeal(meal) {
    if (meal && meal.photoKind === 'user' && meal.photo) return { src: meal.photo, kind: 'user' };
    if (meal && meal.image && meal.image.src && !(meal.image.kind === 'generated' && meal.image.v !== 2)) return meal.image;
    return representative(meal);
  }

  // ספק חיצוני אופציונלי; כישלון = נשארים עם התמונה המייצגת
  async function requestFromProvider(meal) {
    const conf = global.EXCERLY_CONFIG || {};
    if (!conf.mealImageProvider || (meal && meal.photoKind === 'user' && meal.photo)) return null;
    if (representative(meal).src) return null;
    try {
      const res = await fetch(conf.mealImageProvider, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'meal_image',
          dishEn: meal.dishEn || '',
          items: (meal.components || []).map(c => ({
            queryEn: c.queryEn || '',
            cookingMethod: c.cookingMethod || c.method || ''
          }))
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.src) return null;
      return { src: String(data.src), kind: 'generated', provider: 'runtime' };
    } catch (e) { return null; }
  }

  global.ExcerlyMealImage = { forMeal: forMeal, representative: representative, requestFromProvider: requestFromProvider, LIBRARY: LIBRARY, GENERIC: GENERIC };
})(typeof window !== 'undefined' ? window : globalThis);
