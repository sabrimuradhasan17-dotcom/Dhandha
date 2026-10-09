import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
const { app } = await import('../src/app.js');

let server, base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
after(() => server.close());

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};
const reg = (o) => call('POST', '/auth/register', o);
const future = () => new Date(Date.now() + 86400e3).toISOString();

test('booking → auto-assign → job lifecycle → online payment → rating', async () => {
  const cats = (await call('GET', '/categories')).body;
  const plumbing = cats.find((c) => c.name === 'Plumbing');
  const svc = (await call('GET', `/services?categoryId=${plumbing.id}`)).body[0];

  const admin = (await call('POST', '/auth/login', { phone: '9999999999', password: 'admin123' })).body.token;
  const cust = (await reg({ name: 'Cust', phone: '9000000001', password: 'secret1' })).body.token;
  const near = await reg({ name: 'Near', phone: '9000000002', password: 'secret1', role: 'worker', categoryId: plumbing.id });
  const far = await reg({ name: 'Far', phone: '9000000003', password: 'secret1', role: 'worker', categoryId: plumbing.id });

  // unapproved worker cannot go online
  assert.equal((await call('PUT', '/worker/availability', { available: true, lat: 1, lng: 1 }, near.body.token)).status, 403);
  for (const w of [near, far]) await call('PUT', `/admin/workers/${w.body.user.id}/approval`, { approved: true }, admin);
  await call('PUT', '/worker/availability', { available: true, lat: 28.61, lng: 77.2 }, near.body.token);
  await call('PUT', '/worker/availability', { available: true, lat: 19.07, lng: 72.87 }, far.body.token);

  const b = await call('POST', '/bookings', { serviceId: svc.id, address: 'Delhi', lat: 28.6, lng: 77.21, scheduledAt: future(), paymentMethod: 'online' }, cust);
  assert.equal(b.status, 201);
  assert.equal(b.body.status, 'searching');
  assert.equal(b.body.commission, Math.round(svc.price * 0.2));

  // both workers are offered (fanout 3 > 2); first to accept wins
  assert.equal((await call('GET', '/worker/offers', null, near.body.token)).body.length, 1);
  assert.equal((await call('POST', `/worker/offers/${b.body.id}/accept`, null, near.body.token)).status, 200);
  assert.equal((await call('POST', `/worker/offers/${b.body.id}/accept`, null, far.body.token)).status, 409);
  assert.equal((await call('GET', '/worker/offers', null, far.body.token)).body.length, 0);

  const adv = (t) => call('POST', `/worker/jobs/${b.body.id}/advance`, null, t);
  assert.equal((await adv(near.body.token)).body.status, 'on_the_way');
  assert.equal((await adv(near.body.token)).body.status, 'in_progress');
  assert.equal((await adv(near.body.token)).status, 409, 'cannot complete before online payment');

  const order = (await call('POST', '/payments/order', { bookingId: b.body.id }, cust)).body;
  assert.equal((await call('POST', '/payments/verify', { orderId: order.orderId, paymentId: 'x', signature: 'bad' }, cust)).status, 400);
  const mp = (await call('POST', '/payments/mock-pay', { orderId: order.orderId }, cust)).body;
  assert.equal((await call('POST', '/payments/verify', mp, cust)).status, 200);

  assert.equal((await adv(near.body.token)).body.status, 'completed');
  const rated = await call('POST', `/bookings/${b.body.id}/rating`, { rating: 5, comment: 'great' }, cust);
  assert.equal(rated.body.rating, 5);

  const earn = (await call('GET', '/worker/earnings', null, near.body.token)).body;
  assert.equal(earn.earned, svc.price - Math.round(svc.price * 0.2));
  const stats = (await call('GET', '/admin/stats', null, admin)).body;
  assert.equal(stats.revenue, b.body.commission);
});

