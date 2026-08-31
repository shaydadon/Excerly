/* =============================================================
   Excerly – חשבון וסנכרון ענן (Supabase)
   התחברות (Google / קישור למייל) + סנכרון דו-כיווני של מצב האפליקציה.
   כל נתוני המשתמש נשמרים כמסמך JSON יחיד בשורה שלו (RLS מגן — כל אחד
   רואה/כותב רק את שלו). ה-anon key ציבורי בכוונה; האבטחה היא ה-RLS.
   ============================================================= */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://egznewpwbcnhkzhmpckk.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnem5ld3B3YmNuaGt6aG1wY2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODg2MTQsImV4cCI6MjEwMzc2NDYxNH0.NXvgGh9BhLwlzyhKo1SZWmaVsyqutd1-PUpW1hR8oKI';

  const $ = s => document.querySelector(s);
  const I18n = window.ExcerlyI18n;
  const T = (k, fb) => (I18n && I18n.t ? I18n.t(k) : fb);

  // מפתחות שלא מסנכרנים: מפתח ה-AI (סוד אישי) ומצב-UI זמני
  const SKIP = { 'excerly.ai': 1 };
  const isSyncKey = k => k.indexOf('excerly.') === 0 && !SKIP[k];

  const _set = localStorage.setItem.bind(localStorage);
  const _remove = localStorage.removeItem.bind(localStorage);

  function snapshot() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (isSyncKey(k)) out[k] = localStorage.getItem(k);
    }
    return out;
  }
  function applySnapshot(data) {
    // מראה מלאה: מוחקים מפתחות מסונכרנים קיימים (חוץ מ-SKIP) ואז כותבים מהשרת
    const del = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isSyncKey(k)) del.push(k); }
    del.forEach(k => _remove(k));
    Object.keys(data || {}).forEach(k => { if (isSyncKey(k)) _set(k, data[k]); });
  }

  let sb = null, uid = null, pushT = null;

  function schedulePush() {
    if (!uid) return;
    clearTimeout(pushT);
    pushT = setTimeout(pushNow, 1500);
  }
  async function pushNow() {
    if (!uid || !sb) return;
    try {
      const { data } = await sb.from('user_state')
        .upsert({ user_id: uid, data: snapshot(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .select('updated_at').single();
      if (data) sessionStorage.setItem('excerly.cloudStamp', data.updated_at);
      setSyncStatus(true);
    } catch (e) { /* לא מקוון – ננסה בשינוי הבא */ }
  }

  // עטיפת setItem כדי לדחוף אוטומטית בכל שינוי במצב האפליקציה
  localStorage.setItem = function (k, v) { _set(k, v); if (isSyncKey(k)) schedulePush(); };

  async function syncOnLogin(session) {
    uid = session.user.id;
    let row = null;
    try {
      const res = await sb.from('user_state').select('data,updated_at').eq('user_id', uid).maybeSingle();
      row = res.data;
    } catch (e) { setSyncStatus(false); return; }

    const hasServer = row && row.data && Object.keys(row.data).length > 0;
    if (!hasServer) {
      // התחברות ראשונה – זורעים את השרת מהנתונים המקומיים
      await pushNow();
      return;
    }
    const stamp = row.updated_at;
    if (sessionStorage.getItem('excerly.cloudStamp') === stamp) { setSyncStatus(true); return; }
    // מיישמים את השרת מקומית וטוענים מחדש כדי לשקף בכל המסכים
    applySnapshot(row.data);
    sessionStorage.setItem('excerly.cloudStamp', stamp);
    location.reload();
  }

  /* ---------- ממשק ---------- */
  function setSyncStatus(on) {
    const el = $('#cloud-sync-status');
    if (el) el.textContent = on ? T('syncOn', 'סנכרון פעיל ✓') : '';
  }
  function renderSignedOut() {
    $('#cloud-signed-in').hidden = true;
    $('#cloud-signed-out').hidden = false;
  }
  function renderSignedIn(session) {
    $('#cloud-signed-out').hidden = true;
    $('#cloud-signed-in').hidden = false;
    const who = $('#cloud-user');
    if (who) who.textContent = (session.user.email || session.user.user_metadata?.name || '') ;
  }

  function wireUI() {
    const g = $('#cloud-google'); if (g) g.addEventListener('click', signInGoogle);
    const em = $('#cloud-email-btn'); if (em) em.addEventListener('click', signInEmail);
    const out = $('#cloud-signout'); if (out) out.addEventListener('click', signOut);
  }
  async function signInGoogle() {
    try { await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } }); }
    catch (e) { note(T('googleErr', 'התחברות Google עדיין לא מופעלת בשרת. הפעילו את ספק Google ב-Supabase.')); }
  }
  async function signInEmail() {
    const email = ($('#cloud-email') || {}).value;
    if (!email || email.indexOf('@') === -1) { note(T('emailBad', 'הכניסו כתובת אימייל תקינה')); return; }
    try {
      await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.href.split('#')[0] } });
      note(T('checkEmail', 'שלחנו לך קישור התחברות למייל 📧'));
    } catch (e) { note(T('emailErr', 'שליחת המייל נכשלה. נסו שוב.')); }
  }
  async function signOut() { try { await sb.auth.signOut(); } catch (e) {} uid = null; sessionStorage.removeItem('excerly.cloudStamp'); renderSignedOut(); }

  function note(msg) { const el = $('#cloud-note'); if (el) { el.textContent = msg; el.hidden = false; } }

  function init() {
    const card = $('#cloud-card');
    if (!card) return;
    if (!window.supabase || !window.supabase.createClient) {
      note(T('cloudOffline', 'שירות הענן אינו זמין כרגע (בדקו חיבור לאינטרנט).'));
      return;
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    wireUI();
    sb.auth.getSession().then(({ data }) => {
      if (data.session) { renderSignedIn(data.session); syncOnLogin(data.session); }
      else renderSignedOut();
    });
    sb.auth.onAuthStateChange((event, session) => {
      if (session) { renderSignedIn(session); if (event === 'SIGNED_IN') syncOnLogin(session); }
      else renderSignedOut();
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
