const express = require('express'), path = require('path'), fs = require('fs'), crypto = require('crypto');
const DB = require('./db');
const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, '..', 'public');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
DB.load();

/* ---------- security headers ---------- */
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  });
  next();
});

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sanitizeHtml = h => String(h || '')
  .replace(/<\s*(script|style|iframe|object|embed|link|meta|form)[\s\S]*?(<\/\s*\1\s*>|$)/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*/gi, '$1=$2#');
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const buckets = new Map();
function limit(key, max, ms) {
  const now = Date.now(); const b = (buckets.get(key) || []).filter(t => now - t < ms);
  if (b.length >= max) { buckets.set(key, b); return false; }
  b.push(now); buckets.set(key, b); return true;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of buckets) if (!v.some(t => now - t < 3600e3)) buckets.delete(k); }, 600e3).unref();

/* ---------- auth (signed cookie) ---------- */
const b64 = b => Buffer.from(b).toString('base64url');
const sign = p => crypto.createHmac('sha256', DB.db.secret).update(p).digest('base64url');
function makeToken() { const p = b64(JSON.stringify({ exp: Date.now() + 12 * 3600e3 })); return p + '.' + sign(p); }
function validToken(t) {
  if (!t) return false; const [p, s] = t.split('.'); if (!p || !s) return false;
  const good = sign(p); if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).exp > Date.now(); } catch (e) { return false; }
}
const cookie = (req, n) => ((req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(n + '=')) || '').slice(n.length + 1);
const requireAdmin = (req, res, next) => validToken(cookie(req, 'bz_admin')) ? next() : res.status(401).json({ error: 'Not signed in' });

