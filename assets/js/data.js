/* =============================================================
   Excerly – נתוני התרגילים, התוכנית השבועית ולוגיקת התזונה
   ============================================================= */
(function (global) {
  'use strict';

  /* ----- מאגר התרגילים -----
     כל תרגיל: מזהה, שם, שרירים, הוראות, חזרות, משך, ומפתח האנימציה
     (animation) שמצייר את התנועה ב-SVG. */
  const EXERCISES = {
    neck: {
      id: 'neck',
      name: 'מתיחת צוואר',
      area: 'צוואר וכתפיים',
      animation: 'neck',
      reps: '3 חזרות לכל צד',
      hold: '20 שניות',
      duration: 120,
      steps: [
        'שבו או עמדו זקוף עם כתפיים רפויות.',
        'הטו את הראש בעדינות לכיוון הכתף עד לתחושת מתיחה.',
        'החזיקו 20 שניות ונשמו עמוק.',
        'חזרו למרכז והחליפו צד.'
      ],
      tip: 'אל תרימו את הכתף לכיוון האוזן – השאירו אותה רפויה.'
    },
    shoulders: {
      id: 'shoulders',
      name: 'סיבובי כתפיים',
      area: 'כתפיים',
      animation: 'shoulders',
      reps: '10 סיבובים לכל כיוון',
      hold: '—',
      duration: 90,
      steps: [
        'עמדו זקוף עם ידיים רפויות לצדדים.',
        'סובבו את הכתפיים אחורה בתנועה מעגלית איטית.',
        'בצעו 10 סיבובים ואז החליפו כיוון.'
      ],
      tip: 'תנועה איטית ומבוקרת עדיפה על מהירה.'
    },
    arms: {
      id: 'arms',
      name: 'מעגלי זרועות',
      area: 'כתפיים וזרועות',
      animation: 'arms',
      reps: '12 סיבובים לכל כיוון',
      hold: '—',
      duration: 90,
      steps: [
        'עמדו עם רגליים ברוחב הכתפיים.',
        'פרשו את הזרועות לצדדים בגובה הכתף.',
        'צרו מעגלים קטנים ואז הגדילו אותם בהדרגה.'
      ],
      tip: 'שמרו על הבטן אסופה כדי לייצב את הגב.'
    },
    sidebend: {
      id: 'sidebend',
      name: 'הטיית גו לצד',
      area: 'מותניים וגו',
      animation: 'sidebend',
      reps: '4 חזרות לכל צד',
      hold: '15 שניות',
      duration: 120,
      steps: [
        'עמדו עם רגליים ברוחב האגן.',
        'הרימו יד אחת מעל הראש והטו את הגו לצד הנגדי.',
        'הרגישו מתיחה לאורך המותן והחזיקו.',
        'חזרו למרכז והחליפו צד.'
      ],
      tip: 'הימנעו מהטיה קדימה – התנועה היא לצד בלבד.'
    },
    twist: {
      id: 'twist',
      name: 'סיבוב עמוד שדרה',
      area: 'גב תחתון וגו',
      animation: 'twist',
      reps: '6 חזרות לכל צד',
      hold: '10 שניות',
      duration: 120,
      steps: [
        'עמדו עם רגליים ברוחב הכתפיים וידיים בגובה החזה.',
        'סובבו את פלג הגוף העליון לצד תוך שמירה על אגן יציב.',
        'החזיקו רגע וחזרו למרכז, החליפו צד.'
      ],
      tip: 'שמרו על הרגליים נטועות במקום לאורך התנועה.'
    },
    forwardfold: {
      id: 'forwardfold',
      name: 'כפיפה קדימה',
      area: 'גב תחתון ורגליים אחוריות',
      animation: 'forwardfold',
      reps: '3 חזרות',
      hold: '25 שניות',
      duration: 150,
      steps: [
        'עמדו זקוף עם רגליים מעט פשוקות.',
        'התכופפו קדימה מהאגן והשתלשלו כלפי מטה.',
        'תנו לראש ולזרועות להישאר רפויים.',
        'התרוממו לאט חוליה אחר חוליה.'
      ],
      tip: 'כפפו מעט את הברכיים אם הגב התחתון מתוח.'
    },
    hamstring: {
      id: 'hamstring',
      name: 'מתיחת ירך אחורית בישיבה',
      area: 'רגליים אחוריות',
      animation: 'hamstring',
      reps: '3 חזרות לכל רגל',
      hold: '30 שניות',
      duration: 180,
      steps: [
        'שבו על הרצפה עם רגל אחת ישרה קדימה.',
        'קפלו את הרגל השנייה פנימה.',
        'הושיטו ידיים לכיוון כף הרגל הישרה.',
        'החזיקו ונשמו, ואז החליפו רגל.'
      ],
      tip: 'שמרו על גב ישר ככל האפשר במקום לעגל אותו.'
    },
    butterfly: {
      id: 'butterfly',
      name: 'מתיחת פרפר',
      area: 'מפשעה וירך פנימית',
      animation: 'butterfly',
      reps: '2 חזרות',
      hold: '30 שניות',
      duration: 120,
      steps: [
        'שבו והצמידו את כפות הרגליים זו לזו.',
        'החזיקו את כפות הרגליים בידיים.',
        'הורידו בעדינות את הברכיים לכיוון הרצפה.',
        'החזיקו ונשמו עמוק.'
      ],
      tip: 'ישבו זקוף – דמיינו חוט שמושך את הראש כלפי מעלה.'
    },
    quad: {
      id: 'quad',
      name: 'מתיחת ירך קדמית',
      area: 'ירך קדמית',
      animation: 'quad',
      reps: '3 חזרות לכל רגל',
      hold: '25 שניות',
      duration: 150,
      steps: [
        'עמדו והיעזרו בקיר לשיווי משקל.',
        'תפסו את כף הרגל ומשכו את העקב לכיוון הישבן.',
        'שמרו על הברכיים צמודות והחזיקו.',
        'החליפו רגל.'
      ],
      tip: 'דחפו מעט את האגן קדימה להעצמת המתיחה.'
    },
    hipflexor: {
      id: 'hipflexor',
      name: 'מתיחת מכופף ירך',
      area: 'ירך וזוקפי גב',
      animation: 'hipflexor',
      reps: '2 חזרות לכל צד',
      hold: '30 שניות',
      duration: 150,
      steps: [
        'רדו לתנוחת פסיעה – ברך אחת על הרצפה.',
        'דחפו את האגן קדימה בעדינות.',
        'שמרו על גב זקוף וחזה פתוח.',
        'החזיקו והחליפו צד.'
      ],
      tip: 'הניחו מגבת מתחת לברך לנוחות.'
    },
    calf: {
      id: 'calf',
      name: 'מתיחת שוק',
      area: 'שוקיים',
      animation: 'calf',
      reps: '3 חזרות לכל רגל',
      hold: '25 שניות',
      duration: 150,
      steps: [
        'עמדו מול קיר והניחו עליו את הידיים.',
        'הושיטו רגל אחת אחורה עם עקב צמוד לרצפה.',
        'כופפו את הברך הקדמית עד לתחושת מתיחה בשוק.',
        'החזיקו והחליפו רגל.'
      ],
      tip: 'הצביעו עם אצבעות הרגל האחורית ישר קדימה.'
    },
    catcow: {
      id: 'catcow',
      name: 'חתול-פרה',
      area: 'עמוד שדרה',
      animation: 'catcow',
      reps: '10 חזרות',
      hold: '—',
      duration: 120,
      steps: [
        'רדו לתנוחת ארבע – ידיים מתחת לכתפיים.',
        'שאפו וקערו את הגב כלפי מטה (פרה).',
        'נשפו וקמרו את הגב כלפי מעלה (חתול).',
        'המשיכו בתנועה זורמת עם הנשימה.'
      ],
      tip: 'תאמו כל תנועה לנשימה איטית ועמוקה.'
    },
    cobra: {
      id: 'cobra',
      name: 'תנוחת קוברה',
      area: 'בטן וגב תחתון',
      animation: 'cobra',
      reps: '3 חזרות',
      hold: '20 שניות',
      duration: 120,
      steps: [
        'שכבו על הבטן עם כפות ידיים ליד החזה.',
        'דחפו בעדינות והרימו את פלג הגוף העליון.',
        'שמרו על האגן צמוד לרצפה וכתפיים למטה.',
        'החזיקו ואז הורידו לאט.'
      ],
      tip: 'אל תנעלו את המרפקים – שמרו על כיפוף קל.'
    },
    child: {
      id: 'child',
      name: 'תנוחת הילד',
      area: 'גב וכתפיים',
      animation: 'child',
      reps: '2 חזרות',
      hold: '40 שניות',
      duration: 120,
      steps: [
        'שבו על העקבים והורידו את הגו קדימה.',
        'הושיטו את הזרועות קדימה על הרצפה.',
        'הניחו את המצח על הרצפה ונשמו עמוק.',
        'הישארו בתנוחה והירגעו.'
      ],
      tip: 'תנוחת רגיעה מצוינת לסיום האימון.'
    }
  };

  /* ----- התוכנית השבועית -----
     0=ראשון ... 6=שבת. כל יום כולל שם מיקוד ורשימת מזהי תרגילים.
     ימי מנוחה מסומנים ב-rest. */
  const WEEKLY_PROGRAM = [
    { day: 0, title: 'פלג גוף עליון', focus: 'צוואר, כתפיים וזרועות',
      exercises: ['neck', 'shoulders', 'arms', 'sidebend'] },
    { day: 1, title: 'גב וליבה', focus: 'עמוד שדרה וגב תחתון',
      exercises: ['catcow', 'cobra', 'twist', 'child'] },
    { day: 2, title: 'פלג גוף תחתון', focus: 'רגליים וירכיים',
      exercises: ['hamstring', 'quad', 'calf', 'butterfly'] },
    { day: 3, title: 'מנוחה פעילה', focus: 'התאוששות ונשימה', rest: true,
      exercises: ['child', 'catcow'] },
    { day: 4, title: 'גמישות מלאה', focus: 'כל הגוף',
      exercises: ['forwardfold', 'sidebend', 'hipflexor', 'twist'] },
    { day: 5, title: 'ירכיים ואגן', focus: 'פתיחת ירכיים',
      exercises: ['butterfly', 'hipflexor', 'quad', 'hamstring'] },
    { day: 6, title: 'מתיחות רגועות', focus: 'שחרור והרפיה',
      exercises: ['neck', 'shoulders', 'cobra', 'child'] }
  ];

  const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  /* מחזיר את תוכנית האימון עבור אובייקט Date נתון */
  function programForDate(date) {
    return WEEKLY_PROGRAM[date.getDay()];
  }

  /* משך משוער של אימון בדקות */
  function estimatedMinutes(program) {
    const total = program.exercises.reduce(
      (sum, id) => sum + (EXERCISES[id] ? EXERCISES[id].duration : 0), 0);
    return Math.max(1, Math.round(total / 60));
  }

  /* ----- לוגיקת BMI, תזונה וקלוריות ----- */
  function calcBMI(weightKg, heightCm) {
    const h = heightCm / 100;
    return weightKg / (h * h);
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return {
      key: 'under', label: 'תת-משקל', color: '#4aa3ff',
      advice: 'מומלץ להעלות במשקל בצורה בריאה. הוסיפו חטיפים עשירים בקלוריות כמו אגוזים, אבוקדו וטחינה, והקפידו על ארוחות סדירות.'
    };
    if (bmi < 25) return {
      key: 'normal', label: 'משקל תקין', color: '#2ecc71',
      advice: 'משקל בריא! שמרו על תזונה מאוזנת עם ירקות, חלבון איכותי ופחמימות מלאות, והמשיכו בפעילות גופנית קבועה.'
    };
    if (bmi < 30) return {
      key: 'over', label: 'עודף משקל', color: '#f39c12',
      advice: 'כדאי לשים לב לגודל המנות ולהפחית סוכר ומזון מעובד. הגבירו צריכת ירקות וחלבון רזה ושלבו פעילות אירובית.'
    };
    return {
      key: 'obese', label: 'השמנה', color: '#e74c3c',
      advice: 'מומלץ להתייעץ עם איש מקצוע. התמקדו בתזונה דלת קלוריות ועשירה בסיבים, שתו הרבה מים והגבירו פעילות גופנית בהדרגה.'
    };
  }

  /* חישוב BMR לפי נוסחת מיפלין-סנט ג'ור */
  function calcBMR({ weightKg, heightCm, age, gender }) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'female' ? base - 161 : base + 5;
  }

  const ACTIVITY_FACTORS = {
    sedentary: { factor: 1.2, label: 'יושבני (מעט מאוד פעילות)' },
    light: { factor: 1.375, label: 'קל (1–3 אימונים בשבוע)' },
    moderate: { factor: 1.55, label: 'בינוני (3–5 אימונים בשבוע)' },
    active: { factor: 1.725, label: 'פעיל (6–7 אימונים בשבוע)' }
  };

  /* המלצות מאקרו-נוטריאנטים (גרם) לפי קלוריות יעד */
  function macros(calories) {
    return {
      protein: Math.round((calories * 0.30) / 4),
      carbs: Math.round((calories * 0.40) / 4),
      fat: Math.round((calories * 0.30) / 9)
    };
  }

  global.ExcerlyData = {
    EXERCISES, WEEKLY_PROGRAM, DAY_NAMES, MONTH_NAMES,
    programForDate, estimatedMinutes,
    calcBMI, bmiCategory, calcBMR, ACTIVITY_FACTORS, macros
  };
})(window);
