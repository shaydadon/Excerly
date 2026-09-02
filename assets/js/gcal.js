/* =============================================================
   Excerly – סנכרון אימונים ל-Google Calendar
   דוחף אימונים מהיומן כאירועים ביומן Google, כל אחד עם תזכורת
   מייל + פופאפ מובנית (Google שולח את התזכורת — אין צורך ב-Gmail API).
   מבוסס Google Identity Services (טוקן בדפדפן) + Calendar REST API.
   ============================================================= */
(function () {
  'use strict';

  // Client ID מוטמע (ברירת מחדל למוצר) — לא סוד, גלוי ממילא בדף. כשמוגדר,
  // הלקוח לא רואה שדה כלל, רק כפתור סנכרון. אפשר לדרוס דרך ההגדרות (localStorage).
  const DEFAULT_CLIENT_ID = '';
  const CID_KEY = 'excerly.gcalClient';   // Google OAuth Client ID (דריסה מקומית אופציונלית)
  const MAP_KEY = 'excerly.gcalMap';       // { 'YYYY-MM-DD': eventId } — למניעת כפילויות ולעדכון
  const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
  const DEFAULT_HOUR = 18;                  // שעת ברירת מחדל לאירוע אימון
  const tz = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem'; } catch (e) { return 'Asia/Jerusalem'; } })();

  let token = null, tokenExp = 0, tokenClient = null;

  const clientId = () => { try { return localStorage.getItem(CID_KEY) || DEFAULT_CLIENT_ID; } catch (e) { return DEFAULT_CLIENT_ID; } };
  const setClientId = (v) => { try { localStorage.setItem(CID_KEY, v || ''); } catch (e) {} };
  const loadMap = () => { try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}'); } catch (e) { return {}; } };
  const saveMap = (m) => { try { localStorage.setItem(MAP_KEY, JSON.stringify(m)); } catch (e) {} };
  const pad = (n) => String(n).padStart(2, '0');
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  function loadGIS() {
    return new Promise((resolve, reject) => {
      if (window.google && google.accounts && google.accounts.oauth2) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('gis-load'));
      document.head.appendChild(s);
    });
  }

  function getToken(interactive) {
    return new Promise(async (resolve, reject) => {
      const cid = clientId();
      if (!cid) return reject(new Error('no-client-id'));
      if (token && Date.now() < tokenExp - 60000) return resolve(token);
      try { await loadGIS(); } catch (e) { return reject(e); }
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: cid, scope: SCOPE,
        callback: (resp) => {
          if (resp && resp.access_token) { token = resp.access_token; tokenExp = Date.now() + (resp.expires_in || 3600) * 1000; resolve(token); }
          else reject(new Error('no-token'));
        },
        error_callback: (e) => reject(new Error((e && e.type) || 'auth-error'))
      });
      tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
    });
  }

  async function api(method, path, body) {
    const t = await getToken();
    const r = await fetch('https://www.googleapis.com/calendar/v3' + path, {
      method,
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) { if (r.status === 401) token = null; const e = new Error('gcal ' + r.status); e.status = r.status; throw e; }
    return r.status === 204 ? null : r.json();
  }

  function toEvent(item) {
    const d = item.date;
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), DEFAULT_HOUR, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    const iso = (x) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:00:00`;
    return {
      summary: item.title,
      description: item.description || '',
      start: { dateTime: iso(start), timeZone: tz },
      end: { dateTime: iso(end), timeZone: tz },
      reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 120 }, { method: 'popup', minutes: 60 }] },
      source: { title: 'Excerly', url: location.origin + location.pathname }
    };
  }

  // מסנכרן רשימת אימונים עתידיים ליומן Google: יוצר חדשים, מוחק כאלה שכבר לא רלוונטיים (בטווח העתידי)
  async function sync(items) {
    const map = loadMap();
    const targetKeys = new Set(items.map(i => i.key));
    let added = 0, removed = 0;
    for (const it of items) {
      if (map[it.key]) continue;
      const ev = await api('POST', '/calendars/primary/events', toEvent(it));
      if (ev && ev.id) { map[it.key] = ev.id; added++; saveMap(map); }
    }
    const tk = todayKey();
    for (const key of Object.keys(map)) {
      if (key >= tk && !targetKeys.has(key)) { // רק אירועים עתידיים שאיבדו את האימון שלהם
        try { await api('DELETE', '/calendars/primary/events/' + encodeURIComponent(map[key])); } catch (e) {}
        delete map[key]; removed++; saveMap(map);
      }
    }
    return { added, removed };
  }

  window.ExcerlyGCal = { clientId, setClientId, sync, getToken, configured: () => !!clientId() };
})();