/* ---------- input cleaning ---------- */
const S = (v, max = 500) => String(v == null ? '' : v).trim().slice(0, max);
const N = v => { const n = Number(v); return isFinite(n) ? n : 0; };
/* lead-source tracking: normalise whatever the browser reports into a short, tidy platform name */
const PLAT = { instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', google: 'Google', youtube: 'YouTube', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', twitter: 'X', x: 'X', tiktok: 'TikTok', pinterest: 'Pinterest', email: 'Email', tripadvisor: 'TripAdvisor', bing: 'Bing', direct: 'Direct', blog: 'Blog' };
const plat = v => { const t = S(v, 40); if (!t) return 'Direct'; return PLAT[t.toLowerCase()] || t.replace(/[^\w .&-]/g, '').slice(0, 30) || 'Other'; };
const attrOf = b => { const a = (b && typeof b.attr === 'object' && b.attr) || {}; return { platform: plat(a.platform), medium: S(a.medium, 30).replace(/[^\w .-]/g, ''), campaign: S(a.campaign, 60).replace(/[^\w .-]/g, ''), referrer: S(a.referrer, 80).replace(/[^\w.-]/g, ''), landing: S(a.landing, 120) }; };
const B = v => v === true || v === 'true' || v === 1;
const A = (v, max = 300) => (Array.isArray(v) ? v : String(v || '').split('\n')).map(x => S(x, max)).filter(Boolean).slice(0, 100);
function clean(schema, input) {
  const o = {};
  for (const [k, t] of Object.entries(schema)) {
    if (!(k in input)) continue; const v = input[k];
    if (t === 's') o[k] = S(v); else if (t === 'l') o[k] = S(v, 5000); else if (t === 'h') o[k] = sanitizeHtml(S(v, 100000)); else if (t === 'n') o[k] = N(v);
    else if (t === 'b') o[k] = B(v); else if (t === 'a') o[k] = A(v);
    else if (typeof t === 'object' && Array.isArray(t)) o[k] = (Array.isArray(v) ? v : []).slice(0, 60).map(x => clean(t[0], x || {}));
  }
  return o;
}
const SCHEMAS = {
  packages: { slug: 's', name: 's', category: 's', nights: 'n', days: 'n', price: 'n', singleSupplement: 'n', stay: 's', summary: 'l', intro: 'l', image: 's', poster: 's', imageHasTitle: 'b', highlights: 'a', itinerary: [{ title: 's', meta: 's', desc: 'l' }], inclusions: 'a', exclusions: 'a', ideal: 'a', faqs: [{ q: 's', a: 'l' }], flightIncluded: 'b', featured: 'b', active: 'b', order: 'n' },
  departures: { packageId: 's', date: 's', fromCity: 's', seats: 'n', booked: 'n', priceOverride: 'n', status: 's', airline: 's', flightNo: 's', route: 's', depTime: 's', arrTime: 's', notes: 'l' },
  faqs: { q: 's', a: 'l', order: 'n', active: 'b' },
  testimonials: { name: 's', place: 's', text: 'l', rating: 'n', active: 'b' },
  posts: { slug: 's', title: 's', excerpt: 'l', body: 'h', image: 's', date: 's', published: 'b' },
  pages: { slug: 's', title: 's', html: 'h', published: 'b' }
};
const SLUGGED = { packages: 'name', posts: 'title', pages: 'title' };
const SETTINGS = {
  brand: 's', tagline: 's', heroTitle: 's', heroSub: 'l', whatsapp: 's', phone: 's', emails: 'a', address: 'l', hours: 's', siteUrl: 's', logo: 's', favicon: 's', ogImage: 's', heroImages: 'a', documents: 'a',
  sdfINR: 'n', gstPct: 'n', gstIncluded: 'b', showPrices: 'b', advanceInfo: 'l',
  payment: { upiId: 's', accountName: 's', bank: 's', accountNo: 's', ifsc: 's', note: 'l' },
  announcement: { enabled: 'b', text: 's' },
  social: { instagram: 's', facebook: 's', youtube: 's', tripadvisor: 's', trustpilot: 's', linkedin: 's', pinterest: 's', blog: 's' },
  seo: { title: 's', description: 'l' }
};
function cleanSettings(input, schema = SETTINGS) {
  const o = {};
  for (const [k, t] of Object.entries(schema)) {
    if (!(k in input)) continue;
    o[k] = (t && typeof t === 'object' && !Array.isArray(t)) ? cleanSettings(input[k] || {}, t) : clean({ [k]: t }, input)[k];
  }
  if (o.whatsapp) o.whatsapp = o.whatsapp.replace(/\D/g, '');
  return o;
}
const dateOk = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s));

/* ---------- public data ---------- */
const today = () => new Date().toISOString().slice(0, 10);
function publicData() {
  const d = DB.db, t = today();
  return {
    settings: d.settings,
    packages: d.packages.filter(p => p.active).sort((a, b) => a.order - b.order),
    departures: d.departures.filter(x => x.date >= t && x.status !== 'cancelled').sort((a, b) => a.date < b.date ? -1 : 1),
    faqs: d.faqs.filter(f => f.active).sort((a, b) => a.order - b.order),
    testimonials: d.testimonials.filter(x => x.active),
    posts: d.posts.filter(p => p.published).sort((a, b) => a.date < b.date ? 1 : -1).map(({ body, ...r }) => r),
    pages: d.pages.filter(p => p.published).map(({ html, ...r }) => r)
  };
}
app.get('/api/site', (req, res) => res.set('Cache-Control', 'no-cache').json(publicData()));
app.get('/api/post/:slug', (req, res) => { const p = DB.db.posts.find(x => x.slug === req.params.slug && x.published); p ? res.json(p) : res.status(404).json({ error: 'Not found' }); });
app.get('/api/page/:slug', (req, res) => { const p = DB.db.pages.find(x => x.slug === req.params.slug && x.published); p ? res.json(p) : res.status(404).json({ error: 'Not found' }); });

