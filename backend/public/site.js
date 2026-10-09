'use strict';
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const STATUS = {
  searching: 'Finding a professional…', assigned: 'Professional assigned', on_the_way: 'On the way',
  in_progress: 'Service in progress', completed: 'Completed', cancelled: 'Cancelled', unassigned: 'No professional available yet',
};

let token = localStorage.getItem('dh_token');
let me = null;
let timers = [];
let signup = {}; // login flow state

/* ------------------------------- helpers -------------------------------- */
function toast(msg, ms = 3500) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), ms);
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && token) { logout(false); throw new Error('Please log in again'); }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

function poll(fn, ms) {
  fn();
  timers.push(setInterval(fn, ms));
}

const here = () =>
  new Promise((ok, bad) =>
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(
          (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => bad(new Error('Please allow location access so we can match you with a nearby professional')),
          { timeout: 15000 },
        )
      : bad(new Error('Your browser does not support location')),
  );

function setUser(u, t) {
  me = u; token = t;
  localStorage.setItem('dh_token', t);
}
function logout(go = true) {
  token = null; me = null;
  localStorage.removeItem('dh_token');
  if (go) location.hash = '#/';
  renderNav();
}

function renderNav() {
  const links = [];
  if (me?.role === 'customer') links.push(['#/bookings', 'My bookings']);
  if (me?.role === 'worker') links.push(['#/work', 'My jobs']);
  if (me?.role === 'admin') links.push(['/admin.html', 'Admin dashboard']);
  $('#nav').innerHTML =
    `<a class="brand" href="#/">Dhandha</a><a class="link" href="#/">Services</a>` +
    links.map(([h, t]) => `<a class="link" href="${h}">${t}</a>`).join('') +
    (me
      ? `<span class="muted" style="color:#cfd8e6">Hi, ${esc(me.name)}</span><a class="link" href="#" data-act="logout">Log out</a>`
      : `<a class="btn light sm" href="#/login">Log in / Sign up</a>`);
}

const view = (html) => { $('#view').innerHTML = html; window.scrollTo(0, 0); };
const needRole = (role) => {
  if (me?.role === role) return true;
  location.hash = me ? '#/' : '#/login';
  if (me) toast('That page is not available for your account type');
  return false;
};

/* -------------------------------- views --------------------------------- */
async function home() {
  const cats = await api('GET', '/categories');
  view(`
    <section class="hero">
      <h1>Trusted professionals, at your doorstep</h1>
      <p>Plumbers, electricians, cleaners, AC technicians and salon experts. Book in minutes, pay online or in cash.</p>
      ${me?.role === 'worker' ? '<a class="btn light" href="#/work">Go to my jobs</a>' : '<a class="btn light" href="#/login">Get started</a>'}
    </section>
    <h2>What do you need?</h2>
    <div class="grid">${cats.map((c) => `<div class="card click" data-go="#/c/${c.id}"><b>${esc(c.name)}</b><div class="muted">View services →</div></div>`).join('')}</div>
    <h2>How it works</h2>
    <div class="steps">
      <div class="card"><div class="n">1</div><b>Pick a service</b><div class="muted">Choose what you need and a time that suits you.</div></div>
      <div class="card"><div class="n">2</div><b>Choose your professional</b><div class="muted">Let us assign the nearest one, or browse ratings, chat and call before you book.</div></div>
      <div class="card"><div class="n">3</div><b>Pay your way</b><div class="muted">UPI, cards or netbanking online — or cash after the service.</div></div>
    </div>
    <h2>Are you a professional?</h2>
    <div class="card row between"><div><b>Earn more with Dhandha</b><div class="muted">Get job requests from nearby customers by SMS. Set your own availability.</div></div><a class="btn" href="#/login">Join as a professional</a></div>`);
}

async function category(id) {
  const [cats, svcs] = await Promise.all([api('GET', '/categories'), api('GET', `/services?categoryId=${id}`)]);
  const c = cats.find((x) => x.id == id);
  view(`<a href="#/">← All services</a><h2>${esc(c?.name || 'Services')}</h2>
    <div class="grid">${svcs.map((s) => `<div class="card"><b>${esc(s.name)}</b><div class="muted">${esc(s.description)} · ${s.duration_min} min</div>
      <div class="row between" style="margin-top:10px"><span class="total">₹${s.price}</span><a class="btn sm" href="#/book/${s.id}">Book</a></div></div>`).join('')}</div>`);
}

function login() {
  if (me) { location.hash = '#/'; return; }
  const s = signup;
  const step = s.step || 'phone';
  view(`<div class="card narrow">
    <h2 style="margin-top:0">Log in or sign up</h2>
    <form data-form="${step}">
      ${step === 'phone' ? `<label>Mobile number</label><input id="phone" inputmode="numeric" maxlength="10" placeholder="10-digit number" autofocus required>
        <button class="btn" style="width:100%">Send code</button>` : ''}
      ${step === 'code' ? `<p class="muted">Enter the 6-digit code sent to ${esc(s.phone)}</p>
        <label>Code</label><input id="otp" inputmode="numeric" maxlength="6" autofocus required>` : ''}
      ${step === 'profile' ? '<p class="muted">Welcome! Tell us a little about you.</p>' : ''}
      ${step === 'profile' ? `<label>Your name</label><input id="name" required>
        <label>I am a…</label><select id="role"><option value="customer">Customer – I need services</option><option value="worker">Professional – I provide services</option></select>
        <div id="catwrap" hidden><label>My trade</label><select id="cat">${(s.cats || []).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>` : ''}
      ${step !== 'phone' ? `<button class="btn" style="width:100%">${step === 'profile' ? 'Create account' : 'Verify'}</button>
        <p><a href="#" data-act="resetlogin">Change number</a></p>` : ''}
    </form></div>`);
  $('#role')?.addEventListener('change', (e) => ($('#catwrap').hidden = e.target.value !== 'worker'));
}

const SLOT_HOURS = [9, 11, 14, 16, 18];
function slots() {
  const out = [];
  for (let d = 0; d < 3; d++)
    for (const h of SLOT_HOURS) {
      const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0);
      if (t.getTime() > Date.now() + 3600e3) out.push(t);
    }
  return out;
}

async function book(id) {
  if (!needRole('customer')) return;
  const svc = (await api('GET', '/services')).find((s) => s.id == id);
  if (!svc) { location.hash = '#/'; return; }
  const workers = await api('GET', `/workers?categoryId=${svc.category_id}`);
  const sl = slots();
  view(`<a href="#/c/${svc.category_id}">← Back</a>
    <h2>${esc(svc.name)} · ₹${svc.price}</h2>
    <form data-form="book" data-service="${svc.id}" data-price="${svc.price}">
      <div class="card">
        <label>Pick a time</label>
        <div class="slots" id="slots">${sl.map((t, i) => `<div class="slot ${i === 0 ? 'sel' : ''}" data-slot="${t.toISOString()}">${esc(when(t))}</div>`).join('')}</div>
        <label style="display:block;margin-top:14px">Full address</label><textarea id="address" rows="2" required placeholder="House no, street, landmark"></textarea>
        <label>Notes for the professional (optional)</label><input id="notes" maxlength="300">
        <div class="muted">We use your device location to match a nearby professional.</div>
      </div>
      <h2>Professional</h2>
      <div class="opt sel" data-worker=""><b>Auto-assign the nearest available</b><div class="muted">Fastest way to get someone.</div></div>
      ${workers.map((w) => `<div class="opt" data-worker="${w.id}">
        <div class="row between"><b>${esc(w.name)}</b><span>${w.avg_rating ? `★ ${w.avg_rating} (${w.rating_count})` : '<span class="pill">New</span>'}</span></div>
        <div class="muted">${w.experience_years} yrs experience · ${w.jobs} jobs done</div>${w.bio ? `<div>${esc(w.bio)}</div>` : ''}
        <a class="btn ghost sm" style="margin-top:6px" href="tel:${esc(w.phone)}" data-stop>Call ${esc(w.name)}</a></div>`).join('')}
      <div class="muted" id="wnote" hidden>Your request goes only to this professional. If they decline, you can pick another.</div>
      <h2>Payment</h2>
      <div class="row">
        <label class="opt sel" style="flex:1;margin:0"><input type="radio" name="pm" value="online" checked style="width:auto;margin-right:8px">UPI / Card / Netbanking</label>
        <label class="opt" style="flex:1;margin:0"><input type="radio" name="pm" value="cash" style="width:auto;margin-right:8px">Cash after service</label>
      </div>
      <div class="row between" style="margin-top:20px"><span class="total">Total ₹${svc.price}</span><button class="btn" id="bookbtn">Confirm booking</button></div>
    </form>`);
}

async function submitBook(form) {
  const btn = $('#bookbtn');
  btn.disabled = true; btn.textContent = 'Booking…';
  try {
    const loc = await here();
    const workerId = $('.opt.sel[data-worker]')?.dataset.worker;
    const pm = form.querySelector('[name=pm]:checked').value;
    const b = await api('POST', '/bookings', {
      serviceId: +form.dataset.service, address: $('#address').value.trim(), notes: $('#notes').value.trim(), ...loc,
      scheduledAt: $('.slot.sel').dataset.slot, paymentMethod: pm, workerId: workerId ? +workerId : undefined,
    });
    if (pm === 'online') {
      try { await pay(b); toast('Payment successful 🎉'); } catch (e) { toast(`${e.message}. You can pay from My bookings.`, 6000); }
    }
    location.hash = '#/bookings';
  } catch (e) {
    toast(e.message, 6000);
    btn.disabled = false; btn.textContent = 'Confirm booking';
  }
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = ok;
    s.onerror = () => bad(new Error('Could not load the payment window'));
    document.head.append(s);
  });
}

