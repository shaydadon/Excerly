// START HERE guide: the first file the buyer opens. Holds every link (Canva, directory, spreadsheet).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

module.exports = function startHere(cfg, { qrSvg, total, inv }) {
  const head = (k, t) => `<header class="ph"><div><div class="kicker">${k}</div><h1>${t}</h1></div><div class="ph-right">${esc(cfg.brand)}</div></header>`;
  const foot = (n) => `<footer class="pf"><span>${esc(cfg.brand)}</span><span>Start Here</span><span class="num">${n}</span></footer>`;
  const page = (inner) => `<section class="page"><div class="sheet">${inner}</div></section>`;
  const sec = (t) => `<h2 class="sec">${t}</h2>`;
  const row = (n, t, d) => `<div style="display:flex;gap:.18in;padding:.1in 0;border-bottom:.6pt solid var(--line)"><div class="serif" style="font-size:20pt;color:var(--accent);width:.4in;line-height:1">${n}</div><div><div style="font-size:9pt;font-weight:400">${t}</div><p class="note">${d}</p></div></div>`;

  const p1 = page(`${head('Welcome', 'Start <em>Here</em>')}
    <div class="body">
      <p class="lede none" style="font-size:15pt">Thank you, and congratulations. Here is everything in your download and how to use it.</p>
      <div class="row grow">
        <div class="col" style="flex:1.15">
          ${sec('Your files')}
          <div>
            ${row('01', 'The-Wedding-Planner_Digital-Hyperlinked.pdf', `${total} pages with clickable tabs for GoodNotes, Notability, Noteshelf, Xodo and other PDF apps.`)}
            ${row('02', 'The-Wedding-Planner_Printable (US Letter & A4)', 'Print-friendly white pages. Print the whole planner or only the pages you need.')}
            ${row('03', 'Invitation Suite (40 designs)', 'In the Invitation-Suite-and-Spreadsheet zip. Edit in Canva with the links on the next page, or print the ready-made PDFs.')}
            ${row('04', 'The-Wedding-Planner_Spreadsheet.xlsx', 'In the same zip. Budget, guest list, RSVPs, meals, vendors, seating and checklist. Totals update on their own.')}
            ${row('05', 'Vendor directory', 'Vendors for your country, found automatically. Link and QR code below.')}
            ${row('06', 'Interactive app', 'Guests, drag-and-drop seating, budget, checklist and real vendors near you. Works on any phone, tablet or computer.')}
            <div style="margin-top:.1in"><a class="btn" href="${esc(cfg.appUrl)}">Open the app →</a> <span class="note" style="margin-left:.08in">Tip: add it to your home screen.</span></div>
          </div>
          ${sec('Using the digital planner')}
          <p class="copy">On an iPad: download the PDF, tap Share → GoodNotes (or your app) → Import as new document. On Android: open it in Noteshelf, Xodo or Samsung Notes. Use your app’s <b style="font-weight:400">read-only / link mode</b> (in GoodNotes, the pen-free mode) to tap tabs and links.</p>
        </div>
        <div class="col">
          ${sec('Printing')}
          <p class="copy">Choose “Actual size” or “100%” in your print settings. US Letter in North America, A4 everywhere else. 100–120 gsm paper works well for the planner; use a 3-ring or disc binder.</p>
          ${sec('The spreadsheet')}
          <p class="copy">Open it in Excel or Numbers, or upload it to Google Drive and choose Open with → Google Sheets. Start with the Budget tab, then the Guest List. The Dashboard fills in by itself. The budget holds sample numbers to show how it works; replace them with your own.</p>
          ${cfg.downloads.spreadsheetCopyLink ? `<div><a class="btn" href="${esc(cfg.downloads.spreadsheetCopyLink)}">Make a Google Sheets copy →</a></div>` : ''}
          ${sec('The vendor directory')}
          <div class="row" style="align-items:center">
            <a href="${esc(cfg.vendorDirectoryUrl)}" style="display:block;width:1.25in;padding:.1in;background:#fff;border:.6pt solid var(--line-strong);flex:none">${qrSvg}</a>
            <div><p class="copy">Scan or tap: it opens on your country, with hand-picked vendors and a live local search for every category. Bookmark it.</p><a class="btn ghost" style="margin-top:.08in" href="${esc(cfg.vendorDirectoryUrl)}">Open the directory</a></div>
          </div>
        </div>
      </div>
    </div>${foot(1)}`);

  const p2 = page(`${head('Edit in Canva', 'Your Invitation <em>Links</em>')}
    <div class="body">
      <p class="copy none">Tap a link, sign in to Canva (a free account is fine) and choose <b style="font-weight:400">Use template</b>. Canva makes your own copy, so the original stays untouched. Change the text, colors and photos, then download as <b style="font-weight:400">PDF Print</b> for printing or PNG for sharing.</p>
      <div class="row grow">
        ${Object.entries(inv.STYLES).map(([sk, sn]) => `<div class="box" style="flex:1">
          <div class="label accent">${sn}</div>
          ${Object.entries(inv.ITEMS).map(([ik, it]) => `<a href="${esc(cfg.canva[sk][ik])}" style="display:flex;justify-content:space-between;font-size:8.2pt;padding:.075in 0;border-bottom:.5pt solid var(--line)"><span>${it.name}</span><span style="color:var(--accent);font-size:6.4pt;letter-spacing:.18em;text-transform:uppercase">Open →</span></a>`).join('')}
          <p class="note" style="margin-top:.1in">Sizes: invitations 5×7 in, RSVP 3.5×5 in, details 4.25×5.5 in, menu 4×9 in, table number 4×6 in, place card 3.5×2 in, sign 18×24 in.</p>
        </div>`).join('')}
      </div>
      <div class="row none">
        <div class="box wash grow">
          <div class="label">Terms of use</div>
          <p class="note">For your personal use for your own wedding. You may print as many copies as you need and share your finished invitations with your guests. Please don’t share, resell or redistribute the planner files, templates or links. All sales are final because the files are digital, but if anything isn’t working, write to us and we will make it right.</p>
        </div>
        <div class="box grow">
          <div class="label">Need help?</div>
          <p class="copy">${esc(cfg.supportEmail)}</p>
          <p class="note" style="margin-top:.06in">If you love your planner, a review on Etsy helps our small shop more than you know.</p>
          <div style="margin-top:.1in"><a class="btn ghost" href="${esc(cfg.shopUrl)}">Visit the shop</a></div>
        </div>
      </div>
    </div>${foot(2)}`);

  return {
    css: ':root{--pw:8.5in;--ph:11in;--sw:8.5in} @page{size:8.5in 11in;margin:0}',
    html: p1 + p2,
  };
};
