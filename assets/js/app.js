/* =============================================================
   Excerly – לוגיקת האפליקציה
   ============================================================= */
(function () {
  'use strict';

  const D = window.ExcerlyData;
  const A = window.ExcerlyAnim;
  const N = window.ExcerlyNutrition;
  const I18n = window.ExcerlyI18n;
  const t = (k, v) => I18n.t(k, v);          // תרגום מחרוזת
  const L = o => I18n.L(o);                    // בחירת ערך דו-לשוני {he,en}
  const nf = n => Number(n).toLocaleString(I18n.lang === 'he' ? 'he-IL' : 'en-US');

  /* ---------- אחסון מקומי ---------- */
  const STORE = {
    profile: 'excerly.profile',
    done: 'excerly.done',        // { 'YYYY-MM-DD': true }
    exdone: 'excerly.exdone',    // { 'YYYY-MM-DD': { exId: true } }
    reminder: 'excerly.reminder', // { enabled, time }
    foodlog: 'excerly.foodlog',  // מטמון נגזר: { 'YYYY-MM-DD': { total, target, verdict } }
    meals: 'excerly.meals',      // מקור האמת: { 'YYYY-MM-DD': [ { id, name, kcal } ] }
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

  // מגדר הדמות באנימציות – לפי הפרופיל (ברירת מחדל: זכר)
  const figGender = () => (load(STORE.profile, {}).gender === 'female' ? 'female' : 'male');

  /* ---------- שכבת ויזואל לתרגיל: Lottie (אם הוגדר) או SVG מובנה ----------
     אם קיים קובץ Lottie לתרגיל ב-D.LOTTIE – מציגים אותו במסכים הגדולים
     (פירוט התרגיל והנגן). אחרת, נופלים בחזרה לדמות ה-SVG המובנית.
     התמונות הקטנות (thumbnails) תמיד משתמשות ב-SVG הקליל. */
  function lottieSrc(ex) {
    const e = (D.LOTTIE || {})[ex.animation];
    if (!e) return null;
    if (typeof e === 'string') return e;
    return e[figGender()] || e.male || e.female || null;
  }
  // תמונת אווטאר סטטית (זכר/נקבה) אם קיימת לתרגיל
  function exImg(ex) {
    if (!(D.EXIMG || {})[ex.animation]) return null;
    const g = figGender() === 'female' ? 'f' : 'm';
    return `assets/exercise-img/${ex.animation}-${g}.png`;
  }
  // מחזיר HTML לויזואל התרגיל: Lottie (מסך גדול) > תמונה סטטית > דמות SVG.
  function exVisual(ex, big) {
    if (big && lottieSrc(ex)) return `<div class="ex-lottie" data-lottie="${ex.animation}"></div>`;
    const img = exImg(ex);
    if (img) return `<img class="ex-photo" src="${img}" alt="" loading="lazy">`;
    return A.svgFor(ex.animation, figGender());
  }
  // אתחול נגני Lottie בתוך אלמנט לאחר שהוזרק ל-DOM
  function mountLottie(root) {
    if (!root) return;
    const nodes = root.querySelectorAll('.ex-lottie[data-lottie]');
    if (!nodes.length) return;
    withLottie(() => nodes.forEach(el => {
      if (el.dataset.mounted) return;
      const ex = D.EXERCISES[el.dataset.lottie] || { animation: el.dataset.lottie };
      const src = lottieSrc(ex);
      if (!src || !window.lottie) return;
      el.dataset.mounted = '1';
      window.lottie.loadAnimation({ container: el, renderer: 'svg', loop: true, autoplay: true, path: src });
    }));
  }
  // טעינה עצלה של ספריית lottie-web (רק אם באמת נדרשת)
  let _lottieLoading = null;
  function withLottie(cb) {
    if (window.lottie) return cb();
    if (!_lottieLoading) {
      _lottieLoading = new Promise((res) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
        s.onload = () => res();
        s.onerror = () => res();
        document.head.appendChild(s);
      });
    }
    _lottieLoading.then(cb);
  }

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
        toast(t('toastFillAWH'));
        return;
      }
      save(STORE.profile, data);
      renderBMI(data);
      document.dispatchEvent(new CustomEvent('excerly:profile'));
      toast(t('toastSaved'));
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
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const catLabel = t('cat' + cap(cat.key));
    const advice = t('adv' + cap(cat.key));
    const actLabel = t('act' + cap(p.activity));
    const gaugeP = Math.max(0, Math.min(100, ((bmi - 12) / (36 - 12)) * 100));

    box.innerHTML = `
      <div class="bmi-top">
        <div class="bmi-gauge" style="--gauge-color:${cat.color}">
          <div style="text-align:center">
            <div class="val">${bmi.toFixed(1)}</div>
            <div class="cap">${t('bmiCap')}</div>
          </div>
        </div>
        <div class="bmi-cat">
          <span class="bmi-badge" style="background:${cat.color}">${catLabel}</span>
          <p class="bmi-advice">${advice}</p>
        </div>
      </div>
      <div class="calorie-box">
        <div class="calorie-headline">
          <span class="num">${nf(tdee)}</span>
          <span class="unit">${t('perDay')}</span>
        </div>
        <div class="calorie-sub">${t('bmrLine', { bmr: nf(Math.round(bmr)), act: actLabel })}</div>
        <div class="macros">
          <div class="macro p"><div class="m-val">${m.protein} ${t('grams')}</div><div class="m-lbl">${t('protein')}</div></div>
          <div class="macro c"><div class="m-val">${m.carbs} ${t('grams')}</div><div class="m-lbl">${t('carbs')}</div></div>
          <div class="macro f"><div class="m-val">${m.fat} ${t('grams')}</div><div class="m-lbl">${t('fat')}</div></div>
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
    $('#cal-month').textContent = `${I18n.monthNames()[mo]} ${y}`;

    const grid = $('#cal-grid');
    grid.innerHTML = '';
    I18n.dayShort().forEach(n => grid.appendChild(el('div', 'cal-dow', n)));

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
    const dayLabel = t('dayLabel', { day: I18n.dayNames()[date.getDay()], d: date.getDate(), month: I18n.monthNames()[date.getMonth()] });
    const mins = D.estimatedMinutes(prog);

    const items = prog.exercises.map(id => {
      const ex = D.EXERCISES[id];
      const ed = isExDone(key, id);
      const hold = L(ex.hold);
      return `<div class="ex-item ${ed ? 'done' : ''}">
        <button class="ex-open" data-ex="${id}">
          <span class="ex-thumb">${exVisual(ex, false)}</span>
          <span class="ex-info">
            <span class="ex-name">${L(ex.name)}</span>
            <span class="ex-area">${L(ex.area)}</span>
            <span class="ex-reps">${L(ex.reps)}${hold !== '—' ? t('repsSep') + hold : ''}</span>
          </span>
        </button>
        <button class="ex-finish ${ed ? 'on' : ''}" data-ex="${id}"
          aria-label="${ed ? t('finishUnmark') : t('finishMark')}" title="${ed ? t('finishUnmark') : t('finishMark')}">${ed ? '✓' : '+'}</button>
      </div>`;
    }).join('');
    const dc = doneCount(prog, key);
    const heroEx = prog.exercises && prog.exercises.length ? D.EXERCISES[prog.exercises[0]] : null;
    const heroSrc = heroEx ? exImg(heroEx) : null;
    const heroImg = heroSrc ? `<img class="sheet-hero" src="${heroSrc}" alt="" />` : '';

    sheet.innerHTML = `
      <div class="sheet-grip"></div>
      <div class="sheet-head">
        <div class="row">
          <div class="sheet-head-main">
            ${heroImg}
            <div>
              <div class="sheet-date">${dayLabel}</div>
              <div class="sheet-title">${L(prog.title)}</div>
              <div class="sheet-focus">${L(prog.focus)}</div>
            </div>
          </div>
          <button class="sheet-close" id="sheet-close" aria-label="✕">✕</button>
        </div>
        <div class="sheet-meta">
          <span class="chip">${t('exCount', { n: prog.exercises.length })}</span>
          <span class="chip">${t('minutesChip', { n: mins })}</span>
          <span class="chip" id="ex-progress">${t('progressChip', { d: dc, n: prog.exercises.length })}</span>
          ${prog.rest ? `<span class="chip rest">${t('restChip')}</span>` : ''}
          ${foodChip(key)}
        </div>
      </div>
      <div class="sheet-body" id="sheet-body">
        <div class="ex-list">${items}</div>
        <div class="workout-actions">
          <button class="btn btn-primary btn-block" id="start-workout" style="margin-bottom:10px">${t('startWorkout')}</button>
          <button class="btn btn-ghost btn-block" id="toggle-done">
            ${done ? t('dayUndoBtn') : t('dayDoneBtn')}
          </button>
        </div>
        <div class="done-banner ${done ? 'show' : ''}" id="done-banner">${t('doneBanner')}</div>
      </div>`;

    $('#sheet-close', sheet).addEventListener('click', closeSheet);
    $('#start-workout', sheet).addEventListener('click', () => openPlayer(date));
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
    renderHistory();
    if (!silent) {
      if (doneMap[key] && !wasDone) toast(t('toastAllDone'));
      else if (isExDone(key, id)) toast(t('toastExDone'));
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
    renderHistory();
    if (doneMap[key]) toast(t('toastWorkoutDone'));
  }

  function openExercise(id) {
    const ex = D.EXERCISES[id];
    const key = dateKey(sheetDate);
    const ed = isExDone(key, id);
    const hold = L(ex.hold);
    const body = $('#sheet-body', sheet);
    body.innerHTML = `
      <button class="detail-back" id="detail-back">${t('back')}</button>
      <div class="detail-stage">${exVisual(ex, true)}</div>
      <div class="detail-name">${L(ex.name)}</div>
      <div class="detail-badges">
        <span class="badge reps">${t('badgeReps', { r: L(ex.reps) })}</span>
        ${hold !== '—' ? `<span class="badge hold">${t('badgeHold', { h: hold })}</span>` : ''}
        <span class="badge area">${L(ex.area)}</span>
      </div>
      <ol class="detail-steps">${L(ex.steps).map(s => `<li>${s}</li>`).join('')}</ol>
      <div class="detail-tip"><span class="ico">💡</span><span><b>${t('tipLabel')}</b> ${L(ex.tip)}</span></div>
      <button class="btn ${ed ? 'btn-ghost' : 'btn-primary'} btn-block detail-finish" id="detail-finish">
        ${ed ? t('detailUnfinish') : t('detailFinish')}
      </button>`;
    mountLottie(body);
    $('#detail-back', body).addEventListener('click', () => renderWorkout(sheetDate));
    $('#detail-finish', body).addEventListener('click', () => {
      toggleExDone(key, id, true);
      const nowDone = isExDone(key, id);
      toast(nowDone ? t('toastExDone') : t('toastUnmark'));
      openExercise(id); // רענון מצב הכפתור
    });
    sheet.scrollTop = 0;
  }

  backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!P().hidden) closePlayer(); else closeSheet();
  });

  /* =========================================================
     נגן אימון מודרך (טיימר + מעבר בין תרגילים)
     ========================================================= */
  const player = { idx: 0, remaining: 0, paused: false, timer: null, exs: [], key: null, date: null };
  const P = () => $('#player');
  const RING_R = 46, RING_C = 2 * Math.PI * RING_R;
  const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.max(0, s) % 60).padStart(2, '0');

  function openPlayer(date) {
    const prog = D.programForDate(date);
    if (!prog.exercises.length) return;
    player.exs = prog.exercises.slice();
    player.date = date; player.key = dateKey(date); player.idx = 0;
    P().hidden = false; document.body.style.overflow = 'hidden';
    startExercise(0);
  }
  function closePlayer() {
    stopTick(); P().hidden = true; document.body.style.overflow = '';
    if (sheet.classList.contains('open') && sheetDate) renderWorkout(sheetDate);
  }
  function startExercise(i) {
    stopTick();
    player.idx = i; player.paused = false;
    player.remaining = D.EXERCISES[player.exs[i]].duration;
    renderPlayer();
    startTick();
  }
  function startTick() {
    stopTick();
    player.timer = setInterval(() => {
      if (player.paused) return;
      player.remaining--;
      if (player.remaining <= 0) { if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {} nextExercise(); return; }
      updatePlayerTime();
    }, 1000);
  }
  function stopTick() { if (player.timer) { clearInterval(player.timer); player.timer = null; } }
  function nextExercise() { player.idx < player.exs.length - 1 ? startExercise(player.idx + 1) : finishPlayer(); }
  function prevExercise() { startExercise(Math.max(0, player.idx - 1)); }
  function togglePlay() {
    player.paused = !player.paused;
    const b = $('#p-play', P());
    if (b) { b.textContent = player.paused ? '▶' : '⏸'; b.setAttribute('aria-label', player.paused ? t('ariaPlay') : t('ariaPause')); }
  }

  function updatePlayerTime() {
    const te = $('#p-time', P());
    if (te) te.textContent = fmtTime(player.remaining);
    const pr = $('#p-prog', P());
    if (pr) {
      const dur = D.EXERCISES[player.exs[player.idx]].duration;
      const frac = Math.max(0, player.remaining) / dur;
      pr.style.strokeDasharray = RING_C;
      pr.style.strokeDashoffset = (RING_C * (1 - frac)).toFixed(1);
    }
  }

  function renderPlayer() {
    const ex = D.EXERCISES[player.exs[player.idx]];
    const hold = L(ex.hold);
    P().innerHTML = `
      <div class="player-top">
        <button class="p-icon" id="p-close" aria-label="${t('ariaClose')}">✕</button>
        <div class="player-count">${t('playerOf', { i: player.idx + 1, n: player.exs.length })}</div>
        <span class="p-icon" style="visibility:hidden"></span>
      </div>
      <div class="player-stage">
        <svg class="p-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="p-track" cx="50" cy="50" r="${RING_R}" />
          <circle class="p-prog" id="p-prog" cx="50" cy="50" r="${RING_R}" />
        </svg>
        <div class="player-anim">${exVisual(ex, true)}</div>
      </div>
      <div class="player-name">${L(ex.name)}</div>
      <div class="detail-badges" style="justify-content:center;margin-top:6px">
        <span class="badge reps">${t('badgeReps', { r: L(ex.reps) })}</span>
        ${hold !== '—' ? `<span class="badge hold">${t('badgeHold', { h: hold })}</span>` : ''}
      </div>
      <div class="player-time" id="p-time">${fmtTime(player.remaining)}</div>
      <div class="player-controls">
        <button class="p-ctrl" id="p-prev" aria-label="${t('ariaPrev')}">⏮</button>
        <button class="p-ctrl p-main" id="p-play" aria-label="${t('ariaPause')}">⏸</button>
        <button class="p-ctrl" id="p-next" aria-label="${t('ariaNext')}">⏭</button>
      </div>`;
    $('#p-close', P()).addEventListener('click', closePlayer);
    $('#p-prev', P()).addEventListener('click', prevExercise);
    $('#p-next', P()).addEventListener('click', nextExercise);
    $('#p-play', P()).addEventListener('click', togglePlay);
    mountLottie(P());
    updatePlayerTime();
  }

  function finishPlayer() {
    stopTick();
    const key = player.key, prog = D.programForDate(player.date);
    const s = exSet(key); prog.exercises.forEach(id => { s[id] = true; }); doneMap[key] = true;
    save(STORE.exdone, exDoneMap); save(STORE.done, doneMap);
    renderCalendar(); updateStreak(); renderHistory();
    P().innerHTML = `
      <div class="player-top">
        <button class="p-icon" id="p-close" aria-label="${t('ariaClose')}">✕</button>
        <span class="p-icon"></span><span class="p-icon"></span>
      </div>
      <div class="player-done">
        <div class="pd-emoji">🎉</div>
        <div class="pd-text">${t('playerDone')}</div>
        <button class="btn btn-primary" id="p-finish">${t('closeWord')}</button>
      </div>`;
    $('#p-close', P()).addEventListener('click', closePlayer);
    $('#p-finish', P()).addEventListener('click', closePlayer);
  }

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
    renderHero();
  }

  // דמות "גיבור" במסך הבית – התרגיל הראשון של היום, לפי מגדר הפרופיל
  function renderHero() {
    const el = document.getElementById('hero-fig');
    if (!el) return;
    const prog = D.programForDate(new Date());
    const firstId = prog && prog.exercises && prog.exercises[0];
    const ex = firstId ? D.EXERCISES[firstId] : D.EXERCISES.child;
    const src = ex ? exImg(ex) : null;
    if (src) { el.src = src; el.hidden = false; } else { el.hidden = true; }
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
          toast(t('toastReminderPerm'));
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
    if (!('Notification' in window)) { s.textContent = t('remUnsupported'); return; }
    if (r.enabled && Notification.permission === 'granted') s.textContent = t('remActive', { time: r.time });
    else if (r.enabled) s.textContent = t('remBlocked');
    else s.textContent = t('remOff');
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
      ? t('notifRest')
      : t('notifWorkout', { title: L(prog.title), n: prog.exercises.length });
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(t('notifTitle'), {
          body, icon: 'assets/icon.svg', badge: 'assets/icon.svg', tag: 'excerly-daily'
        });
        return;
      } catch (e) {}
    }
    toast(t('toastReminderNow'));
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
        setTimeout(() => toast(t('toastMissed', { title: L(prog.title) })), 1200);
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
    return `<span class="chip" style="color:${c};border-color:${c}">${t('foodChip', { t: log.total + (log.target ? '/' + log.target : '') })}</span>`;
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

  /* ---------- ניהול הארוחות של היום (מקור אמת אחד) ---------- */
  let estimateItems = [];
  const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function getMeals(key) {
    const all = load(STORE.meals, {});
    if (all[key]) return all[key];
    // מיגרציה מרישום ישן (סכום בודד) לפריט ארוחה אחד
    const log = load(STORE.foodlog, {})[key];
    if (log && log.total > 0) {
      const seeded = [{ id: uid(), name: t('mealLabel'), kcal: log.total }];
      all[key] = seeded; save(STORE.meals, all);
      return seeded;
    }
    return [];
  }

  // שמירת הארוחות + עדכון המטמון הנגזר (foodlog) — כך שני המסכים תואמים
  function setMeals(key, arr) {
    const all = load(STORE.meals, {});
    if (arr.length) all[key] = arr; else delete all[key];
    save(STORE.meals, all);
    const fl = load(STORE.foodlog, {});
    if (arr.length) {
      const total = arr.reduce((s, m) => s + (m.kcal || 0), 0);
      const target = N.targetCalories() || (fl[key] && fl[key].target) || 2000;
      const v = N.verdict(total, target);
      fl[key] = { total, target, verdict: { color: v.color, key: v.key } };
    } else delete fl[key];
    save(STORE.foodlog, fl);
  }

  function addMeals(items) {
    const valid = (items || []).filter(it => it && it.kcal);
    if (!valid.length) return;
    const key = dateKey(new Date());
    const arr = getMeals(key).slice();
    valid.forEach(it => arr.push({ id: uid(), name: it.name || t('mealLabel'), kcal: Math.round(it.kcal) }));
    setMeals(key, arr);
    refreshNutrition();
    toast(t('toastAdded'));
  }
  const addMeal = item => addMeals([item]);

  function removeMeal(id) {
    const key = dateKey(new Date());
    setMeals(key, getMeals(key).filter(m => m.id !== id));
    refreshNutrition();
    toast(t('toastRemoved'));
  }

  // רענון כל התצוגות שתלויות בתזונה — עקביות מלאה בין המסכים והממוצע
  function refreshNutrition() {
    renderDayMeals();
    renderHistory();
    if (sheet.classList.contains('open') && sheetDate) renderWorkout(sheetDate);
  }

  function renderDayMeals() {
    const box = $('#day-meals');
    if (!box) return;
    const key = dateKey(new Date());
    const meals = getMeals(key);
    if (!meals.length) { box.innerHTML = ''; box.classList.remove('show'); return; }
    const total = meals.reduce((s, m) => s + m.kcal, 0);
    const target = N.targetCalories();
    const rows = meals.map(m => `
      <div class="dm-row">
        <button class="dm-del" data-id="${m.id}" aria-label="${t('removeMealAria')}" title="${t('removeMealAria')}">✕</button>
        <span class="dm-name">${m.name}</span>
        <span class="dm-kcal">${m.kcal} ${t('goalUnit')}</span>
      </div>`).join('');
    let summary;
    if (target) {
      const v = N.verdict(total, target);
      const pct = Math.min(100, Math.round((total / target) * 100));
      const vLabel = t(v.key === 'over' ? 'vOver' : v.key === 'met' ? 'vMet' : 'vUnder');
      const deltaTxt = v.key === 'over' ? t('dOver', { n: nf(v.delta) })
        : v.key === 'under' ? t('dUnder', { n: nf(v.delta) }) : t('dMet');
      summary = `
        <div class="nutri-summary" style="margin-top:10px">
          <div class="nutri-verdict" style="background:${v.color}">${vLabel}</div>
          <div class="nutri-numbers">${t('ofTarget', { a: '<b>' + nf(total) + '</b>', b: nf(target), d: deltaTxt })}</div>
        </div>
        <div class="nutri-bar"><span style="width:${pct}%;background:${v.color}"></span></div>`;
    } else {
      summary = `<div class="nutri-numbers" style="margin-top:8px"><b>${nf(total)}</b> ${t('goalUnit')}</div>`;
    }
    box.innerHTML = `<div class="dm-title">${t('dayMealsTitle')}</div><div class="dm-list">${rows}</div>${summary}`;
    box.classList.add('show');
    box.querySelectorAll('.dm-del').forEach(b => b.addEventListener('click', () => removeMeal(b.dataset.id)));
  }

  function renderNutriTarget() {
    const box = $('#nutri-target');
    const target = N.targetCalories();
    if (!target) {
      box.innerHTML = `<div class="nutri-need-profile">${t('needProfile')}</div>`;
      return null;
    }
    box.innerHTML = `<div class="nutri-goal"><span class="nutri-goal-lbl">${t('goalLabel')}</span><span class="nutri-goal-val">${nf(target)} ${t('goalUnit')}</span></div>`;
    return target;
  }

  // מציג את האומדן עם כפתור ＋ ליד כל פריט (הוספה ליום) + "הוסף הכל"
  function renderFoodResult(res, target) {
    const box = $('#nutri-result');
    estimateItems = res.items || [];
    const kcal = t('goalUnit');
    const itemsHtml = estimateItems.length
      ? `<ul class="nutri-items add-list">${estimateItems.map((i, idx) => `<li>
          <button class="add-item" data-idx="${idx}" aria-label="${t('addMealAria')}" title="${t('addMealAria')}">＋</button>
          <span class="ni-name">${i.name}</span>
          <span class="ni-k">${i.kcal} ${kcal}</span>
        </li>`).join('')}</ul>`
      : `<div class="nutri-empty">${t('itemsEmpty')}</div>`;
    const unmatched = res.unmatched && res.unmatched.length
      ? `<div class="nutri-unmatched">${t('unmatched', { list: res.unmatched.join(', ') })}</div>` : '';
    box.innerHTML = `
      <div class="est-head">
        <div class="est-total">${t('estimateLabel', { n: nf(res.total) })}</div>
        ${estimateItems.length ? `<button class="btn btn-primary est-addall" id="est-addall">${t('addAll')}</button>` : ''}
      </div>
      <div class="nutri-src">${res.source === 'ai' ? t('srcAi') : t('srcLocal')}</div>
      ${res.note ? `<div class="nutri-note">${res.note}</div>` : ''}
      ${itemsHtml}
      ${unmatched}`;
    box.classList.add('show');
    const addAll = $('#est-addall', box);
    if (addAll) addAll.addEventListener('click', () => addMeals(estimateItems));
    box.querySelectorAll('.add-item').forEach(b =>
      b.addEventListener('click', () => addMeal(estimateItems[+b.dataset.idx])));
  }

  function renderMenu(plan) {
    const box = $('#menu-result');
    box.innerHTML = `
      <div class="menu-head">
        <div class="menu-title">${t('menuTitle')}</div>
        <button class="btn btn-ghost menu-shuffle" id="menu-shuffle">${t('menuShuffle')}</button>
      </div>
      <div class="menu-list">${plan.meals.map(m => `
        <div class="menu-item">
          <div class="menu-slot">${m.label}</div>
          <div class="menu-name">${m.name}</div>
          <div class="menu-kcal">${m.kcal} ${t('goalUnit')}</div>
        </div>`).join('')}</div>
      <div class="menu-total">${plan.target ? t('menuTotal', { n: nf(plan.total), t: nf(plan.target) }) : t('menuTotalNoTarget', { n: nf(plan.total) })}</div>
      ${plan.source === 'ai' ? `<div class="nutri-src">${t('menuSrcAi')}</div>` : ''}
      ${plan.note ? `<div class="nutri-note">${plan.note}</div>` : ''}`;
    box.classList.add('show');
    $('#menu-shuffle', box).addEventListener('click', buildMenu);
  }

  async function calcFood() {
    const target = renderNutriTarget();
    if (!target) { toast(t('toastFillProfile')); return; }
    const text = $('#food-text').value.trim();
    if (!text) { toast(t('toastWriteFood')); return; }
    const prov = aiProvider();
    const btn = $('#calc-food');
    let res;
    if (prov.mode !== 'local') {
      btn.disabled = true; btn.textContent = t('calcBtnBusy');
      try {
        res = prov.mode === 'proxy'
          ? await N.estimateViaProxy(text, prov.url)
          : await N.estimateAI(text, prov.key);
      } catch (e) { toast(t('toastAiErrLocal')); res = N.estimateLocal(text); }
      btn.disabled = false; btn.textContent = t('calcBtn');
    } else {
      res = N.estimateLocal(text);
    }
    renderFoodResult(res, target);
  }

  // כיווץ תמונה בצד הלקוח לפני שליחה ל-AI (חוסך תעבורה וזמן)
  function fileToResizedDataURL(file, maxDim, quality) {
    maxDim = maxDim || 1024; quality = quality || 0.82;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
      img.src = url;
    });
  }
  function parseDataUrl(dataUrl) {
    const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    return m ? { media_type: m[1], data: m[2] } : null;
  }

  async function calcFromImage(file) {
    const target = renderNutriTarget();
    if (!target) { toast(t('toastFillProfile')); return; }
    const prov = aiProvider();
    if (prov.mode === 'local') {
      toast(t('toastNeedAiPhoto'));
      $('#ai-settings').open = true;
      return;
    }
    const btn = $('#photo-btn');
    let dataUrl;
    try { dataUrl = await fileToResizedDataURL(file); }
    catch (e) { toast(t('toastImgRead')); return; }
    const prev = $('#photo-preview');
    prev.hidden = false;
    prev.innerHTML = `<img src="${dataUrl}" alt="meal" />`;

    const image = parseDataUrl(dataUrl);
    btn.disabled = true; btn.textContent = t('photoBtnBusy');
    let res;
    try {
      res = prov.mode === 'proxy'
        ? await N.estimateImageViaProxy(image, prov.url)
        : await N.estimateImageAI(image, prov.key);
    } catch (e) {
      toast(t('toastImgErr'));
      btn.disabled = false; btn.textContent = t('photoBtn');
      return;
    }
    btn.disabled = false; btn.textContent = t('photoBtn');
    renderFoodResult(res, target);
  }

  async function buildMenu() {
    const target = renderNutriTarget();
    if (!target) { toast(t('toastFillProfile')); return; }
    const prov = aiProvider();
    const btn = $('#build-menu');
    let plan;
    if (prov.mode !== 'local') {
      btn.disabled = true; btn.textContent = t('menuBtnBusy');
      try {
        plan = prov.mode === 'proxy'
          ? await N.mealPlanViaProxy(target, prov.url)
          : await N.mealPlanAI(target, prov.key);
      } catch (e) { toast(t('toastAiErrMenu')); plan = N.generateMealPlan(target); }
      btn.disabled = false; btn.textContent = t('menuBtn');
    } else {
      plan = N.generateMealPlan(target);
    }
    renderMenu(plan);
  }

  function initNutrition() {
    renderNutriTarget();
    renderDayMeals(); // שחזור הארוחות של היום מהאחסון (מקור אמת אחד)
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
        toast(t('toastEnterKey'));
        $('#ai-enabled').checked = false;
      }
      persistAI();
    });
    updateAiBadge();

    $('#calc-food').addEventListener('click', calcFood);
    $('#build-menu').addEventListener('click', buildMenu);
    $('#photo-btn').addEventListener('click', () => $('#food-photo').click());
    $('#food-photo').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) calcFromImage(file);
      e.target.value = ''; // מאפשר לבחור שוב את אותה תמונה
    });
    document.addEventListener('excerly:profile', () => {
      renderNutriTarget();
      // עדכון היעד גם ברישומי היום כדי שהמחוון והממוצע יתעדכנו
      const k = dateKey(new Date());
      const meals = getMeals(k);
      if (meals.length) setMeals(k, meals);
      renderDayMeals();
    });
  }

  /* =========================================================
     היסטוריה ומגמות
     ========================================================= */
  let histRange = 7;

  function buildHistoryData(rangeDays) {
    const foodlog = load(STORE.foodlog, {});
    const arr = [];
    const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const key = dateKey(d);
      const log = foodlog[key];
      arr.push({
        date: d, key,
        consumed: log ? log.total : null,
        target: log ? log.target : null,
        vkey: (log && log.verdict) ? log.verdict.key : null,
        workout: !!doneMap[key],
        rest: !!D.programForDate(d).rest
      });
    }
    return arr;
  }

  const VKEY_COLOR = { met: 'var(--accent)', over: 'var(--danger)', under: 'var(--accent-2)' };
  const colorForVkey = k => VKEY_COLOR[k] || 'var(--line)';

  function historyStatsHtml(data) {
    const workouts = data.filter(d => d.workout).length;
    const logged = data.filter(d => d.consumed != null);
    const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.consumed, 0) / logged.length) : null;
    const onTarget = data.filter(d => d.vkey === 'met').length;
    const tile = (val, lbl, cls) => `<div class="hstat ${cls || ''}"><div class="hstat-val">${val}</div><div class="hstat-lbl">${lbl}</div></div>`;
    return tile(`${workouts}<span class="hstat-of">/${data.length}</span>`, t('statWorkouts'), 'w')
      + tile(avg != null ? nf(avg) : '—', t('statAvg'), 'c')
      + tile(onTarget, t('statOnTarget'), 't');
  }

  // גרף עמודות של הקלוריות היומיות מול קו היעד (SVG inline, מותאם לנושא)
  function buildTrendChart(data, refTarget) {
    const n = data.length;
    const H = 172, padL = 10, padR = 10, top = 22, bottom = 40;
    const Wv = n <= 7 ? 340 : n * 20;
    const plotW = Wv - padL - padR, plotH = H - top - bottom;
    const maxConsumed = Math.max(0, ...data.map(d => d.consumed || 0));
    const yMax = Math.max(maxConsumed, refTarget) * 1.15 || 1;
    const step = plotW / n;
    const barW = Math.min(22, step * 0.6);
    const baseY = top + plotH;
    const yFor = v => baseY - (v / yMax) * plotH;

    const kcal = t('goalUnit');
    const doneTxt = t('legWorkoutDone').replace(/^✓\s*/, '');
    let bars = '';
    data.forEach((d, i) => {
      const cx = padL + (i + 0.5) * step;
      const dn = I18n.dayShort()[d.date.getDay()];
      const dm = d.date.getDate();
      const showLabel = n <= 7 || i % Math.ceil(n / 6) === 0;
      if (d.consumed != null) {
        const y = yFor(d.consumed);
        const h = baseY - y;
        bars += `<rect x="${(cx - barW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="4" fill="${colorForVkey(d.vkey)}"><title>${dn} ${dm}: ${d.consumed} ${kcal}${d.workout ? ' · ' + doneTxt : ''}</title></rect>`;
        if (n <= 7) bars += `<text x="${cx.toFixed(1)}" y="${(y - 5).toFixed(1)}" class="chart-val" text-anchor="middle">${d.consumed}</text>`;
      } else {
        bars += `<rect x="${(cx - barW / 2).toFixed(1)}" y="${(baseY - 3).toFixed(1)}" width="${barW.toFixed(1)}" height="3" rx="1.5" class="chart-empty"><title>${dn} ${dm}${d.workout ? ' · ' + doneTxt : ''}</title></rect>`;
      }
      if (showLabel) bars += `<text x="${cx.toFixed(1)}" y="${(baseY + 14).toFixed(1)}" class="chart-axis" text-anchor="middle">${n <= 7 ? dn : dm}</text>`;
      bars += `<circle cx="${cx.toFixed(1)}" cy="${(baseY + 26).toFixed(1)}" r="${d.workout ? 4 : 2.5}" fill="${d.workout ? 'var(--accent)' : 'var(--line)'}"></circle>`;
    });

    const ty = yFor(refTarget);
    const targetLine = `<line x1="${padL}" y1="${ty.toFixed(1)}" x2="${Wv - padR}" y2="${ty.toFixed(1)}" class="chart-target" stroke-dasharray="4 4" />` +
      `<text x="${padL}" y="${(ty - 4).toFixed(1)}" class="chart-target-lbl" text-anchor="start">${t('targetShort')}</text>`;

    const widthStyle = n <= 7 ? 'width:100%' : `width:${Wv}px`;
    return `<svg class="trend-svg" style="${widthStyle}" viewBox="0 0 ${Wv} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="calories vs goal">${targetLine}${bars}</svg>`;
  }

  function historyListHtml() {
    const data = buildHistoryData(14).reverse();
    return data.map(d => {
      const dn = I18n.dayNames()[d.date.getDay()];
      const cal = d.consumed != null ? `${nf(d.consumed)}${d.target ? '/' + nf(d.target) : ''}` : '—';
      return `<div class="hist-row">
        <span class="hr-date">${dn} ${d.date.getDate()}/${d.date.getMonth() + 1}</span>
        <span class="hr-workout ${d.workout ? 'on' : ''}">${d.workout ? t('rowWorkout') : (d.rest ? t('rowRest') : '—')}</span>
        <span class="hr-cal"><i class="hr-dot" style="background:${colorForVkey(d.vkey)}"></i>${cal}</span>
      </div>`;
    }).join('');
  }

  function renderHistory() {
    const data = buildHistoryData(histRange);
    const lastTarget = [...data].reverse().find(d => d.target);
    const refTarget = N.targetCalories() || (lastTarget && lastTarget.target) || 2000;
    $('#hist-stats').innerHTML = historyStatsHtml(data);
    $('#hist-chart').innerHTML = buildTrendChart(data, refTarget);
    $('#hist-list').innerHTML = historyListHtml();
  }

  function initHistory() {
    $('#hist-range').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      histRange = +btn.dataset.range;
      Array.prototype.forEach.call($('#hist-range').children, x => x.classList.toggle('on', x === btn));
      renderHistory();
    });
    renderHistory();
  }

  /* =========================================================
     אתחול
     ========================================================= */
  // מסמן את כפתור השפה הפעיל
  function markLangButtons() {
    Array.prototype.forEach.call($('#lang-switch').children,
      b => b.classList.toggle('on', b.dataset.lang === I18n.lang));
  }

  // רענון כל התוכן הדינמי בעת החלפת שפה
  function reRenderAll() {
    markLangButtons();
    const p = load(STORE.profile, null);
    if (p && p.age && p.weight && p.height) renderBMI(p);
    renderNutriTarget();
    renderDayMeals();
    renderCalendar();
    updateStreak();
    renderHistory();
    updateReminderStatus(load(STORE.reminder, { enabled: false, time: '18:00' }));
    // אם חלון היום פתוח – רענון תוכנו
    if (sheet.classList.contains('open') && sheetDate) renderWorkout(sheetDate);
  }

  function init() {
    I18n.applyStatic();
    markLangButtons();
    $('#lang-switch').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) I18n.setLang(b.dataset.lang);
    });
    document.addEventListener('excerly:lang', reRenderAll);

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
    initHistory();
    initReminders();
    checkMissedReminder();
    document.addEventListener('excerly:profile', renderHistory);
    // שינוי מגדר בפרופיל → רענון הדמויות אם חלון האימון פתוח
    document.addEventListener('excerly:profile', () => {
      renderHero();
      if (sheet.classList.contains('open') && sheetDate) renderWorkout(sheetDate);
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
