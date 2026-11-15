// Builds the planner as one HTML document. Each <section class="page"> is one PDF page.
const C = require('./content');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rep = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');

// ── small building blocks ──
const field = (k, cls = '') => `<div class="field ${cls}"><span class="k">${k}</span></div>`;
const fields = (list, cols = 1, cls = '') => `<div class="fields" style="grid-template-columns:repeat(${cols},1fr)">${list.map((k) => field(k, cls)).join('')}</div>`;
const lines = (n = 6, cls = '') => `<div class="lines ${cls}">${rep(n, () => '<i></i>')}</div>`;
const check = (items, cls = '') => `<ul class="check ${cls}">${items.map((t) => (t === '' ? '<li class="blank"></li>' : `<li>${esc(t)}</li>`)).join('')}</ul>`;
const box = (label, inner, cls = '', style = '') => `<div class="box ${cls}" style="${style}">${label ? `<div class="label">${label}</div>` : ''}${inner}</div>`;
const tip = (title, text) => `<div class="tip"><div class="label">${title}</div><p class="note">${text}</p></div>`;
const sec = (t, small = '') => `<h2 class="sec">${t}${small ? `<small>${small}</small>` : ''}</h2>`;

// cols: [{h, w, cb, pre:[...] }]
function tbl(cols, n, { tot = null, pre = null, cls = '', style = '' } = {}) {
  const head = `<div class="tr th">${cols.map((c) => `<div style="flex:${c.w || 1}">${c.h}</div>`).join('')}</div>`;
  const body = rep(n, (r) => `<div class="tr">${cols.map((c, ci) => {
    const v = pre && pre[r] && pre[r][ci] != null ? pre[r][ci] : '';
    return `<div style="flex:${c.w || 1}" class="${c.cb ? 'cb' : ''}">${v ? `<span class="pre">${esc(v)}</span>` : ''}</div>`;
  }).join('')}</div>`);
  const foot = tot ? `<div class="tr tot">${cols.map((c, i) => `<div style="flex:${c.w || 1}">${i === 0 ? tot : ''}</div>`).join('')}</div>` : '';
  return `<div class="tbl ${cls}" style="${style}">${head}${body}${foot}</div>`;
}

function tableSVG(seats = 10) {
  const R = 30, r = 6.2, cx = 50, cy = 50, ring = 42;
  let s = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#C9BCAD" stroke-width=".8"/>`;
  for (let i = 0; i < seats; i++) {
    const a = (i / seats) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${(cx + ring * Math.cos(a)).toFixed(2)}" cy="${(cy + ring * Math.sin(a)).toFixed(2)}" r="${r}" fill="none" stroke="#DCD3C8" stroke-width=".7"/>`;
  }
  return s + `<line x1="38" y1="56" x2="62" y2="56" stroke="#DCD3C8" stroke-width=".6"/><text x="50" y="48" text-anchor="middle" font-family="Jost" font-size="5.5" letter-spacing="1.5" fill="#A69C92">TABLE</text></svg>`;
}

// One color story per section, each paired with a public-domain botanical painting (art/).
const THEMES = {
  front: { wash: '#FBF0EE', tint: '#F3DCD6', accent: '#B9675F', art: 'rose', credit: 'Pierre-Joseph Redouté, Rosa turbinata, 1817–24' },
  start: { wash: '#FCEFEB', tint: '#F5D9D1', accent: '#C0675E', art: 'poppy', credit: 'Johanna Helena Herolt, A Poppy in Three Stages of Flowering, c. 1700' },
  plan: { wash: '#F4EFF7', tint: '#E4D9EE', accent: '#86609A', art: 'columbine', credit: 'Pieter Holsteyn II, A Columbine, 17th century' },
  budget: { wash: '#FCF2E7', tint: '#F3DEC4', accent: '#B5783B', art: 'crown-imperial', credit: 'Pierre-Joseph Redouté, Fritillaria imperialis, 1802–16' },
  guests: { wash: '#F8EFF4', tint: '#EDD7E3', accent: '#9A5A7D', art: 'sweet-pea', credit: 'Jacques Le Moyne de Morgues, A Sheet of Studies of Flowers, 16th century' },
  vendors: { wash: '#EEF5EF', tint: '#D6E7D8', accent: '#558A61', art: 'gloriosa', credit: 'Pierre-Joseph Redouté, Gloriosa superba, c. 1810' },
  design: { wash: '#FCEFF2', tint: '#F4D5DD', accent: '#B5526B', art: 'tulips', credit: 'Jacob Marrel, Four Tulips, c. 1635–45' },
  events: { wash: '#EDF4F2', tint: '#D3E6E0', accent: '#46806E', art: 'star-flower', credit: 'Maria Moninckx, Study of a Plant with Red-Purple Flowers, 1695' },
  day: { wash: '#EEF2F9', tint: '#D7E1F0', accent: '#5878A3', art: 'erica', credit: 'Pierre-Joseph Redouté, Erica fulgida, 1813' },
  after: { wash: '#F8F1E9', tint: '#EBDCCB', accent: '#987052', art: 'fritillaries', credit: 'Herman Saftleven II, Study of Three Fritillaries, 1683' },
};

