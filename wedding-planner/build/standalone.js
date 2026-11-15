// Builds the interactive app as ONE self-contained HTML file (fonts, art and code inlined).
// Buyers keep it forever: it opens by double-click, works offline, and does not depend on your hosting.
const fs = require('fs');
const path = require('path');

module.exports = function buildStandalone(ROOT, outFile) {
  const APP = path.join(ROOT, 'site/app');
  const b64 = (f) => fs.readFileSync(f).toString('base64');
  let css = fs.readFileSync(path.join(APP, 'app.css'), 'utf8')
    .replace(/url\(\.\.\/([^)]+\.ttf)\)/g, (_, f) => `url(data:font/ttf;base64,${b64(path.join(ROOT, 'site', f))})`);
  const art = {};
  for (const f of fs.readdirSync(path.join(APP, 'art'))) {
    if (f.endsWith('-sm.png')) art[f.replace('-sm.png', '')] = `data:image/png;base64,${b64(path.join(APP, 'art', f))}`;
  }
  const js = (f) => fs.readFileSync(f, 'utf8').replace(/<\/script/gi, '<\\/script');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Wedding Planner App</title>
<link rel="icon" href="${art.rose}">
<style>${css}</style>
</head>
<body>
<header class="top">
  <div class="brand"><img src="${art.rose}" alt=""><div><div class="kicker">The Wedding Planner</div><div class="couple" id="couple-line">Your wedding</div></div></div>
  <nav class="tabs" id="tabs" role="tablist"></nav>
</header>
<main id="view"></main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>window.ART_INLINE = ${JSON.stringify(art)};</script>
<script>${js(path.join(APP, 'data.js'))}</script>
<script>${js(path.join(ROOT, 'site/locales.js'))}</script>
<script>${js(path.join(APP, 'messages.js'))}</script>
<script>${js(path.join(APP, 'app.js'))}</script>
</body>
</html>
`;
  fs.writeFileSync(outFile, html);
  return (fs.statSync(outFile).size / 1e6).toFixed(1);
};
