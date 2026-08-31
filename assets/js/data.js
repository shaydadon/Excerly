/* =============================================================
   Excerly – נתוני התרגילים, התוכנית השבועית ולוגיקת התזונה
   שדות תוכן דו-לשוניים: { he, en }
   ============================================================= */
(function (global) {
  'use strict';

  const EXERCISES = {
    neck: {
      id: 'neck', animation: 'neck', duration: 120,
      name: { he: 'מתיחת צוואר', en: 'Neck stretch' },
      area: { he: 'צוואר וכתפיים', en: 'Neck & shoulders' },
      reps: { he: '3 חזרות לכל צד', en: '3 reps per side' },
      hold: { he: '20 שניות', en: '20 sec' },
      steps: {
        he: ['שבו או עמדו זקוף עם כתפיים רפויות.', 'הטו את הראש בעדינות לכיוון הכתף עד לתחושת מתיחה.', 'החזיקו 20 שניות ונשמו עמוק.', 'חזרו למרכז והחליפו צד.'],
        en: ['Sit or stand tall with relaxed shoulders.', 'Gently tilt your head toward one shoulder until you feel a stretch.', 'Hold for 20 seconds and breathe deeply.', 'Return to center and switch sides.']
      },
      tip: { he: 'אל תרימו את הכתף לכיוון האוזן – השאירו אותה רפויה.', en: "Don't lift your shoulder toward your ear — keep it relaxed." }
    },
    shoulders: {
      id: 'shoulders', animation: 'shoulders', duration: 90,
      name: { he: 'סיבובי כתפיים', en: 'Shoulder rolls' },
      area: { he: 'כתפיים', en: 'Shoulders' },
      reps: { he: '10 סיבובים לכל כיוון', en: '10 rolls each direction' },
      hold: { he: '—', en: '—' },
      steps: {
        he: ['עמדו זקוף עם ידיים רפויות לצדדים.', 'סובבו את הכתפיים אחורה בתנועה מעגלית איטית.', 'בצעו 10 סיבובים ואז החליפו כיוון.'],
        en: ['Stand tall with your arms relaxed at your sides.', 'Roll your shoulders backward in slow circles.', 'Do 10 rolls, then switch direction.']
      },
      tip: { he: 'תנועה איטית ומבוקרת עדיפה על מהירה.', en: 'Slow, controlled movement beats fast.' }
    },
    arms: {
      id: 'arms', animation: 'arms', duration: 90,
      name: { he: 'מעגלי זרועות', en: 'Arm circles' },
      area: { he: 'כתפיים וזרועות', en: 'Shoulders & arms' },
      reps: { he: '12 סיבובים לכל כיוון', en: '12 circles each direction' },
      hold: { he: '—', en: '—' },
      steps: {
        he: ['עמדו עם רגליים ברוחב הכתפיים.', 'פרשו את הזרועות לצדדים בגובה הכתף.', 'צרו מעגלים קטנים ואז הגדילו אותם בהדרגה.'],
        en: ['Stand with feet shoulder-width apart.', 'Extend your arms out to the sides at shoulder height.', 'Make small circles, then gradually make them larger.']
      },
      tip: { he: 'שמרו על הבטן אסופה כדי לייצב את הגב.', en: 'Keep your core tight to stabilize your back.' }
    },
    sidebend: {
      id: 'sidebend', animation: 'sidebend', duration: 120,
      name: { he: 'הטיית גו לצד', en: 'Side bend' },
      area: { he: 'מותניים וגו', en: 'Waist & torso' },
      reps: { he: '4 חזרות לכל צד', en: '4 reps per side' },
      hold: { he: '15 שניות', en: '15 sec' },
      steps: {
        he: ['עמדו עם רגליים ברוחב האגן.', 'הרימו יד אחת מעל הראש והטו את הגו לצד הנגדי.', 'הרגישו מתיחה לאורך המותן והחזיקו.', 'חזרו למרכז והחליפו צד.'],
        en: ['Stand with feet hip-width apart.', 'Raise one arm overhead and lean your torso to the opposite side.', 'Feel the stretch along your waist and hold.', 'Return to center and switch sides.']
      },
      tip: { he: 'הימנעו מהטיה קדימה – התנועה היא לצד בלבד.', en: 'Avoid leaning forward — the movement is purely sideways.' }
    },
    twist: {
      id: 'twist', animation: 'twist', duration: 120,
      name: { he: 'סיבוב עמוד שדרה', en: 'Spinal twist' },
      area: { he: 'גב תחתון וגו', en: 'Lower back & torso' },
      reps: { he: '6 חזרות לכל צד', en: '6 reps per side' },
      hold: { he: '10 שניות', en: '10 sec' },
      steps: {
        he: ['עמדו עם רגליים ברוחב הכתפיים וידיים בגובה החזה.', 'סובבו את פלג הגוף העליון לצד תוך שמירה על אגן יציב.', 'החזיקו רגע וחזרו למרכז, החליפו צד.'],
        en: ['Stand with feet shoulder-width apart and hands at chest height.', 'Rotate your upper body to one side while keeping your hips stable.', 'Hold briefly, return to center, and switch sides.']
      },
      tip: { he: 'שמרו על הרגליים נטועות במקום לאורך התנועה.', en: 'Keep your feet planted throughout the movement.' }
    },
    forwardfold: {
      id: 'forwardfold', animation: 'forwardfold', duration: 150,
      name: { he: 'כפיפה קדימה', en: 'Forward fold' },
      area: { he: 'גב תחתון ורגליים אחוריות', en: 'Lower back & hamstrings' },
      reps: { he: '3 חזרות', en: '3 reps' },
      hold: { he: '25 שניות', en: '25 sec' },
      steps: {
        he: ['עמדו זקוף עם רגליים מעט פשוקות.', 'התכופפו קדימה מהאגן והשתלשלו כלפי מטה.', 'תנו לראש ולזרועות להישאר רפויים.', 'התרוממו לאט חוליה אחר חוליה.'],
        en: ['Stand tall with feet slightly apart.', 'Fold forward from the hips and hang down.', 'Let your head and arms stay relaxed.', 'Rise slowly, one vertebra at a time.']
      },
      tip: { he: 'כפפו מעט את הברכיים אם הגב התחתון מתוח.', en: 'Bend your knees slightly if your lower back feels tight.' }
    },
    hamstring: {
      id: 'hamstring', animation: 'hamstring', duration: 180,
      name: { he: 'מתיחת ירך אחורית בישיבה', en: 'Seated hamstring stretch' },
      area: { he: 'רגליים אחוריות', en: 'Hamstrings' },
      reps: { he: '3 חזרות לכל רגל', en: '3 reps per leg' },
      hold: { he: '30 שניות', en: '30 sec' },
      steps: {
        he: ['שבו על הרצפה עם רגל אחת ישרה קדימה.', 'קפלו את הרגל השנייה פנימה.', 'הושיטו ידיים לכיוון כף הרגל הישרה.', 'החזיקו ונשמו, ואז החליפו רגל.'],
        en: ['Sit on the floor with one leg straight in front.', 'Fold the other leg inward.', 'Reach toward the foot of the straight leg.', 'Hold and breathe, then switch legs.']
      },
      tip: { he: 'שמרו על גב ישר ככל האפשר במקום לעגל אותו.', en: 'Keep your back as straight as possible rather than rounding it.' }
    },
    butterfly: {
      id: 'butterfly', animation: 'butterfly', duration: 120,
      name: { he: 'מתיחת פרפר', en: 'Butterfly stretch' },
      area: { he: 'מפשעה וירך פנימית', en: 'Groin & inner thigh' },
      reps: { he: '2 חזרות', en: '2 reps' },
      hold: { he: '30 שניות', en: '30 sec' },
      steps: {
        he: ['שבו והצמידו את כפות הרגליים זו לזו.', 'החזיקו את כפות הרגליים בידיים.', 'הורידו בעדינות את הברכיים לכיוון הרצפה.', 'החזיקו ונשמו עמוק.'],
        en: ['Sit and press the soles of your feet together.', 'Hold your feet with your hands.', 'Gently lower your knees toward the floor.', 'Hold and breathe deeply.']
      },
      tip: { he: 'ישבו זקוף – דמיינו חוט שמושך את הראש כלפי מעלה.', en: 'Sit tall — imagine a string pulling the top of your head up.' }
    },
    quad: {
      id: 'quad', animation: 'quad', duration: 150,
      name: { he: 'מתיחת ירך קדמית', en: 'Quad stretch' },
      area: { he: 'ירך קדמית', en: 'Quadriceps' },
      reps: { he: '3 חזרות לכל רגל', en: '3 reps per leg' },
      hold: { he: '25 שניות', en: '25 sec' },
      steps: {
        he: ['עמדו והיעזרו בקיר לשיווי משקל.', 'תפסו את כף הרגל ומשכו את העקב לכיוון הישבן.', 'שמרו על הברכיים צמודות והחזיקו.', 'החליפו רגל.'],
        en: ['Stand and use a wall for balance.', 'Grab your foot and pull the heel toward your glutes.', 'Keep your knees together and hold.', 'Switch legs.']
      },
      tip: { he: 'דחפו מעט את האגן קדימה להעצמת המתיחה.', en: 'Push your hips slightly forward to deepen the stretch.' }
    },
    hipflexor: {
      id: 'hipflexor', animation: 'hipflexor', duration: 150,
      name: { he: 'מתיחת מכופף ירך', en: 'Hip flexor stretch' },
      area: { he: 'ירך וזוקפי גב', en: 'Hips & back' },
      reps: { he: '2 חזרות לכל צד', en: '2 reps per side' },
      hold: { he: '30 שניות', en: '30 sec' },
      steps: {
        he: ['רדו לתנוחת פסיעה – ברך אחת על הרצפה.', 'דחפו את האגן קדימה בעדינות.', 'שמרו על גב זקוף וחזה פתוח.', 'החזיקו והחליפו צד.'],
        en: ['Drop into a lunge — one knee on the floor.', 'Gently push your hips forward.', 'Keep your back tall and chest open.', 'Hold and switch sides.']
      },
      tip: { he: 'הניחו מגבת מתחת לברך לנוחות.', en: 'Place a towel under your knee for comfort.' }
    },
    calf: {
      id: 'calf', animation: 'calf', duration: 150,
      name: { he: 'מתיחת שוק', en: 'Calf stretch' },
      area: { he: 'שוקיים', en: 'Calves' },
      reps: { he: '3 חזרות לכל רגל', en: '3 reps per leg' },
      hold: { he: '25 שניות', en: '25 sec' },
      steps: {
        he: ['עמדו מול קיר והניחו עליו את הידיים.', 'הושיטו רגל אחת אחורה עם עקב צמוד לרצפה.', 'כופפו את הברך הקדמית עד לתחושת מתיחה בשוק.', 'החזיקו והחליפו רגל.'],
        en: ['Stand facing a wall and place your hands on it.', 'Step one leg back with the heel flat on the floor.', 'Bend the front knee until you feel a stretch in the calf.', 'Hold and switch legs.']
      },
      tip: { he: 'הצביעו עם אצבעות הרגל האחורית ישר קדימה.', en: 'Point the toes of your back foot straight ahead.' }
    },
    catcow: {
      id: 'catcow', animation: 'catcow', duration: 120,
      name: { he: 'חתול-פרה', en: 'Cat-Cow' },
      area: { he: 'עמוד שדרה', en: 'Spine' },
      reps: { he: '10 חזרות', en: '10 reps' },
      hold: { he: '—', en: '—' },
      steps: {
        he: ['רדו לתנוחת ארבע – ידיים מתחת לכתפיים.', 'שאפו וקערו את הגב כלפי מטה (פרה).', 'נשפו וקמרו את הגב כלפי מעלה (חתול).', 'המשיכו בתנועה זורמת עם הנשימה.'],
        en: ['Get on all fours — hands under shoulders.', 'Inhale and arch your back downward (cow).', 'Exhale and round your back upward (cat).', 'Continue in a flowing motion with your breath.']
      },
      tip: { he: 'תאמו כל תנועה לנשימה איטית ועמוקה.', en: 'Match each movement to a slow, deep breath.' }
    },
    cobra: {
      id: 'cobra', animation: 'cobra', duration: 120,
      name: { he: 'תנוחת קוברה', en: 'Cobra pose' },
      area: { he: 'בטן וגב תחתון', en: 'Abs & lower back' },
      reps: { he: '3 חזרות', en: '3 reps' },
      hold: { he: '20 שניות', en: '20 sec' },
      steps: {
        he: ['שכבו על הבטן עם כפות ידיים ליד החזה.', 'דחפו בעדינות והרימו את פלג הגוף העליון.', 'שמרו על האגן צמוד לרצפה וכתפיים למטה.', 'החזיקו ואז הורידו לאט.'],
        en: ['Lie on your stomach with palms beside your chest.', 'Gently push up and lift your upper body.', 'Keep your hips on the floor and shoulders down.', 'Hold, then lower slowly.']
      },
      tip: { he: 'אל תנעלו את המרפקים – שמרו על כיפוף קל.', en: "Don't lock your elbows — keep a slight bend." }
    },
    child: {
      id: 'child', animation: 'child', duration: 120,
      name: { he: 'תנוחת הילד', en: "Child's pose" },
      area: { he: 'גב וכתפיים', en: 'Back & shoulders' },
      reps: { he: '2 חזרות', en: '2 reps' },
      hold: { he: '40 שניות', en: '40 sec' },
      steps: {
        he: ['שבו על העקבים והורידו את הגו קדימה.', 'הושיטו את הזרועות קדימה על הרצפה.', 'הניחו את המצח על הרצפה ונשמו עמוק.', 'הישארו בתנוחה והירגעו.'],
        en: ['Sit back on your heels and lower your torso forward.', 'Reach your arms forward on the floor.', 'Rest your forehead on the floor and breathe deeply.', 'Stay in the pose and relax.']
      },
      tip: { he: 'תנוחת רגיעה מצוינת לסיום האימון.', en: 'A great relaxation pose to finish the workout.' }
    }
  };

  const WEEKLY_PROGRAM = [
    { day: 0, exercises: ['neck', 'shoulders', 'arms', 'sidebend'],
      title: { he: 'פלג גוף עליון', en: 'Upper body' }, focus: { he: 'צוואר, כתפיים וזרועות', en: 'Neck, shoulders & arms' } },
    { day: 1, exercises: ['catcow', 'cobra', 'twist', 'child'],
      title: { he: 'גב וליבה', en: 'Back & core' }, focus: { he: 'עמוד שדרה וגב תחתון', en: 'Spine & lower back' } },
    { day: 2, exercises: ['hamstring', 'quad', 'calf', 'butterfly'],
      title: { he: 'פלג גוף תחתון', en: 'Lower body' }, focus: { he: 'רגליים וירכיים', en: 'Legs & hips' } },
    { day: 3, rest: true, exercises: ['child', 'catcow'],
      title: { he: 'מנוחה פעילה', en: 'Active rest' }, focus: { he: 'התאוששות ונשימה', en: 'Recovery & breathing' } },
    { day: 4, exercises: ['forwardfold', 'sidebend', 'hipflexor', 'twist'],
      title: { he: 'גמישות מלאה', en: 'Full flexibility' }, focus: { he: 'כל הגוף', en: 'Whole body' } },
    { day: 5, exercises: ['butterfly', 'hipflexor', 'quad', 'hamstring'],
      title: { he: 'ירכיים ואגן', en: 'Hips & pelvis' }, focus: { he: 'פתיחת ירכיים', en: 'Hip opening' } },
    { day: 6, exercises: ['neck', 'shoulders', 'cobra', 'child'],
      title: { he: 'מתיחות רגועות', en: 'Gentle stretches' }, focus: { he: 'שחרור והרפיה', en: 'Release & relax' } }
  ];

  // נשמר לתאימות; app.js משתמש ב-ExcerlyI18n לשמות ימים/חודשים
  const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  function programForDate(date) { return WEEKLY_PROGRAM[date.getDay()]; }

  function estimatedMinutes(program) {
    const total = program.exercises.reduce((sum, id) => sum + (EXERCISES[id] ? EXERCISES[id].duration : 0), 0);
    return Math.max(1, Math.round(total / 60));
  }

  /* ----- BMI, תזונה וקלוריות ----- */
  function calcBMI(weightKg, heightCm) { const h = heightCm / 100; return weightKg / (h * h); }

  // טווח משקל בריא לפי גובה (BMI 18.5–24.9)
  function healthyWeight(heightCm) {
    const h = heightCm / 100;
    return { lo: 18.5 * h * h, hi: 24.9 * h * h };
  }

  // מחזיר מפתח קטגוריה + צבע; התוויות והטקסטים מגיעים מ-i18n
  function bmiCategory(bmi) {
    if (bmi < 18.5) return { key: 'under', color: '#4aa3ff' };
    if (bmi < 25) return { key: 'normal', color: '#2ecc71' };
    if (bmi < 30) return { key: 'over', color: '#f39c12' };
    return { key: 'obese', color: '#e74c3c' };
  }

  function calcBMR({ weightKg, heightCm, age, gender }) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'female' ? base - 161 : base + 5;
  }

  const ACTIVITY_FACTORS = {
    sedentary: { factor: 1.2 }, light: { factor: 1.375 },
    moderate: { factor: 1.55 }, active: { factor: 1.725 }
  };

  function macros(calories) {
    return {
      protein: Math.round((calories * 0.30) / 4),
      carbs: Math.round((calories * 0.40) / 4),
      fat: Math.round((calories * 0.30) / 9)
    };
  }

  /* =============================================================
     שדרוג אופציונלי לאנימציות Lottie (איכות מקצועית)
     -------------------------------------------------------------
     כל עוד המפה ריקה – האפליקציה מציגה את דמויות ה-SVG המובנות.
     כדי לשדרג תרגיל לאנימציית Lottie מקצועית, הוסיפו קובץ JSON
     לתיקייה assets/lottie/ ורשמו אותו כאן לפי מפתח האנימציה של
     התרגיל (העמודה animation למעלה). ניתן לתת קובץ אחד, או קבצים
     נפרדים לזכר/נקבה:

       neck: 'assets/lottie/neck.json',
       arms: { male: 'assets/lottie/arms-m.json',
               female: 'assets/lottie/arms-f.json' },

     ראו assets/lottie/README.md להסבר שלב-אחר-שלב.
     ============================================================= */
  const LOTTIE = {
    // ריק כברירת מחדל – מוסיפים כאן ערכים כדי לשדרג תרגילים.
  };

  /* תמונות אווטאר סטטיות (זכר/נקבה) לכל תרגיל.
     קבצים: assets/exercise-img/<key>-m.png  /  -f.png
     מפתחות הרשומים כאן מוצגים כתמונה במקום דמות ה-SVG. */
  const EXIMG = {
    neck: 1, shoulders: 1, arms: 1, sidebend: 1, twist: 1, forwardfold: 1,
    hamstring: 1, butterfly: 1, quad: 1, hipflexor: 1, calf: 1, catcow: 1, cobra: 1, child: 1
  };

  global.ExcerlyData = {
    EXERCISES, WEEKLY_PROGRAM, DAY_NAMES, MONTH_NAMES, LOTTIE, EXIMG,
    programForDate, estimatedMinutes,
    calcBMI, bmiCategory, healthyWeight, calcBMR, ACTIVITY_FACTORS, macros
  };
})(window);