// ── document ──
module.exports = function buildPlanner(cfg, opts) {
  const { digital, size, thumbs = {}, qrSvg = '', art = '' } = opts;
  const sections = [];
  let current = null;
  const S = (id, tab, title, lede) => { current = { id, tab, title, lede, theme: THEMES[id], pages: [] }; sections.push(current); };
  const P = (id, title, kicker, body, extra = {}) => current.pages.push({ id, title, kicker, body, ...extra });

  // ═════════ 01 · START ═════════
  S('start', 'Start', 'The <em>Beginning</em>', 'Your story, your vision and the people who will help you bring it to life.');

  P('couple', 'About <em>Us</em>', 'The Couple', () => `
    <div class="row none">
      ${box('Partner One', fields(['Full name', 'Phone', 'Email', 'Birthday']), 'grow')}
      ${box('Partner Two', fields(['Full name', 'Phone', 'Email', 'Birthday']), 'grow')}
    </div>
    <div class="row none">${box('The Wedding', fields(['Wedding date', 'Ceremony venue', 'Reception venue', 'Estimated guests', 'Total budget', 'Our hashtag'], 2), 'grow')}</div>
    <div class="row grow">
      ${box('How we met', lines(7), 'grow')}
      ${box('The proposal', lines(7), 'grow')}
    </div>
    <div class="row none" style="height:1.15in">${box('Three words for our wedding', `<div class="row grow">${rep(3, () => '<div class="grow" style="border-bottom:.6pt solid var(--line)"></div>')}</div>`, 'grow wash')}</div>`);

  P('vision', 'Vision <em>Board</em>', 'Style & Mood', () => `
    <p class="lede none">Paste images, add photos on your tablet, or sketch the feeling you want guests to walk into.</p>
    <div class="grow" style="display:grid;grid-template-columns:1.3fr 1fr 1fr;grid-template-rows:1fr 1fr 0.8fr;gap:.12in;min-height:0">
      <div class="ph-box" style="grid-row:span 2">Image</div><div class="ph-box">Image</div><div class="ph-box">Image</div>
      <div class="ph-box" style="grid-column:span 2">Image</div>
      <div class="ph-box">Image</div><div class="ph-box">Image</div><div class="ph-box">Image</div>
    </div>
    <div class="row none">
      ${box('Color palette', `<div class="swatches">${rep(5, () => '<i></i>')}</div>`, 'grow')}
      ${box('Style', check(['Classic', 'Modern', 'Romantic', 'Rustic', 'Boho', 'Glam'], 'two'), 'grow')}
    </div>`);

  P('priorities', 'Our <em>Priorities</em>', 'Decide Together', () => `
    <p class="lede none">Each of you ranks what matters most from 1 to 10. Where you agree, spend; where you don’t care, save.</p>
    ${tbl([{ h: 'Element', w: 2.4 }, { h: 'Partner one', w: 1 }, { h: 'Partner two', w: 1 }, { h: 'Together', w: 1 }, { h: 'Splurge / Save', w: 1.3 }], 16, {
      pre: ['Venue', 'Food & drink', 'Photography', 'Videography', 'Music & dancing', 'Flowers & décor', 'Attire', 'Guest experience', 'Bar & cocktails', 'Invitations', 'Cake', 'Honeymoon', 'Entertainment', 'Transportation', 'Favors', ''].map((x) => [x]),
    })}
    <div class="row none">
      ${box('Our top three', fields(['1', '2', '3']), 'grow wash')}
      ${box('Where we will save', fields(['1', '2', '3']), 'grow wash')}
    </div>`);

  P('dates', 'Key <em>Dates</em>', 'At a Glance', () => `
    ${tbl([{ h: 'Event', w: 2.2 }, { h: 'Date', w: 1 }, { h: 'Time', w: 0.8 }, { h: 'Location', w: 2 }], 18, {
      pre: ['Engagement party', 'Engagement shoot', 'Save-the-dates sent', 'Venue walkthrough', 'Menu tasting', 'Cake tasting', 'Hair & makeup trial', 'Invitations sent', 'RSVP deadline', 'Bridal shower', 'Bachelor party', 'Bachelorette party', 'Final fitting', 'Rehearsal', 'Rehearsal dinner', 'Wedding day', 'Honeymoon departs', ''].map((x) => [x]),
    })}`);

  P('contacts', 'Key <em>Contacts</em>', 'Who to Call', () => `
    ${tbl([{ h: 'Name', w: 1.6 }, { h: 'Role', w: 1.3 }, { h: 'Phone', w: 1.3 }, { h: 'Email', w: 1.8 }], 22, {
      pre: [[, 'Planner'], [, 'Venue coordinator'], [, 'Maid of honor'], [, 'Best man'], [, 'Parent'], [, 'Parent'], [, 'Officiant'], [, 'Day-of point person']],
    })}`);

  // ═════════ 02 · PLAN ═════════
  S('plan', 'Plan', 'The <em>Plan</em>', 'A month-by-month checklist and undated calendars so nothing slips through.');

  const ck = C.checklist;
  const ckPages = [[[0, 1], [2, 3]], [[4, 5], [6, 7]], [[8, 9], [10]]];
  ckPages.forEach((cols, pi) => {
    P(`checklist-${pi + 1}`, 'Wedding <em>Checklist</em>', `Part ${pi + 1} of 3`, () => `
      <div class="row grow">${cols.map((col, ci) => `<div class="col">${col.map((i) => `<div class="box" style="flex:${ck[i].items.length + 3}">${sec(ck[i].when, i <= 8 ? 'before' : '')}${check([...ck[i].items, '', ''], 'fill')}</div>`).join('')}${pi === 2 && ci === 1 ? box('Our own to-dos', check(['', '', '', '', '', '', ''], 'fill'), 'wash', 'flex:10') : ''}</div>`).join('')}</div>`);
  });

  for (let m = 1; m <= 12; m++) {
    P(`month-${m}`, 'Month <em>Planner</em>', `Month ${m} of 12`, () => `
      <div class="row none" style="align-items:flex-end">
        ${field('Month', 'grow')} ${field('Year', '')}
        <div class="none label" style="padding-bottom:.06in">${m === 1 ? 'Write in your months' : ''}</div>
      </div>
      <div class="row grow">
        <div class="cal" style="flex:3">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div class="dow">${d}</div>`).join('')}${rep(42, () => '<div></div>')}</div>
        <div class="col" style="flex:1">
          ${box('Focus this month', check(['', '', '', '', '', '']), 'none')}
          ${box('Notes', lines(8), 'grow')}
        </div>
      </div>`);
  }

  P('weekly', 'Weekly <em>Planner</em>', 'Copy as Needed', () => `
    <div class="row none">${field('Week of', 'grow')}${field('Weeks to go', 'grow')}</div>
    <div class="grow" style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,1fr);gap:.14in;min-height:0">
      ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => box(d, lines(4))).join('')}
      ${box('Top priorities', check(['', '', '']), 'wash')}
    </div>`);

  // ═════════ 03 · BUDGET ═════════
  S('budget', 'Budget', 'The <em>Budget</em>', 'Know your number, split it with intention, and track every payment.');

  P('budget-guide', 'Budget <em>Guide</em>', 'Where the Money Goes', () => `
    <p class="lede none">A common starting split. Move the numbers to match your priorities: if photography is your top three, take it from somewhere at the bottom.</p>
    <div class="row grow">
      <div class="col" style="flex:1.3">
        <div class="tbl" style="flex:none">
          <div class="tr th"><div style="flex:2.2">Category</div><div style="flex:.7">Guide</div><div style="flex:1">Our amount</div></div>
          ${C.budgetSplit.map(([k, v]) => `<div class="tr" style="flex:none;min-height:.34in"><div style="flex:2.2;flex-direction:column;align-items:stretch;justify-content:center"><span>${k}</span><div class="bar-track"><i style="width:${v * 2.2}%"></i></div></div><div style="flex:.7;font-family:var(--serif);font-size:11pt;color:var(--accent)">${v}%</div><div style="flex:1"></div></div>`).join('')}
          <div class="tr tot"><div style="flex:2.2">Total budget</div><div style="flex:.7">100%</div><div style="flex:1"></div></div>
        </div>
      </div>
      <div class="col" style="flex:1">
        ${box('Who is contributing', fields(['Us', 'Family one', 'Family two', 'Other', 'Total']), 'none')}
        ${tip('Keep a buffer', 'Hold back 5–10% for the things nobody budgets for: overtime, postage, a last-minute rental, tips.')}
        ${tip('Count the hidden costs', 'Ask every vendor whether tax, service charge, delivery and overtime are in the quote.')}
        ${tip('Cost per guest', 'Divide your food, drink and rental costs by your headcount. Every guest you add costs roughly this much.')}
        ${box('Cost per guest', fields(['Food + drink + rentals', '÷ Guests', '= Per guest']), 'wash none')}
      </div>
    </div>`);

  P('budget-overview', 'Budget <em>Overview</em>', 'Estimated vs. Actual', () => {
    const rows = [];
    C.budgetLines.forEach(([g, items]) => { rows.push({ g }); items.forEach((it) => rows.push({ it })); });
    return `<div class="tbl tight">
      <div class="tr th"><div style="flex:2.4">Item</div><div style="flex:1">Estimated</div><div style="flex:1">Actual</div><div style="flex:1">Paid</div><div style="flex:1">Balance</div></div>
      ${rows.map((r) => r.g
        ? `<div class="tr" style="background:var(--accent-wash)"><div style="flex:2.4;font-size:6.4pt;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:400">${r.g}</div><div style="flex:1"></div><div style="flex:1"></div><div style="flex:1"></div><div style="flex:1"></div></div>`
        : `<div class="tr"><div style="flex:2.4">${r.it}</div><div style="flex:1"></div><div style="flex:1"></div><div style="flex:1"></div><div style="flex:1"></div></div>`).join('')}
      <div class="tr tot"><div style="flex:2.4">Totals</div><div style="flex:1"></div><div style="flex:1"></div><div style="flex:1"></div><div style="flex:1"></div></div>
    </div>`;
  });

  P('payments', 'Payment <em>Schedule</em>', 'Deposits & Balances', () => `
    ${tbl([{ h: 'Vendor', w: 1.8 }, { h: 'Total', w: 0.9 }, { h: 'Deposit', w: 0.9 }, { h: 'Paid on', w: 0.9 }, { h: 'Balance', w: 0.9 }, { h: 'Due', w: 0.9 }, { h: '✓', w: 0.35, cb: 1 }], 22, { tot: 'Totals' })}`);

  for (let i = 1; i <= 2; i++) {
    P(`expenses-${i}`, 'Expense <em>Log</em>', `Page ${i} of 2`, () => `
      ${tbl([{ h: 'Date', w: 0.8 }, { h: 'Item', w: 2.2 }, { h: 'Vendor', w: 1.5 }, { h: 'Method', w: 0.9 }, { h: 'Amount', w: 0.9 }], 26, { tot: 'Page total' })}`);
  }

  // ═════════ 04 · GUESTS ═════════
  S('guests', 'Guests', 'The <em>Guests</em>', 'Lists, RSVPs, meal choices, seating and the friends travelling to celebrate with you.');

  P('guest-guide', 'Guest List <em>Guide</em>', 'Before You Start', () => `
    <div class="row grow">
      <div class="col">
        ${box('Our headcount', `
          <div class="row" style="align-items:flex-end;margin:.06in 0 .12in">
            <div class="grow center"><div class="big-num">&nbsp;</div><div class="label" style="border-top:.6pt solid var(--line);padding-top:.06in">Venue max</div></div>
            <div class="grow center"><div class="big-num">&nbsp;</div><div class="label" style="border-top:.6pt solid var(--line);padding-top:.06in">Budget allows</div></div>
            <div class="grow center"><div class="big-num">&nbsp;</div><div class="label" style="border-top:.6pt solid var(--line);padding-top:.06in">Our target</div></div>
          </div>`, 'none')}
        ${box('How we split it', fields(['Partner one’s family', 'Partner two’s family', 'Our friends', 'Colleagues', 'Plus-ones', 'Children']), 'none')}
        ${box('Ground rules', check(['Plus-ones only for couples', 'Plus-ones for everyone', 'Children welcome', 'Adults only', 'Colleagues invited', 'Invite-only ceremony', '']), 'grow')}
      </div>
      <div class="col">
        ${tip('The A / B list', 'Make an A list of people you cannot imagine the day without. Expect 10–20% of invited guests to decline, and invite from the B list as replies come in.')}
        ${tip('The one-year rule', 'Not sure? Ask yourselves: have we spoken to them in the past year, and will we in the next?')}
        ${tip('Collect addresses early', 'Ask for mailing addresses and phone numbers as soon as the list is set. The guest list in the companion spreadsheet sorts and counts everything for you.')}
        <div><a class="btn" href="${esc(cfg.appUrl)}#guests">Open the guest list app →</a></div>
        ${box('RSVP summary', fields(['Invited', 'Attending', 'Declined', 'Awaiting reply', 'Children', 'Vegetarian / vegan', 'Allergies']), 'wash grow')}
      </div>
    </div>`);

  for (let i = 1; i <= 6; i++) {
    P(`guests-${i}`, 'Guest <em>List</em>', `Guests ${(i - 1) * 25 + 1}–${i * 25}`, () => `
      ${tbl([{ h: '#', w: 0.35 }, { h: 'Name', w: 2 }, { h: 'Party', w: 0.5 }, { h: 'Phone / Address', w: 2 }, { h: 'Side', w: 0.55 }, { h: 'Inv.', w: 0.4, cb: 1 }, { h: 'Yes', w: 0.4, cb: 1 }, { h: 'No', w: 0.4, cb: 1 }, { h: 'Meal', w: 0.8 }, { h: 'Gift', w: 0.9 }, { h: 'Thx', w: 0.4, cb: 1 }], 25, {
        pre: Array.from({ length: 25 }, (_, r) => [String((i - 1) * 25 + r + 1)]),
      })}`);
  }

  P('meals', 'Meals & <em>Dietary Needs</em>', 'For the Caterer', () => `
    <div class="row none">
      ${['Meat', 'Fish', 'Vegetarian', 'Vegan', 'Children'].map((k) => box(k, '<div class="big-num center" style="height:.5in"></div>', 'grow wash')).join('')}
    </div>
    ${tbl([{ h: 'Guest', w: 1.8 }, { h: 'Table', w: 0.6 }, { h: 'Meal', w: 1 }, { h: 'Allergy / dietary need', w: 2.4 }, { h: 'Told caterer', w: 0.7, cb: 1 }], 20)}`);

  for (let i = 1; i <= 2; i++) {
    P(`seating-${i}`, 'Seating <em>Chart</em>', `Tables ${(i - 1) * 12 + 1}–${i * 12}`, () => `
      <div class="seat-grid">${rep(12, (t) => `<div class="seat">${tableSVG(10)}<div class="names"><div class="label accent">Table ${(i - 1) * 12 + t + 1}</div>${rep(5, () => '<i></i>')}</div></div>`)}</div>
      <div class="row none" style="align-items:center;justify-content:space-between"><p class="note">Seat ten per table, or plan it in the app: drag and drop guests onto tables.</p><a class="btn" href="${esc(cfg.appUrl)}#seating">Drag &amp; drop seating →</a></div>`);
  }

  P('head-table', 'Head Table & <em>Seating Notes</em>', 'Seating', () => `
    ${box('Head table / sweetheart table', `<div class="row" style="align-items:center;justify-content:center;margin:.1in 0"><div style="width:5.8in;height:.55in;border:.8pt solid var(--line-strong);display:flex">${rep(10, () => '<div class="grow" style="border-right:.5pt solid var(--line)"></div>')}</div></div>${fields(['Seat 1–5', 'Seat 6–10'], 2)}`, 'none')}
    <div class="row grow">
      ${box('Keep together', lines(10), 'grow')}
      ${box('Keep apart', lines(10), 'grow')}
    </div>
    <div class="row none">${tip('Seating tips', 'Seat older guests away from the speakers, families with young children near an exit, and single friends together. Finish the chart once RSVPs close, about 2–3 weeks before the day.')}</div>`);

  P('accommodation', 'Guest <em>Accommodation</em>', 'Out-of-Town Guests', () => `
    <div class="row none">
      ${box('Hotel block one', fields(['Hotel', 'Contact', 'Group rate', 'Booking code', 'Cut-off date'], 1), 'grow')}
      ${box('Hotel block two', fields(['Hotel', 'Contact', 'Group rate', 'Booking code', 'Cut-off date'], 1), 'grow')}
    </div>
    ${tbl([{ h: 'Guest', w: 1.8 }, { h: 'Arrives', w: 0.8 }, { h: 'Departs', w: 0.8 }, { h: 'Staying at', w: 1.6 }, { h: 'Needs a ride', w: 0.7, cb: 1 }, { h: 'Welcome bag', w: 0.7, cb: 1 }], 14)}`);

  // ═════════ 05 · VENDORS ═════════
  S('vendors', 'Vendors', 'The <em>Vendors</em>', 'Find, compare and book the team behind your day, with the questions to ask every one of them.');

  P('directory', 'Vendor <em>Directory</em>', 'Updated Regularly', () => `
    <div class="row grow">
      <div class="col" style="flex:1.2">
        <p class="lede">Your planner comes with a live vendor directory that opens on your own country: photographers, DJs, bars, florists and more.</p>
        <p class="copy">Scan the code or tap the link. You’ll see our hand-picked vendors for your country, plus a live local search for every category in your language, on Google Maps and your country’s leading wedding marketplaces. Add your city for results close to home. Check every vendor with the questions in this section before you book.</p>
        <div class="row" style="gap:.12in"><a class="btn" href="${esc(cfg.vendorDirectoryUrl)}">Open the vendor directory →</a><a class="btn ghost" href="${esc(cfg.appUrl)}#vendors">Vendors near me</a></div>
        ${box('Categories in the directory', check(['Venues', 'Catering', 'Photographers', 'Videographers', 'DJs & bands', 'Bars & alcohol', 'Active / mobile bars', 'Florists & designers', 'Hair & makeup', 'Cakes & desserts', 'Officiants', 'Stationery', 'Transportation', 'Photo booths & extras', 'Rentals & lighting', 'Planners'], 'two round'), 'grow wash')}
      </div>
      <div class="col" style="flex:.8;align-items:center;justify-content:flex-start">
        <a href="${esc(cfg.vendorDirectoryUrl)}" style="display:block;width:2.4in;padding:.18in;border:.6pt solid var(--line-strong);background:#fff">${qrSvg}</a>
        <div class="label center">Scan to open</div>
        ${box('Your vendor team', check(C.vendors.map((v) => v.name)), 'grow')}
      </div>
    </div>`);

  P('vendor-contacts', 'Vendor <em>Contacts</em>', 'Your Booked Team', () => `
    ${tbl([{ h: 'Service', w: 1.4 }, { h: 'Company', w: 1.6 }, { h: 'Contact', w: 1.2 }, { h: 'Phone', w: 1.1 }, { h: 'Arrives', w: 0.7 }, { h: 'Signed', w: 0.5, cb: 1 }], C.vendors.length + 3, { pre: C.vendors.map((v) => [v.name]) })}`);

  C.vendors.forEach((v) => {
    P(`v-${v.id}`, `${v.name}`, `Vendor · book ${v.when} out`, () => `
      <div class="row grow">
        <div class="col" style="flex:1">
          ${box('Questions to ask', check([...v.q, '', '']), 'none')}
          ${box('Must-haves', lines(5), 'grow wash')}
        </div>
        <div class="col" style="flex:1">
          ${box('Booked vendor', fields(['Company', 'Contact person', 'Phone', 'Email', 'Website / social', 'Contract signed', 'Total cost', 'Deposit paid', 'Balance due', 'Arrival time', 'Hours booked']), 'none')}
          ${box('Notes', lines(5), 'grow')}
        </div>
      </div>`, { vendor: v });

    const optRows = ['Company', 'Contact', 'Phone / email', 'Website / social', 'Package', 'Price', 'Deposit', 'Date available', 'What’s included', '', 'Pros', '', 'Cons', '', 'Rating'];
    P(`v-${v.id}-compare`, `${v.name} <em>Comparison</em>`, 'Compare Three Options', () => `
      <div class="tbl">
        <div class="tr th"><div style="flex:1.1"></div>${['Option A', 'Option B', 'Option C'].map((o) => `<div style="flex:1.6">${o}</div>`).join('')}</div>
        ${optRows.map((r) => `<div class="tr"><div style="flex:1.1;font-size:6.4pt;letter-spacing:.18em;text-transform:uppercase;color:var(--soft);font-weight:400">${r}</div>${rep(3, () => `<div style="flex:1.6">${r === 'Rating' ? '<span class="stars">☆☆☆☆☆</span>' : ''}</div>`)}</div>`).join('')}
      </div>
      <div class="row none">${field('Our choice', 'grow')}${field('Decided on', 'grow')}</div>`);

    if (v.id === 'bar') {
      P('alcohol-calc', 'Alcohol <em>Calculator</em>', 'How Much to Buy', () => `
        <p class="lede none">Plan on one drink per guest per hour, then split by what your crowd drinks.</p>
        <div class="row none">
          ${box('Your numbers', fields(['Drinking guests', '× Hours of open bar', '= Total drinks']), 'grow')}
          ${box('Example · 100 guests, 5 hours', `
            <div class="kv"><b>Total drinks</b><span>500</span></div>
            <div class="kv"><b>Wine 50% · 250 glasses ÷ 5</b><span>50 bottles</span></div>
            <div class="kv"><b>Beer 20% · 100 drinks</b><span>100 bottles</span></div>
            <div class="kv"><b>Spirits 30% · 150 drinks ÷ 16</b><span>10 bottles</span></div>
            <div class="kv"><b>Toast · 100 glasses ÷ 6</b><span>17 bottles</span></div>`, 'grow wash')}
        </div>
        <div class="tbl" style="flex:none">
          <div class="tr th"><div style="flex:1.4">Drink</div><div style="flex:.8">Our split</div><div style="flex:.9">Drinks</div><div style="flex:1.4">Servings per bottle</div><div style="flex:.9">Bottles</div><div style="flex:.9">Cost</div></div>
          ${[['Red wine', '', '5 glasses / 750 ml'], ['White & rosé', '', '5 glasses / 750 ml'], ['Sparkling (toast)', '', '6 flutes / 750 ml'], ['Beer', '', '1 per bottle or can'], ['Vodka', '', '16 shots / 750 ml'], ['Whisky', '', '16 shots / 750 ml'], ['Gin / rum / tequila', '', '16 shots / 750 ml'], ['Soft drinks & mixers', '', '3 per guest'], ['Water', '', '2 per guest'], ['Ice', '', '1 kg / 2 lb per guest']].map(([a, , c]) => `<div class="tr" style="flex:none;min-height:.27in"><div style="flex:1.4">${a}</div><div style="flex:.8"></div><div style="flex:.9"></div><div style="flex:1.4;color:var(--soft);font-size:7.4pt">${c}</div><div style="flex:.9"></div><div style="flex:.9"></div></div>`).join('')}
          <div class="tr tot"><div style="flex:1.4">Total</div><div style="flex:.8"></div><div style="flex:.9"></div><div style="flex:1.4"></div><div style="flex:.9"></div><div style="flex:.9"></div></div>
        </div>
        <div class="row grow">
          ${box('Signature cocktails', fields(['Cocktail one', 'Cocktail two', 'Mocktail']), 'grow')}
          <div class="col">
            ${tip('Adjust for your crowd', 'Lean heavier on spirits for a cocktail crowd, on wine for a dinner-led evening. Summer weddings drink more beer and sparkling.')}
            ${tip('Bartenders', 'Book one bartender for every 50–75 guests, and one more if cocktails are made to order.')}
            ${tip('Buy smart', 'Ask your supplier about returning unopened bottles; many will take them back.')}
          </div>
        </div>`);
    }
  });

  // ═════════ 06 · DESIGN ═════════
  S('design', 'Design', 'The <em>Details</em>', 'Flowers, attire, stationery, food, music and the shots you will treasure.');

  P('stationery', 'Stationery <em>Tracker</em>', 'Paper Goods', () => `
    ${tbl([{ h: 'Item', w: 1.6 }, { h: 'Qty', w: 0.5 }, { h: 'Design / template', w: 1.6 }, { h: 'Ordered', w: 0.8 }, { h: 'Proof OK', w: 0.6, cb: 1 }, { h: 'Received', w: 0.8 }, { h: 'Sent', w: 0.8 }], 14, {
      pre: ['Save-the-dates', 'Invitations', 'RSVP cards', 'Details cards', 'Envelopes & postage', 'Ceremony programs', 'Menus', 'Place cards', 'Table numbers', 'Welcome sign', 'Seating chart sign', 'Thank-you cards', '', ''].map((x) => [x]),
    })}
    <div class="row none">
      ${box('Invitation wording', lines(5), 'grow')}
      ${box('Mailing', fields(['Postage per invite', 'Mail by', 'RSVP deadline']), 'grow wash')}
    </div>`);

  const items = [['saveTheDate', 'Save the Date'], ['invitation', 'Invitation'], ['rsvp', 'RSVP Card'], ['details', 'Details Card'], ['program', 'Program'], ['menu', 'Menu'], ['tableNumber', 'Table Number'], ['placeCard', 'Place Card'], ['welcomeSign', 'Welcome Sign'], ['thankYou', 'Thank You']];
  const styles = [['garden', 'Garden Rose'], ['classic', 'Ivory Classic'], ['modern', 'Modern Minimal'], ['botanical', 'Botanical Line']];
  styles.forEach(([sk, sn], si) => {
    P(`canva-${sk}`, `Invitation <em>Suite</em>`, `${sn} · Edit in Canva`, () => `
      <div class="row none" style="align-items:flex-start">
        <div class="col" style="flex:1.6"><p class="copy">${si === 0 ? 'Forty matching designs in four styles. Tap <b style="font-weight:400">Edit in Canva</b> under any design to open your own copy. Change the names, date and wording, then print at home, send to a print shop, or share it digitally. A free Canva account is all you need.' : 'Every design opens as your own copy in Canva. Fonts used: Cormorant Garamond and Jost, both free in Canva.'}</p></div>
        <div class="col" style="flex:1">${tip('Printing tip', 'Download as “PDF Print” with crop marks and bleed for a print shop, or print at home on 250–300 gsm card stock.')}</div>
      </div>
      <div class="grow" style="display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:.18in .2in;min-height:0">
        ${items.map(([ik, iname]) => `<a class="canva-card" href="${esc(cfg.canva[sk][ik])}" style="min-height:0">
          <div class="thumb" style="flex:1;aspect-ratio:auto;min-height:0">${thumbs[`${sk}-${ik}`] ? `<img src="${thumbs[`${sk}-${ik}`]}">` : ''}</div>
          <div class="t">${iname}</div><div class="go">Edit in Canva</div></a>`).join('')}
        <div class="box wash" style="grid-column:span 2;justify-content:center"><div class="label accent">${String(si + 1).padStart(2, '0')} / 04</div><div class="serif" style="font-size:20pt;font-weight:300;margin-top:.05in">${sn}</div><p class="note" style="margin-top:.06in">Save the date, invitation, RSVP, details, program, menu, table number, place card, welcome sign and thank-you card.</p></div>
      </div>`);
  });

  P('attire', 'Wedding <em>Attire</em>', 'What We Will Wear', () => `
    <div class="row grow">
      ${box('Partner one', fields(['Shop', 'Designer / style', 'Size', 'Price', 'Order date', 'Fitting 1', 'Fitting 2', 'Final fitting', 'Pick-up']) + '<div class="label" style="margin:.14in 0 .04in">Accessories</div>' + check(['Veil / headpiece', 'Shoes', 'Jewelry', 'Undergarments', 'Second look', '', '']), 'grow')}
      ${box('Partner two', fields(['Shop', 'Designer / style', 'Size', 'Price', 'Order date', 'Fitting 1', 'Fitting 2', 'Final fitting', 'Pick-up']) + '<div class="label" style="margin:.14in 0 .04in">Accessories</div>' + check(['Shoes', 'Tie / bow tie', 'Cufflinks', 'Watch', 'Boutonnière', '', '']), 'grow')}
    </div>`);

  P('wedding-party', 'Wedding <em>Party</em>', 'Our People', () => `
    ${tbl([{ h: 'Name', w: 1.6 }, { h: 'Role', w: 1.1 }, { h: 'Phone', w: 1.1 }, { h: 'Size', w: 0.6 }, { h: 'Attire', w: 1 }, { h: 'Gift', w: 0.9 }, { h: '✓', w: 0.35, cb: 1 }], 16)}
    <div class="row none" style="height:2in">${box('Day-of jobs', fields(['Rings', 'Emergency kit', 'Guest book', 'Vendor tips', 'Gifts & cards', 'Décor pick-up'], 2), 'grow wash')}</div>`);

  P('flowers', 'Flowers <em>&amp; Décor</em>', 'Florist Brief', () => `
    <div class="row none">
      ${box('Our flowers', fields(['Main flowers', 'Accent flowers', 'Greenery', 'Colors']), 'grow')}
      ${box('Inspiration', '<div class="ph-box grow" style="min-height:1.2in">Image</div>', 'grow')}
    </div>
    ${tbl([{ h: 'Arrangement', w: 2 }, { h: 'Qty', w: 0.5 }, { h: 'Description', w: 2.2 }, { h: 'Cost', w: 0.8 }], 14, {
      pre: ['Bridal bouquet', 'Bridesmaid bouquets', 'Boutonnières', 'Corsages', 'Ceremony arch', 'Aisle arrangements', 'Centerpieces', 'Head table', 'Cake flowers', 'Flower crowns', '', '', '', ''].map((x) => [x]),
    })}`);

  P('decor', 'Décor &amp; <em>Rentals</em>', 'Inventory', () => `
    ${tbl([{ h: 'Item', w: 1.8 }, { h: 'Qty', w: 0.5 }, { h: 'Source', w: 1.2 }, { h: 'Cost', w: 0.7 }, { h: 'Delivered', w: 0.6, cb: 1 }, { h: 'Returned', w: 0.6, cb: 1 }], 24, {
      pre: ['Tables', 'Chairs', 'Linens', 'Napkins', 'Place settings', 'Glassware', 'Candles & holders', 'String lights', 'Signage', 'Guest book', 'Card box', 'Lounge furniture', 'Dance floor', 'Arch / backdrop'].map((x) => [x]),
    })}`);

  P('menu', 'Menu <em>Planning</em>', 'Food & Cake', () => `
    <div class="row grow">
      <div class="col">
        ${box('Cocktail hour', lines(5), 'grow')}
        ${box('Starter', lines(3), 'grow')}
        ${box('Main course', lines(4), 'grow')}
        ${box('Late-night snack', lines(3), 'grow')}
      </div>
      <div class="col">
        ${box('Tasting notes', lines(7), 'grow')}
        ${box('Cake', fields(['Baker', 'Tiers', 'Flavor', 'Filling', 'Frosting', 'Servings', 'Delivery time']), 'none')}
        ${box('Dessert table', lines(3), 'grow wash')}
      </div>
    </div>`);

  P('music', 'Music <em>&amp; Playlist</em>', 'For the DJ or Band', () => `
    <div class="row none">${box('Key moments', `<div class="tbl" style="border-top:0">${['Prelude', 'Processional', 'Bride’s entrance', 'Signing', 'Recessional', 'Grand entrance', 'First dance', 'Parent dance one', 'Parent dance two', 'Cake cutting', 'Last dance'].map((k) => `<div class="tr" style="flex:none;min-height:.28in"><div style="flex:1;font-size:6.4pt;letter-spacing:.18em;text-transform:uppercase;color:var(--soft);font-weight:400">${k}</div><div style="flex:2.5"></div></div>`).join('')}</div>`, 'grow')}</div>
    <div class="row grow">
      ${box('Must play', lines(10), 'grow')}
      ${box('Do not play', lines(10), 'grow')}
    </div>`);

  P('shots', 'Photo <em>Shot List</em>', 'For the Photographer', () => `
    <div class="row grow">
      ${Object.entries(C.shotList).reduce((acc, [k, v], i) => { acc[i % 2].push(box(k, check([...v, ''], 'round'), 'none')); return acc; }, [[], []]).map((col) => `<div class="col">${col.join('')}</div>`).join('')}
    </div>
    <div class="row none">${box('Family groupings', fields(['Group 1', 'Group 2', 'Group 3', 'Group 4'], 2), 'grow wash')}</div>`);

  // ═════════ 07 · EVENTS ═════════
  S('events', 'Events', 'The <em>Celebrations</em>', 'From the engagement party to the rehearsal dinner, and the ceremony itself.');

  [['engagement', 'Engagement <em>Party</em>'], ['shower', 'Bridal <em>Shower</em>'], ['bach', 'Bachelor &amp; <em>Bachelorette</em>'], ['rehearsal', 'Rehearsal <em>Dinner</em>']].forEach(([id, t]) => {
    P(id, t, 'Event Planner', () => `
      <div class="row none">${box('Details', fields(['Date', 'Time', 'Location', 'Host', 'Theme', 'Budget', 'Guests', 'RSVP by'], 2), 'grow')}</div>
      <div class="row grow">
        ${box('To do', check(['', '', '', '', '', '', '', '', '', '']), 'grow')}
        ${box('Guest list', lines(13), 'grow')}
      </div>
      <div class="row none" style="height:1.4in">${box('Menu & notes', lines(4), 'grow wash')}</div>`);
  });

  P('ceremony', 'Ceremony <em>Planner</em>', 'Order of Ceremony', () => `
    <div class="row none">${box('Details', fields(['Officiant', 'Location', 'Start time', 'Length', 'Readers', 'Witnesses'], 2), 'grow')}</div>
    ${tbl([{ h: 'Order', w: 0.4 }, { h: 'Moment', w: 2 }, { h: 'Who', w: 1.6 }, { h: 'Music / reading', w: 2 }], 14, {
      pre: [['1', 'Guests seated'], ['2', 'Processional'], ['3', 'Entrance'], ['4', 'Welcome'], ['5', 'Reading'], ['6', 'Vows'], ['7', 'Ring exchange'], ['8', 'Declaration'], ['9', 'First kiss'], ['10', 'Recessional'], ['11'], ['12'], ['13'], ['14']],
    })}`);

  P('vows', 'Writing Your <em>Vows</em>', 'From the Heart', () => `
    <div class="row none">
      ${box('Prompts', check(['When did you know?', 'What do they do that nobody else sees?', 'What are you promising, really?', 'A small, specific promise (and a funny one)', 'What does forever look like to you?'], 'round'), 'grow wash')}
      <div class="col">${tip('Keep it short', 'One to two minutes aloud, about 150–250 words. Read it out at least three times before the day.')}${tip('Agree on the format', 'Decide together on length and tone, so one of you isn’t reading a poem while the other reads three lines.')}</div>
    </div>
    ${box('My vows', lines(18), 'grow')}`);

  P('reception', 'Reception <em>Order</em>', 'Run of Show', () => `
    ${tbl([{ h: 'Time', w: 0.7 }, { h: 'Moment', w: 2 }, { h: 'Who leads', w: 1.3 }, { h: 'Music / notes', w: 2 }], C.receptionOrder.length + 4, { pre: C.receptionOrder.map((x) => ['', x]) })}
    <div class="row none" style="height:1.5in">${box('Speeches', fields(['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'], 2), 'grow wash')}</div>`);

  // ═════════ 08 · THE DAY ═════════
  S('day', 'The Day', 'The <em>Big Day</em>', 'Timelines, final payments, the emergency kit and everything to pack.');

  P('day-timeline', 'Wedding Day <em>Timeline</em>', 'Hour by Hour', () => `
    <p class="note none">A sample timeline is filled in to help you start. Cross it out and write your own.</p>
    ${tbl([{ h: 'Time', w: 0.7 }, { h: 'What happens', w: 2.6 }, { h: 'Where', w: 1.3 }, { h: 'Who', w: 1.3 }], C.dayTimeline.length + 6, { pre: C.dayTimeline.map(([t, w]) => [t, w]) })}`);

  P('vendor-schedule', 'Vendor <em>Schedule</em>', 'Arrivals & Final Payments', () => `
    ${tbl([{ h: 'Vendor', w: 1.6 }, { h: 'Contact on the day', w: 1.5 }, { h: 'Arrives', w: 0.7 }, { h: 'Leaves', w: 0.7 }, { h: 'Final payment', w: 0.9 }, { h: 'Tip', w: 0.7 }, { h: '✓', w: 0.35, cb: 1 }], 18)}
    <div class="row none">${box('Tipping guide · customs vary by country', C.tipping.map(([a, b]) => `<div class="kv"><b>${a}</b><span style="font-family:var(--sans);font-size:7.6pt;color:var(--soft)">${b}</span></div>`).join(''), 'grow wash')}</div>`);

  P('final-week', 'The Final <em>Week</em>', 'Countdown', () => `
    <div class="grow" style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,1fr);gap:.14in;min-height:0">
      ${['7 days to go', '6 days to go', '5 days to go', '4 days to go', '3 days to go', '2 days to go', 'The day before', 'Don’t forget'].map((d, i) => box(d, check(['', '', '', '']), i === 7 ? 'wash' : '')).join('')}
    </div>`);

  P('emergency', 'Emergency <em>Kit</em>', 'Just in Case', () => `
    <p class="lede none">Pack it the week before and hand it to a calm friend.</p>
    ${box('', check([...C.emergencyKit, '', '', '', ''], 'two'), 'grow')}`);

  P('packing', 'Packing <em>Lists</em>', 'Wedding Day & Honeymoon', () => `
    <div class="row grow">
      ${box('Wedding day bag', check(['Attire & accessories', 'Rings', 'Vows', 'Marriage license', 'Shoes (and flats)', 'Change of clothes', 'Toiletries', 'Perfume / cologne', 'Phone charger', 'Vendor envelopes', 'Gifts for each other', 'Guest book & pens', 'Snacks', '', '', '']), 'grow')}
      ${box('Honeymoon', check([...C.honeymoonPack, '', '']), 'grow')}
    </div>`);

  // ═════════ 09 · AFTER ═════════
  S('after', 'After', 'Ever <em>After</em>', 'The honeymoon, the thank-yous and the little things that come after the party.');

  P('honeymoon', 'Honeymoon <em>Planner</em>', 'Getaway', () => `
    <div class="tbl" style="flex:none">
      <div class="tr th"><div style="flex:1"></div>${['Destination A', 'Destination B', 'Destination C'].map((o) => `<div style="flex:1.5">${o}</div>`).join('')}</div>
      ${['Where', 'Best season', 'Flight time', 'Stay', 'Cost estimate', 'Why we love it'].map((r) => `<div class="tr" style="flex:none;min-height:.32in"><div style="flex:1;font-size:6.4pt;letter-spacing:.18em;text-transform:uppercase;color:var(--soft);font-weight:400">${r}</div>${rep(3, () => '<div style="flex:1.5"></div>')}</div>`).join('')}
    </div>
    <div class="row none">
      ${box('Bookings', fields(['Flights', 'Hotel', 'Car / transfers', 'Insurance', 'Confirmation #']), 'grow')}
      ${box('Budget', fields(['Travel', 'Stay', 'Food', 'Activities', 'Total']), 'grow wash')}
    </div>
    ${box('Itinerary', `<div class="tbl" style="border-top:0">${rep(7, (i) => `<div class="tr"><div style="flex:.5;font-size:6.4pt;letter-spacing:.18em;text-transform:uppercase;color:var(--soft);font-weight:400">Day ${i + 1}</div><div style="flex:4"></div></div>`)}</div>`, 'grow')}`);

  for (let i = 1; i <= 2; i++) {
    P(`gifts-${i}`, 'Gifts &amp; <em>Thank-Yous</em>', `Page ${i} of 2`, () => `
      ${tbl([{ h: 'From', w: 1.7 }, { h: 'Gift', w: 2 }, { h: 'Received', w: 0.8 }, { h: 'Note written', w: 0.7, cb: 1 }, { h: 'Sent', w: 0.6, cb: 1 }], 26)}`);
  }

  P('name-change', 'Name Change <em>Checklist</em>', 'If You Choose To', () => `
    <p class="lede none">Start with the marriage certificate and ID; most other places will ask to see both.</p>
    ${tbl([{ h: 'Where', w: 2.4 }, { h: 'How (online / in person)', w: 1.6 }, { h: 'Date done', w: 0.9 }, { h: '✓', w: 0.35, cb: 1 }], C.nameChange.length + 2, { pre: C.nameChange.map((x) => [x]) })}`);

  P('memories', 'Our Day <em>in Words</em>', 'Keepsake', () => `
    <p class="lede none">Write this in the first week after, while it’s all still fresh.</p>
    <div class="row grow">
      <div class="col">${box('The moment I’ll never forget', lines(8), 'grow')}${box('What made us laugh', lines(6), 'grow')}</div>
      <div class="col">${box('A photo from the day', '<div class="ph-box grow">Photo</div>', 'grow')}${box('Words for our first anniversary', lines(6), 'grow wash')}</div>
    </div>`);

  for (let i = 1; i <= 3; i++) {
    P(`notes-${i}`, 'Notes', `Page ${i} of 3`, () => lines(30, i === 3 ? 'dots' : ''));
  }

  // ═════════ assemble with page numbers ═════════
  let n = 3; // cover, welcome, contents
  sections.forEach((s, si) => {
    s.num = String(si + 1).padStart(2, '0');
    s.page = ++n;
    s.pages.forEach((p) => { p.n = ++n; });
  });
  const total = n;

  const vars = (t) => `--sec:${t.accent};--sec-wash:${t.wash};--sec-tint:${t.tint}`;
  const themeOf = (id) => (sections.find((s) => s.id === id) || {}).theme || THEMES.front;
  const rail = (activeId) => !digital ? '' : `<nav class="rail"><a class="home" href="#contents">&amp;</a>${sections.map((s) => `<a href="#${s.id}" class="${s.id === activeId ? 'on' : ''}" style="${vars(s.theme)}">${s.tab}</a>`).join('')}</nav>`;
  const wrap = (id, cls, inner, activeId = '') => `<section class="page ${cls}" id="${id}" style="${vars(themeOf(activeId))}"><div class="sheet">${inner}</div>${rail(activeId)}</section>`;
  const artImg = (name, cls = '', style = '') => (art ? `<img class="art ${cls}" src="${art}/${name}${cls === 'vign' ? '-sm' : ''}.png" style="${style}" alt="">` : '');
  const head = (kicker, title, extra = '', vign = '') => `<header class="ph"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div><div class="ph-right">${extra}${vign ? artImg(vign, 'vign') : ''}</div></header>`;
  const foot = (num, label, nav = '') => `<footer class="pf"><span>${esc(cfg.brand)}</span><span>${nav || label}</span><span class="num">${num}</span></footer>`;
  const plain = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

  const out = [];

  // cover
  out.push(wrap('cover', 'cover', `
    <div class="frame"></div>
    ${artImg('rose', 'cover-art')}
    <div style="margin-top:4.5in">
      <div class="label accent" style="letter-spacing:.42em;margin-bottom:.22in">${esc(cfg.edition)}</div>
      <h1>The Wedding <em>Planner</em></h1>
      <div class="sub">${esc(cfg.productSubtitle)}</div>
    </div>
    <div class="names">
      ${field('&nbsp;', 'tall')}
      <div class="label" style="margin:.12in 0 .3in">Our names</div>
      ${field('&nbsp;', 'tall')}
      <div class="label" style="margin-top:.12in">Our date</div>
    </div>`, ''));

  // welcome
  out.push(wrap('welcome', '', `
    ${head('Welcome', 'Before You <em>Begin</em>')}
    <div class="body">
      <p class="lede none" style="font-size:15pt">Congratulations. This planner holds everything you need to plan your wedding calmly, from the first budget conversation to the last thank-you note.</p>
      <div class="row grow">
        <div class="col">
          ${sec('How to use it')}
          <p class="copy">Work through the sections in order, or jump straight to what you need from the contents page. Each section opens with a short overview, then gives you the checklists, trackers and worksheets for that part of planning.</p>
          <p class="copy">The <b style="font-weight:400">Vendors</b> section has a page for every supplier you might book, with the questions to ask before you sign, a comparison sheet for three options, and space to record the one you choose.</p>
          ${sec('What’s included')}
          ${check([`${total} planner pages`, 'Printable PDF in US Letter and A4', 'Hyperlinked digital PDF for tablets', '40 invitation designs to edit in Canva', 'Interactive app: drag & drop seating, budget, vendors near you', 'Companion budget & guest-list spreadsheet', 'Live vendor directory for your country'], 'round')}
        </div>
        <div class="col">
          ${box('On a tablet', `<p class="copy">Open the <b style="font-weight:400">Digital</b> PDF in GoodNotes, Notability, Noteshelf, Xodo or any PDF app that supports links. Tap the tabs on the right to move between sections; tap <span class="serif" style="color:var(--accent)">&amp;</span> to return to the contents. Write with a stylus, or add text boxes and photos.</p>`, 'none')}
          ${box('On paper', `<p class="copy">Print the <b style="font-weight:400">Printable</b> PDF in US Letter or A4, single or double-sided. Print only the pages you need, as many times as you need: extra guest lists, months, notes. A ring binder or disc binder keeps it all together.</p>`, 'none')}
          ${box('The interactive app', `<p class="copy">Prefer to tap and drag? Open the app on any phone, tablet or computer to manage guests, drag them onto tables, track the budget and find real vendors near you. It saves on your device and works offline.</p><div style="margin-top:.08in"><a class="btn" href="${esc(cfg.appUrl)}">Open the app →</a></div>`, 'none')}
          ${box('A note on numbers', `<p class="note">Budget splits, tipping customs and timings are common starting points, not rules. Prices and customs differ by country and region, so adjust them to your own wedding.</p>`, 'wash grow')}
        </div>
      </div>
    </div>
    ${foot(2, 'Welcome')}`, ''));

  // contents
  out.push(wrap('contents', '', `
    ${head('Contents', 'Inside This <em>Planner</em>', digital ? 'Tap any line<br>to go there' : '')}
    <div class="toc">
      ${sections.map((s) => `<div class="grp">
        <a class="g" href="#${s.id}"><span class="n">${s.num}</span><span>${plain(s.title)}</span></a>
        ${s.pages.filter((p, i, a) => !(p.vendor && a.findIndex((q) => q.vendor) !== i) && !/-compare$/.test(p.id) && !/^(month|guests|expenses|gifts|notes|checklist|seating)-([2-9]|1[0-2])$/.test(p.id) && !/^canva-(classic|modern|botanical)$/.test(p.id) && p.id !== 'alcohol-calc')
          .map((p) => {
            let label = plain(p.title);
            if (p.vendor) label = 'Vendor pages (16 categories)';
            if (/^month-1$/.test(p.id)) label = 'Monthly planners (12)';
            if (/^guests-1$/.test(p.id)) label = 'Guest list (150 guests)';
            if (/^checklist-1$/.test(p.id)) label = 'Wedding checklist (3 pages)';
            if (p.id === 'canva-garden') label = 'Invitation suite · Canva (40)';
            return `<a class="i" href="#${p.id}"><span>${label}</span><span>${p.n}</span></a>`;
          }).join('')}
        ${s.id === 'vendors' ? `<a class="i" href="#alcohol-calc"><span>Alcohol calculator</span><span>${s.pages.find((p) => p.id === 'alcohol-calc').n}</span></a>` : ''}
      </div>`).join('')}
    </div>
    ${foot(3, 'Contents')}`, ''));

  sections.forEach((s) => {
    // divider
    const toc = s.pages.filter((p) => !/-compare$/.test(p.id) && !/^(month|guests|expenses|gifts|notes|checklist|seating)-([2-9]|1[0-2])$/.test(p.id) && !/^canva-(classic|modern|botanical)$/.test(p.id));
    out.push(wrap(s.id, 'divider', `
      <div class="div-art" style="${toc.length > 12 ? 'height:3.5in' : ''}">${artImg(s.theme.art)}</div>
      <div class="div-text">
        <div class="num">${s.num}</div>
        <h1>${s.title}</h1>
        <div class="rule"></div>
        <p class="lede">${s.lede}</p>
      </div>
      <div class="toc-mini">${toc.map((p) => `<a href="#${p.id}"><span>${plain(p.title)}</span><span>${p.n}</span></a>`).join('')}</div>
      <div class="credit">${esc(s.theme.credit)}</div>`, s.id));
    s.pages.forEach((p) => {
      const nav = digital ? `<a href="#${s.id}">${s.tab}</a> &nbsp;·&nbsp; <a href="#contents">Contents</a>` : '';
      out.push(wrap(p.id, '', `${head(p.kicker, p.title, '', s.theme.art)}<div class="body">${p.body()}</div>${foot(p.n, s.tab, nav)}`, s.id));
    });
  });

  const dims = size === 'a4' ? { pw: '210mm', ph: '297mm' } : { pw: '8.5in', ph: '11in' };
  const rw = '0.6in';
  const pw = digital ? (size === 'a4' ? '225.24mm' : '9.1in') : dims.pw;
  return {
    total,
    css: `:root{--pw:${pw};--ph:${dims.ph};--sw:${dims.pw};--rail:${rw}} @page{size:${pw} ${dims.ph};margin:0}`,
    html: out.join('\n'),
    pageWidth: pw,
    pageHeight: dims.ph,
  };
};
module.exports.THEMES = THEMES;
