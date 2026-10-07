// End-to-end test. Usage: BASE=http://localhost:3100 ADMIN_EMAIL=.. ADMIN_PASSWORD=.. node scripts/e2e.mjs
// Needs playwright (npm i -D playwright) and a running server on a throwaway DATA_DIR.
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3100', EMAIL = process.env.ADMIN_EMAIL, PW = process.env.ADMIN_PASSWORD;
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('/tmp/e2e.png', png);
const b = await chromium.launch({ executablePath: exe });
const mk = async () => { const c = await b.newContext(); const p = await c.newPage(); p.on('dialog', (d) => d.accept()); p.on('pageerror', (e) => ok(false, 'JS error ' + e.message)); return p; };
const p = await mk();
const go = async (u) => { const r = await p.goto(BASE + u); return r.status(); };
const login = async (pg, e, pw) => { await pg.goto(BASE + '/admin/login'); await pg.fill('#email', e); await pg.fill('#password', pw); await pg.click('button.btn'); await pg.waitForLoadState('networkidle'); };

// public pages
for (const u of ['/', '/tours', '/tours/bhutan-classic-6n7d', '/destinations', '/destinations/paro', '/flights', '/blog', '/blog/bhutan-packing-list', '/faq', '/about', '/plan', '/sitemap.xml', '/robots.txt']) ok((await go(u)) === 200, 'GET ' + u);
ok((await go('/tours/nope')) === 404, '404 for unknown tour');
ok((await go('/tours/bhutan-wellness-retreat-4n5d')) === 404, 'draft tour hidden');
await go('/tours/bhutan-classic-6n7d');
ok((await p.title()).includes('Bhutan 6N/7D'), 'tour has own SEO title');
ok(await p.locator('script[type="application/ld+json"]').count() >= 2, 'JSON-LD present');
ok(/canonical/.test(await p.content()), 'canonical link present');
await go('/tours'); await p.selectOption('#budget', 'h'); await p.click('form.filters button.btn'); await p.waitForLoadState();
ok((await p.locator('.card .price').count()) === 1, 'budget filter works (1 tour >= 70k)');

// auth
await go('/admin'); ok(p.url().includes('/admin/login'), 'unauthenticated /admin redirects to login');
await login(p, EMAIL, 'wrong-password'); ok(/Wrong email or password/.test(await p.textContent('body')), 'bad login rejected');
await login(p, EMAIL, PW); ok(p.url().endsWith('/admin'), 'owner login works');

// tour edit: price + date override + image
await go('/admin/tours'); await p.click('a:has-text("Bhutan Classic")'); await p.waitForLoadState();
await p.fill('#price', '51000');
await p.fill('#dates', '2027-06-01 | 4 | 55000\n2027-07-01 | 0');
await p.setInputFiles('#image', '/tmp/e2e.png');
await p.click('button:has-text("Save tour")'); await p.waitForLoadState('networkidle');
ok(/Tour saved/.test(await p.textContent('body')), 'tour saved');
await go('/tours/bhutan-classic-6n7d'); const t = await p.textContent('main');
ok(t.includes('51,000'), 'new price live on tour page'); ok(t.includes('55,000') && t.includes('4 seats left'), 'date-specific price and seats shown'); ok(t.includes('Sold out'), 'sold-out date shown');
ok((await p.locator('img[src^="/uploads/"]').count()) === 1, 'uploaded image displayed');
const src = await p.getAttribute('img[src^="/uploads/"]', 'src'); ok((await p.request.get(BASE + src)).status() === 200, 'uploaded image served');
// validation
await go('/admin/tours/new'); await p.fill('#name', 'Bad'); await p.fill('#price', '0'); await p.fill('#itinerary', 'x'); await p.evaluate(() => (document.querySelector('form:has(#itinerary)').noValidate = true)); await p.click('button:has-text("Save tour")'); await p.waitForURL(/error=/);
ok(/Price must be/.test(await p.textContent('body')), 'price validation');
// new tour
await go('/admin/tours/new'); await p.fill('#name', 'Test Trek Alpha'); await p.fill('#price', '9999'); await p.fill('#route', 'Bumthang'); await p.fill('#itinerary', 'Arrive: Land\nWalk: Hike'); await p.selectOption('#status', 'live'); await p.click('button:has-text("Save tour")'); await p.waitForLoadState('networkidle');
ok(/Tour saved/.test(await p.textContent('body')), 'new tour created');
ok((await go('/tours/test-trek-alpha')) === 200, 'new tour page live'); ok((await (await p.request.get(BASE + '/sitemap.xml')).text()).includes('test-trek-alpha'), 'new tour in sitemap');
await go('/admin/tours'); await p.click('tr:has-text("Test Trek Alpha") button:has-text("live")'); await p.waitForLoadState('networkidle'); ok((await go('/tours/test-trek-alpha')) === 404, 'draft toggle hides tour');
await go('/admin/tours'); await p.click('tr:has-text("Test Trek Alpha") button:has-text("Delete")'); await p.waitForLoadState('networkidle'); ok(!(await p.textContent('main')).includes('Test Trek Alpha'), 'owner can delete tour');

