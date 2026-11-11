/* =============================================================
   Excerly – בניית תוכנית אימון אישית לחדר כושר
   מנוע תבניות מקומי (עובד תמיד, לא מקוון) + מצב AI אישי (Claude)
   דרך שרת proxy או מפתח של המשתמש (BYOK), בדומה למודול התזונה.
   ============================================================= */
(function (global) {
  'use strict';

  const I = () => global.ExcerlyI18n;
  const curLang = () => (I() ? I().lang : 'he');
  const L = o => (I() ? I().L(o) : o.he);

  /* ---------- בנק תרגילי חדר כושר (דו-לשוני) ---------- */
  const EX = {
    squat: { he: 'סקוואט', en: 'Squat' },
    legPress: { he: 'לחיצת רגליים (מכונה)', en: 'Leg press (machine)' },
    legCurl: { he: 'כפיפת ברך (מכונה)', en: 'Leg curl (machine)' },
    legExt: { he: 'פשיטת ברך (מכונה)', en: 'Leg extension (machine)' },
    calf: { he: 'הרמות עקב (שוקיים)', en: 'Standing calf raise' },
    hipThrust: { he: 'היפ ת׳ראסט', en: 'Hip thrust' },
    lunge: { he: 'מספריים עם משקולות', en: 'Dumbbell lunges' },
    bench: { he: 'לחיצת חזה במוט', en: 'Barbell bench press' },
    inclineDb: { he: 'לחיצת חזה בשיפוע (מ׳)', en: 'Incline DB press' },
    fly: { he: 'פרפר בכבלים', en: 'Cable fly' },
    ohp: { he: 'לחיצת כתפיים', en: 'Shoulder press' },
    lateral: { he: 'הרחקות צד (כתפיים)', en: 'Lateral raise' },
    pushdown: { he: 'פשיטת מרפק בפולי (טרייספס)', en: 'Triceps pushdown' },
    pulldown: { he: 'משיכת פולי עליון', en: 'Lat pulldown' },
    row: { he: 'חתירה בישיבה (מכונה)', en: 'Seated cable row' },
    facePull: { he: 'משיכת פנים (כבלים)', en: 'Face pull' },
    curl: { he: 'כפיפת מרפק (בייספס)', en: 'Biceps curl' },
    hammer: { he: 'כפיפת פטיש', en: 'Hammer curl' },
    rearDelt: { he: 'פרפר הפוך (כתף אחורית)', en: 'Rear-delt fly' },
    plank: { he: 'פלאנק', en: 'Plank' },
    cardio: { he: 'קרדיו קל לסיום (הליכון/אופניים)', en: 'Light finisher cardio (treadmill/bike)' },
    rdl: { he: 'דדליפט רומני עם משקולות', en: 'Romanian deadlift with dumbbells' },
    warmup: { he: 'חימום: אופניים נייחים + סיבובי כתפיים', en: 'Warm-up: stationary bike + shoulder circles' },
    smith: { he: 'סקוואט במכונת סמית', en: 'Smith machine squat' },
    deadlift: { he: 'דדליפט', en: 'Deadlift' },
    pullup: { he: 'מתח', en: 'Pull-up' },
    dips: { he: 'מקבילים', en: 'Dips' },
    chestPress: { he: 'לחיצת חזה במכונה', en: 'Machine chest press' },
    elliptical: { he: 'אליפטיקל', en: 'Elliptical' },
    crunch: { he: 'כפיפות בטן', en: 'Crunch' },
    pushup: { he: 'שכיבות סמיכה', en: 'Push-up' },
    bentRow: { he: 'חתירה עם מוט', en: 'Barbell row' }
  };

  /* נירמול שם תרגיל לצורך התאמה לתמונה: AI לא מחזיר id, והשמות לעיתים
     שונים במקצת משמות הבנק (למשל בלי סוגריים, או «במשקולות»). */
  // Hebrew letters are not JS \w, so \b never fires around them.
  const HEB_EDGE = '(^|[^\\u05D0-\\u05EAa-z0-9])';
  const HEB_END = '(?=$|[^\\u05D0-\\u05EAa-z0-9])';
  const FINAL_LETTERS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  function foldName(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\"׳'`]/g, '')
      .replace(/[()[\]{}]/g, ' ')
      .replace(/[/\\+|–—_-]+/g, ' ')
      .replace(/[.:;!?]/g, ' ')
      .replace(new RegExp(HEB_EDGE + '(עם|של|על|machine|with|and|the|a)' + HEB_END, 'g'), '$1')
      .replace(new RegExp(HEB_EDGE + '(dumbbells?|db|משקולות|משקולת|במשקולות)' + HEB_END, 'g'), '$1')
      .replace(/[ךםןףץ]/g, ch => FINAL_LETTERS[ch] || ch)
      .replace(/(^|\s)[\u05D0-\u05EA](?=\s|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function nameTokens(s) {
    return foldName(s).split(' ').filter(Boolean);
  }
  // Bank/alias tokens are covered by the query (prefix-friendly so ברך matches ברכיים).
  // Require the candidate to be covered by the query, not the other way around
  // («סיבובי כתפיים» must not match the bike warm-up).
  function tokensCovered(query, cand) {
    const q = nameTokens(query);
    const c = nameTokens(cand);
    if (!q.length || !c.length) return false;
    return c.every(ct => q.some(qt =>
      qt === ct ||
      (ct.length >= 3 && qt.indexOf(ct) === 0) ||
      (qt.length >= 3 && ct.indexOf(qt) === 0 && qt.length >= Math.ceil(ct.length * 0.6))
    ));
  }

  // כינויים נפוצים (בעיקר מתוכניות AI) למזהה בנק קיים. לא כולל סיבובי כתפיים.
  const NAME_ALIASES = {
    squat: ['barbell squat', 'back squat', 'סקוואט מוט', 'סקוואט חופשי', 'front squat', 'סקוואט קדמי', 'goblet squat', 'סקוואט גובלט'],
    legPress: ['leg press', 'leg press machine', 'לחיצת רגליים', 'לחיצת רגליים במכונה', 'hack squat'],
    legCurl: ['leg curl', 'lying leg curl', 'seated leg curl', 'כפיפת ברך', 'leg curls', 'כפיפת ברכיים', 'כפיפת ברכיים במכונה', 'כפיפת ברך במכונה'],
    legExt: ['leg extension', 'פשיטת ברך', 'פשיטת ברכיים', 'פשיטת ברכיים במכונה'],
    calf: ['calf raise', 'standing calf raise', 'seated calf raise', 'הרמות עקב', 'הרמת עקבים', 'הרמת שוקיים'],
    hipThrust: ['hip thrust', 'barbell hip thrust', 'היפ טראסט', 'היפ תראסט'],
    lunge: ['dumbbell lunge', 'db lunges', 'walking lunge', 'lunges', 'מספריים', 'bulgarian split squat', 'סקוואט בולגרי'],
    bench: ['bench press', 'barbell bench press', 'לחיצת חזה', 'לחיצת חזה במוט', 'close grip bench', 'close-grip bench'],
    inclineDb: [
      'incline db press', 'incline db chest press', 'incline dumbbell press',
      'incline dumbbell chest press', 'incline chest press',
      'לחיצת חזה בשיפוע', 'לחיצת חזה בשיפוע במשקולות'
    ],
    fly: ['cable fly', 'cable flyes', 'pec fly', 'pec deck', 'pec-deck', 'פרפר בכבלים', 'פרפר במכונה'],
    ohp: ['overhead press', 'shoulder press', 'military press', 'לחיצת כתפיים', 'לחיצת כתפיים במכונה'],
    lateral: [
      'lateral raise', 'db lateral raise', 'dumbbell lateral raise',
      'side lateral raise', 'side raise',
      'הרחקת כתף', 'הרחקות צד', 'הרחקת כתף בצדדים', 'הרחקת כתף בצדדים עם משקולות'
    ],
    pushdown: ['triceps pushdown', 'cable pushdown', 'פשיטת מרפק בפולי', 'overhead tricep extension', 'overhead triceps extension', 'skull crusher', 'פשיטת מרפק מעל הראש'],
    pulldown: [
      'lat pulldown', 'lat pull down', 'lat pull-down',
      'assisted pull-up', 'assisted pull up', 'assisted chin-up',
      'פולי עליון', 'משיכת פולי עליון',
      'מתח בעזרת מכונת סיוע', 'מתח בעזרת מכונת סיוע / פולי עליון'
    ],
    row: ['seated cable row', 'cable row', 'חתירה בישיבה', 'חתירה בכבלים'],
    facePull: ['face pull', 'face pulls', 'משיכת פנים'],
    curl: [
      'biceps curl', 'bicep curl', 'cable curl', 'cable curls', 'preacher curl',
      'כפיפת מרפק', 'כפיפת מרפקים', 'כפיפת מרפקים בכבל', 'כפיפת מרפק בכבל'
    ],
    hammer: ['hammer curl', 'hammer curls', 'כפיפת פטיש'],
    rearDelt: ['rear delt fly', 'rear-delt fly', 'reverse fly', 'פרפר הפוך'],
    plank: ['front plank', 'פלנק'],
    cardio: ['light finisher cardio', 'treadmill', 'הליכון', 'הליכה במסילה', 'חימום: הליכה במסילה', 'חימום: הליכה במסילה + מתיחות דינמיות', 'treadmill walk', 'warm-up: treadmill walk + dynamic stretches', 'warmup: treadmill walk + dynamic stretches', 'קרדיו קל לסיום'],
    rdl: ['romanian deadlift', 'dumbbell rdl', 'db rdl', 'rdl', 'דדליפט רומני'],
    warmup: ['upright bike', 'stationary upright bike', 'stationary bike', 'אופניים נייחים', 'חימום אופניים'],
    smith: ['smith squat', 'smith machine squat', 'סקוואט סמית', 'סקוואט במכונת סמית'],
    deadlift: ['deadlift', 'conventional deadlift', 'barbell deadlift', 'דדליפט קנוונציונלי', 'דדליפט עם מוט'],
    pullup: ['pull-up', 'pull ups', 'pullups', 'pullup', 'chin-up', 'chin up', 'מתח', 'מתח רחב'],
    dips: ['dip', 'dips', 'מקבילים', 'שקיעות במקבילים'],
    chestPress: ['machine chest press', 'chest press machine', 'chest press', 'לחיצת חזה במכונה'],
    elliptical: ['elliptical', 'אליפטיקל', 'קרוס טריינר', 'cross trainer', 'חימום אליפטיקל', 'חימום: אליפטיקל'],
    crunch: ['crunch', 'crunches', 'sit-up', 'sit ups', 'sit-ups', 'כפיפות בטן'],
    pushup: ['push-up', 'push ups', 'push-ups', 'pushup', 'שכיבות סמיכה'],
    bentRow: ['bent over row', 'bent-over row', 'barbell row', 'חתירה בעמידה', 'חתירה עם מוט']
  };

  // Home-plan stills (shoulders, stretches). Used when a gym/AI name matches a home exercise.
  // Bare «פרפר» stays unmapped (fly vs butterfly). «סיבובי כתפיים» must not use the bike warm-up.
  const HOME_ALIASES = {
    neck: ['neck stretch', 'הטיית ראש', 'מתיחת צוואר'],
    shoulders: ['shoulder rolls', 'shoulder roll', 'סיבובי כתפיים', 'גלגול כתפיים'],
    arms: ['arm circles', 'סיבובי ידיים', 'מעגלי זרועות'],
    sidebend: ['side bend', 'כפיפה הצידה', 'הטיית גו לצד'],
    twist: ['spinal twist', 'סיבוב עמוד שדרה'],
    forwardfold: ['forward fold', 'כפיפה קדימה'],
    hamstring: ['hamstring stretch', 'seated hamstring stretch', 'מתיחת מיתרים', 'מתיחת ירך אחורית בישיבה'],
    butterfly: ['butterfly stretch', 'מתיחת פרפר'],
    quad: ['quad stretch', 'מתיחת ארבע ראשי', 'מתיחת ירך קדמית'],
    hipflexor: ['hip flexor stretch', 'מתיחת מכופפי ירך', 'מתיחת מכופף ירך'],
    calf: ['calf stretch', 'מתיחת שוק'],
    catcow: ['cat cow', 'cat-cow', 'חתול פרה', 'חתול-פרה'],
    cobra: ['cobra', 'cobra pose', 'קוברה', 'תנוחת קוברה'],
    child: ["child's pose", 'childs pose', 'child pose', 'תנוחת הילד']
  };


  function resolveGymId(ex) {
    if (ex == null) return null;
    if (typeof ex === 'string') {
      if (EX[ex]) return ex;
      ex = { name: ex };
    }
    if (ex.id && EX[ex.id]) return ex.id;
    const name = typeof ex.name === 'string' ? ex.name : '';
    if (!name) return null;
    for (const k of Object.keys(EX)) {
      if (EX[k].he === name || EX[k].en === name) return k;
    }
    const n = foldName(name);
    if (!n) return null;
    const cands = {};
    const add = (k, s) => {
      const f = foldName(s);
      if (f) (cands[k] || (cands[k] = new Set())).add(f);
    };
    for (const k of Object.keys(EX)) {
      add(k, EX[k].he);
      add(k, EX[k].en);
      (NAME_ALIASES[k] || []).forEach(a => add(k, a));
    }
    for (const k of Object.keys(cands)) {
      if (cands[k].has(n)) return k;
    }
    const hits = [];
    for (const k of Object.keys(cands)) {
      for (const cand of cands[k]) {
        const distinctive = cand.length >= 8 || cand.split(' ').length >= 2;
        // Query may contain a bank/alias phrase (AI names). A short query
        // must not match just because it is a suffix of a longer name
        // (e.g. «סיבובי כתפיים» must not map to the bike warm-up).
        const queryContains = distinctive && (n.includes(cand) || tokensCovered(n, cand));
        const almostEqual = distinctive && cand.includes(n) && n.length >= Math.max(8, Math.ceil(cand.length * 0.6));
        if (queryContains || almostEqual) {
          hits.push({ k, len: cand.length });
        }
      }
    }
    if (!hits.length) return null;
    const best = Math.max.apply(null, hits.map(h => h.len));
    const unique = hits.filter(h => h.len === best).map(h => h.k).filter((k, i, a) => a.indexOf(k) === i);
    return unique.length === 1 ? unique[0] : null;
  }

  function homeBank() {
    const D = global.ExcerlyData;
    return (D && D.EXERCISES) || {};
  }

  function matchFromCands(n, cands) {
    for (const k of Object.keys(cands)) {
      if (cands[k].has(n)) return k;
    }
    const hits = [];
    for (const k of Object.keys(cands)) {
      for (const cand of cands[k]) {
        const distinctive = cand.length >= 8 || cand.split(' ').length >= 2;
        const queryContains = distinctive && (n.includes(cand) || tokensCovered(n, cand));
        const almostEqual = distinctive && cand.includes(n) && n.length >= Math.max(8, Math.ceil(cand.length * 0.6));
        if (queryContains || almostEqual) hits.push({ k, len: cand.length });
      }
    }
    if (!hits.length) return null;
    const best = Math.max.apply(null, hits.map(h => h.len));
    const unique = hits.filter(h => h.len === best).map(h => h.k).filter((k, i, a) => a.indexOf(k) === i);
    return unique.length === 1 ? unique[0] : null;
  }

  function resolveHomeId(ex) {
    if (ex == null) return null;
    if (typeof ex === 'string') {
      const bank = homeBank();
      if (bank[ex]) return ex;
      ex = { name: ex };
    }
    const bank = homeBank();
    if (ex.id && bank[ex.id]) return ex.id;
    if (ex.animation && bank[ex.animation]) return ex.animation;
    const name = typeof ex.name === 'string' ? ex.name : '';
    if (!name) return null;
    for (const k of Object.keys(bank)) {
      const nm = bank[k].name || {};
      if (nm.he === name || nm.en === name) return k;
    }
    const n = foldName(name);
    if (!n) return null;
    const cands = {};
    const add = (k, s) => {
      const f = foldName(s);
      if (f) (cands[k] || (cands[k] = new Set())).add(f);
    };
    for (const k of Object.keys(bank)) {
      const nm = bank[k].name || {};
      if (nm.he) add(k, nm.he);
      if (nm.en) add(k, nm.en);
      (HOME_ALIASES[k] || []).forEach(a => add(k, a));
    }
    // Aliases still apply when data.js has not been loaded (tests that only load workout.js).
    if (!Object.keys(bank).length) {
      for (const k of Object.keys(HOME_ALIASES)) {
        (HOME_ALIASES[k] || []).forEach(a => add(k, a));
      }
    }
    return matchFromCands(n, cands);
  }

  // Gym first (so «לחיצת חזה» is bench, not a stretch). Then home, so
  // «סיבובי כתפיים» uses the home shoulders photo and never the bike warm-up.
  function resolveVisual(ex) {
    const gid = resolveGymId(ex);
    if (gid) return { id: gid, kind: 'gym' };
    const hid = resolveHomeId(ex);
    if (hid) return { id: hid, kind: 'home' };
    return null;
  }


  // מרשמי סטים/חזרות/מנוחה לפי דגש האימון (כוח / מסת שריר / סיבולת / כוח מתפרץ)
  function scheme(style) {
    if (style === 'strength') return { sets: '4–5', reps: '4–6', rest: "2–3 דק'", restEn: '2–3 min' };
    if (style === 'power') return { sets: '5', reps: '3–5', rest: "2–3 דק'", restEn: '2–3 min' };
    if (style === 'endurance') return { sets: '3', reps: '15–20', rest: "30–45 שנ'", restEn: '30–45 sec' };
    return { sets: '3–4', reps: '8–12', rest: "60–90 שנ'", restEn: '60–90 sec' }; // hypertrophy (מסת שריר)
  }

  // בחירת ימי האימון לפי מיקוד הגוף
  function chooseDays(days, focusArea) {
    let pool;
    if (focusArea === 'upper') pool = ['upper', 'push', 'upper2', 'pull', 'push2', 'pull2'];
    else if (focusArea === 'lower') pool = ['lower', 'legs', 'lower2', 'legs2', 'lower', 'legs'];
    else if (focusArea === 'posterior') pool = ['pull', 'legs', 'pull2', 'legs2', 'pull', 'legs'];
    else pool = split(days);
    return pool.slice(0, days);
  }

  // חלוקת ימים לפי כמות ימים בשבוע
  function split(days) {
    const F = ['fullA', 'fullB', 'fullC'];
    const PPL = ['push', 'pull', 'legs'];
    const UL = ['upper', 'lower'];
    if (days <= 2) return ['fullA', 'fullB'];
    if (days === 3) return PPL;
    if (days === 4) return ['upper', 'lower', 'upper2', 'lower2'];
    if (days === 5) return ['push', 'pull', 'legs', 'upper', 'lower'];
    return ['push', 'pull', 'legs', 'push2', 'pull2', 'legs2']; // 6+
  }

  const DAY_DEF = {
    fullA: { focus: { he: 'גוף מלא A', en: 'Full body A' }, ex: ['squat', 'bench', 'row', 'ohp', 'plank'] },
    fullB: { focus: { he: 'גוף מלא B', en: 'Full body B' }, ex: ['legPress', 'pulldown', 'inclineDb', 'legCurl', 'calf'] },
    fullC: { focus: { he: 'גוף מלא C', en: 'Full body C' }, ex: ['hipThrust', 'row', 'ohp', 'curl', 'pushdown'] },
    push: { focus: { he: 'דחיפה (חזה/כתף/טרייספס)', en: 'Push (chest/shoulders/triceps)' }, ex: ['bench', 'inclineDb', 'ohp', 'lateral', 'fly', 'pushdown'] },
    push2: { focus: { he: 'דחיפה B', en: 'Push B' }, ex: ['ohp', 'inclineDb', 'fly', 'lateral', 'pushdown'] },
    pull: { focus: { he: 'משיכה (גב/בייספס)', en: 'Pull (back/biceps)' }, ex: ['pulldown', 'row', 'facePull', 'rearDelt', 'curl', 'hammer'] },
    pull2: { focus: { he: 'משיכה B', en: 'Pull B' }, ex: ['row', 'pulldown', 'facePull', 'curl', 'hammer'] },
    legs: { focus: { he: 'רגליים', en: 'Legs' }, ex: ['squat', 'legPress', 'legCurl', 'legExt', 'hipThrust', 'calf'] },
    legs2: { focus: { he: 'רגליים B', en: 'Legs B' }, ex: ['hipThrust', 'legPress', 'legCurl', 'lunge', 'calf'] },
    upper: { focus: { he: 'פלג גוף עליון', en: 'Upper body' }, ex: ['bench', 'pulldown', 'ohp', 'row', 'curl', 'pushdown'] },
    upper2: { focus: { he: 'פלג גוף עליון B', en: 'Upper body B' }, ex: ['inclineDb', 'row', 'lateral', 'facePull', 'hammer', 'pushdown'] },
    lower: { focus: { he: 'פלג גוף תחתון', en: 'Lower body' }, ex: ['squat', 'legPress', 'legCurl', 'legExt', 'calf'] },
    lower2: { focus: { he: 'פלג גוף תחתון B', en: 'Lower body B' }, ex: ['hipThrust', 'lunge', 'legCurl', 'legExt', 'calf'] }
  };

  const exName = key => L(EX[key]);

  /* ---------- מחולל תבנית מקומי (ללא AI) ---------- */
  function planLocal(p) {
    const days = Math.max(2, Math.min(6, parseInt(p.days, 10) || 3));
    const sc = scheme(p.style);
    const cardioLevel = p.cardio || (p.goal === 'fatloss' ? 'some' : 'none');
    const rest = curLang() === 'en' ? sc.restEn : sc.rest;
    const dayList = chooseDays(days, p.focusArea).map((k, idx) => {
      const def = DAY_DEF[k];
      const exs = def.ex.map(e => ({
        id: e,
        name: exName(e), sets: sc.sets, reps: e === 'plank' ? (curLang() === 'en' ? '3 × 40 sec' : "3 × 40 שנ'") : sc.reps,
        rest, note: ''
      }));
      if (cardioLevel !== 'none') {
        const mins = cardioLevel === 'lots' ? (curLang() === 'en' ? '20 min' : "20 דק'") : (curLang() === 'en' ? '10 min' : "10 דק'");
        exs.push({ id: 'cardio', name: exName('cardio'), sets: '1', reps: mins, rest: '—', note: '' });
      }
      return {
        name: (curLang() === 'en' ? 'Day ' : 'יום ') + (idx + 1),
        focus: L(def.focus),
        exercises: exs
      };
    });
    return {
      title: curLang() === 'en' ? 'Personal gym program' : 'תוכנית אימון אישית לחדר כושר',
      note: curLang() === 'en'
        ? 'Warm up 5–8 min before each session. Add ~2.5% weight when you complete all reps with good form. General template — enable AI for a fully personalized plan.'
        : 'התחממו 5–8 דק׳ לפני כל אימון. הוסיפו ~2.5% משקל כשמשלימים את כל החזרות בטכניקה טובה. זוהי תבנית כללית — הפעילו AI לתוכנית אישית לחלוטין.',
      days: dayList, source: 'local'
    };
  }

  /* ---------- נירמול תשובת AI ---------- */
  function normalize(out) {
    const days = (out.days || []).map(d => ({
      name: String(d.name || ''),
      focus: String(d.focus || ''),
      exercises: (d.exercises || []).map(e => {
        const item = {
          name: String(e.name || ''), sets: String(e.sets == null ? '' : e.sets),
          reps: String(e.reps == null ? '' : e.reps), rest: String(e.rest == null ? '' : e.rest),
          note: String(e.note || '')
        };
        const id = resolveGymId(item);
        if (id) item.id = id;
        return item;
      })
    }));
    return { title: String(out.title || ''), note: String(out.note || ''), days, source: 'ai' };
  }

  /* ---------- קריאות AI (proxy / BYOK) ---------- */
  async function callProxy(url, payload) {
    const token = (global.ExcerlyCloud && global.ExcerlyCloud.token && global.ExcerlyCloud.token()) || null;
    const body = token ? Object.assign({ token }, payload) : payload;
    const res = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    let data = null; try { data = await res.json(); } catch (e) {}
    if (res.status === 429 && data && data.error === 'quota_exceeded') { const err = new Error('quota'); err.code = 'quota'; err.used = data.used; err.limit = data.limit; throw err; }
    if (res.status === 401 && data && data.error === 'login_required') { const err = new Error('login'); err.code = 'login'; throw err; }
    if (!res.ok) throw new Error('proxy failed: ' + res.status);
    if (data && data.error) throw new Error('proxy error: ' + data.error);
    if (data && data._quota && global.ExcerlyCloud) { global.ExcerlyCloud.quota = data._quota; try { document.dispatchEvent(new CustomEvent('excerly:quota')); } catch (e) {} }
    return data;
  }
  async function planViaProxy(p, url) {
    return normalize(await callProxy(url, { action: 'workout_plan', plan: p, lang: curLang() }));
  }

  const langLine = () => curLang() === 'en'
    ? ' Respond in English (all fields in English).'
    : ' החזר את כל השדות בעברית.';

  async function planAI(p, key) {
    const system =
      'You are a certified strength & conditioning coach. Build a safe, personalized GYM workout program ' +
      'from the trainee data. Use standard gym exercises suited to the equipment and level, split the ' +
      'requested days sensibly, and for each exercise give sets, a rep range and rest. Keep sessions within ' +
      'the requested minutes, respect limitations, and add a weekly progression tip in note. Return JSON only: ' +
      '{"title": string, "note": string, "days": [{"name": string, "focus": string, "exercises": ' +
      '[{"name": string, "sets": string, "reps": string, "rest": string, "note": string}]}]}.' + langLine();
    const user =
      'Goal: ' + (p.goal || 'general fitness') + '\nTraining emphasis: ' + (p.style || 'hypertrophy') +
      '\nBody focus: ' + (p.focusArea || 'full body') + '\nDays/week: ' + (p.days || 3) +
      '\nMinutes/session: ' + (p.minutes || 45) + '\nLevel: ' + (p.level || 'beginner') +
      '\nCardio: ' + (p.cardio || 'none') + '\nEquipment: ' + (p.equipment || 'full gym') +
      '\nTrainee: age ' + (p.age || '-') + ', weight ' + (p.weight || '-') + ' kg, height ' + (p.height || '-') +
      ' cm, sex ' + (p.gender || '-') + '\nNotes/limitations: ' + (String(p.notes || '').slice(0, 300) || 'none');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json', 'x-api-key': key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-5', max_tokens: 2600, output_config: { effort: 'low' },
        system, messages: [{ role: 'user', content: user }]
      })
    });
    if (!res.ok) throw new Error('AI request failed: ' + res.status);
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI returned no JSON');
    return normalize(JSON.parse(m[0]));
  }

  global.ExcerlyWorkout = { planLocal, planViaProxy, planAI, EX, resolveGymId, resolveHomeId, resolveVisual, foldName, NAME_ALIASES, HOME_ALIASES };
})(window);
