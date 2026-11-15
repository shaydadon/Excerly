// Etsy listing images, 2700 × 2025 px (Etsy's recommended 4:3 size).
// Run after `npm run build`:  npm run listing  ->  dist/Etsy-Listing-Images/*.png
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const cfg = require('./config');

const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(ROOT, '.cache/pages');
const THUMBS = path.join(ROOT, '.cache/thumbs');
const OUT = path.join(ROOT, 'dist/Etsy-Listing-Images');
fs.mkdirSync(OUT, { recursive: true });
const fontCss = fs.readFileSync(path.join(ROOT, 'fonts/fonts.css'), 'utf8').replace(/url\(([^)]+\.ttf)\)/g, (_, f) => `url(file://${path.join(ROOT, 'fonts', f)})`);
const pg = (id) => `file://${PAGES}/${id}.png`;
const th = (id) => `file://${THUMBS}/${id}.png`;
const total = fs.readdirSync(PAGES).length;

const CSS = `${fontCss}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 2700px; height: 2025px; overflow: hidden; background: #EEE7DD; font-family: 'Jost'; font-weight: 300; color: #2E2A27; position: relative; }
.k { font-size: 30px; letter-spacing: .34em; text-transform: uppercase; color: #A3845F; font-weight: 400; }
h1 { font-family: 'Cormorant Garamond'; font-weight: 300; font-size: 168px; line-height: .95; }
h1 em { font-style: italic; }
h2 { font-family: 'Cormorant Garamond'; font-weight: 300; font-size: 118px; line-height: 1; }
h2 em { font-style: italic; }
.sub { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 52px; color: #6F665F; line-height: 1.3; }
.pg { position: absolute; box-shadow: 0 30px 70px rgba(70, 50, 30, .22), 0 4px 14px rgba(70, 50, 30, .12); background: #fff; }
.feat { display: flex; flex-direction: column; gap: 26px; }
.feat div { font-size: 38px; display: flex; gap: 26px; align-items: center; }
.feat div::before { content: ''; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #A3845F; flex: none; }
.pill { display: inline-block; font-size: 28px; letter-spacing: .24em; text-transform: uppercase; border: 2px solid #2E2A27; padding: 16px 34px; border-radius: 60px; font-weight: 400; }
.band { position: absolute; left: 0; right: 0; bottom: 0; height: 130px; background: #2E2A27; color: #FBF8F3; display: flex; align-items: center; justify-content: center; gap: 70px; font-size: 28px; letter-spacing: .28em; text-transform: uppercase; }
.band span + span::before { content: '·'; margin-right: 70px; color: #A3845F; }
`;

const W = 1748 / 2; // page preview natural aspect (digital page 9.1 × 11 in)
const img = (src, x, y, w, rot = 0, extra = '') => `<img class="pg" src="${src}" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg);${extra}">`;
const band = `<div class="band"><span>Instant download</span><span>Printable + digital</span><span>US Letter & A4</span><span>Edit in Canva</span></div>`;

