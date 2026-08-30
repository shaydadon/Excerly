/* =============================================================
   Excerly – לוגיקת האפליקציה
   ============================================================= */
(function () {
  'use strict';

  const D = window.ExcerlyData;
  const A = window.ExcerlyAnim;
  const N = window.ExcerlyNutrition;

  /* ---------- אחסון מקומי ---------- */
  const STORE = {
    profile: 'excerly.profile',
    done: 'excerly.done',        // { 'YYYY-MM-DD': true }
    exdone: 'excerly.exdone',    // { 'YYYY-MM-DD': { exId: true } }
    reminder: 'excerly.reminder', // { enabled, time }
    foodlog: 'excerly.foodlog',  // { 'YYYY-MM-DD': { text, total, target, verdict } }
    ai: 'excerly.ai'             // { key, enabled }
  };
  const load = (k, fb) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }
    catch (e) { return fb; }
  };
  const save = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const pad = n => String(n).padStart(2, '0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const sameDay = (a, b) => dateKey(a) === dateKey(b);

  let doneMap = load(STORE.done, {});
  let exDoneMap = load(STORE.exdone, {}); // השלמה ברמת תרגיל בודד
  let viewDate = new Date();        // חודש מוצג בלוח
  const today = new Date();

  const exSet = key => (exDoneMap[key] || (exDoneMap[key] = {}));
  const isExDone = (key, id) => !!(exDoneMap[key] && exDoneMap[key][id]);
  const doneCount = (prog, key) => prog.exercises.filter(id => isExDone(key, id)).length;

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = el('div', 'toast'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* =========================================================
     פרופיל + BMI + קלוריות
     ========================================================= */
  function initProfile() {
    const p = load(STORE.profile, { age: '', weight: '', height: '', gender: 'male', activity: 'moderate' });
    const form = $('#profile-form');
    form.age.value = p.age;
    form.weight.value = p.weight;
    form.height.value = p.height;
    form.gender.value = p.gender;
    form.activity.value = p.activity;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        age: +form.age.value,
        weight: +form.weight.value,
        height: +form.height.value,
        gender: form.gender.value,
        activity: form.activity.value
      };
      if (!data.age || !data.weight || !data.height) {
        toast('נא למלא גיל, משקל וגובה');
        return;
      }
      save(STORE.profile, data);
      renderBMI(data);
      document.dispatchEvent(new CustomEvent('excerly:profile'));
      toast('הנתונים נשמרו ✓');
    });

    if (p.age && p.weight && p.height) renderBMI(p);
  }

  function renderBMI(p) {
    const box = $('#bmi-result');
    const bmi = D.calcBMI(p.weight, p.height);
    const cat = D.bmiCategory(bmi);
    const bmr = D.calcBMR({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender });
    const act = D.ACTIVITY_FACTORS[p.activity];
    const tdee = Math.round(bmr * act.factor);
    const m = D.macros(tdee);
    // מיקום המחוג: טווח 12–36 ממופה ל-0–100
    const gaugeP = Math.max(0, Math.min(100, ((bmi - 12) / (36 - 12)) * 100));

    box.innerHTML = `
      <div class="bmi-top">
        <div class="bmi-gauge" style="--gauge-color:${cat.color}">
          <div style="text-align:center">
            <div class="val">${bmi.toFixed(1)}</div>
            <div class="cap">BMI</div>
          </div>
        </div>
        <div class="bmi-cat">
          <span class="bmi-badge" style="background:${cat.color}">${cat.label}</span>
          <p class="bmi-advice">${cat.advice}</p>
        </div>
      </div>
      <div class="calorie-box">
        <div class="calorie-headline">
          <span class="num">${tdee.toLocaleString('he-IL')}</span>
          <span class="unit">קק"ל ליום (לשמירה על המשקל)</span>
        </div>
        <div class="calorie-sub">חילוף חומרים בסיסי: ${Math.round(bmr).toLocaleString('he-IL')} קק"ל · רמת פעילות: ${act.label}</div>
        <div class="macros">
          <div class="macro p"><div class="m-val">${m.protein} ג׳</div><div class="m-lbl">חלבון</div></div>
          <div class="macro c"><div class="m-val">${m.carbs} ג׳</div><div class="m-lbl">פחמימות</div></div>
          <div class="macro f"><div class="m-val">${m.fat} ג׳</div><div class="m-lbl">שומן</div></div>
        </div>
      </div>`;
    // הנעת המחוג
    requestAnimationFrame(() => {
      const g = box.querySelector('.bmi-gauge');
      if (g) g.style.setProperty('--p', gaugeP.toFixed(1));
    });
  }

  /* =========================================================
     לוח שנה
     ========================================================= */
  function renderCalendar() {
    const y = viewDate.getFullYear();
    const mo = viewDate.getMonth();
    $('#cal-month').textContent = `${D.MONTH_NAMES[mo]} ${y}`;

    const grid = $('#cal-grid');
    grid.innerHTML = '';
    D.DAY_NAMES.forEach(n => grid.appendChild(el('div', 'cal-dow', n.slice(0, 3))));

    const first = new Date(y, mo, 1).getDay();
    const days = new Date(y, mo + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(el('div', 'cal-cell empty'));

    for (let d = 1; d <= days; d++) {
      const date = new Date(y, mo, d);
      const prog = D.programForDate(date);
      const key = dateKey(date);
      const cell = el('div', 'cal-cell');
      if (prog.rest) cell.classList.add('rest');
      if (sameDay(date, today)) cell.classList.add('today');

      cell.appendChild(el('div', 'd-num', String(d)));
      const dot = el('div', 'dot');
      if (doneMap[key]) { dot.classList.add('done'); cell.appendChild(el('div', 'cell-check', '✓')); }
      else if (prog.rest) dot.classList.add('rest');
      cell.appendChild(dot);

      cell.addEventListener('click', () => openSheet(date));
      grid.appendChild(cell);
    }
  }

  /* =========================================================
     חלון יומי (bottom sheet) + מסך תרגיל
     ========================================================= */
  const backdrop = $('#sheet-backdrop');
  const sheet = $('#sheet');
  let sheetDate = null;

  function openSheet(date) {
    sheetDate = date;
    renderWorkout(date);
    backdrop.classList.add('open');
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    backdrop.classList.remove('open');
    sheet.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderWorkout(date) {
    const prog = D.programForDate(date);
    const key = dateKey(date);
    const done = !!doneMap[key];
    const dayLabel = `יום ${D.DAY_NAMES[date.getDay()]}, ${date.getDate()} ב${D.MONTH_NAMES[date.getMonth()]}`;
    const mins = D.estimatedMinutes(prog);

    const items = prog.exercises.map(id => {
      const ex = D.EXERCISES[id];
      const ed = isExDone(key, id);
      return `<div class="ex-item ${ed ? 'done' : ''}">
        <button class="ex-open" data-ex="${id}">
          <span class="ex-thumb">${A.svgFor(ex.animation)}</span>
          <span class="ex-info">
            <span class="ex-name">${ex.name}</span>
            <span class="ex-area">${ex.area}</span>
            <span class="ex-reps">${ex.reps}${ex.hold !== '—' ? ' · החזקה ' + ex.hold : ''}</span>
          </span>
        </button>
        <button class="ex-finish ${ed ? 'on' : ''}" data-ex="${id}"
          aria-label="${ed ? 'בטל סימון' : 'סיום תרגיל'}" title="${ed ? 'בוצע' : 'סמן כבוצע'}">${ed ? '✓' : '+'}</button>
      </div>`;
    }).join('');
    const dc = doneCount(prog, key);

    sheet.innerHTML = `
      <div class="sheet-grip"></div>
      <div class="sheet-head">
        <div class="row">
          <div>
            <div class="sheet-date">${dayLabel}</div>
            <div class="sheet-title">${prog.title}</div>
            <div class="sheet-focus">${prog.focus}</div>
          </div>
          <button class="sheet-close" id="sheet-close" aria-label="סגור">✕</button>
        </div>
        <div class="sheet-meta">
          <span class="chip">🧘 ${prog.exercises.length} תרגילים</span>
          <span class="chip">⏱ כ-${mins} דק׳</span>
          <span class="chip" id="ex-progress">✅ ${dc}/${prog.exercises.length} הושלמו</span>
          ${prog.rest ? '<span class="chip rest">☕ יום מנוחה פעילה</span>' : ''}
          ${foodChip(key)}
        </div>
      </div>
      <div class="sheet-body" id="sheet-body">
        <div class="ex-list">${items}</div>
        <div class="workout-actions">
          <button class="btn btn-primary btn-block" id="toggle-done">
            ${done ? '↺ בטל סימון האימון' : '✓ סיימתי את כל האימון'}
          </button>
        </div>
        <div class="done-banner ${done ? 'show' : ''}" id="done-banner">🎉 כל הכבוד! השלמת את האימון להיום</div>
      </div>`;

    $('#sheet-close', sheet).addEventListener('click', closeSheet);
    $('#toggle-done', sheet).addEventListener('click', () => toggleDone(key));
    sheet.querySelectorAll('.ex-open').forEach(btn => {
      btn.addEventListener('click', () => openExercise(btn.dataset.ex));
    });
    sheet.querySelectorAll('.ex-finish').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleExDone(key, btn.dataset.ex); });
    });
    sheet.scrollTop = 0;
  }

  // סנכרון סימון היום עם השלמת כל התרגילים
  function syncDayDone(key, prog) {
    const all = prog.exercises.length > 0 && prog.exercises.every(id => isExDone(key, id));
    if (all) doneMap[key] = true; else delete doneMap[key];
    save(STORE.done, doneMap);
  }

  // סימון/ביטול תרגיל בודד
  function toggleExDone(key, id, silent) {
    const prog = D.programForDate(sheetDate);
    const s = exSet(key);
    if (s[id]) delete s[id]; else s[id] = true;
    if (Object.keys(s).length === 0) delete exDoneMap[key];
    save(STORE.exdone, exDoneMap);
    const wasDone = !!doneMap[key];
    syncDayDone(key, prog);
    renderWorkout(sheetDate);
    renderCalendar();
    updateStreak();
    if (!silent) {
      if (doneMap[key] && !wasDone) toast('כל הכבוד! השלמת את כל האימון 💪');
      else if (isExDone(key, id)) toast('תרגיל הושלם ✓');
    }
  }

  // סימון/ביטול כל האימון – מסמן גם את כל התרגילים
  function toggleDone(key) {
    const prog = D.programForDate(sheetDate);
    if (doneMap[key]) {
      delete doneMap[key];
      delete exDoneMap[key];
    } else {
      doneMap[key] = true;
      const s = exSet(key);
      prog.exercises.forEach(id => { s[id] = true; });
    }
    save(STORE.done, doneMap);
    save(STORE.exdone, exDoneMap);
    renderWorkout(sheetDate);
    renderCalendar();
    updateStreak();
    if (doneMap[key]) toast('אימון הושלם! 💪');
  }

  function openExercise(id) {
    const ex = D.EXERCISES[id];
    const key = dateKey(sheetDate);
    const ed = isExDone(key, id);
    const body = $('#sheet-body', sheet);
    body.innerHTML = `
      <button class="detail-back" id="detail-back">→ חזרה לרשימה</button>
      <div class="detail-stage">${A.svgFor(ex.animation)}</div>
      <div class="detail-name">${ex.name}</div>
      <div class="detail-badges">
        <span class="badge reps">🔁 ${ex.reps}</span>
        ${ex.hold !== '—' ? `<span class="badge hold">⏳ החזקה ${ex.hold}</span>` : ''}
        <span class="badge area">${ex.area}</span>
      </div>
      <ol class="detail-steps">${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      <div class="detail-tip"><span class="ico">💡</span><span><b>טיפ:</b> ${ex.tip}</span></div>
      <button class="btn ${ed ? 'btn-ghost' : 'btn-primary'} btn-block detail-finish" id="detail-finish">
        ${ed ? '↺ בטל סימון התרגיל' : '✓ סיימתי את התרגיל'}
      </button>`;
    $('#detail-back', body).addEventListener('click', () => renderWorkout(sheetDate));
    $('#detail-finish', body).addEventListener('click', () => {
      toggleExDone(key, id, true);
      const nowDone = isExDone(key, id);
      toast(nowDone ? 'תרגיל הושלם ✓' : 'הסימון בוטל');
      openExercise(id); // רענון מצב הכפתור
    });
    sheet.scrollTop = 0;
  }

  backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  /* =========================================================
     רצף אימונים (streak)
     ========================================================= */
  function updateStreak() {
    let streak = 0;
    const d = new Date();
    // אם היום לא סומן, נתחיל לספור מאתמול
    if (!doneMap[dateKey(d)]) d.setDate(d.getDate() - 1);
    while (doneMap[dateKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
    const total = Object.keys(doneMap).length;
    $('#streak-num').textContent = streak;
    $('#total-num').textContent = total;
  }

  /* =========================================================
     תזכורות יומיות
     ========================================================= */
  let reminderTimer = null;
  function initReminders() {
    const r = load(STORE.reminder, { enabled: false, time: '18:00' });
    const toggle = $('#reminder-toggle');
    const timeInput = $('#reminder-time');
    toggle.checked = r.enabled;
    timeInput.value = r.time;

    const persist = () => {
      const data = { enabled: toggle.checked, time: timeInput.value };
      save(STORE.reminder, data);
      scheduleReminder(data);
      updateReminderStatus(data);
    };

    toggle.addEventListener('change', async () => {
      if (toggle.checked && 'Notification' in window && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toggle.checked = false;
          toast('כדי לקבל תזכורות צריך לאשר התראות');
        }
      }
      persist();
    });
    timeInput.addEventListener('change', persist);

    scheduleReminder(r);
    updateReminderStatus(r);
  }

  function updateReminderStatus(r) {
    const s = $('#reminder-status');
    if (!('Notification' in window)) {
      s.textContent = 'הדפדפן אינו תומך בהתראות. נשמח להזכיר לך בכל פתיחה של האפליקציה.';
      return;
    }
    if (r.enabled && Notification.permission === 'granted') {
      s.textContent = `תזכורת יומית פעילה לשעה ${r.time}. השאירו את האפליקציה פתוחה או פתחו אותה במהלך היום.`;
    } else if (r.enabled) {
      s.textContent = 'ההתראות חסומות בדפדפן. אפשר לאשר אותן בהגדרות האתר.';
    } else {
      s.textContent = 'התזכורות כבויות.';
    }
  }

  function scheduleReminder(r) {
    if (reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
    if (!r.enabled) return;
    const [h, mi] = r.time.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, mi, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = Math.min(next - now, 2147483647); // תקרת setTimeout
    reminderTimer = setTimeout(() => {
      fireReminder();
      scheduleReminder(load(STORE.reminder, r)); // תזמון ליום הבא
    }, delay);
  }

  function fireReminder() {
    const prog = D.programForDate(new Date());
    const body = prog.rest
      ? 'היום מנוחה פעילה 🧘 קחו כמה דקות למתיחות רגועות.'
      : `הגיע הזמן לאימון "${prog.title}" 💪 ${prog.exercises.length} תרגילים מחכים לך.`;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Excerly – זמן להתמתח!', {
          body, icon: 'assets/icon.svg', badge: 'assets/icon.svg', tag: 'excerly-daily'
        });
        return;
      } catch (e) {}
    }
    toast('⏰ זמן לאימון היומי!');
  }

  /* בדיקת "החמצה" בפתיחת האפליקציה – אם עברה שעת התזכורת והיום לא בוצע */
  function checkMissedReminder() {
    const r = load(STORE.reminder, { enabled: false, time: '18:00' });
    if (!r.enabled) return;
    const [h, mi] = r.time.split(':').map(Number);
    const now = new Date();
    const past = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= mi);
    if (past && !doneMap[dateKey(now)]) {
      const prog = D.programForDate(now);
      if (!prog.rest) {
        setTimeout(() => toast(`עוד לא התאמנת היום – ${prog.title} מחכה לך 💪`), 1200);
      }
    }
  }

  /* =========================================================
     מעקב תזונה יומי (הערכת קלוריות + תפריט)
     ========================================================= */
  function foodChip(key) {
    const log = load(STORE.foodlog, {})[key];
    if (!log) return '';
    const v = log.verdict || {};
    const c = v.color || 'var(--muted)';
    return `<span class="chip" style="color:${c};border-color:${c}">🍎 ${log.total}${log.target ? '/' + log.target : ''} קק"ל</span>`;
  }

  function aiCfg() { return load(STORE.ai, { proxyUrl: '', key: '', enabled: false }); }
  function updateAiBadge() {
    const badge = $('#ai-badge');
    if (badge) badge.hidden = aiProvider().mode === 'local';
  }
  // האם להשתמש ב-AI, ובאיזה ספק: 'proxy' (מומלץ) או 'key' (BYOK)
  function aiProvider() {
    const c = aiCfg();
    if (c.proxyUrl) return { mode: 'proxy', url: c.proxyUrl };
    if (c.enabled && c.key) return { mode: 'key', key: c.key };
    return { mode: 'local' };
  }

  function renderNutriTarget() {
    const box = $('#nutri-target');
    const target = N.targetCalories();
    if (!target) {
      box.innerHTML = '<div class="nutri-need-profile">מלאו את פרטי הפרופיל למעלה כדי לקבל יעד קלוריות יומי מותאם.</div>';
      return null;
    }
    box.innerHTML = `<div class="nutri-goal"><span class="nutri-goal-lbl">היעד היומי שלך</span><span class="nutri-goal-val">${target.toLocaleString('he-IL')} קק"ל</span></div>`;
    return target;
  }

  function renderFoodResult(res, target) {
    const box = $('#nutri-result');
    const v = N.verdict(res.total, target);
    const pct = Math.min(100, Math.round((res.total / target) * 100));
    const itemsHtml = res.items.length
      ? `<ul class="nutri-items">${res.items.map(i => `<li><span>${i.name}</span><span>${i.kcal} קק"ל</span></li>`).join('')}</ul>`
      : '<div class="nutri-empty">לא זיהיתי פריטי מזון. נסו לפרט יותר, למשל "2 ביצים, פרוסת לחם, תפוח".</div>';
    const unmatched = res.unmatched && res.unmatched.length
      ? `<div class="nutri-unmatched">לא זוהו: ${res.unmatched.join(', ')} — לא נכללו בחישוב.</div>` : '';
    const deltaTxt = v.key === 'over'
      ? `חרגת ב-${v.delta.toLocaleString('he-IL')} קק"ל`
      : v.key === 'under'
        ? `נותרו לך ${v.delta.toLocaleString('he-IL')} קק"ל להיום`
        : 'נשארת בטווח היעד';
    box.innerHTML = `
      <div class="nutri-summary">
        <div class="nutri-verdict" style="background:${v.color}">${v.label}</div>
        <div class="nutri-numbers"><b>${res.total.toLocaleString('he-IL')}</b> מתוך ${target.toLocaleString('he-IL')} קק"ל · ${deltaTxt}</div>
      </div>
      <div class="nutri-bar"><span style="width:${pct}%;background:${v.color}"></span></div>
      ${res.source === 'ai' ? '<div class="nutri-src">✨ הוערך באמצעות Claude AI</div>' : '<div class="nutri-src">הערכה מקומית — לחישוב מדויק יותר הפעילו מצב AI למטה</div>'}
      ${res.note ? `<div class="nutri-note">${res.note}</div>` : ''}
      ${itemsHtml}
      ${unmatched}`;
    box.classList.add('show');
  }

  function renderMenu(plan) {
    const box = $('#menu-result');
    box.innerHTML = `
      <div class="menu-head">
        <div class="menu-title">תפריט יומי מוצע</div>
        <button class="btn btn-ghost menu-shuffle" id="menu-shuffle">🔄 תפריט אחר</button>
      </div>
      <div class="menu-list">${plan.meals.map(m => `
        <div class="menu-item">
          <div class="menu-slot">${m.label}</div>
          <div class="menu-name">${m.name}</div>
          <div class="menu-kcal">${m.kcal} קק"ל</div>
        </div>`).join('')}</div>
      <div class="menu-total">סה"כ כ-${plan.total.toLocaleString('he-IL')} קק"ל${plan.target ? ' (יעד: ' + plan.target.toLocaleString('he-IL') + ')' : ''}</div>
      ${plan.source === 'ai' ? '<div class="nutri-src">✨ נבנה באמצעות Claude AI</div>' : ''}
      ${plan.note ? `<div class="nutri-note">${plan.note}</div>` : ''}`;
    box.classList.add('show');
    $('#menu-shuffle', box).addEventListener('click', buildMenu);
  }

  async function calcFood() {
    const target = renderNutriTarget();
    if (!target) { toast('מלאו קודם את פרטי הפרופיל'); return; }
    const text = $('#food-text').value.trim();
    if (!text) { toast('כתבו מה אכלתם היום'); return; }
    const prov = aiProvider();
    const btn = $('#calc-food');
    let res;
    if (prov.mode !== 'local') {
      btn.disabled = true; btn.textContent = 'Claude מחשב…';
      try {
        res = prov.mode === 'proxy'
          ? await N.estimateViaProxy(text, prov.url)
          : await N.estimateAI(text, prov.key);
      } catch (e) { toast('שגיאת AI — עברתי למנוע המקומי'); res = N.estimateLocal(text); }
      btn.disabled = false; btn.textContent = 'חשב קלוריות';
    } else {
      res = N.estimateLocal(text);
    }
    renderFoodResult(res, target);
    const v = N.verdict(res.total, target);
    const log = load(STORE.foodlog, {});
    log[dateKey(new Date())] = { text, total: res.total, target, verdict: { color: v.color, key: v.key } };
    save(STORE.foodlog, log);
  }

  async function buildMenu() {
    const target = renderNutriTarget();
    if (!target) { toast('מלאו קודם את פרטי הפרופיל'); return; }
    const prov = aiProvider();
    const btn = $('#build-menu');
    let plan;
    if (prov.mode !== 'local') {
      btn.disabled = true; btn.textContent = 'Claude בונה…';
      try {
        plan = prov.mode === 'proxy'
          ? await N.mealPlanViaProxy(target, prov.url)
          : await N.mealPlanAI(target, prov.key);
      } catch (e) { toast('שגיאת AI — בניתי תפריט מקומי'); plan = N.generateMealPlan(target); }
      btn.disabled = false; btn.textContent = '🍽️ בנה לי תפריט יומי';
    } else {
      plan = N.generateMealPlan(target);
    }
    renderMenu(plan);
  }

  function initNutrition() {
    renderNutriTarget();
    // שחזור רישום היום
    const todayLog = load(STORE.foodlog, {})[dateKey(new Date())];
    if (todayLog) {
      $('#food-text').value = todayLog.text || '';
      const t = N.targetCalories();
      if (t) renderFoodResult(N.estimateLocal(todayLog.text || ''), t);
    }
    // הגדרות AI
    const cfg = aiCfg();
    $('#ai-proxy').value = cfg.proxyUrl || '';
    $('#ai-key').value = cfg.key || '';
    $('#ai-enabled').checked = !!cfg.enabled;
    const persistAI = () => save(STORE.ai, {
      proxyUrl: $('#ai-proxy').value.trim(),
      key: $('#ai-key').value.trim(),
      enabled: $('#ai-enabled').checked
    });
    $('#ai-proxy').addEventListener('change', () => { persistAI(); updateAiBadge(); });
    $('#ai-key').addEventListener('change', persistAI);
    $('#ai-enabled').addEventListener('change', () => {
      if ($('#ai-enabled').checked && !$('#ai-key').value.trim()) {
        toast('הזינו מפתח API כדי להפעיל מצב AI');
        $('#ai-enabled').checked = false;
      }
      persistAI();
    });
    updateAiBadge();

    $('#calc-food').addEventListener('click', calcFood);
    $('#build-menu').addEventListener('click', buildMenu);
    document.addEventListener('excerly:profile', renderNutriTarget);
  }

  /* =========================================================
     אתחול
     ========================================================= */
  function init() {
    // ניווט חודשים
    $('#cal-prev').addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      renderCalendar();
    });
    $('#cal-next').addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      renderCalendar();
    });
    $('#today-btn').addEventListener('click', () => openSheet(new Date()));

    initProfile();
    initNutrition();
    renderCalendar();
    updateStreak();
    initReminders();
    checkMissedReminder();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
