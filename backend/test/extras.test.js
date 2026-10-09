import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.PUSH_MODE = 'mock';
process.env.OTP_COOLDOWN_SEC = '0';
const { app } = await import('../src/app.js');
const { pushOutbox } = await import('../src/push.js');

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
const future = () => new Date(Date.now() + 86400e3).toISOString();
const TOK = (n) => `ExponentPushToken[${n}]`;

test('OTP signup + login, wrong codes, admin blocked', async () => {
  const cats = (await call('GET', '/categories')).body;
  const r1 = await call('POST', '/auth/otp/request', { phone: '9100000001' });
  assert.equal(r1.body.isNewUser, true);
  assert.match(r1.body.devOtp, /^\d{6}$/);
  // wrong code
  assert.equal((await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: '000000' })).status, r1.body.devOtp === '000000' ? 200 : 400);
  // right code but new user → profile needed, code not consumed
  const need = await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: r1.body.devOtp });
  assert.equal(need.body.needsProfile, true);
  const reg = await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: r1.body.devOtp, name: 'Otp User', role: 'worker', categoryId: cats[0].id });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.pendingApproval, true);
  // code is single-use
  assert.equal((await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: r1.body.devOtp })).status, 400);
  // returning login
  const r2 = await call('POST', '/auth/otp/request', { phone: '9100000001' });
  assert.equal(r2.body.isNewUser, false);
  const login = await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: r2.body.devOtp });
  assert.equal(login.body.user.name, 'Otp User');
  // brute force: 5 wrong attempts lock the code
  const r3 = await call('POST', '/auth/otp/request', { phone: '9100000001' });
  const wrong = r3.body.devOtp === '111111' ? '222222' : '111111';
  for (let i = 0; i < 5; i++) await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: wrong });
  assert.equal((await call('POST', '/auth/otp/verify', { phone: '9100000001', otp: r3.body.devOtp })).status, 400);
  // admin cannot use OTP
  assert.equal((await call('POST', '/auth/otp/request', { phone: '9999999999' })).status, 403);
});

test('push notifications reach the right people; settlements ledger balances', async () => {
  const cats = (await call('GET', '/categories')).body;
  const cat = cats.find((c) => c.name === 'AC Service');
  const svc = (await call('GET', `/services?categoryId=${cat.id}`)).body[0];
  const admin = (await call('POST', '/auth/login', { phone: '9999999999', password: 'admin123' })).body.token;
  const cust = (await call('POST', '/auth/register', { name: 'C', phone: '9100000011', password: 'secret1' })).body;
  const w = (await call('POST', '/auth/register', { name: 'W', phone: '9100000012', password: 'secret1', role: 'worker', categoryId: cat.id })).body;
  await call('PUT', `/admin/workers/${w.user.id}/approval`, { approved: true }, admin);
  await call('PUT', '/worker/availability', { available: true, lat: 1, lng: 1 }, w.token);

  assert.equal((await call('PUT', '/auth/push-token', { token: 'garbage' }, cust.token)).status, 400);
  await call('PUT', '/auth/push-token', { token: TOK('cust') }, cust.token);
  await call('PUT', '/auth/push-token', { token: TOK('work') }, w.token);

  pushOutbox.length = 0;
  const book = async (method) => (await call('POST', '/bookings', { serviceId: svc.id, address: 'A', lat: 1, lng: 1, scheduledAt: future(), paymentMethod: method }, cust.token)).body;
  const cash = await book('cash');
  assert.deepEqual(pushOutbox.map((m) => m.to), [TOK('work')], 'worker pushed on new request');
  pushOutbox.length = 0;
  await call('POST', `/worker/offers/${cash.id}/accept`, null, w.token);
  assert.deepEqual(pushOutbox.map((m) => m.to), [TOK('cust')], 'customer pushed on accept');
  pushOutbox.length = 0;
  await call('POST', `/bookings/${cash.id}/messages`, { body: 'hello' }, cust.token);
  assert.deepEqual(pushOutbox.map((m) => m.to), [TOK('work')], 'chat pushes the other party only');
  for (let i = 0; i < 3; i++) await call('POST', `/worker/jobs/${cash.id}/advance`, null, w.token);

  // online job, paid
  const online = await book('online');
  await call('POST', `/worker/offers/${online.id}/accept`, null, w.token);
  const order = (await call('POST', '/payments/order', { bookingId: online.id }, cust.token)).body;
  const mp = (await call('POST', '/payments/mock-pay', { orderId: order.orderId }, cust.token)).body;
  await call('POST', '/payments/verify', mp, cust.token);
  for (let i = 0; i < 3; i++) await call('POST', `/worker/jobs/${online.id}/advance`, null, w.token);

  const share = svc.price - Math.round(svc.price * 0.2);
  const comm = Math.round(svc.price * 0.2);
  let bal = (await call('GET', '/worker/balance', null, w.token)).body;
  assert.equal(bal.balance, share - comm);

  const pay = (kind, amount) => call('POST', `/admin/workers/${w.user.id}/settlements`, { kind, amount, reference: 'UPI-1' }, admin);
  assert.equal((await pay('payout', bal.balance + 1)).status, 409, 'cannot overpay');
  assert.equal((await pay('remittance', 1)).status, 409, 'worker owes nothing');
  assert.equal((await pay('payout', bal.balance)).status, 201);
  bal = (await call('GET', '/worker/balance', null, w.token)).body;
  assert.equal(bal.balance, 0);
  assert.equal(bal.history.length, 1);
  assert.equal((await call('GET', '/admin/settlements', null, cust.token)).status, 403);

  // cash-only job leaves the worker owing commission; remittance clears it
  const c2 = await book('cash');
  await call('POST', `/worker/offers/${c2.id}/accept`, null, w.token);
  for (let i = 0; i < 3; i++) await call('POST', `/worker/jobs/${c2.id}/advance`, null, w.token);
  bal = (await call('GET', '/worker/balance', null, w.token)).body;
  assert.equal(bal.balance, -comm);
  assert.equal((await pay('remittance', comm)).status, 201);
  assert.equal((await call('GET', '/worker/balance', null, w.token)).body.balance, 0);
});
