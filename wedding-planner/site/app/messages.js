/* WhatsApp invitations and RSVP messages for the Wedding Planner app.
   Uses WhatsApp's free click-to-chat links (wa.me): the message opens ready in WhatsApp and the
   couple taps Send. No account, API key or server. Calendar reminders (.ics) prompt the couple
   on each send date, so everything can be planned ahead of time. */
window.WP_MESSAGES = (() => {
  const TEMPLATES = [
    { id: 'saveDate', title: 'Save the date', offset: -240, audience: 'all' },
    { id: 'invite', title: 'Invitation & RSVP', offset: -56, audience: 'notDeclined', rsvp: true },
    { id: 'reminder', title: 'RSVP reminder', offset: -21, audience: 'awaiting', rsvp: true },
    { id: 'dayBefore', title: 'Day-before details', offset: -1, audience: 'attending' },
    { id: 'thanks', title: 'Thank you', offset: 14, audience: 'attending' },
  ];
  const TEXT = {
    en: {
      saveDate: 'Save the date! 💍\nHi {name}, {couple} are getting married on {date} in {city}. A formal invitation will follow. We would love you to be there!',
      invite: 'Hi {name}! 💌\nWe are so happy to invite you to our wedding.\n📅 {date} at {time}\n📍 {venue}\nPlease reply YES or NO by {rsvp}, and let us know about any dietary needs.\n{link}\nWith love, {couple}',
      reminder: 'Hi {name}, a gentle reminder to RSVP for our wedding on {date} 🤍 Just reply YES or NO here by {rsvp}. Thank you! {couple}',
      dayBefore: 'Hi {name}! Tomorrow is the day 🥂\n📍 {venue}, {time}\n{link}\nYour table: {table}\nWe cannot wait to celebrate with you! {couple}',
      thanks: 'Dear {name}, thank you for celebrating with us and for your kind gift 💛 It meant the world to us. With love, {couple}',
    },
    he: {
      saveDate: 'שמרו את התאריך! 💍\nהיי {name}, {couple} מתחתנים ב-{date} ב{city}. הזמנה רשמית תגיע בהמשך. נשמח מאוד לראותך!',
      invite: 'היי {name}! 💌\nאנחנו שמחים להזמין אותך לחתונה שלנו.\n📅 {date} בשעה {time}\n📍 {venue}\nנשמח לאישור הגעה עד {rsvp}: פשוט השיבו כן או לא להודעה הזו, וספרו לנו אם יש העדפות תזונה.\n{link}\nבאהבה, {couple}',
      reminder: 'היי {name}, תזכורת קטנה לאשר הגעה לחתונה שלנו ב-{date} 🤍 אפשר פשוט להשיב כן או לא עד {rsvp}. תודה! {couple}',
      dayBefore: 'היי {name}! מחר זה קורה 🥂\n📍 {venue}, {time}\n{link}\nהשולחן שלך: {table}\nמחכים לחגוג איתך! {couple}',
      thanks: '{name} היקר/ה, תודה שחגגת איתנו ועל המתנה המרגשת 💛 זה היה שווה לנו המון. באהבה, {couple}',
    },
  };
  const AUD = { all: 'All guests', notDeclined: 'Everyone not declined', awaiting: 'Guests who have not replied', attending: 'Attending guests' };

  // Local number -> international digits for wa.me (e.g. 052-123-4567 in Israel -> 972521234567)
  function waNumber(phone, dial) {
    let d = String(phone || '').trim();
    const plus = d.startsWith('+');
    d = d.replace(/\D/g, '');
    if (!d) return '';
    if (plus) return d;
    if (d.startsWith('00')) return d.slice(2);
    if (dial && d.startsWith('0')) return dial + d.slice(1);
    if (dial && !d.startsWith(dial) && d.length <= 10) return dial + d;
    return d;
  }
  const fmtDate = (iso, lang) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  function fill(text, vars) { return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null && vars[k] !== '' ? vars[k] : '')).replace(/\n{2,}/g, '\n').trim(); }
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d; };
  const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

  function ics(S, list, titleOf) {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ev = list.map((t) => {
      const d = addDays(S.couple.date, t.offset), e = new Date(d); e.setDate(e.getDate() + 1);
      return ['BEGIN:VEVENT', `UID:wedding-${t.id}-${S.couple.date}@weddingplanner`, `DTSTAMP:${now}`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(e)}`,
        `SUMMARY:💌 Send "${titleOf(t)}" on WhatsApp`, 'DESCRIPTION:Open your Wedding Planner app > Invites and tap WhatsApp next to each guest.',
        'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', `DESCRIPTION:Send "${titleOf(t)}" on WhatsApp`, 'END:VALARM', 'END:VEVENT'].join('\r\n');
    });
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Wedding Planner//Invites//EN', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n');
  }

  return { TEMPLATES, TEXT, AUD, waNumber, fmtDate, fill, addDays, ics };
})();