/* ---------- enquiries ---------- */
app.post('/api/enquiries', express.json({ limit: '20kb' }), (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  if (!limit('enq:' + req.ip, 5, 10 * 60e3)) return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes or message us on WhatsApp.' });
  const name = S(b.name, 100), phone = S(b.phone, 30).replace(/[^\d+\s-]/g, ''), email = S(b.email, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (phone.replace(/\D/g, '').length < 8) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const e = {
    id: DB.uid(), createdAt: new Date().toISOString(), name, phone, email,
    packageId: S(b.packageId, 60), departureId: S(b.departureId, 60), travelMonth: S(b.travelMonth, 20),
    adults: Math.min(50, Math.max(1, N(b.adults) || 1)), children: Math.min(50, Math.max(0, N(b.children))),
    message: S(b.message, 1500), source: S(b.source, 60), ...attrOf(b), status: 'new', notes: ''
  };
  DB.db.enquiries.unshift(e); DB.save();
  if (process.env.NOTIFY_WEBHOOK_URL) { // optional: forward new leads to Zapier / Slack / Make
    fetch(process.env.NOTIFY_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: `New enquiry from ${e.name} (${e.phone})`, enquiry: e }) }).catch(() => {});
  }
  res.json({ ok: true, ref: e.id.slice(0, 6).toUpperCase() });
});

/* WhatsApp / call taps, tagged with the visitor's platform (so leads that go straight to WhatsApp are counted too) */
app.post('/api/events', express.json({ limit: '4kb' }), (req, res) => {
  const b = req.body || {};
  if (!limit('ev:' + req.ip, 60, 10 * 60e3)) return res.status(429).json({ ok: false });
  if (!['whatsapp', 'call'].includes(b.type)) return res.status(400).json({ ok: false });
  const a = attrOf(b), ev = DB.db.events = DB.db.events || [];
  ev.unshift({ t: new Date().toISOString(), type: b.type, ...a, page: S(b.page, 120) });
  if (ev.length > 5000) ev.length = 5000;
  DB.save(); res.json({ ok: true });
});

