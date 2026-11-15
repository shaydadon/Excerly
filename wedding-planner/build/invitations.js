// Invitation suite: 10 items × 4 styles. Every size is the real print size in inches.
// All type is sized from --u (1% of the card width) so each design scales cleanly.

const ITEMS = {
  saveTheDate: { name: 'Save the Date', w: 5, h: 7 },
  invitation: { name: 'Invitation', w: 5, h: 7 },
  rsvp: { name: 'RSVP Card', w: 3.5, h: 5 },
  details: { name: 'Details Card', w: 4.25, h: 5.5 },
  program: { name: 'Program', w: 5, h: 7 },
  menu: { name: 'Menu', w: 4, h: 9 },
  tableNumber: { name: 'Table Number', w: 4, h: 6 },
  placeCard: { name: 'Place Card', w: 3.5, h: 2 },
  welcomeSign: { name: 'Welcome Sign', w: 18, h: 24 },
  thankYou: { name: 'Thank You', w: 7, h: 5 },
};

const STYLES = { classic: 'Ivory Classic', modern: 'Modern Minimal', botanical: 'Botanical Line', garden: 'Garden Rose' };

const D = {
  a: 'Olivia', b: 'James',
  dateNum: '06 · 12 · 2027',
  dateLong: 'Saturday, the twelfth of June<br>two thousand twenty-seven',
  dateShort: 'June 12, 2027',
  time: 'at four o’clock in the afternoon',
  venue: 'Rosewood Gardens',
  city: 'Napa Valley, California',
};

function sprig(flip = false, color = '#8C9B80') {
  // a hand-drawn-looking branch: curved stem with alternating leaves
  let leaves = '';
  const pts = 7;
  for (let i = 0; i < pts; i++) {
    const t = (i + 0.6) / (pts + 0.4);
    const x = 10 + t * 180;
    const y = 30 - Math.sin(t * Math.PI) * 14;
    const side = i % 2 ? 1 : -1;
    const ang = side * (38 - t * 12) - t * 8;
    const s = 1.15 - t * 0.45;
    leaves += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang - 90 * side * 0).toFixed(1)}) scale(${s.toFixed(2)} ${(side * s).toFixed(2)})"><path d="M0 0 C6 -9 18 -11 26 -4 C18 1 7 2 0 0Z" fill="none" stroke="${color}" stroke-width="0.9"/><path d="M1 -0.4 C9 -4 16 -5 24 -4" fill="none" stroke="${color}" stroke-width="0.5"/></g>`;
  }
  return `<svg class="sprig" viewBox="0 0 200 50" style="${flip ? 'transform:scaleY(-1)' : ''}" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 32 C 60 10, 130 10, 196 26" fill="none" stroke="${color}" stroke-width="1"/>${leaves}
    <circle cx="196" cy="26" r="1.6" fill="${color}"/></svg>`;
}

const amp = '<span class="amp">&amp;</span>';
const names = (cls = '') => `<div class="names ${cls}">${D.a} ${amp} ${D.b}</div>`;

