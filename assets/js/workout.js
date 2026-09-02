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
    cardio: { he: 'קרדיו קל לסיום (הליכון/אופניים)', en: 'Light finisher cardio (treadmill/bike)' }
  };

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
        name: exName(e), sets: sc.sets, reps: e === 'plank' ? (curLang() === 'en' ? '3 × 40 sec' : "3 × 40 שנ'") : sc.reps,
        rest, note: ''
      }));
      if (cardioLevel !== 'none') {
        const mins = cardioLevel === 'lots' ? (curLang() === 'en' ? '20 min' : "20 דק'") : (curLang() === 'en' ? '10 min' : "10 דק'");
        exs.push({ name: exName('cardio'), sets: '1', reps: mins, rest: '—', note: '' });
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
      exercises: (d.exercises || []).map(e => ({
        name: String(e.name || ''), sets: String(e.sets == null ? '' : e.sets),
        reps: String(e.reps == null ? '' : e.reps), rest: String(e.rest == null ? '' : e.rest),
        note: String(e.note || '')
      }))
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

  global.ExcerlyWorkout = { planLocal, planViaProxy, planAI };
})(window);
