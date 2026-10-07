#!/usr/bin/env node
// Builds a self-contained, clickable DEMO of the admin panel (no server): node tools/build-admin-demo.js <out-dir> [public-preview-url]
// The real admin UI runs unchanged; /api/admin/* is simulated in the page and data lives in the viewer's localStorage.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = process.argv[2], pubUrl = process.argv[3] || '';
if (!out) { console.error('usage: build-admin-demo.js <out-dir> [public-preview-url]'); process.exit(1); }
const srv = fs.readFileSync(path.join(root, 'server/index.js'), 'utf8');
const grab = (from, to) => { const a = srv.indexOf(from), b = srv.indexOf(to, a); if (a < 0 || b < 0) throw new Error('extract failed: ' + from); return srv.slice(a, b); };
const helpers = srv.split('\n').filter(l => /^const (sanitizeHtml|slugify) =/.test(l) || /^  \.replace\(/.test(l) && false).join('\n');
const sanitize = grab('const sanitizeHtml', 'const slugify'), slug = grab('const slugify', 'const buckets');
const cleaning = grab('/* ---------- input cleaning ---------- */', '/* ---------- public data ---------- */');

const seed = require('../server/seed')();
const rel = v => JSON.parse(JSON.stringify(v).replace(/"\/img\//g, '"img/'));
const day = n => new Date(Date.now() + n * 864e5).toISOString();
seed.departures = [
  { id: 'dm1', packageId: 'last-shangri-la-9n10d', date: day(35).slice(0, 10), fromCity: 'Mumbai', seats: 20, booked: 6, priceOverride: 0, status: 'open', airline: 'Drukair', flightNo: '', route: 'Mumbai → Paro → Mumbai', depTime: '', arrTime: '', notes: 'DEMO ROW' },
  { id: 'dm2', packageId: 'thunder-dragon-6n7d', date: day(49).slice(0, 10), fromCity: 'Mumbai', seats: 20, booked: 17, priceOverride: 0, status: 'open', airline: 'Bhutan Airlines', flightNo: '', route: 'Mumbai → Paro → Mumbai', depTime: '', arrTime: '', notes: 'DEMO ROW' },
  { id: 'dm3', packageId: 'fly-5n6d', date: day(70).slice(0, 10), fromCity: 'Mumbai', seats: 12, booked: 0, priceOverride: 0, status: 'open', airline: '', flightNo: '', route: '', depTime: '', arrTime: '', notes: 'DEMO ROW — land package' }
];
seed.enquiries = [
  { id: 'e1', createdAt: day(-0.2), name: 'Priya Shah', phone: '+91 98200 11122', email: 'priya@example.com', packageId: 'fly-5n6d', departureId: '', travelMonth: '2026-12', adults: 2, children: 0, message: 'Honeymoon trip. Can we add a hot stone bath?', source: '/package/fly-5n6d', status: 'new', notes: '' },
  { id: 'e2', createdAt: day(-1.5), name: 'Rohit Mehta', phone: '9987654321', email: '', packageId: 'last-shangri-la-9n10d', departureId: 'dm1', travelMonth: '', adults: 4, children: 1, message: 'Family of 5, vegetarian.', source: '/departures', status: 'contacted', notes: 'Called, sending quote tomorrow.' },
  { id: 'e3', createdAt: day(-4), name: 'Anita Rao', phone: '9876500000', email: 'anita@example.com', packageId: '', departureId: '', travelMonth: '2027-03', adults: 2, children: 0, message: 'Looking for something for senior parents.', source: '/', status: 'quoted', notes: '' }
];
seed.testimonials = []; 
const SEED = JSON.stringify(rel(seed)).replace(/<\//g, '<\\/');

let css = fs.readFileSync(path.join(root, 'public/css/site.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'public/admin/admin.css'), 'utf8');
css = css.replace(/@media\(prefers-color-scheme:dark\)\{:root\{([^}]*)\}\}/, (m, v) => `@media(prefers-color-scheme:dark){:root:not([data-theme=light]){${v};color-scheme:dark}}:root[data-theme=dark]{${v};color-scheme:dark}`);

let js = fs.readFileSync(path.join(root, 'public/admin/admin.js'), 'utf8');
const must = (a, b) => { if (!js.includes(a)) throw new Error('patch target missing: ' + a.slice(0, 60)); js = js.split(a).join(b); };
must(`<p class="note" style="margin-top:14px"><a href="/">← Back to website</a></p>`, `<p class="note" style="margin-top:14px"><b>Demo:</b> password is <code>bhutanz@2026</code>. Data is simulated and stays in this browser only.${pubUrl ? ` <a href="${pubUrl}" target="_blank">Open the website preview ↗</a>` : ''}</p>`);
// the hosted viewer can block typing into password fields, so the demo needs no typing: prefilled value + one-click button
must(`<input id="pw" type="password" autocomplete="current-password" autofocus>`, `<input id="pw" type="text" value="bhutanz@2026" autocomplete="off" spellcheck="false">`);
must(`<button class="btn btn-primary btn-block" id="go">Sign in</button>`, `<button class="btn btn-primary btn-block" id="go">Enter demo admin</button>`);
must(`$('#go').onclick = go;`, `$('#go').onclick = go; setTimeout(() => { const g = $('#go'); if (g) g.focus(); }, 0);`);
must(`<a href="/" target="_blank">↗ View website</a>`, pubUrl ? `<a href="${pubUrl}" target="_blank">↗ View website preview</a>` : '<span></span>');
must(`<a class="btn btn-ghost btn-sm" href="/api/admin/enquiries.csv">⬇ Export CSV</a>`, `<span class="note">CSV export works on the live server</span>`);
must(`<a class="btn btn-ghost" href="/api/admin/backup">⬇ Download backup</a>`, `<span class="note">Backup download works on the live server.</span>`);
must(`target="_blank" href="/package/`, `target="_blank" href="${pubUrl || '#'}" data-x="/package/`);

const shim = `
window.confirm = () => true; // the hosted viewer blocks confirm(); demo deletes are harmless and resettable
${sanitize}
${slug}
${cleaning}
(function () {
  const KEY = 'bz_admin_demo_v1', SEED = ${SEED}, origFetch = window.fetch.bind(window);
  let DB = null; try { DB = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!DB) DB = SEED;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };
  let signed = false; try { signed = sessionStorage.getItem('bz_demo_in') === '1'; } catch (e) {}
  let must = !DB.passwordChanged, today = () => new Date().toISOString().slice(0, 10);
  const uid = () => Math.random().toString(16).slice(2, 12);
  const R = (o, st = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json' } }));
  const bar = document.createElement('div'); bar.style.cssText = 'background:#1d1512;color:#f1e6d8;font:500 12px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:7px 16px'; bar.innerHTML = 'Admin panel demo. Changes are simulated and stay in this browser. <a href="#" id="pvReset" style="color:#e5bd4a">Reset demo data</a>'; document.body.prepend(bar);
  bar.querySelector('#pvReset').onclick = e => { e.preventDefault(); try { localStorage.removeItem(KEY); sessionStorage.removeItem('bz_demo_in'); } catch (x) {} location.reload(); };
  document.body.classList.add('adm');
  window.fetch = async (u, o = {}) => {
    u = String(u); if (!u.startsWith('/api/')) return origFetch(u, o);
    const m = (o.method || 'GET').toUpperCase(), p = u.replace('/api/admin', '').split('?')[0];
    const body = typeof o.body === 'string' ? JSON.parse(o.body || '{}') : o.body;
    if (p === '/login') { if (body.password === 'bhutanz@2026' || body.password === DB.pw) { signed = true; try { sessionStorage.setItem('bz_demo_in', '1'); } catch (e) {} return R({ ok: true, mustChange: must }); } return R({ error: 'Incorrect password. In this demo use bhutanz@2026.' }, 401); }
    if (p === '/logout') { signed = false; try { sessionStorage.removeItem('bz_demo_in'); } catch (e) {} return R({ ok: true }); }
    if (p === '/me') return R({ signedIn: signed, mustChange: must });
    if (!signed) return R({ error: 'Not signed in' }, 401);
    if (p === '/password') { if (!body.next || body.next.length < 10) return R({ error: 'New password must be at least 10 characters.' }, 400); DB.pw = body.next; DB.passwordChanged = true; must = false; save(); return R({ ok: true }); }
    if (p === '/stats') {
      const t = today(), up = DB.departures.filter(x => x.date >= t && x.status !== 'cancelled').sort((a, b) => a.date < b.date ? -1 : 1), by = {}; DB.enquiries.forEach(e => by[e.status] = (by[e.status] || 0) + 1);
      return R({ enquiries: DB.enquiries.length, byStatus: by, last7: DB.enquiries.filter(e => new Date(e.createdAt) > Date.now() - 7 * 864e5).length, upcoming: up.slice(0, 8), upcomingCount: up.length, unpriced: DB.packages.filter(x => x.active && !(x.price > 0)).length, mustChange: must, recent: DB.enquiries.slice(0, 6) });
    }
    if (p === '/settings') { if (m === 'PUT') { const s = cleanSettings(body || {}); for (const k of Object.keys(s)) DB.settings[k] = (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) ? { ...DB.settings[k], ...s[k] } : s[k]; save(); } return R(DB.settings); }
    if (p === '/upload') { const f = o.body; if (!f || !f.size) return R({ error: 'No image received.' }, 400); if (f.size > 600e3) return R({ error: 'Demo images are limited to 600 KB.' }, 400); const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); }); return R({ url }); }
    if (p === '/restore') return R({ error: 'Restore works on the live server.' }, 400);
    let x;
    if ((x = p.match(/^\\/enquiries\\/(\\w+)$/))) {
      const e = DB.enquiries.find(q => q.id === x[1]); if (!e) return R({ error: 'Not found' }, 404);
      if (m === 'DELETE') { DB.enquiries = DB.enquiries.filter(q => q.id !== e.id); save(); return R({ ok: true }); }
      if (['new', 'contacted', 'quoted', 'booked', 'lost'].includes(body.status)) e.status = body.status; if ('notes' in body) e.notes = S(body.notes, 3000); save(); return R(e);
    }
    if (p === '/enquiries') return R(DB.enquiries);
    if ((x = p.match(/^\\/(\\w+)(?:\\/(\\w[\\w-]*))?$/)) && SCHEMAS[x[1]]) {
      const c = x[1], id = x[2], sc = SCHEMAS[c];
      if (m === 'GET') return R(DB[c]);
      if (m === 'POST') {
        const o = clean(sc, body || {}), key = SLUGGED[c];
        if (key) { o.slug = slugify(o.slug || o[key] || '') || uid(); if (DB[c].some(q => q.slug === o.slug)) o.slug += '-' + uid().slice(0, 3); o.id = c === 'packages' ? o.slug : (c === 'pages' ? 'pg-' + o.slug : uid()); } else o.id = uid();
        if (c === 'departures' && !dateOk(o.date)) return R({ error: 'Valid date required.' }, 400);
        if (c === 'packages') { o.active = o.active !== false; o.priceConfirmed = o.price > 0; o.order = o.order || DB.packages.length; }
        DB[c].push(o); save(); return R(o);
      }
      const o = DB[c].find(q => q.id === id); if (!o) return R({ error: 'Not found' }, 404);
      if (m === 'DELETE') { DB[c] = DB[c].filter(q => q.id !== id); save(); return R({ ok: true }); }
      const upd = clean(sc, body || {});
      if (upd.slug !== undefined) { upd.slug = slugify(upd.slug) || o.slug; if (DB[c].some(q => q.slug === upd.slug && q.id !== o.id)) return R({ error: 'That URL slug is already used.' }, 400); }
      if (c === 'packages' && upd.price !== undefined && upd.price !== o.price) upd.priceConfirmed = true;
      Object.assign(o, upd); save(); return R(o);
    }
    return R({ error: 'Not available in demo' }, 404);
  };
})();
`;
const html = `<title>La Bhutanz Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css}\nbody{font-size:16px}</style>
<div id="root"></div>
<script>${shim}</script>
<script>${js}</script>
`;
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.mkdirSync(path.join(out, 'img'), { recursive: true });
fs.copyFileSync(path.join(root, 'public/img/logo.png'), path.join(out, 'img/logo.png'));
fs.copyFileSync(path.join(root, 'public/img/favicon.png'), path.join(out, 'img/favicon.png'));
console.log('built', out, Math.round(html.length / 1024) + 'KB');
