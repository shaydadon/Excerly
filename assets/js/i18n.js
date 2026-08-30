/* =============================================================
   Excerly – i18n (עברית / English)
   ============================================================= */
(function (global) {
  'use strict';

  const DICT = {
    he: {
      appSub: 'יומן המתיחות והכושר הביתי שלך',
      langName: 'עברית',
      streakTitle: 'רצף אימונים 🔥',
      streakDays: '{n} ימים', daysWord: 'ימים',
      totalDone: 'סה״כ אימונים שהושלמו: ',
      todayBtn: 'האימון של היום ←',
      phAge: 'לדוגמה: 30', phWeight: 'לדוגמה: 72', phHeight: 'לדוגמה: 172',

      profileTitle: 'פרופיל בריאות ו-BMI',
      profileHint: 'מלאו את הפרטים לחישוב מדד מסת גוף, קלוריות יומיות והמלצות תזונה.',
      age: 'גיל', weight: 'משקל (ק״ג)', height: 'גובה (ס״מ)',
      gender: 'מין', male: 'זכר', female: 'נקבה',
      activity: 'רמת פעילות',
      actSedentary: 'יושבני (מעט מאוד פעילות)',
      actLight: 'קל (1–3 אימונים בשבוע)',
      actModerate: 'בינוני (3–5 אימונים בשבוע)',
      actActive: 'פעיל (6–7 אימונים בשבוע)',
      calcBmiBtn: 'חשב/י BMI וקלוריות',
      bmiCap: 'BMI',
      perDay: 'קק"ל ליום (לשמירה על המשקל)',
      bmrLine: 'חילוף חומרים בסיסי: {bmr} קק"ל · רמת פעילות: {act}',
      protein: 'חלבון', carbs: 'פחמימות', fat: 'שומן', grams: 'ג׳',

      catUnder: 'תת-משקל', catNormal: 'משקל תקין', catOver: 'עודף משקל', catObese: 'השמנה',
      advUnder: 'מומלץ להעלות במשקל בצורה בריאה. הוסיפו חטיפים עשירים בקלוריות כמו אגוזים, אבוקדו וטחינה, והקפידו על ארוחות סדירות.',
      advNormal: 'משקל בריא! שמרו על תזונה מאוזנת עם ירקות, חלבון איכותי ופחמימות מלאות, והמשיכו בפעילות גופנית קבועה.',
      advOver: 'כדאי לשים לב לגודל המנות ולהפחית סוכר ומזון מעובד. הגבירו צריכת ירקות וחלבון רזה ושלבו פעילות אירובית.',
      advObese: 'מומלץ להתייעץ עם איש מקצוע. התמקדו בתזונה דלת קלוריות ועשירה בסיבים, שתו הרבה מים והגבירו פעילות גופנית בהדרגה.',

      nutriTitle: 'מעקב תזונה יומי',
      aiActive: '✨ AI פעיל',
      nutriHint: 'כתבו בטקסט חופשי מה אכלתם — Claude יבין ויעריך את הקלוריות, ויראה אם עמדתם ביעד.',
      needProfile: 'מלאו את פרטי הפרופיל למעלה כדי לקבל יעד קלוריות יומי מותאם.',
      goalLabel: 'היעד היומי שלך', goalUnit: 'קק"ל',
      foodLabel: 'מה אכלת היום?',
      foodPlaceholder: 'לדוגמה: 2 ביצים, פרוסת לחם מלא, חזה עוף 150 גרם, תפוח וכוס אורז',
      calcBtn: 'חשב קלוריות', calcBtnBusy: 'Claude מחשב…',
      menuBtn: '🍽️ בנה לי תפריט יומי', menuBtnBusy: 'Claude בונה…',
      photoBtn: '📷 חשב לפי תמונה של הארוחה', photoBtnBusy: 'Claude מנתח את התמונה…',
      vOver: 'חרגת מהיעד', vMet: 'עמדת ביעד! 🎯', vUnder: 'מתחת ליעד',
      dOver: 'חרגת ב-{n} קק"ל', dUnder: 'נותרו לך {n} קק"ל להיום', dMet: 'נשארת בטווח היעד',
      ofTarget: '{a} מתוך {b} קק"ל · {d}',
      srcAi: '✨ הוערך באמצעות Claude AI',
      srcLocal: 'הערכה מקומית — לחישוב מדויק יותר הפעילו מצב AI למטה',
      estimateLabel: 'אומדן: {n} קק"ל',
      addAll: '➕ הוסף הכל ליום',
      addMealAria: 'הוסף מנה ליום',
      dayMealsTitle: '🍽️ הארוחות של היום',
      removeMealAria: 'הסר מנה',
      mealLabel: 'ארוחה',
      toastAdded: 'נוסף ליום ✓', toastRemoved: 'הוסר מהיום ✓',
      itemsEmpty: 'לא זיהיתי פריטי מזון. נסו לפרט יותר, למשל "2 ביצים, פרוסת לחם, תפוח".',
      unmatched: 'לא זוהו: {list} — לא נכללו בחישוב.',
      menuTitle: 'תפריט יומי מוצע', menuShuffle: '🔄 תפריט אחר',
      menuTotal: 'סה"כ כ-{n} קק"ל (יעד: {t})', menuTotalNoTarget: 'סה"כ כ-{n} קק"ל',
      menuSrcAi: '✨ נבנה באמצעות Claude AI',
      slotBreakfast: 'ארוחת בוקר', slotLunch: 'ארוחת צהריים', slotDinner: 'ארוחת ערב', slotSnack: 'חטיף',
      aiSettings: '⚙️ הגדרות AI (ניתוח טקסט חכם באמצעות Claude)',
      aiNote1: 'כשמחובר שרת AI, האפליקציה מבינה כל טקסט חופשי ומחשבת קלוריות בעזרת Claude — אוטומטית. ללא חיבור, פועל מנוע ההערכה המקומי.',
      proxyLabel: 'כתובת שרת ה-AI (Proxy URL) — מומלץ',
      aiNote2: 'מגדירים פעם אחת שרת proxy קטן (Cloudflare Worker) שמחזיק את המפתח בצד השרת — ואז ה-AI עובד לכל מי שנכנס לאתר, בלי לחשוף מפתח.',
      advSummary: 'אפשרות למתקדמים: מפתח ישיר במכשיר (BYOK)',
      keyLabel: 'מפתח Anthropic API (sk-ant-...)',
      keyToggle: 'השתמש במפתח המקומי (נשמר רק במכשיר זה)',

      calTitle: 'יומן האימונים',
      prevMonth: 'חודש קודם', nextMonth: 'חודש הבא',
      legHas: 'יש אימון', legDone: 'הושלם', legRest: 'מנוחה', legTap: 'לחצו על יום כדי לפתוח את האימון',

      histTitle: 'היסטוריה ומגמות',
      statWorkouts: 'אימונים שהושלמו', statAvg: 'ממוצע קק"ל ליום', statOnTarget: 'ימים ביעד',
      range7: '7 ימים', range30: '30 יום',
      legMetC: 'ביעד', legOverC: 'חריגה', legUnderC: 'מתחת ליעד', legTargetLine: 'קו היעד', legWorkoutDone: '✓ אימון הושלם',
      histSub: 'היסטוריה אחרונה', rowWorkout: '✓ אימון', rowRest: '☕ מנוחה', targetShort: 'יעד',

      reminderTitle: 'תזכורת יומית', reminderTimeLabel: 'שעת התזכורת',
      remUnsupported: 'הדפדפן אינו תומך בהתראות. נשמח להזכיר לך בכל פתיחה של האפליקציה.',
      remActive: 'תזכורת יומית פעילה לשעה {time}. השאירו את האפליקציה פתוחה או פתחו אותה במהלך היום.',
      remBlocked: 'ההתראות חסומות בדפדפן. אפשר לאשר אותן בהגדרות האתר.',
      remOff: 'התזכורות כבויות.',
      notifTitle: 'Excerly – זמן להתמתח!',
      notifRest: 'היום מנוחה פעילה 🧘 קחו כמה דקות למתיחות רגועות.',
      notifWorkout: 'הגיע הזמן לאימון "{title}" 💪 {n} תרגילים מחכים לך.',

      footer: 'Excerly · אפליקציית כושר ביתי · הנתונים נשמרים במכשיר שלך בלבד',

      // דינמי (workout sheet / toasts)
      dayLabel: 'יום {day}, {d} ב{month}',
      dayLabelEn: '', // לא בשימוש בעברית
      exCount: '🧘 {n} תרגילים', minutesChip: '⏱ כ-{n} דק׳', restChip: '☕ יום מנוחה פעילה',
      progressChip: '✅ {d}/{n} הושלמו', foodChip: '🍎 {t} קק"ל',
      holdPrefix: 'החזקה', repsSep: ' · החזקה ',
      dayDoneBtn: '✓ סיימתי את כל האימון', dayUndoBtn: '↺ בטל סימון האימון',
      doneBanner: '🎉 כל הכבוד! השלמת את האימון להיום',
      back: '→ חזרה לרשימה', detailFinish: '✓ סיימתי את התרגיל', detailUnfinish: '↺ בטל סימון התרגיל',
      startWorkout: '▶ התחל אימון מודרך',
      playerOf: '{i} מתוך {n}', playerDone: '🎉 סיימת את האימון!', closeWord: 'סגור',
      ariaClose: 'סגור', ariaPrev: 'התרגיל הקודם', ariaNext: 'התרגיל הבא', ariaPlay: 'המשך', ariaPause: 'השהה',
      finishMark: 'סיום תרגיל', finishUnmark: 'בטל סימון', tipLabel: 'טיפ:',
      badgeReps: '🔁 {r}', badgeHold: '⏳ החזקה {h}',
      tOver: 'חרגת מהיעד',
      toastSaved: 'הנתונים נשמרו ✓', toastFillAWH: 'נא למלא גיל, משקל וגובה',
      toastFillProfile: 'מלאו קודם את פרטי הפרופיל', toastWriteFood: 'כתבו מה אכלתם היום',
      toastAiErrLocal: 'שגיאת AI — עברתי למנוע המקומי', toastAiErrMenu: 'שגיאת AI — בניתי תפריט מקומי',
      toastNeedAiPhoto: 'חישוב לפי תמונה דורש AI — הפעילו מצב AI בהגדרות ⚙️',
      toastImgRead: 'לא הצלחתי לקרוא את התמונה', toastImgErr: 'שגיאה בניתוח התמונה — נסו שוב',
      toastEnterKey: 'הזינו מפתח API כדי להפעיל מצב AI',
      toastExDone: 'תרגיל הושלם ✓', toastAllDone: 'כל הכבוד! השלמת את כל האימון 💪',
      toastUnmark: 'הסימון בוטל', toastWorkoutDone: 'אימון הושלם! 💪',
      toastReminderPerm: 'כדי לקבל תזכורות צריך לאשר התראות',
      toastReminderNow: '⏰ זמן לאימון היומי!',
      toastMissed: 'עוד לא התאמנת היום – {title} מחכה לך 💪'
    },

    en: {
      appSub: 'Your home stretching & fitness journal',
      langName: 'English',
      streakTitle: 'Workout streak 🔥',
      streakDays: '{n} days', daysWord: 'days',
      totalDone: 'Total workouts completed: ',
      todayBtn: "Today's workout →",
      phAge: 'e.g. 30', phWeight: 'e.g. 72', phHeight: 'e.g. 172',

      profileTitle: 'Health profile & BMI',
      profileHint: 'Fill in your details to calculate BMI, daily calories and nutrition tips.',
      age: 'Age', weight: 'Weight (kg)', height: 'Height (cm)',
      gender: 'Gender', male: 'Male', female: 'Female',
      activity: 'Activity level',
      actSedentary: 'Sedentary (little to no exercise)',
      actLight: 'Light (1–3 workouts/week)',
      actModerate: 'Moderate (3–5 workouts/week)',
      actActive: 'Active (6–7 workouts/week)',
      calcBmiBtn: 'Calculate BMI & calories',
      bmiCap: 'BMI',
      perDay: 'kcal/day (to maintain weight)',
      bmrLine: 'Basal metabolic rate: {bmr} kcal · Activity: {act}',
      protein: 'Protein', carbs: 'Carbs', fat: 'Fat', grams: 'g',

      catUnder: 'Underweight', catNormal: 'Healthy weight', catOver: 'Overweight', catObese: 'Obese',
      advUnder: 'Aim to gain weight healthily. Add calorie-rich snacks like nuts, avocado and tahini, and keep regular meals.',
      advNormal: 'Healthy weight! Keep a balanced diet with vegetables, quality protein and whole grains, and stay active.',
      advOver: 'Watch portion sizes and cut sugar and processed food. Add vegetables and lean protein, and include cardio.',
      advObese: 'Consider consulting a professional. Focus on a lower-calorie, high-fiber diet, drink plenty of water and add activity gradually.',

      nutriTitle: 'Daily nutrition tracker',
      aiActive: '✨ AI on',
      nutriHint: 'Write in free text what you ate — Claude will understand it and estimate the calories, and show if you met your goal.',
      needProfile: 'Fill in your profile above to get a personalized daily calorie goal.',
      goalLabel: 'Your daily goal', goalUnit: 'kcal',
      foodLabel: 'What did you eat today?',
      foodPlaceholder: 'e.g.: 2 eggs, a slice of whole-grain bread, 150g chicken breast, an apple and a cup of rice',
      calcBtn: 'Calculate calories', calcBtnBusy: 'Claude is calculating…',
      menuBtn: '🍽️ Build me a daily menu', menuBtnBusy: 'Claude is building…',
      photoBtn: '📷 Calculate from a meal photo', photoBtnBusy: 'Claude is analyzing the photo…',
      vOver: 'Over your goal', vMet: 'On target! 🎯', vUnder: 'Below your goal',
      dOver: '{n} kcal over', dUnder: '{n} kcal left for today', dMet: 'Within your target range',
      ofTarget: '{a} of {b} kcal · {d}',
      srcAi: '✨ Estimated by Claude AI',
      srcLocal: 'Local estimate — enable AI below for a more accurate result',
      estimateLabel: 'Estimate: {n} kcal',
      addAll: '➕ Add all to today',
      addMealAria: 'Add dish to today',
      dayMealsTitle: "🍽️ Today's meals",
      removeMealAria: 'Remove dish',
      mealLabel: 'Meal',
      toastAdded: 'Added ✓', toastRemoved: 'Removed ✓',
      itemsEmpty: "I couldn't identify any foods. Try to be more specific, e.g. \"2 eggs, a slice of bread, an apple\".",
      unmatched: 'Not recognized: {list} — not included in the total.',
      menuTitle: 'Suggested daily menu', menuShuffle: '🔄 Another menu',
      menuTotal: '≈ {n} kcal total (goal: {t})', menuTotalNoTarget: '≈ {n} kcal total',
      menuSrcAi: '✨ Built by Claude AI',
      slotBreakfast: 'Breakfast', slotLunch: 'Lunch', slotDinner: 'Dinner', slotSnack: 'Snack',
      aiSettings: '⚙️ AI settings (smart text analysis with Claude)',
      aiNote1: 'When an AI server is connected, the app understands any free text and computes calories with Claude — automatically. Without it, the local estimator runs.',
      proxyLabel: 'AI server address (Proxy URL) — recommended',
      aiNote2: 'Set up a small proxy server once (a Cloudflare Worker) that holds the key server-side — then AI works for anyone who opens the site, without exposing a key.',
      advSummary: 'Advanced: direct key on this device (BYOK)',
      keyLabel: 'Anthropic API key (sk-ant-...)',
      keyToggle: 'Use the local key (stored on this device only)',

      calTitle: 'Workout calendar',
      prevMonth: 'Previous month', nextMonth: 'Next month',
      legHas: 'Has workout', legDone: 'Completed', legRest: 'Rest', legTap: 'Tap a day to open its workout',

      histTitle: 'History & trends',
      statWorkouts: 'Workouts completed', statAvg: 'Avg kcal/day', statOnTarget: 'Days on target',
      range7: '7 days', range30: '30 days',
      legMetC: 'On target', legOverC: 'Over', legUnderC: 'Under goal', legTargetLine: 'Goal line', legWorkoutDone: '✓ Workout done',
      histSub: 'Recent history', rowWorkout: '✓ Workout', rowRest: '☕ Rest', targetShort: 'goal',

      reminderTitle: 'Daily reminder', reminderTimeLabel: 'Reminder time',
      remUnsupported: "Your browser doesn't support notifications. We'll remind you whenever you open the app.",
      remActive: 'Daily reminder is on for {time}. Keep the app open or open it during the day.',
      remBlocked: 'Notifications are blocked in the browser. You can allow them in the site settings.',
      remOff: 'Reminders are off.',
      notifTitle: 'Excerly – time to stretch!',
      notifRest: "Today is active rest 🧘 Take a few minutes for some gentle stretching.",
      notifWorkout: 'Time for your "{title}" workout 💪 {n} exercises are waiting.',

      footer: 'Excerly · home fitness app · your data is stored on your device only',

      dayLabel: '{day}, {month} {d}',
      dayLabelEn: '',
      exCount: '🧘 {n} exercises', minutesChip: '⏱ ~{n} min', restChip: '☕ Active rest day',
      progressChip: '✅ {d}/{n} done', foodChip: '🍎 {t} kcal',
      holdPrefix: 'hold', repsSep: ' · hold ',
      dayDoneBtn: '✓ I finished the whole workout', dayUndoBtn: '↺ Unmark workout',
      doneBanner: "🎉 Well done! You've completed today's workout",
      back: '← Back to list', detailFinish: '✓ I finished this exercise', detailUnfinish: '↺ Unmark exercise',
      startWorkout: '▶ Start guided workout',
      playerOf: '{i} of {n}', playerDone: '🎉 Workout complete!', closeWord: 'Close',
      ariaClose: 'Close', ariaPrev: 'Previous exercise', ariaNext: 'Next exercise', ariaPlay: 'Play', ariaPause: 'Pause',
      finishMark: 'Finish exercise', finishUnmark: 'Unmark', tipLabel: 'Tip:',
      badgeReps: '🔁 {r}', badgeHold: '⏳ hold {h}',
      tOver: 'over your goal',
      toastSaved: 'Saved ✓', toastFillAWH: 'Please fill in age, weight and height',
      toastFillProfile: 'Fill in your profile first', toastWriteFood: 'Write what you ate today',
      toastAiErrLocal: 'AI error — switched to the local engine', toastAiErrMenu: 'AI error — built a local menu',
      toastNeedAiPhoto: 'Photo calculation requires AI — enable AI in settings ⚙️',
      toastImgRead: "Couldn't read the image", toastImgErr: 'Error analyzing the photo — try again',
      toastEnterKey: 'Enter an API key to enable AI mode',
      toastExDone: 'Exercise done ✓', toastAllDone: "Great job! You've completed the whole workout 💪",
      toastUnmark: 'Unmarked', toastWorkoutDone: 'Workout completed! 💪',
      toastReminderPerm: 'To get reminders you need to allow notifications',
      toastReminderNow: '⏰ Time for your daily workout!',
      toastMissed: "You haven't worked out today – {title} is waiting 💪"
    }
  };

  const DAY_NAMES = {
    he: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  const DAY_SHORT = {
    he: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  };
  const MONTH_NAMES = {
    he: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  const STORE_KEY = 'excerly.lang';
  let lang = 'he';
  try { const s = localStorage.getItem(STORE_KEY); if (s === 'he' || s === 'en') lang = s; } catch (e) {}

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key] != null) ? DICT[lang][key] : (DICT.he[key] != null ? DICT.he[key] : key);
    if (vars) for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    return s;
  }
  // בחירת ערך דו-לשוני מאובייקט {he,en} (או החזרת הערך כמו שהוא)
  function L(obj) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj) && ('he' in obj || 'en' in obj)) {
      return obj[lang] != null ? obj[lang] : obj.he;
    }
    return obj;
  }
  const dayNames = () => DAY_NAMES[lang];
  const dayShort = () => DAY_SHORT[lang];
  const monthNames = () => MONTH_NAMES[lang];

  function applyStatic(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }

  function setLang(next) {
    if (next !== 'he' && next !== 'en') return;
    lang = next;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    applyStatic();
    document.dispatchEvent(new CustomEvent('excerly:lang', { detail: { lang } }));
  }

  global.ExcerlyI18n = {
    t, L, setLang, applyStatic, dayNames, dayShort, monthNames,
    get lang() { return lang; }
  };
})(window);