async function pay(b) {
  const o = await api('POST', '/payments/order', { bookingId: b.id });
  if (o.provider === 'mock') { // dev mode: no Razorpay keys configured on the server
    await api('POST', '/payments/verify', await api('POST', '/payments/mock-pay', { orderId: o.orderId }));
    return;
  }
  await loadRazorpay();
  await new Promise((ok, bad) => {
    const rz = new window.Razorpay({
      key: o.keyId, order_id: o.orderId, amount: o.amount * 100, currency: 'INR', name: 'Dhandha', description: b.service_name,
      prefill: { contact: me.phone, name: me.name },
      handler: (r) => api('POST', '/payments/verify', { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }).then(ok, bad),
      modal: { ondismiss: () => bad(new Error('Payment cancelled')) },
    });
    rz.open();
  });
}

let lastBookings = '';
function bookings() {
  if (!needRole('customer')) return;
  view('<h2>My bookings</h2><div id="list"><p class="muted">Loading…</p></div>');
  lastBookings = '';
  poll(async () => {
    try {
      const list = await api('GET', '/bookings');
      const sig = JSON.stringify(list);
      const busy = document.activeElement?.closest?.('#list') && /SELECT|INPUT|TEXTAREA/.test(document.activeElement.tagName);
      if (sig === lastBookings || busy || !$('#list')) return;
      lastBookings = sig;
      $('#list').innerHTML = list.length ? list.map(bookingCard).join('') : '<div class="card muted">No bookings yet. <a href="#/">Book a service</a></div>';
    } catch (e) { /* transient */ }
  }, 8000);
}