/* ---------- admin auth ---------- */
app.post('/api/admin/login', express.json({ limit: '2kb' }), (req, res) => {
  if (!limit('login:' + req.ip, 8, 15 * 60e3)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const pw = S(req.body && req.body.password, 200);
  if (!pw || !DB.checkPassword(pw, DB.db.admin)) return res.status(401).json({ error: 'Incorrect password.' });
  const secure = req.secure ? '; Secure' : '';
  res.set('Set-Cookie', `bz_admin=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${12 * 3600}${secure}`);
  res.json({ ok: true, mustChange: !!DB.db.admin.mustChange });
});
app.post('/api/admin/logout', (req, res) => { res.set('Set-Cookie', 'bz_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/me', (req, res) => res.json({ signedIn: validToken(cookie(req, 'bz_admin')), mustChange: !!DB.db.admin.mustChange }));

const admin = express.Router();
admin.use(requireAdmin);
admin.use((req, res, next) => { // CSRF defence in depth: state-changing requests must come from our own origin
  if (req.method !== 'GET') { const o = req.headers.origin; if (o && new URL(o).host !== req.headers.host) return res.status(403).json({ error: 'Bad origin' }); }
  next();
});
admin.post('/password', express.json({ limit: '2kb' }), (req, res) => {
  const { current, next } = req.body || {};
  if (!DB.checkPassword(S(current, 200), DB.db.admin)) return res.status(400).json({ error: 'Current password is incorrect.' });
  if (S(next, 200).length < 10) return res.status(400).json({ error: 'New password must be at least 10 characters.' });
  DB.db.admin = { ...DB.hashPassword(next), mustChange: false };
  DB.db.secret = crypto.randomBytes(32).toString('hex'); // invalidates all existing sessions
  DB.save();
  res.set('Set-Cookie', `bz_admin=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${12 * 3600}`);
  res.json({ ok: true });
});
admin.get('/stats', (req, res) => {
  const d = DB.db, t = today(), up = d.departures.filter(x => x.date >= t && x.status !== 'cancelled').sort((a, b) => a.date < b.date ? -1 : 1);
  const byStatus = {}; d.enquiries.forEach(e => byStatus[e.status] = (byStatus[e.status] || 0) + 1);
  const week = Date.now() - 7 * 864e5;
  res.json({
    enquiries: d.enquiries.length, byStatus, last7: d.enquiries.filter(e => new Date(e.createdAt) > week).length,
    upcoming: up.slice(0, 8), upcomingCount: up.length,
    unpriced: d.packages.filter(p => p.active && !(p.price > 0)).length,
    mustChange: !!d.admin.mustChange, recent: d.enquiries.slice(0, 6),
    sources: (() => { // leads by platform: enquiries (all time + last 30 days) and WhatsApp / call taps (last 30 days)
      const m30 = Date.now() - 30 * 864e5, o = {}, row = k => o[k] = o[k] || { platform: k, enquiries: 0, enq30: 0, whatsapp: 0, calls: 0 };
      d.enquiries.forEach(e => { const r = row(e.platform || 'Direct'); r.enquiries++; if (new Date(e.createdAt) > m30) r.enq30++; });
      (d.events || []).filter(v => new Date(v.t) > m30).forEach(v => { const r = row(v.platform || 'Direct'); v.type === 'call' ? r.calls++ : r.whatsapp++; });
      return Object.values(o).sort((a, b) => (b.enq30 + b.whatsapp + b.calls) - (a.enq30 + a.whatsapp + a.calls) || b.enquiries - a.enquiries);
    })()
  });
});
admin.get('/settings', (req, res) => res.json(DB.db.settings));
admin.put('/settings', express.json({ limit: '200kb' }), (req, res) => {
  const s = cleanSettings(req.body || {}), cur = DB.db.settings;
  for (const k of Object.keys(s)) cur[k] = (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) ? { ...cur[k], ...s[k] } : s[k];
  DB.save(); res.json(cur);
});

/* enquiries */
admin.get('/enquiries', (req, res) => res.json(DB.db.enquiries));
admin.patch('/enquiries/:id', express.json({ limit: '10kb' }), (req, res) => {
  const e = DB.db.enquiries.find(x => x.id === req.params.id); if (!e) return res.status(404).json({ error: 'Not found' });
  if (['new', 'contacted', 'quoted', 'booked', 'lost'].includes(req.body.status)) e.status = req.body.status;
  if ('notes' in req.body) e.notes = S(req.body.notes, 3000);
  DB.save(); res.json(e);
});
admin.delete('/enquiries/:id', (req, res) => { DB.db.enquiries = DB.db.enquiries.filter(x => x.id !== req.params.id); DB.save(); res.json({ ok: true }); });
admin.get('/enquiries.csv', (req, res) => {
  const cell = v => { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  const pk = Object.fromEntries(DB.db.packages.map(p => [p.id, p.name + ' ' + p.nights + 'N/' + p.days + 'D']));
  const rows = [['Date', 'Name', 'Phone', 'Email', 'Package', 'Travel month', 'Adults', 'Children', 'Status', 'Message', 'Notes', 'Platform', 'Medium', 'Campaign', 'Referrer', 'Landing page']];
  DB.db.enquiries.forEach(e => rows.push([e.createdAt, e.name, e.phone, e.email, pk[e.packageId] || '', e.travelMonth, e.adults, e.children, e.status, e.message, e.notes, e.platform || 'Direct', e.medium, e.campaign, e.referrer, e.landing]));
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="enquiries.csv"' }).send(rows.map(r => r.map(cell).join(',')).join('\n'));
});

/* backup / restore / upload */
admin.get('/backup', (req, res) => res.set({ 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="bhutanz-backup.json"' }).send(JSON.stringify({ ...DB.db, admin: undefined, secret: undefined }, null, 1)));
admin.post('/restore', express.json({ limit: '10mb' }), (req, res) => {
  const j = req.body; if (!j || !Array.isArray(j.packages) || !Array.isArray(j.departures) || !j.settings) return res.status(400).json({ error: 'Not a valid backup file.' });
  DB.replace({ ...j, admin: DB.db.admin, secret: DB.db.secret }); res.json({ ok: true });
});
const MAGIC = [[[0x89, 0x50, 0x4e, 0x47], 'png'], [[0xff, 0xd8, 0xff], 'jpg'], [[0x52, 0x49, 0x46, 0x46], 'webp'], [[0x47, 0x49, 0x46, 0x38], 'gif']];
admin.post('/upload', express.raw({ type: () => true, limit: '5mb' }), (req, res) => {
  const buf = req.body; if (!Buffer.isBuffer(buf) || buf.length < 100) return res.status(400).json({ error: 'No image received.' });
  const m = MAGIC.find(([sig]) => sig.every((b, i) => buf[i] === b)); if (!m) return res.status(400).json({ error: 'Only PNG, JPG, WEBP or GIF images are allowed.' });
  const name = crypto.randomBytes(8).toString('hex') + '.' + m[1];
  fs.writeFileSync(path.join(DB.DIR, 'uploads', name), buf); res.json({ url: '/uploads/' + name });
});

/* generic collections */
admin.get('/:c', (req, res, next) => SCHEMAS[req.params.c] ? res.json(DB.db[req.params.c]) : next());
admin.post('/:c', express.json({ limit: '1mb' }), (req, res, next) => {
  const c = req.params.c, sc = SCHEMAS[c]; if (!sc) return next();
  const o = clean(sc, req.body || {}); const key = SLUGGED[c];
  if (key) { o.slug = slugify(o.slug || o[key] || '') || DB.uid(); if (DB.db[c].some(x => x.slug === o.slug)) o.slug += '-' + DB.uid().slice(0, 3); o.id = c === 'packages' ? o.slug : (c === 'pages' ? 'pg-' + o.slug : DB.uid()); }
  else o.id = DB.uid();
  if (c === 'departures' && !dateOk(o.date)) return res.status(400).json({ error: 'Valid date required.' });
  if (c === 'packages') { o.active = o.active !== false; o.priceConfirmed = o.price > 0; o.order = o.order || DB.db.packages.length; }
  DB.db[c].push(o); DB.save(); res.json(o);
});
admin.put('/:c/:id', express.json({ limit: '1mb' }), (req, res, next) => {
  const c = req.params.c, sc = SCHEMAS[c]; if (!sc) return next();
  const o = DB.db[c].find(x => x.id === req.params.id); if (!o) return res.status(404).json({ error: 'Not found' });
  const upd = clean(sc, req.body || {});
  if (upd.slug !== undefined) { upd.slug = slugify(upd.slug) || o.slug; if (DB.db[c].some(x => x.slug === upd.slug && x.id !== o.id)) return res.status(400).json({ error: 'That URL slug is already used.' }); }
  if (c === 'departures' && upd.date !== undefined && !dateOk(upd.date)) return res.status(400).json({ error: 'Valid date required.' });
  if (c === 'packages' && upd.price !== undefined && upd.price !== o.price) upd.priceConfirmed = true;
  Object.assign(o, upd); DB.save(); res.json(o);
});
admin.delete('/:c/:id', (req, res, next) => {
  const c = req.params.c; if (!SCHEMAS[c]) return next();
  DB.db[c] = DB.db[c].filter(x => x.id !== req.params.id); DB.save(); res.json({ ok: true });
});
app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- static + SEO-aware HTML shell ---------- */
app.use('/uploads', express.static(path.join(DB.DIR, 'uploads'), { maxAge: '7d', setHeaders: r => r.set('Content-Security-Policy', "default-src 'none'") }));
app.use('/admin', express.static(path.join(PUB, 'admin')));
app.use(express.static(PUB, { index: false, maxAge: '1h' }));

const shell = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
const baseUrl = req => (DB.db.settings.siteUrl || (req.protocol + '://' + req.get('host'))).replace(/\/$/, '');
function meta(req) {
  const d = DB.db, s = d.settings, base = baseUrl(req), p = req.path.replace(/\/$/, '') || '/';
  let title = s.seo.title, desc = s.seo.description, status = 200, ld = null, img = s.ogImage || s.logo || '';
  let m;
  if ((m = p.match(/^\/package\/([\w-]+)$/))) {
    const k = d.packages.find(x => x.slug === m[1] && x.active);
    if (k) {
      title = `${k.name} ${k.nights} Nights / ${k.days} Days — Bhutan Tour Package | ${s.brand}`; desc = k.summary; img = k.poster || k.image || img;
      ld = { '@context': 'https://schema.org', '@type': 'TouristTrip', name: `${k.name} ${k.nights}N/${k.days}D`, description: k.summary, touristType: 'Leisure', provider: { '@type': 'TravelAgency', name: s.brand }, ...(k.price > 0 && s.showPrices ? { offers: { '@type': 'Offer', priceCurrency: 'INR', price: k.price, url: base + req.path } } : {}) };
    } else status = 404;
  } else if ((m = p.match(/^\/blog\/([\w-]+)$/))) {
    const k = d.posts.find(x => x.slug === m[1] && x.published); if (k) { title = k.title + ' | ' + s.brand; desc = k.excerpt; img = k.image || img; } else status = 404;
  } else if ((m = p.match(/^\/page\/([\w-]+)$/))) {
    const k = d.pages.find(x => x.slug === m[1] && x.published); if (k) title = k.title + ' | ' + s.brand; else status = 404;
  } else if (p === '/packages') title = 'Bhutan Tour Packages | ' + s.brand;
  else if (p === '/departures') title = 'Bhutan Fixed Departures from Mumbai | ' + s.brand;
  else if (p === '/contact') title = 'Contact & Enquiry | ' + s.brand;
  else if (p === '/faq') title = 'Bhutan Travel FAQ | ' + s.brand;
  else if (p === '/blog') title = 'Bhutan Travel Journal | ' + s.brand;
  else if (p === '/how-to-book') title = 'How to Book & Pay | ' + s.brand;
  else if (p !== '/') status = 404;
  if (!ld && p === '/') ld = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: s.brand, url: base, telephone: s.phone, email: s.emails[0], address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'IN' }, sameAs: Object.values(s.social).filter(Boolean) };
  const tags = `<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(base + (p === '/' ? '/' : p))}">` +
    `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">${img ? `<meta property="og:image" content="${esc(/^https?:/.test(img) ? img : base + img)}">` : ''}` +
    (ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : '') + (status === 404 ? '<meta name="robots" content="noindex">' : '');
  return { tags, status };
}
app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl(req)}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const d = DB.db, b = baseUrl(req);
  const urls = ['/', '/packages', '/departures', '/faq', '/blog', '/contact', '/how-to-book', ...d.packages.filter(p => p.active).map(p => '/package/' + p.slug), ...d.posts.filter(p => p.published).map(p => '/blog/' + p.slug), ...d.pages.filter(p => p.published).map(p => '/page/' + p.slug)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${esc(b + u)}</loc></url>`).join('')}</urlset>`);
});
app.get('*', (req, res) => { const m = meta(req); res.status(m.status).type('html').set('Cache-Control', 'no-cache').send(shell.replace('<!--META-->', m.tags)); });

app.use((err, req, res, next) => { console.error(err.message); res.status(err.status || 500).json({ error: err.status === 413 ? 'File too large' : 'Server error' }); });
app.listen(PORT, () => {
  console.log(`La Bhutanz Tours running on http://localhost:${PORT}`);
  if (DB.db.admin.mustChange) console.log('Admin panel: /admin  (default password: bhutanz@2026 — you will be asked to change it)');
});
