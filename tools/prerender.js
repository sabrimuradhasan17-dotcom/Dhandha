#!/usr/bin/env node
// Bakes a static snapshot of the rendered page into a stand-alone HTML file, so it still shows content in
// viewers that block scripts. With scripts enabled, the page re-renders itself exactly as before.
//   node tools/prerender.js <file.html>      (needs Playwright + Chromium: PLAYWRIGHT_PATH, default /opt/node22/lib/node_modules)
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2] || ''); if (!fs.existsSync(file)) { console.error('usage: prerender.js <file.html>'); process.exit(1); }
const { chromium } = require(require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules'] }));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto('file://' + file); await p.waitForSelector('#app .hero, #app section', { timeout: 20000 }); await p.waitForTimeout(3500);
  // let every reveal fire so the snapshot shows the finished state
  await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
  await p.waitForTimeout(800);
  const parts = await p.evaluate(() => Object.fromEntries(['banner', 'hdr', 'app', 'ftr', 'mbar', 'fab'].map(id => [id, document.getElementById(id).innerHTML])));
  await b.close();
  let html = fs.readFileSync(file, 'utf8');
  const put = (re, inner) => { if (!re.test(html)) throw new Error('slot missing: ' + re); html = html.replace(re, (m, a, old, z) => a + inner + z); };
  put(/(<div id="banner">)([\s\S]*?)(<\/div><div class="wrap"><div class="nav-in" id="hdr">)/, parts.banner);
  put(/(<div class="nav-in" id="hdr">)([\s\S]*?)(<\/div><\/div><\/div>\s*<main)/, parts.hdr);
  put(/(<main id="app" tabindex="-1">)([\s\S]*?)(<\/main>)/, parts.app);
  put(/(<footer id="ftr">)([\s\S]*?)(<\/footer>)/, parts.ftr);
  put(/(<div id="mbar">)([\s\S]*?)(<\/div>\s*<div id="fab">)/, parts.mbar);
  put(/(<div id="fab">)([\s\S]*?)(<\/div>\s*<div id="modal">)/, parts.fab);
  fs.writeFileSync(file, html); console.log('snapshot baked into', path.basename(file), (html.length / 1048576).toFixed(1) + ' MB');
})().catch(e => { console.error(e.message); process.exit(1); });