test('cash booking settles on completion; unassigned when no workers; cancel + authz', async () => {
  const cats = (await call('GET', '/categories')).body;
  const salon = cats.find((c) => c.name === 'Salon at Home');
  const svc = (await call('GET', `/services?categoryId=${salon.id}`)).body[0];
  const cust = (await reg({ name: 'C2', phone: '9000000011', password: 'secret1' })).body.token;
  const other = (await reg({ name: 'C3', phone: '9000000012', password: 'secret1' })).body.token;

  const b = (await call('POST', '/bookings', { serviceId: svc.id, address: 'X', lat: 1, lng: 1, scheduledAt: future(), paymentMethod: 'cash' }, cust)).body;
  assert.equal(b.status, 'unassigned');
  assert.equal((await call('GET', `/bookings/${b.id}`, null, other)).status, 404);
  assert.equal((await call('POST', '/payments/order', { bookingId: b.id }, cust)).status, 409);
  assert.equal((await call('POST', `/bookings/${b.id}/cancel`, null, cust)).body.status, 'cancelled');
  assert.equal((await call('GET', '/admin/stats', null, cust)).status, 403);
  assert.equal((await call('POST', '/bookings', { serviceId: svc.id, address: 'X', lat: 1, lng: 1, scheduledAt: '2000-01-01', paymentMethod: 'cash' }, cust)).status, 400);
});

test('decline widens dispatch to next nearest worker', async () => {
  const cats = (await call('GET', '/categories')).body;
  const el = cats.find((c) => c.name === 'Electrician');
  const svc = (await call('GET', `/services?categoryId=${el.id}`)).body[0];
  const admin = (await call('POST', '/auth/login', { phone: '9999999999', password: 'admin123' })).body.token;
  const cust = (await reg({ name: 'C4', phone: '9000000021', password: 'secret1' })).body.token;
  const ws = [];
  for (let i = 0; i < 4; i++) {
    const w = await reg({ name: `E${i}`, phone: `90000001${i}0`, password: 'secret1', role: 'worker', categoryId: el.id });
    await call('PUT', `/admin/workers/${w.body.user.id}/approval`, { approved: true }, admin);
    await call('PUT', '/worker/availability', { available: true, lat: 10 + i * 0.01, lng: 10 }, w.body.token);
    ws.push(w.body);
  }
  const b = (await call('POST', '/bookings', { serviceId: svc.id, address: 'X', lat: 10, lng: 10, scheduledAt: future(), paymentMethod: 'cash' }, cust)).body;
  for (const w of ws.slice(0, 3)) await call('POST', `/worker/offers/${b.id}/decline`, null, w.token);
  assert.equal((await call('GET', '/worker/offers', null, ws[3].token)).body.length, 1);
  await call('POST', `/worker/offers/${b.id}/accept`, null, ws[3].token);
  const adv = () => call('POST', `/worker/jobs/${b.id}/advance`, null, ws[3].token);
  await adv(); await adv();
  const done = (await adv()).body;
  assert.equal(done.status, 'completed');
  assert.equal(done.payment_status, 'paid');
});

test('customer can browse, contact and book a specific worker; others are not offered', async () => {
  const cats = (await call('GET', '/categories')).body;
  const ac = cats.find((c) => c.name === 'AC Service');
  const svc = (await call('GET', `/services?categoryId=${ac.id}`)).body[0];
  const admin = (await call('POST', '/auth/login', { phone: '9999999999', password: 'admin123' })).body.token;
  const cust = (await reg({ name: 'C5', phone: '9000000031', password: 'secret1' })).body.token;
  const [a, b] = [];
  const mk = async (n, phone) => {
    const w = await reg({ name: n, phone, password: 'secret1', role: 'worker', categoryId: ac.id });
    await call('PUT', `/admin/workers/${w.body.user.id}/approval`, { approved: true }, admin);
    await call('PUT', '/worker/availability', { available: true, lat: 5, lng: 5 }, w.body.token);
    return w.body;
  };
  const w1 = await mk('Pick', '9000000032'), w2 = await mk('Other', '9000000033');
  await call('PUT', '/worker/profile', { bio: '10 yrs AC expert', experienceYears: 10 }, w1.token);

  const list = (await call('GET', `/workers?categoryId=${ac.id}`, null, cust)).body;
  const pick = list.find((w) => w.id === w1.user.id);
  assert.equal(pick.phone, '9000000032');
  assert.equal(pick.experience_years, 10);

  const bk = await call('POST', '/bookings', { serviceId: svc.id, workerId: w1.user.id, address: 'X', lat: 5, lng: 5, scheduledAt: future(), paymentMethod: 'cash' }, cust);
  assert.equal(bk.status, 201);
  assert.equal((await call('GET', '/worker/offers', null, w1.token)).body.length, 1);
  assert.equal((await call('GET', '/worker/offers', null, w2.token)).body.length, 0);
  // declining a chosen-worker request must NOT fan out to others
  await call('POST', `/worker/offers/${bk.body.id}/decline`, null, w1.token);
  assert.equal((await call('GET', '/worker/offers', null, w2.token)).body.length, 0);
  assert.equal((await call('GET', `/bookings/${bk.body.id}`, null, cust)).body.status, 'unassigned');

  const bad = await call('POST', '/bookings', { serviceId: svc.id, workerId: 1, address: 'X', lat: 5, lng: 5, scheduledAt: future(), paymentMethod: 'cash' }, cust);
  assert.equal(bad.status, 400);
});

