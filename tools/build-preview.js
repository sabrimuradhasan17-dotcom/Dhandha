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
  packages: seed.packages.filter(p => p.active).sort((a, b) => a.order - b.order),
  departures: [], faqs: seed.faqs.filter(f => f.active).sort((a, b) => a.order - b.order), testimonials: [],
  posts: seed.posts.filter(p => p.published).map(({ body, ...r }) => r), pages: seed.pages.map(({ html, ...r }) => r)
});
const posts = Object.fromEntries(seed.posts.map(p => [p.slug, p])), pages = Object.fromEntries(seed.pages.map(p => [p.slug, p]));
const data = JSON.stringify({ site, posts, pages }).replace(/<\//g, '<\\/');

let css = fs.readFileSync(path.join(root, 'public/css/site.css'), 'utf8');
css = css.split('url(/fonts/').join('url(fonts/');

let js = fs.readFileSync(path.join(root, 'public/js/site.js'), 'utf8');
const must = (a, b) => { if (!js.includes(a)) throw new Error('patch target missing: ' + a.slice(0, 50)); js = js.split(a).join(b); };
js = js.replace(/history\.replaceState\([^;]*\);/, "__route = __P() + (u.toString() ? '?' + u : '');");
must('function go(url) { history.pushState(null, \'\', url); render(); }', "function go(url) { __route = url.split('#')[0]; render(); }");
must("window.addEventListener('popstate', () => render());", '');
must("if (location.hash && $(location.hash)) $(location.hash).scrollIntoView(); else window.scrollTo({ top: 0, behavior: 'instant' });", "window.scrollTo({ top: 0, behavior: 'instant' });");
must('has reached our team', 'would reach our team (preview only: nothing was sent or saved)');
js = js.split("'/img/photos/'").join("'img/photos/'");
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
    if (u === '/api/enquiries') return json({ ok: true, ref: 'PREVIEW' });
    return json({ error: 'Not available in preview' }, 404);
  };
})();
`;
const html = `<title>La Bhutanz Tours</title>
<style>${css}
.pv{position:relative;z-index:120;background:#1d1512;color:#f1e6d8;font:500 12px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:7px 16px}
.pv a{color:#e5bd4a}</style>
<script>document.documentElement.className='js'</script>
<div class="pre" id="pre" aria-hidden="true"><div class="pre-in"><img src="img/logo.png" alt=""><span>La Bhutanz</span><i></i></div></div>
<div class="prog" id="prog"></div>
<div class="nav" id="nav"><div class="pv">Preview of the new La Bhutanz Tours website. Enquiries are not saved in this preview.${adminUrl ? ` <a href="${adminUrl}" target="_blank">Try the admin panel demo ↗</a>` : ' The admin panel runs on the live server.'}</div><div id="banner"></div><div class="wrap"><div class="nav-in" id="hdr"></div></div></div>
<main id="app" tabindex="-1"><div class="wrap" style="padding:160px var(--gut) 100px"><p class="lead">Loading…</p></div></main>
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
fs.cpSync(path.join(root, 'public/fonts'), path.join(out, 'fonts'), { recursive: true });
fs.rmSync(path.join(out, 'img/og.jpg'), { force: true });
fs.rmSync(path.join(out, 'img/packages'), { recursive: true, force: true });
console.log('built', out, Math.round(html.length / 1024) + 'KB html');