const slides = {
  '01-cover': `
    <div style="position:absolute;left:170px;top:330px;width:1150px">
      <div class="k">Printable & Digital Planner</div>
      <h1 style="margin:50px 0 46px">The Wedding<br><em>Planner</em></h1>
      <div class="sub">Everything you need, from yes to ever after</div>
      <div class="feat" style="margin-top:90px">
        <div>${total} hyperlinked pages</div><div>30 invitation templates for Canva</div><div>Budget & guest-list spreadsheet</div><div>Live vendor directory</div>
      </div>
    </div>
    ${img(pg('budget-guide'), 1500, 330, 900, 7)}
    ${img(pg('v-photo'), 1380, 250, 900, -6)}
    ${img(pg('cover'), 1420, 150, 1000, 0)}
    ${band}`,

  '02-inside': `
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><div class="k">${total} pages</div><h2 style="margin-top:26px">What’s <em>Inside</em></h2></div>
    <div style="position:absolute;left:150px;right:150px;top:470px;display:grid;grid-template-columns:repeat(6,1fr);gap:46px 40px">
      ${['couple', 'checklist-1', 'month-1', 'budget-guide', 'budget-overview', 'guest-guide', 'guests-1', 'seating-1', 'v-photo', 'alcohol-calc', 'canva-classic', 'music', 'shots', 'ceremony', 'day-timeline', 'vendor-schedule', 'honeymoon', 'memories']
    .map((id) => `<img src="${pg(id)}" style="width:100%;box-shadow:0 14px 34px rgba(70,50,30,.18)">`).join('')}
    </div>`,

  '03-digital': `
    <div style="position:absolute;left:170px;top:360px;width:980px">
      <div class="k">Digital planner</div>
      <h2 style="margin:36px 0 50px">Tap to go<br><em>anywhere</em></h2>
      <div class="feat">
        <div>Hyperlinked tabs on every page</div><div>Clickable contents & section pages</div><div>GoodNotes, Notability, Noteshelf, Xodo</div><div>iPad, Android tablets & laptops</div>
      </div>
    </div>
    <div style="position:absolute;left:1260px;top:110px;width:1330px;height:1650px;background:#2E2A27;border-radius:80px;padding:56px;box-shadow:0 40px 90px rgba(40,25,10,.35)">
      <img src="${pg('contents')}" style="width:100%;height:100%;object-fit:cover;object-position:top left;border-radius:26px;display:block">
    </div>
    <div style="position:absolute;left:2390px;top:230px;width:260px;font-size:26px;letter-spacing:.2em;text-transform:uppercase;color:#A3845F;font-weight:400;text-align:center;line-height:1.5"></div>`,

  '04-vendors': `
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><div class="k">16 vendor categories</div><h2 style="margin-top:26px">Book the right <em>team</em></h2>
    <div class="sub" style="margin-top:30px;font-size:44px">Questions to ask · compare three quotes · alcohol calculator · active bar planning</div></div>
    ${img(pg('v-photo'), 170, 620, 760, -3)}
    ${img(pg('alcohol-calc'), 1770, 620, 760, 3)}
    ${img(pg('v-activebar-compare'), 950, 560, 800, 0)}`,

  '05-budget-guests': `
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><div class="k">Budget · Guests · Seating</div><h2 style="margin-top:26px">Every number, <em>in one place</em></h2></div>
    ${img(pg('budget-guide'), 170, 520, 760, -3)}
    ${img(pg('seating-1'), 1770, 520, 760, 3)}
    ${img(pg('guests-1'), 950, 470, 800, 0)}`,

  '06-invitations': `
    <div style="position:absolute;left:170px;top:150px;width:1000px">
      <div class="k">Edit in Canva</div>
      <h2 style="margin:30px 0 40px">30 invitation<br><em>templates</em></h2>
      <div class="sub" style="font-size:44px">Three styles, ten matching pieces each. Change the names, date and wording in a free Canva account.</div>
      <div class="feat" style="margin-top:60px">
        <div>Save the date · Invitation · RSVP</div><div>Details · Program · Menu</div><div>Table number · Place card</div><div>Welcome sign · Thank-you card</div>
      </div>
    </div>
    ${[['classic-invitation', 1250, 200, 410, -2], ['modern-invitation', 1720, 170, 410, 0], ['botanical-invitation', 2190, 200, 410, 2], ['classic-rsvp', 1290, 950, 300, -3], ['botanical-menu', 1690, 900, 260, 0], ['modern-tableNumber', 2010, 940, 320, 2], ['botanical-placeCard', 2290, 1500, 330, -2], ['classic-thankYou', 1300, 1520, 480, 2]]
    .map(([id, x, y, w, r]) => img(th(id), x, y, w, r)).join('')}`,

  '07-spreadsheet': `
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><div class="k">Excel · Google Sheets · Numbers</div><h2 style="margin-top:26px">A spreadsheet that <em>does the math</em></h2></div>
    <div style="position:absolute;left:300px;right:300px;top:520px;bottom:200px;background:#fff;box-shadow:0 30px 70px rgba(70,50,30,.2);padding:70px 90px;display:grid;grid-template-columns:1fr 1fr;gap:40px 90px;align-content:start">
      ${[['Budget', [['Total budget', '35,000'], ['Estimated', '30,100'], ['Paid so far', '9,320'], ['Still to pay', '13,980']]],
    ['Guests', [['Invited', '142'], ['Attending', '118'], ['Declined', '9'], ['Response rate', '89%']]],
    ['Meals', [['Meat', '64'], ['Fish', '31'], ['Vegetarian', '18'], ['Vegan', '5']]],
    ['Progress', [['Checklist', '62%'], ['Vendors booked', '9'], ['Days to go', '209'], ['Tables in use', '12']]]]
    .map(([t, rows]) => `<div><div class="k" style="font-size:24px;border-bottom:3px solid #2E2A27;padding-bottom:16px">${t}</div>${rows.map(([a, b]) => `<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px solid #DCD3C8;padding:18px 0;font-size:32px">${a}<span style="font-family:'Cormorant Garamond';font-size:50px">${b}</span></div>`).join('')}</div>`).join('')}
      <div style="grid-column:span 2;display:flex;gap:14px;margin-top:16px">${['Dashboard', 'Budget', 'Guest List', 'Vendors', 'Checklist', 'Seating'].map((t, i) => `<span style="font-size:24px;letter-spacing:.14em;text-transform:uppercase;padding:12px 26px;${i ? 'border:1.5px solid #DCD3C8;color:#6F665F' : 'background:#2E2A27;color:#fff'}">${t}</span>`).join('')}</div>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:90px;text-align:center;font-size:24px;letter-spacing:.2em;text-transform:uppercase;color:#A69C92">Example numbers shown</div>`,

  '08-what-you-get': `
    <div style="position:absolute;left:0;right:0;top:120px;text-align:center"><div class="k">Instant download</div><h2 style="margin-top:26px">What you <em>get</em></h2></div>
    <div style="position:absolute;left:260px;right:260px;top:520px;display:grid;grid-template-columns:repeat(3,1fr);gap:50px">
      ${[['01', 'Digital planner', `${total}-page hyperlinked PDF for tablets`], ['02', 'Printable planner', 'US Letter and A4 PDFs, print what you need'], ['03', 'Invitation suite', '30 Canva templates + print-ready PDFs'], ['04', 'Spreadsheet', 'Budget, guests, RSVPs, vendors & seating'], ['05', 'Vendor directory', 'Live, regularly updated online list'], ['06', 'Start-here guide', 'Links, setup and printing tips']]
    .map(([n, t, d]) => `<div style="background:#FBF8F3;padding:60px 56px;min-height:470px"><div style="font-family:'Cormorant Garamond';font-size:84px;color:#A3845F;font-weight:300">${n}</div><div style="font-family:'Cormorant Garamond';font-size:58px;margin:18px 0 18px">${t}</div><div style="font-size:32px;color:#6F665F;line-height:1.5">${d}</div></div>`).join('')}
    </div>
    <div style="position:absolute;left:0;right:0;bottom:120px;text-align:center"><span class="pill">${cfg.brand}</span></div>`,
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2700, height: 2025 } });
  for (const [name, html] of Object.entries(slides)) {
    const f = path.join(ROOT, '.cache', `listing-${name}.html`);
    fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`);
    await p.goto('file://' + f);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log('✓', name);
  }
  await b.close();
})();
