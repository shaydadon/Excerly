/* =============================================================
   Excerly – הגדרות ריצה (לא סודות!)
   fdcProxy: כתובת ה-Worker שמחזיק את מפתח USDA בצד השרת.
     GitHub Pages הוא אחסון סטטי — ‎/api/fdc‎ שם מחזיר 405, לכן חייבים כתובת חיצונית.
     משתמש יכול לדרוס בהגדרות ה-AI (excerly.ai.proxyUrl).
   mealImageProvider: נקודת קצה (POST) שמחזירה תמונה מייצגת לארוחה. null = לא מוגדר.
   ============================================================= */
window.EXCERLY_CONFIG = Object.assign({
  fdcProxy: 'https://excerly.shaydadon.workers.dev',
  mealImageProvider: null
}, window.EXCERLY_CONFIG || {});