test('SMS on new request, booking chat, and offer timeout', async () => {
  const { outbox } = await import('../src/sms.js');
  const { sweepExpiredOffers } = await import('../src/dispatch.js');
  const cats = (await call('GET', '/categories')).body;
  const cl = cats.find((c) => c.name === 'Home Cleaning');
  const svc = (await call('GET', `/services?categoryId=${cl.id}`)).body[0];
  const admin = (await call('POST', '/auth/login', { phone: '9999999999', password: 'admin123' })).body.token;
  const cust = (await reg({ name: 'C6', phone: '9000000041', password: 'secret1' })).body;
  const stranger = (await reg({ name: 'C7', phone: '9000000042', password: 'secret1' })).body.token;
  const mk = async (n, phone, lat) => {
    const w = await reg({ name: n, phone, password: 'secret1', role: 'worker', categoryId: cl.id });
    await call('PUT', `/admin/workers/${w.body.user.id}/approval`, { approved: true }, admin);
    await call('PUT', '/worker/availability', { available: true, lat, lng: 50 }, w.body.token);
    return w.body;
  };
  const w1 = await mk('N1', '9000000043', 50), w2 = await mk('N2', '9000000044', 50.5);
  const book = (extra) => call('POST', '/bookings', { serviceId: svc.id, address: 'MG Road', lat: 50, lng: 50, scheduledAt: future(), paymentMethod: 'cash', ...extra }, cust.token);

  // SMS goes to every offered worker
  outbox.length = 0;
  const b = (await book({})).body;
  await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(outbox.map((m) => m.to).sort(), ['9000000043', '9000000044']);
  assert.match(outbox[0].body, /new .* request/);

  // chat: customer and requested/assigned worker only
  assert.equal((await call('GET', `/bookings/${b.id}/messages`, null, stranger)).status, 404);
  assert.equal((await call('POST', `/bookings/${b.id}/messages`, { body: '  ' }, cust.token)).status, 400);
  await call('POST', `/worker/offers/${b.id}/accept`, null, w1.token);
  assert.equal((await call('POST', `/bookings/${b.id}/messages`, { body: 'Please bring a ladder' }, w1.token)).status, 201);
  assert.equal((await call('POST', `/bookings/${b.id}/messages`, { body: 'Sure' }, cust.token)).status, 201);
  assert.equal((await call('GET', `/bookings/${b.id}/messages`, null, w2.token)).status, 404);
  const msgs = (await call('GET', `/bookings/${b.id}/messages`, null, cust.token)).body;
  assert.deepEqual(msgs.map((m) => m.body), ['Please bring a ladder', 'Sure']);
  assert.equal((await call('GET', `/bookings/${b.id}/messages?after=${msgs[0].id}`, null, cust.token)).body.length, 1);

  // direct request to w2 pre-acceptance: w2 can already chat
  const d = (await book({ workerId: w2.user.id })).body;
  assert.equal((await call('POST', `/bookings/${d.id}/messages`, { body: 'Hi, are you free?' }, w2.token)).status, 201);
  assert.equal((await call('GET', '/worker/offers', null, w2.token)).body[0].direct, 1);

  // timeout: unanswered offer expires, direct request becomes unassigned, open one widens
  assert.deepEqual(sweepExpiredOffers(), [], 'fresh offers survive');
  assert.ok(sweepExpiredOffers(-1).includes(d.id));
  assert.equal((await call('GET', `/bookings/${d.id}`, null, cust.token)).body.status, 'unassigned');
});