// flights
await go('/admin/flights'); await p.fill('details:first-of-type #route', 'Chennai > Paro'); await p.fill('details:first-of-type #flight_no', 'ZZ 9'); await p.fill('details:first-of-type #price', '23456'); await p.click('details:first-of-type button.btn'); await p.waitForLoadState('networkidle');
await go('/flights'); ok((await p.textContent('main')).includes('Chennai > Paro') && (await p.textContent('main')).includes('23,456'), 'new flight on public page');

// enquiry from the public form (intercept the WhatsApp redirect)
const pub = await mk(); let wa = '';
await pub.route(/wa\.me/, (r) => { wa = r.request().url(); r.fulfill({ status: 200, body: 'wa' }); });
await pub.goto(BASE + '/plan'); await pub.fill('#name', 'E2E Traveller'); await pub.fill('#phone', '+91 98765 43210'); await pub.fill('#when', 'March'); await pub.click('button.btn.wa'); await pub.waitForLoadState('networkidle');
ok(wa.includes('wa.me/919999999999') && wa.includes('E2E%20Traveller'), 'enquiry redirects to WhatsApp prefilled');
await go('/admin/enquiries'); ok((await p.textContent('main')).includes('E2E Traveller'), 'enquiry saved in admin');
await p.selectOption('tr:has-text("E2E Traveller") select', 'booked'); await p.click('tr:has-text("E2E Traveller") button:has-text("Save")'); await p.waitForLoadState('networkidle'); ok(await p.locator('tr:has-text("E2E Traveller") select').inputValue() === 'booked', 'enquiry status updated');

// blog + review + seo + settings
await go('/admin/posts'); await p.click('details:first-of-type summary'); await p.fill('details:first-of-type #title', 'E2E Post'); await p.selectOption('details:first-of-type #status', 'live'); await p.fill('details:first-of-type #body', 'Hello world'); await p.click('details:first-of-type button.btn'); await p.waitForLoadState('networkidle');
ok((await go('/blog/e2e-post')) === 200, 'blog post live');
await go('/admin/reviews'); await p.click('details:first-of-type summary'); await p.fill('details:first-of-type #name', 'E2E Reviewer'); await p.fill('details:first-of-type #text', 'Great trip e2e'); await p.click('details:first-of-type button.btn'); await p.waitForLoadState('networkidle');
await go('/'); ok((await p.textContent('main')).includes('Great trip e2e'), 'review on home page');
await go('/admin/seo'); await p.fill('#t_home', 'E2E Home Title'); await p.click('button:has-text("Save SEO")'); await p.waitForLoadState('networkidle'); await go('/'); ok((await p.title()) === 'E2E Home Title', 'SEO title applied');
await go('/admin/settings'); await p.fill('#wa', '911234567890'); await p.fill('#phone', '+91 11111 11111'); await p.click('button:has-text("Save settings")'); await p.waitForLoadState('networkidle');
await go('/'); ok((await p.getAttribute('a.float', 'href')).includes('911234567890'), 'WhatsApp number updated site-wide'); ok((await p.textContent('footer')).includes('11111 11111'), 'footer phone updated');

// users and roles
await go('/admin/users'); await p.fill('#name', 'Staffer'); await p.fill('form:has(#role) #email', 'staff@test.com'); await p.fill('form:has(#role) #password', 'Staff12345'); await p.click('button:has-text("Create user")'); await p.waitForLoadState('networkidle');
ok((await p.textContent('main')).includes('staff@test.com'), 'staff user created');
const sp = await mk(); await login(sp, 'staff@test.com', 'Staff12345'); ok(sp.url().endsWith('/admin'), 'staff login');
await sp.goto(BASE + '/admin/tours'); ok((await sp.locator('button:has-text("Delete")').count()) === 0, 'staff sees no delete buttons');
await sp.goto(BASE + '/admin/users'); ok(!sp.url().endsWith('/admin/users') && /Owner access required/.test(await sp.textContent('body')), 'staff blocked from users page');
await sp.goto(BASE + '/admin/settings'); ok(!sp.url().includes('/settings'), 'staff blocked from settings');
await sp.goto(BASE + '/admin/tours'); await sp.click('a:has-text("Bhutan Classic")'); await sp.fill('#price', '52000'); await sp.click('button:has-text("Save tour")'); await sp.waitForLoadState('networkidle'); ok(/Tour saved/.test(await sp.textContent('body')), 'staff can edit prices');
// logout
await sp.click('button:has-text("Log out")'); await sp.waitForURL(/\/admin\/login/); await sp.goto(BASE + '/admin'); ok(sp.url().includes('/login'), 'logout works');
// forged cookie
const fc = await mk(); await fc.context().addCookies([{ name: 'bz_session', value: 'eyJ1aWQiOjEsImV4cCI6OTk5OTk5OTk5OTk5OX0.forged', url: BASE }]); await fc.goto(BASE + '/admin'); ok(fc.url().includes('/login'), 'forged session cookie rejected');
// password change
await go('/admin/account'); await p.fill('#current', PW); await p.fill('#new', 'NewPass12345'); await p.click('button:has-text("Update password")'); await p.waitForLoadState('networkidle'); ok(/Password updated/.test(await p.textContent('body')), 'password changed');
const np = await mk(); await login(np, EMAIL, 'NewPass12345'); ok(np.url().endsWith('/admin'), 'login with new password');
await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