function bookingCard(b) {
  const open = !['cancelled', 'completed'].includes(b.status);
  const cls = b.status === 'completed' ? 'ok' : ['cancelled', 'unassigned'].includes(b.status) ? 'bad' : '';
  return `<div class="card" style="margin-bottom:12px">
    <div class="row between"><b>${esc(b.service_name)} · ₹${b.amount}</b><span class="pill ${cls}">${STATUS[b.status]}</span></div>
    <div class="muted">${esc(when(b.scheduled_at))} · ${esc(b.address)}</div>
    ${b.worker_name ? `<div>Professional: <b>${esc(b.worker_name)}</b> · <a href="tel:${esc(b.worker_phone)}">${esc(b.worker_phone)}</a></div>` : ''}
    <div class="muted">${b.payment_method === 'cash' ? 'Cash' : 'Online'} · payment ${b.payment_status}</div>
    <div class="row" style="margin-top:10px">
      ${b.payment_method === 'online' && b.payment_status === 'pending' && b.status !== 'cancelled' ? `<button class="btn sm" data-act="pay" data-id="${b.id}">Pay now</button>` : ''}
      ${(b.worker_id || b.requested_worker_id) && open ? `<a class="btn ghost sm" href="#/chat/${b.id}">Chat</a>` : ''}
      ${b.worker_phone ? `<a class="btn ghost sm" href="tel:${esc(b.worker_phone)}">Call</a>` : ''}
      ${['searching', 'assigned', 'unassigned'].includes(b.status) ? `<button class="btn danger sm" data-act="cancel" data-id="${b.id}">Cancel</button>` : ''}
    </div>
    ${b.status === 'completed' && !b.rating ? `<div class="row" style="margin-top:10px"><select id="r-${b.id}" style="width:auto;margin:0">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select><button class="btn sm" data-act="rate" data-id="${b.id}">Submit rating</button></div>` : ''}
    ${b.rating ? `<div class="muted">You rated ${'★'.repeat(b.rating)}</div>` : ''}</div>`;
}

