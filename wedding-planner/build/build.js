// Builds every file you sell: planner PDFs, invitation suite, previews.
// Usage: npm run build           (everything)
//        npm run build -- planner (only planner PDFs)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');
const cfg = require('./config');
const buildPlanner = require('./planner');
const inv = require('./invitations');
const startHere = require('./starthere');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const TMP = path.join(ROOT, '.cache');
const only = process.argv[2];
[OUT, TMP, path.join(TMP, 'thumbs'), path.join(TMP, 'pages')].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const fontCss = fs.readFileSync(path.join(ROOT, 'fonts/fonts.css'), 'utf8')
  .replace(/url\(([^)]+\.ttf)\)/g, (_, f) => `url(file://${path.join(ROOT, 'fonts', f)})`);
const pageCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

const doc = (body, css, bodyClass = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${fontCss}${css}</style></head><body class="${bodyClass}">${body}</body></html>`;

async function writeAndLoad(page, name, html) {
  const f = path.join(TMP, name);
  fs.writeFileSync(f, html);
  await page.goto('file://' + f, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // ── 1. invitation suite ──
  const thumbs = {};
  if (!only || only === 'invitations' || only === 'planner') {
    for (const [sk, sname] of Object.entries(inv.STYLES)) {
      const dir = path.join(OUT, 'Invitation-Suite', sname.replace(/ /g, '-'));
      fs.mkdirSync(dir, { recursive: true });
      for (const [ik, it] of Object.entries(inv.ITEMS)) {
        const html = doc(inv.cardHTML(sk, ik), inv.CSS + `@page{size:${it.w}in ${it.h}in;margin:0}`);
        await writeAndLoad(page, `inv-${sk}-${ik}.html`, html);
        const thumb = path.join(TMP, 'thumbs', `${sk}-${ik}.png`);
        await page.setViewportSize({ width: 1400, height: 1800 });
        await page.locator('.card').screenshot({ path: thumb });
        thumbs[`${sk}-${ik}`] = 'file://' + thumb;
        if (only !== 'planner') {
          await page.pdf({ path: path.join(dir, `${it.name.replace(/ /g, '-')}_${it.w}x${it.h}in.pdf`), width: `${it.w}in`, height: `${it.h}in`, printBackground: true });
        }
      }
    }
    console.log('✓ invitation suite');
  }

  // ── 2. planner ──
  if (!only || only === 'planner') {
    const qrSvg = await QRCode.toString(cfg.vendorDirectoryUrl, { type: 'svg', margin: 0, color: { dark: '#2E2A27', light: '#FFFFFF' } });
    const variants = [
      { file: 'The-Wedding-Planner_Digital-Hyperlinked.pdf', digital: true, size: 'letter', cls: '' },
      { file: 'The-Wedding-Planner_Printable_US-Letter.pdf', digital: false, size: 'letter', cls: 'print' },
      { file: 'The-Wedding-Planner_Printable_A4.pdf', digital: false, size: 'a4', cls: 'print' },
    ];
    for (const v of variants) {
      const p = buildPlanner(cfg, { ...v, thumbs, qrSvg });
      await writeAndLoad(page, `planner-${v.digital ? 'digital' : v.size}.html`, doc(p.html, pageCss + p.css, v.cls));
      await page.pdf({ path: path.join(OUT, v.file), preferCSSPageSize: true, printBackground: true });
      console.log(`✓ ${v.file} · ${p.total} pages`);

      if (v.digital) {
        // page previews for listing images
        await page.setViewportSize({ width: 1000, height: 1200 });
        fs.rmSync(path.join(TMP, 'pages'), { recursive: true, force: true });
        fs.mkdirSync(path.join(TMP, 'pages'));
        const ids = await page.$$eval('.page', (els) => els.map((e) => e.id));
        for (const id of ids) {
          await page.locator(`#${id}`).screenshot({ path: path.join(TMP, 'pages', `${id}.png`) });
        }
        console.log(`✓ ${ids.length} page previews`);
      }
    }
  }

  // ── 3. start-here guide ──
  if (!only || only === 'planner' || only === 'start') {
    const qrSvg = await QRCode.toString(cfg.vendorDirectoryUrl, { type: 'svg', margin: 0, color: { dark: '#2E2A27', light: '#FFFFFF' } });
    const total = buildPlanner(cfg, { digital: true, size: 'letter', thumbs: {}, qrSvg }).total;
    const sh = startHere(cfg, { qrSvg, total, inv });
    await writeAndLoad(page, 'start-here.html', doc(sh.html, pageCss + sh.css, 'print'));
    await page.pdf({ path: path.join(OUT, '00-START-HERE.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.setViewportSize({ width: 1000, height: 1200 });
    const shots = await page.$$('.page');
    for (let i = 0; i < shots.length; i++) await shots[i].screenshot({ path: path.join(TMP, `start-here-${i + 1}.png`) });
    console.log('✓ 00-START-HERE.pdf');
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