function content(item) {
  switch (item) {
    case 'saveTheDate': return `
      <div class="eyebrow">Save the Date</div>
      ${names('xl')}
      <div class="rule"></div>
      <div class="date big">${D.dateNum}</div>
      <div class="small">${D.city}</div>
      <div class="text it">Formal invitation to follow</div>`;
    case 'invitation': return `
      <div class="text">Together with their families</div>
      ${names('xl')}
      <div class="text">request the pleasure of your company<br>at the celebration of their marriage</div>
      <div class="rule"></div>
      <div class="date">${D.dateLong}</div>
      <div class="text it">${D.time}</div>
      <div class="small">${D.venue}<br>${D.city}</div>
      <div class="text it">Dinner and dancing to follow</div>`;
    case 'rsvp': return `
      <div class="eyebrow">Kindly Reply</div>
      <div class="text it">by the first of May</div>
      <div class="form">
        <div class="ln"><span>Name(s)</span></div>
        <div class="opt"><i></i>Joyfully accepts</div>
        <div class="opt"><i></i>Regretfully declines</div>
        <div class="ln"><span>Number attending</span></div>
        <div class="small">Meal · Beef ___ Fish ___ Vegetarian ___</div>
      </div>`;
    case 'details': return `
      <div class="eyebrow">The Details</div>
      <div class="blk"><div class="small">Ceremony & Reception</div><div class="text">${D.venue}<br>1200 Vineyard Lane, ${D.city}</div></div>
      <div class="blk"><div class="small">Accommodation</div><div class="text">A room block is held at The Valley Inn<br>until May 1 under “Olivia & James”</div></div>
      <div class="blk"><div class="small">Attire</div><div class="text">Black tie optional</div></div>
      <div class="blk"><div class="small">Online</div><div class="text">oliviaandjames.com</div></div>`;
    case 'program': return `
      <div class="eyebrow">Order of Ceremony</div>
      ${names()}
      <div class="small">${D.dateShort} · ${D.venue}</div>
      <div class="rule"></div>
      <div class="list">
        ${['Processional', 'Welcome', 'Reading', 'Exchange of Vows', 'Exchange of Rings', 'Pronouncement', 'Recessional'].map((x) => `<div>${x}</div>`).join('')}
      </div>
      <div class="rule"></div>
      <div class="small">Officiant · Maid of Honor · Best Man</div>
      <div class="text it">Sarah Miller · Emma Clarke · Daniel Reed</div>`;
    case 'menu': return `
      ${names()}
      <div class="small">${D.dateShort}</div>
      <div class="rule"></div>
      <div class="eyebrow">Dinner</div>
      <div class="blk"><div class="small">To Start</div><div class="text">Burrata, heirloom tomato, basil oil<br>& grilled sourdough</div></div>
      <div class="blk"><div class="small">Main</div><div class="text">Herb-roasted chicken, potato purée<br>& seasonal vegetables<br><span class="it">or</span><br>Wild mushroom risotto, parmesan</div></div>
      <div class="blk"><div class="small">Dessert</div><div class="text">Wedding cake<br>& salted caramel tart</div></div>
      <div class="rule"></div>
      <div class="text it">Signature cocktails · The Olivia & The James</div>`;
    case 'tableNumber': return `
      <div class="eyebrow">Table</div>
      <div class="numeral">4</div>
      <div class="rule"></div>
      <div class="small">${D.a} & ${D.b}</div>`;
    case 'placeCard': return `
      <div class="names pc">Emma Thompson</div>
      <div class="small">Table 4</div>`;
    case 'welcomeSign': return `
      <div class="eyebrow">Welcome to the wedding of</div>
      ${names('xl')}
      <div class="rule"></div>
      <div class="date big">${D.dateNum}</div>
      <div class="small">${D.venue}</div>`;
    case 'thankYou': return `
      <div class="ty">Thank you</div>
      <div class="rule"></div>
      <div class="small">With love, ${D.a} & ${D.b}</div>`;
  }
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.card { position: relative; width: var(--w); height: var(--h); overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: calc(var(--u) * 3.2); padding: calc(var(--u) * 12); color: #2E2A27; font-family: 'Cormorant Garamond', serif; }
.eyebrow { font-family: 'Jost', sans-serif; font-weight: 400; font-size: calc(var(--u) * 2.6); letter-spacing: .36em; text-transform: uppercase; color: #A3845F; }
.names { font-weight: 300; font-size: calc(var(--u) * 9); line-height: 1.05; }
.names.xl { font-size: calc(var(--u) * 12); }
.names.pc { font-size: calc(var(--u) * 11); font-style: italic; }
.amp { font-style: italic; color: #A3845F; }
.text { font-size: calc(var(--u) * 4.1); line-height: 1.5; }
.it { font-style: italic; }
.date { font-size: calc(var(--u) * 4.6); line-height: 1.45; font-weight: 500; }
.date.big { font-size: calc(var(--u) * 7); font-weight: 300; letter-spacing: .08em; }
.small { font-family: 'Jost', sans-serif; font-weight: 300; font-size: calc(var(--u) * 2.5); letter-spacing: .28em; text-transform: uppercase; line-height: 1.9; }
.rule { width: calc(var(--u) * 12); border-top: calc(var(--u) * .18) solid #A3845F; }
.blk { display: flex; flex-direction: column; gap: calc(var(--u) * .8); }
.list { display: flex; flex-direction: column; gap: calc(var(--u) * 1.6); font-size: calc(var(--u) * 4.6); }
.numeral { font-weight: 300; font-size: calc(var(--u) * 44); line-height: .9; }
.ty { font-weight: 300; font-style: italic; font-size: calc(var(--u) * 15); line-height: 1; }
.form { width: 100%; display: flex; flex-direction: column; gap: calc(var(--u) * 4); text-align: left; margin-top: calc(var(--u) * 2); }
.form .ln { border-bottom: calc(var(--u) * .2) solid #C9BCAD; padding-bottom: calc(var(--u) * 1); }
.form .ln span, .form .opt { font-family: 'Jost', sans-serif; font-size: calc(var(--u) * 3); letter-spacing: .12em; text-transform: uppercase; }
.form .opt { display: flex; align-items: center; gap: calc(var(--u) * 2.4); }
.form .opt i { width: calc(var(--u) * 3.4); height: calc(var(--u) * 3.4); border: calc(var(--u) * .25) solid #A3845F; border-radius: 50%; }
.form .small { text-align: left; letter-spacing: .12em; }

/* Ivory Classic */
.s-classic { background: #FBF8F3; }
.s-classic::before { content: ''; position: absolute; inset: calc(var(--u) * 4); border: calc(var(--u) * .2) solid #C9B79F; }
.s-classic::after { content: ''; position: absolute; inset: calc(var(--u) * 5.4); border: calc(var(--u) * .1) solid #DCCFBE; }

/* Modern Minimal */
.s-modern { background: #FFFFFF; align-items: flex-start; text-align: left; justify-content: flex-end; }
.s-modern .eyebrow { color: #2E2A27; }
.s-modern .names { font-weight: 400; letter-spacing: -.01em; }
.s-modern .names.xl { font-size: calc(var(--u) * 15); line-height: .92; }
.s-modern .amp { color: #2E2A27; font-weight: 300; }
.s-modern .rule { width: 100%; border-top-color: #2E2A27; border-top-width: calc(var(--u) * .14); }
.s-modern .form { margin-top: 0; }
.s-modern .numeral { font-size: calc(var(--u) * 60); }
.s-modern::before { content: '${'Olivia & James'}'; position: absolute; top: calc(var(--u) * 10); left: calc(var(--u) * 12); font-family: 'Jost', sans-serif; font-size: calc(var(--u) * 2.3); letter-spacing: .32em; text-transform: uppercase; color: #A69C92; }
.s-modern.i-saveTheDate::before, .s-modern.i-invitation::before, .s-modern.i-welcomeSign::before, .s-modern.i-program::before, .s-modern.i-menu::before, .s-modern.i-placeCard::before { content: '${D.dateNum}'; }

/* Botanical Line */
.s-botanical { background: #F8F7F2; }
.s-botanical .eyebrow, .s-botanical .amp { color: #7D8E72; }
.s-botanical .rule { border-top-color: #9CAB91; }
.s-botanical .sprig { position: absolute; left: 50%; width: calc(var(--u) * 56); margin-left: calc(var(--u) * -28); height: auto; }
.s-botanical .sprig.top { top: calc(var(--u) * 5); }
.s-botanical .sprig.bot { bottom: calc(var(--u) * 5); }
.s-botanical .form .opt i { border-color: #7D8E72; }

/* Garden Rose: watercolor rose (Redouté, public domain) on blush */
.s-garden { background: linear-gradient(180deg, #FBEFEC 0%, #FDF8F5 70%); }
.s-garden .rose { flex: none; width: calc(var(--u) * 34); margin-bottom: calc(var(--u) * 1); }
.s-garden .eyebrow, .s-garden .amp { color: #B9675F; }
.s-garden .rule { border-top-color: #D9A49B; }
.s-garden .form .opt i { border-color: #B9675F; }
.s-garden::after { content: ''; position: absolute; inset: calc(var(--u) * 3.4); border: calc(var(--u) * .15) solid #EBC9C1; pointer-events: none; }
.s-garden.i-invitation, .s-garden.i-program { padding-top: calc(var(--u) * 8); padding-bottom: calc(var(--u) * 8); gap: calc(var(--u) * 2.6); }
.s-garden.i-invitation .rose, .s-garden.i-program .rose { width: calc(var(--u) * 20); }
.s-garden.i-rsvp .rose, .s-garden.i-details .rose { width: calc(var(--u) * 20); }
.s-garden.i-menu .rose { width: calc(var(--u) * 30); }
.s-garden.i-tableNumber .rose { width: calc(var(--u) * 30); }
.s-garden.i-tableNumber .numeral { font-size: calc(var(--u) * 34); }
.s-garden.i-welcomeSign .rose { width: calc(var(--u) * 32); }
.s-garden.i-thankYou, .s-garden.i-placeCard { padding: calc(var(--u) * 8) calc(var(--u) * 6) calc(var(--u) * 8) calc(var(--u) * 48); }
.s-garden.i-thankYou .rose, .s-garden.i-placeCard .rose { position: absolute; top: 50%; left: calc(var(--u) * 6); width: auto; height: 80%; transform: translateY(-50%); margin: 0; }
.s-garden.i-thankYou .ty { font-size: calc(var(--u) * 11); }
.s-garden.i-placeCard .names.pc { font-size: calc(var(--u) * 9); }

/* tight formats */
.i-placeCard { gap: calc(var(--u) * 2); padding: calc(var(--u) * 8); }
.i-placeCard.s-botanical .sprig { width: calc(var(--u) * 30); margin-left: calc(var(--u) * -15); }
.i-placeCard.s-modern::before { top: calc(var(--u) * 7); left: calc(var(--u) * 8); }
.i-menu { justify-content: center; gap: calc(var(--u) * 4.4); }
.i-menu .text { font-size: calc(var(--u) * 4.6); }
.i-menu .eyebrow, .i-menu .small { font-size: calc(var(--u) * 3); }
.i-welcomeSign { gap: calc(var(--u) * 4); }
.i-thankYou .small { font-size: calc(var(--u) * 2.1); }
.i-rsvp.s-modern, .i-details.s-modern { justify-content: center; }
`;

function cardHTML(style, item, art = '') {
  const it = ITEMS[item];
  const u = it.w / 100;
  const deco = style === 'botanical' ? `${sprig(false).replace('class="sprig"', 'class="sprig top"')}${item !== 'placeCard' && item !== 'thankYou' ? sprig(true).replace('class="sprig"', 'class="sprig bot"') : ''}` : '';
  const rose = style === 'garden' && art ? `<img class="rose" src="${art}/rose.png" alt="">` : '';
  return `<div class="card s-${style} i-${item}" style="--w:${it.w}in;--h:${it.h}in;--u:${u}in">${deco}${rose}${content(item)}</div>`;
}

module.exports = { ITEMS, STYLES, CSS, cardHTML };