async function chat(id) {
  if (!me || me.role === 'admin') { location.hash = '#/login'; return; }
  view(`<a href="${me.role === 'worker' ? '#/work' : '#/bookings'}">← Back</a><h2>Chat</h2>
    <div class="chat"><div class="msgs" id="msgs"><p class="muted">No messages yet. Say hello 👋</p></div>
    <form data-form="chat" data-id="${id}"><input id="msg" placeholder="Type a message" maxlength="1000" autocomplete="off" required><button class="btn">Send</button></form></div>`);
  let last = 0;
  poll(async () => {
    try {
      const m = await api('GET', `/bookings/${id}/messages?after=${last}`);
      if (!m.length || !$('#msgs')) return;
      if (!last) $('#msgs').innerHTML = '';
      $('#msgs').insertAdjacentHTML('beforeend', m.map((x) => `<div class="msg ${x.sender_id === me.id ? 'me' : ''}">${esc(x.body)}</div>`).join(''));
      last = m[m.length - 1].id;
      $('#msgs').scrollTop = $('#msgs').scrollHeight;
    } catch (e) { if (e.message.includes('Not found')) { clearTimers(); location.hash = '#/'; } }
  }, 3000);
}

/* ------------------------------ worker portal ---------------------------- */
let lastWork = '';
function work() {
  if (!needRole('worker')) return;
  view('<h2>My jobs</h2><div id="w"><p class="muted">Loading…</p></div>');
  lastWork = '';
  poll(async () => {
    try {
      const [prof, offers, jobs, bal] = await Promise.all([api('GET', '/auth/me'), api('GET', '/worker/offers'), api('GET', '/worker/jobs'), api('GET', '/worker/balance')]);
      const sig = JSON.stringify([prof, offers, jobs, bal]);
      if (sig === lastWork || !$('#w') || document.activeElement?.closest?.('#w') && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      lastWork = sig;
      $('#w').innerHTML = workView(prof.worker, offers, jobs, bal);
    } catch (e) { /* transient */ }
  }, 6000);
}

const NEXT = { assigned: 'Start travel', on_the_way: 'Start service', in_progress: 'Complete job' };
function workView(w, offers, jobs, bal) {
  return `
    ${!w.approved ? '<div class="card" style="border-left:4px solid var(--a)">Your account is awaiting admin approval. You can edit your profile meanwhile.</div>' : ''}
    <div class="card row between" style="margin:12px 0">
      <div><b>${w.available ? '🟢 You are online' : '⚪ You are offline'}</b><div class="muted">Go online to receive job requests near you.</div></div>
      <button class="btn ${w.available ? 'ghost' : ''}" data-act="avail" data-on="${w.available ? 0 : 1}" ${w.approved ? '' : 'disabled'}>${w.available ? 'Go offline' : 'Go online'}</button>
    </div>
    <div class="card" style="margin-bottom:12px"><b>${bal.balance >= 0 ? `Dhandha owes you ₹${bal.balance}` : `You owe Dhandha ₹${-bal.balance}`}</b>
      <div class="muted">Online job earnings ₹${bal.online_share} − cash commission ₹${bal.cash_commission} − paid out ₹${bal.paid_out} + remitted ₹${bal.remitted}</div>
      ${bal.history.slice(0, 5).map((h) => `<div class="muted">${esc(h.created_at.slice(0, 10))} · ${h.kind === 'payout' ? 'Paid to you' : 'You paid'} ₹${h.amount} ${esc(h.reference)}</div>`).join('')}</div>
    <form class="card" data-form="wprofile" style="margin-bottom:12px"><b>Your public profile</b>
      <textarea id="bio" rows="2" maxlength="500" placeholder="About you / skills">${esc(w.bio)}</textarea>
      <input id="yrs" type="number" min="0" max="60" value="${w.experience_years}" placeholder="Years of experience"><button class="btn sm">Save profile</button></form>
    <h2>New job requests</h2>
    ${offers.length ? offers.map((o) => `<div class="card" style="margin-bottom:10px"><b>${esc(o.service_name)} · you earn ₹${o.earning}</b>
      <div class="muted">${esc(when(o.scheduled_at))} · ${o.distance_km ?? '?'} km away</div><div>${esc(o.address)}</div>
      <div class="muted">${o.payment_method === 'cash' ? 'Collect cash from customer' : 'Paid online'}${o.notes ? ' · Note: ' + esc(o.notes) : ''}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="accept" data-id="${o.id}">Accept</button><button class="btn ghost sm" data-act="decline" data-id="${o.id}">Decline</button>
      ${o.direct ? `<a class="btn ghost sm" href="#/chat/${o.id}">Chat with customer</a>` : ''}</div></div>`).join('') : '<p class="muted">None right now. Stay online to receive jobs.</p>'}
    <h2>My jobs</h2>
    ${jobs.length ? jobs.map((b) => `<div class="card" style="margin-bottom:10px"><div class="row between"><b>${esc(b.service_name)} · ₹${b.amount}</b><span class="pill">${STATUS[b.status]}</span></div>
      <div class="muted">${esc(when(b.scheduled_at))} · ${esc(b.customer_name)}</div><div>${esc(b.address)}</div>
      <div class="row" style="margin-top:8px">${NEXT[b.status] ? `<button class="btn sm" data-act="advance" data-id="${b.id}">${NEXT[b.status]}</button>` : ''}
      ${!['cancelled', 'completed'].includes(b.status) ? `<a class="btn ghost sm" href="#/chat/${b.id}">Chat with customer</a>` : ''}</div></div>`).join('') : '<p class="muted">No jobs yet.</p>'}`;
}

/* ------------------------------- actions -------------------------------- */
async function run(btn, fn) {
  if (btn) btn.disabled = true;
  try { await fn(); } catch (e) { toast(e.message, 5000); }
  if (btn?.isConnected) btn.disabled = false;
}

const actions = {
  logout: () => logout(),
  resetlogin: () => { signup = {}; login(); },
  pay: (el) => run(el, async () => { const b = (await api('GET', `/bookings/${el.dataset.id}`)); await pay(b); toast('Payment successful 🎉'); lastBookings = ''; bookings(); }),
  cancel: (el) => confirm('Cancel this booking?') && run(el, async () => { await api('POST', `/bookings/${el.dataset.id}/cancel`); lastBookings = ''; bookings(); }),
  rate: (el) => run(el, async () => { await api('POST', `/bookings/${el.dataset.id}/rating`, { rating: +$(`#r-${el.dataset.id}`).value }); toast('Thanks for rating!'); lastBookings = ''; bookings(); }),
  avail: (el) => run(el, async () => {
    const on = el.dataset.on === '1';
    await api('PUT', '/worker/availability', { available: on, ...(on ? await here() : {}) });
    lastWork = ''; work();
  }),
  accept: (el) => run(el, async () => { await api('POST', `/worker/offers/${el.dataset.id}/accept`); lastWork = ''; work(); }),
  decline: (el) => run(el, async () => { await api('POST', `/worker/offers/${el.dataset.id}/decline`); lastWork = ''; work(); }),
  advance: (el) => run(el, async () => { await api('POST', `/worker/jobs/${el.dataset.id}/advance`); lastWork = ''; work(); }),
};

const forms = {
  async phone(f) {
    const phone = $('#phone').value.trim();
    const r = await api('POST', '/auth/otp/request', { phone });
    if (r.devOtp) toast(`Dev mode: your code is ${r.devOtp}`, 15000); // only when the server has no SMS provider
    signup = { step: 'code', phone, isNew: r.isNewUser, cats: await api('GET', '/categories') };
    login();
  },
  async code(f) {
    const r = await api('POST', '/auth/otp/verify', { phone: signup.phone, otp: $('#otp').value.trim() });
    if (r.needsProfile) { signup.step = 'profile'; signup.otp = $('#otp').value.trim(); return login(); }
    finishLogin(r);
  },
  async profile(f) {
    const role = $('#role').value;
    const r = await api('POST', '/auth/otp/verify', { phone: signup.phone, otp: signup.otp, name: $('#name').value.trim(), role, categoryId: role === 'worker' ? +$('#cat').value : undefined });
    finishLogin(r);
  },
  book: (f) => submitBook(f),
  async chat(f) {
    const input = $('#msg'); const body = input.value.trim();
    if (!body) return;
    input.value = '';
    try { await api('POST', `/bookings/${f.dataset.id}/messages`, { body }); } catch (e) { input.value = body; throw e; }
  },
  wprofile: () => saveProfile(),
};

function finishLogin(r) {
  setUser(r.user, r.token);
  signup = {};
  renderNav();
  if (r.pendingApproval) toast('Registered! An admin must approve your account before you can take jobs.', 7000);
  location.hash = r.user.role === 'worker' ? '#/work' : '#/';
}

document.addEventListener('click', (e) => {
  const stop = e.target.closest('[data-stop]');
  if (stop) return; // let tel: links work without selecting the card
  const act = e.target.closest('[data-act]');
  if (act) { e.preventDefault(); return actions[act.dataset.act]?.(act); }
  const go = e.target.closest('[data-go]');
  if (go) { location.hash = go.dataset.go; return; }
  const slot = e.target.closest('[data-slot]');
  if (slot) { document.querySelectorAll('.slot').forEach((s) => s.classList.remove('sel')); slot.classList.add('sel'); return; }
  const opt = e.target.closest('.opt[data-worker]');
  if (opt) {
    document.querySelectorAll('.opt[data-worker]').forEach((s) => s.classList.remove('sel'));
    opt.classList.add('sel');
    $('#wnote').hidden = !opt.dataset.worker;
    return;
  }
  const pm = e.target.closest('label.opt');
  if (pm) { document.querySelectorAll('label.opt').forEach((s) => s.classList.remove('sel')); pm.classList.add('sel'); }
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  const name = f.dataset.form;
  run(f.querySelector('button'), () => forms[name](f));
});

async function saveProfile() {
  await api('PUT', '/worker/profile', { bio: $('#bio').value, experienceYears: parseInt($('#yrs').value, 10) || 0 });
  toast('Profile saved');
  lastWork = '';
  work();
}

/* -------------------------------- router -------------------------------- */
function clearTimers() { timers.forEach(clearInterval); timers = []; }
const ROUTES = [
  [/^#\/?$/, home], [/^#\/c\/(\d+)$/, category], [/^#\/login$/, login], [/^#\/book\/(\d+)$/, book],
  [/^#\/bookings$/, bookings], [/^#\/chat\/(\d+)$/, chat], [/^#\/work$/, work],
];
async function route() {
  clearTimers();
  const h = location.hash || '#/';
  for (const [re, fn] of ROUTES) {
    const m = h.match(re);
    if (m) {
      try { await fn(...m.slice(1)); } catch (e) { view(`<div class="card">Something went wrong: ${esc(e.message)}. <a href="#/">Go home</a></div>`); }
      return;
    }
  }
  location.hash = '#/';
}
window.addEventListener('hashchange', route);

(async () => {
  if (token) {
    try { me = await api('GET', '/auth/me'); } catch { token = null; }
  }
  renderNav();
  route();
})();
