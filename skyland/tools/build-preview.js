#!/usr/bin/env node
// Builds a static, self-contained preview of the PUBLIC site (no server needed):
//   node tools/build-preview.js <out-dir> [admin-demo-url]
// The real front end runs unchanged, but /api/* calls are answered from embedded seed data,
// routing is in-memory, and enquiries are NOT stored. Admin runs only on the Node server.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.argv[2], adminUrl = process.argv[3] || '';
if (!out) { console.error('usage: build-preview.js <out-dir>'); process.exit(1); }
const seed = require('../server/seed')();
const rel = v => JSON.parse(JSON.stringify(v).replace(/"\/img\//g, '"img/'));
const site = rel({
  settings: seed.settings,
  destinations: seed.destinations.filter(d => d.active),
  packages: seed.packages.filter(p => p.active).sort((a, b) => a.order - b.order),
  departures: [], faqs: seed.faqs.filter(f => f.active).sort((a, b) => a.order - b.order), testimonials: [],
  posts: seed.posts.filter(p => p.published).map(({ body, ...r }) => r), pages: seed.pages.map(({ html, ...r }) => r)
});
const posts = Object.fromEntries(seed.posts.map(p => [p.slug, p])), pages = Object.fromEntries(seed.pages.map(p => [p.slug, p]));
const credits = rel(require('../server/photo-credits.json'));
const data = JSON.stringify({ site, posts, pages, credits }).replace(/<\//g, '<\\/');

let css = fs.readFileSync(path.join(root, 'public/css/site.css'), 'utf8');
// make the dark palette follow the viewer's explicit theme choice as well as the OS setting
css = css.replace(/@media\(prefers-color-scheme:dark\)\{:root\{([^}]*)\}\}/, (m, vars) =>
  `@media(prefers-color-scheme:dark){:root:not([data-theme=light]){${vars};color-scheme:dark}}:root[data-theme=dark]{${vars};color-scheme:dark}`);

let js = fs.readFileSync(path.join(root, 'public/js/site.js'), 'utf8');
const must = (a, b) => { if (!js.includes(a)) throw new Error('patch target missing: ' + a.slice(0, 50)); js = js.split(a).join(b); };
js = js.replace(/history\.replaceState\([^;]*\);/, "__route = __P() + (u.toString() ? '?' + u : '');");
must('function go(url) { history.pushState(null, \'\', url); render(); }', "function go(url) { __route = url.split('#')[0]; render(); }");
must("window.addEventListener('popstate', render);", '');
must("if (location.hash && $(location.hash)) $(location.hash).scrollIntoView(); else window.scrollTo(0, 0);", 'window.scrollTo(0, 0);');
must('has reached our team', 'would reach our team (preview only: nothing was sent or saved)');
js = js.split('location.pathname').join('__P()').split('location.search').join('__Q()');

const shim = `
let __route = '/'; const __P = () => __route.split('?')[0]; const __Q = () => { const i = __route.indexOf('?'); return i < 0 ? '' : __route.slice(i); };
(function () {
  const PV = ${data};
  const json = (o, st = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json' } }));
  window.fetch = (u, o) => {
    u = String(u); let m;
    if (u === '/api/site') return json(PV.site);
    if ((m = u.match(/^\\/api\\/post\\/(.+)$/))) return PV.posts[decodeURIComponent(m[1])] ? json(PV.posts[decodeURIComponent(m[1])]) : json({ error: 'Not found' }, 404);
    if ((m = u.match(/^\\/api\\/page\\/(.+)$/))) return PV.pages[decodeURIComponent(m[1])] ? json(PV.pages[decodeURIComponent(m[1])]) : json({ error: 'Not found' }, 404);
    if (u === '/api/credits') return json(PV.credits);
    if (u === '/api/enquiries') return json({ ok: true, ref: 'PREVIEW' });
    return json({ error: 'Not available in preview' }, 404);
  };
})();
`;
const html = `<title>Skyland Tours &amp; Travels</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css}
.pv{background:#1d1512;color:#f1e6d8;font:500 12px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:7px 16px}
body{font-size:16px}</style>
<div class="pv">Preview of the new Skyland Tours &amp; Travels website. Enquiries are not saved in this preview.${adminUrl ? ` <a href="${adminUrl}" target="_blank" style="color:#e5bd4a">Try the admin panel demo ↗</a>` : ' The admin panel runs on the live server.'}</div>
<div id="banner"></div>
<header class="nav" id="hdr"></header>
<main id="app" tabindex="-1"><div class="wrap" style="padding:80px 20px">Loading…</div></main>
<footer id="ftr"></footer>
<div id="mbar"></div>
<div id="fab"></div>
<div id="modal"></div>
<script>${shim}</script>
<script>${js}</script>
`;
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.cpSync(path.join(root, 'public/img'), path.join(out, 'img'), { recursive: true });
fs.rmSync(path.join(out, 'img/og.jpg'), { force: true });
console.log('built', out, Math.round(html.length / 1024) + 'KB html');
