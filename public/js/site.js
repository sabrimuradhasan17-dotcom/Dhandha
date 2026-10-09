(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const pd = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const fd = s => pd(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fm = s => new Date(s + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const CAT = { fly: 'Fly in · Fly out', drive: 'Drive in · Drive out', special: 'Special interest', fixed: 'Fixed departures' };
  const PH = '/img/photos/';
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.49-8.41Z"/></svg>';
  const root = document.documentElement;
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) root.classList.add('rm');
  const FINE = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  try { history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }
  let D, S, pending = null, rid = 0, firstDone = false;
  const app = $('#app');

  /* ---------- lead-source attribution: which platform did this visitor come from? ---------- */
  const NAMES = { instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', google: 'Google', youtube: 'YouTube', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', twitter: 'X', x: 'X', tiktok: 'TikTok', pinterest: 'Pinterest', email: 'Email', tripadvisor: 'TripAdvisor', bing: 'Bing', qr: 'QR code' };
  const HOSTS = [[/(^|\.)mail\.google\.com$|(^|\.)outlook\.(live|office)\.com$/, 'Email', 'email'], [/(^|\.)(instagram\.com|ig\.me)$/, 'Instagram', 'social'], [/(^|\.)(facebook\.com|fb\.com|fb\.me|fb\.watch|messenger\.com)$/, 'Facebook', 'social'], [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube', 'social'], [/(^|\.)(wa\.me|whatsapp\.com)$/, 'WhatsApp', 'social'], [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X', 'social'], [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn', 'social'], [/(^|\.)pinterest\./, 'Pinterest', 'social'], [/(^|\.)tiktok\.com$/, 'TikTok', 'social'], [/(^|\.)tripadvisor\./, 'TripAdvisor', 'referral'], [/(^|\.)google\./, 'Google', 'organic'], [/(^|\.)bing\.com$/, 'Bing', 'organic'], [/(^|\.)(duckduckgo\.com|yahoo\.com)$/, 'Search', 'organic']];
  function detectAttr() {
    let q; try { q = new URLSearchParams(location.search); } catch (e) { q = new URLSearchParams(''); }
    const g = k => (q.get(k) || '').trim().slice(0, 60);
    let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { /* ignore */ }
    if (ref && ref === location.hostname) ref = '';
    const ua = navigator.userAgent || '', us = g('utm_source').toLowerCase() || g('src').toLowerCase();
    let platform = '', medium = '';
    if (us) { platform = NAMES[us] || us; medium = g('utm_medium') || 'campaign'; }
    else if (g('gclid')) { platform = 'Google'; medium = 'paid'; }
    else if (g('igshid')) { platform = 'Instagram'; medium = 'social'; }
    else if (g('fbclid')) { platform = /Instagram/i.test(ua) || /instagram/.test(ref) ? 'Instagram' : 'Facebook'; medium = 'social'; }
    else if (ref) { const h = HOSTS.find(x => x[0].test(ref)); platform = h ? h[1] : ref; medium = h ? h[2] : 'referral'; }
    else if (/Instagram/i.test(ua)) { platform = 'Instagram'; medium = 'social'; }
    else if (/FBAN|FBAV|FB_IAB/.test(ua)) { platform = 'Facebook'; medium = 'social'; }
    return platform ? { platform, medium, campaign: g('utm_campaign'), referrer: ref, landing: location.pathname } : null;
  }
  const ATTR = (function () {
    const K = 'bz_attr_v1', now = Date.now(); let old = null;
    try { old = JSON.parse(localStorage.getItem(K)); } catch (e) { /* storage blocked */ }
    const cur = detectAttr();
    if (cur) { try { localStorage.setItem(K, JSON.stringify({ ...cur, ts: now })); } catch (e) { /* ignore */ } return cur; }
    if (old && old.platform && now - old.ts < 30 * 864e5) return old;   // returning visitor: remember where they first came from
    return { platform: 'Direct', medium: 'direct', campaign: '', referrer: '', landing: location.pathname };
  })();
  const ping = type => { try { fetch('/api/events', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, attr: ATTR, page: location.pathname }) }).catch(() => {}); } catch (e) { /* ignore */ } };

  /* ---------- data helpers ---------- */
  const wa = t => 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(t + (ATTR.platform !== 'Direct' ? '\n\n(via ' + ATTR.platform + ')' : ''));
  const tel = () => 'tel:' + S.phone.replace(/[^\d+]/g, '');
  const dur = p => p.nights + 'N / ' + p.days + 'D';
  const pkgOf = id => D.packages.find(p => p.id === id);
  const avail = d => Math.max(0, (+d.seats || 0) - (+d.booked || 0));
  function seat(d) {
    const a = avail(d);
    if (d.status === 'closed' || a <= 0) return { c: 'full', t: 'Sold out', sold: true };
    if (a <= 5) return { c: 'few', t: 'Only ' + a + ' left' };
    return { c: 'open', t: a + ' seats' };
  }
  const priceOf = (p, d) => (d && +d.priceOverride > 0) ? +d.priceOverride : +p.price;
  const showPrice = p => S.showPrices && p.price > 0;
  const para = t => String(t || '').split(/\n\n+/).map(x => `<p>${esc(x)}</p>`).join('');
  const pimg = p => p.image || PH + 'tiger.jpg';
  const HELLO = () => 'Hello ' + S.brand + ', I would like guidance for planning a Bhutan journey.';

  /* split text into words for the masked reveal. opts.em italicises the first "key" word */
  function sp(text, o = {}) {
    let i = o.from || 0, used = false;
    return String(text || '').split(/\s+/).filter(Boolean).map(w => {
      let cls = '';
      if (o.em && !used && /^(bhutan|himalaya|journeys?|kingdom|happiness|thunder|dragon|stories|story|answers)/i.test(w)) { cls = ' it'; used = true; }
      return `<span class="w"><span class="wi${cls}" style="--i:${i++}">${esc(w)}</span></span>`;
    }).join(' ');
  }

  /* ---------- cards ---------- */
  function jc(p, i, rv) {
    const price = showPrice(p) ? `<div class="jc-price"><small>From · per guest</small>${inr(p.price)}</div>` : '<span class="jc-meta" style="color:var(--ink3)">Price on request</span>';
    const meta = `${p.nights} Nights · ${p.days} Days`, sub = p.stay || CAT[p.category] || '';
    return `<a class="jc${rv ? ' rv' : ''}" ${rv ? `style="--d:${((i || 0) % 3) * 0.09}s"` : ''} href="/package/${esc(p.slug)}" data-cur="View">
      <div class="jc-img"><img class="lz" src="${esc(pimg(p))}" alt="${esc(p.name)} ${dur(p)} Bhutan tour" loading="lazy" decoding="async" draggable="false"></div>
      <div class="jc-in"><span class="jc-meta">${esc(meta)}${p.category === 'fixed' ? ' · Fixed departure' : ''}</span><h3>${esc(p.name)}</h3><div class="jc-sub">${esc(sub)}</div><div class="jc-row">${price}<span class="jc-go">Discover</span></div></div></a>`;
  }
  const postCard = (p, i) => `<a class="pc rv" style="--d:${((i || 0) % 3) * 0.09}s" href="/blog/${esc(p.slug)}" data-cur="Read"><div class="pc-img imgrv">${p.image ? `<img class="lz" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" decoding="async">` : ''}</div><div><span class="note">${fd(p.date)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div></a>`;
  const acc = (q, a, open) => `<div class="acc${open ? ' open' : ''}"><button type="button" aria-expanded="${!!open}"><span>${esc(q)}</span><i></i></button><div class="acc-b"><div><p>${esc(a)}</p></div></div></div>`;

  function depTable(list, compact) {
    if (!list.length) return D.departures.length ? '<div class="empty">No departures match those filters. Message us for a private departure on your dates.</div>' : `<div class="empty-premium"><span class="eyebrow c">Private departures</span><h3>Your dates. Your pace.</h3><p>Every journey runs privately on the dates that suit you — no fixed group, no compromise. Tell us when you would like to travel and we will confirm flights, hotels and permits.</p><button class="btn btn-gold" data-enq type="button">Request your dates</button></div>`;
    return `<div class="tbl-wrap"><table><thead><tr><th>Departure</th><th>Package</th><th>Flight / route</th><th>Price / person</th><th>Seats</th><th></th></tr></thead><tbody>${list.map(d => {
      const p = pkgOf(d.packageId) || { name: 'Package', nights: '', days: '', price: 0 }, s = seat(d), price = priceOf(p, d);
      const fl = [d.airline, d.flightNo].filter(Boolean).join(' · ');
      return `<tr><td data-l="Departure"><b>${fd(d.date)}</b><br><span class="note">from ${esc(d.fromCity)}</span>${(() => { const n = Math.ceil((pd(d.date) - new Date().setHours(0, 0, 0, 0)) / 864e5); return n >= 0 ? `<span class="cd">${n === 0 ? 'Departs today' : n === 1 ? 'Tomorrow' : 'In ' + n + ' days'}</span>` : ''; })()}</td><td data-l="Package"><a href="/package/${esc(p.slug || '')}"><b>${esc(p.name)}</b></a><br><span class="note">${p.nights ? dur(p) : ''}</span></td>
        <td data-l="Flight / route">${fl ? esc(fl) + '<br>' : ''}<span class="note">${esc(d.route || (p.flightIncluded ? 'Flights included' : 'Land package — join us at Paro'))}${d.depTime ? ' · ' + esc(d.depTime) + (d.arrTime ? ' → ' + esc(d.arrTime) : '') : ''}</span>${d.notes && !compact ? `<br><span class="note">${esc(d.notes)}</span>` : ''}</td>
        <td data-l="Price / person"><b>${S.showPrices && price > 0 ? inr(price) : 'On request'}</b></td><td data-l="Seats"><span class="pill ${s.c}">${s.t}</span><div class="meter ${s.c}" title="${(+d.booked || 0)} of ${(+d.seats || 0)} seats booked"><i style="--w:${Math.min(100, Math.round(100 * (+d.booked || 0) / Math.max(1, +d.seats || 1)))}%"></i></div></td>
        <td>${s.sold ? `<button class="btn btn-line btn-sm noarrow" data-enq data-pkg="${esc(d.packageId)}">Waitlist</button>` : `<button class="btn btn-gold btn-sm noarrow" data-enq data-pkg="${esc(d.packageId)}" data-dep="${esc(d.id)}">Reserve</button>`}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  /* ---------- layout ---------- */
  function layout() {
    const logo = S.logo ? `<img src="${esc(S.logo)}" alt="">` : '';
    $('#hdr').innerHTML = `<a class="logo" href="/" aria-label="${esc(S.brand)} home">${logo}<div><span>La Bhutanz</span><small>TOURS</small></div></a>
      <nav class="menu" id="menu" aria-label="Main"><a href="/packages">Journeys</a><a href="/departures">Departures</a>
        <div class="dd"><button type="button">Plan your trip</button><div class="dd-list"><a href="/page/visa">Visa &amp; permit</a><a href="/faq">FAQ</a><a href="/page/festivals">Festivals</a><a href="/page/about-us">About us</a><a href="/page/about-bhutan">About Bhutan</a><a href="/page/dos-and-donts">Do's &amp; Don'ts</a><a href="/how-to-book">How to book &amp; pay</a></div></div>
        <a href="/blog">Travelogues</a><a href="/contact">Contact</a>
        <button class="btn btn-gold btn-sm" data-enq type="button">Enquire</button></nav>
      <button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><i></i><i></i></button>`;
    if (S.favicon) { const l = $('link[rel=icon]'); if (l) l.href = S.favicon; }
    $('#banner').innerHTML = S.announcement && S.announcement.enabled && S.announcement.text ? `<div class="bn">${esc(S.announcement.text)}</div>` : '';
    const soc = Object.entries(S.social || {}).filter(([, v]) => v).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`).join('');
    $('#ftr').innerHTML = `<div class="wrap"><div class="f-big" aria-hidden="true">Bhutanz</div><div class="fcols">
      <div>${S.logo ? `<img src="${esc(S.logo)}" alt="" style="height:64px;margin-bottom:16px">` : ''}<h4>${esc(S.brand)}</h4><p>${esc(S.tagline)}</p><p>Personalised Bhutan journeys from Mumbai and across India.</p></div>
      <div><h4>Explore</h4><ul><li><a href="/packages">All journeys</a></li><li><a href="/departures">Fixed departures</a></li><li><a href="/blog">Travelogues</a></li><li><a href="/page/about-us">About us</a></li><li><a href="/faq">FAQ</a></li></ul></div>
      <div><h4>Plan</h4><ul><li><a href="/page/visa">Visa &amp; permit guide</a></li><li><a href="/page/festivals">Festivals</a></li><li><a href="/how-to-book">How to book &amp; pay</a></li><li><a href="/page/terms">Terms &amp; cancellation</a></li><li><a href="/page/privacy">Privacy</a></li></ul></div>
      <div><h4>Contact</h4><p>${esc(S.address)}</p><p><a href="${tel()}">${esc(S.phone)}</a><br>${S.emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join('<br>')}</p><p class="note">${esc(S.hours)}</p></div></div>
      <div class="fbot"><div>© ${new Date().getFullYear()} ${esc(S.brand)}. All rights reserved. · <a href="/page/photo-credits">Photo credits</a></div><div class="soc">${soc}</div></div></div>`;
    $('#fab').innerHTML = `<a class="fab" href="${esc(wa(HELLO()))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_ICON}</a>`;
    $('#mbar').innerHTML = `<a href="${tel()}">Call</a><a href="${esc(wa('Hello ' + S.brand))}" target="_blank" rel="noopener">WhatsApp</a><button type="button" data-enq>Enquire</button>`;
    $('#mbar').style.gridTemplateColumns = 'repeat(3,1fr)';
  }
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    root.classList.toggle('lock', open || !!$('.modal-bg'));
    const b = $('#burger'); if (b) { b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  }

  /* ---------- enquiry modal ---------- */
  let lastFocus = null;
  function openEnquiry(o = {}) {
    setMenu(false); lastFocus = document.activeElement;
    const pk = o.pkg || '', pkgOpts = '<option value="">Not sure yet — suggest something</option>' + D.packages.map(p => `<option value="${esc(p.id)}" ${p.id === pk ? 'selected' : ''}>${esc(p.name)} ${dur(p)}</option>`).join('');
    $('#modal').innerHTML = `<div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true" aria-label="Enquiry"><button class="x" data-close type="button" aria-label="Close">×</button>
      <div id="enq-body"><div class="eyebrow">Enquiry</div><h3>Plan your Bhutan journey</h3><p class="note" style="margin-bottom:22px">Tell us a little and our Bhutan specialist will reply on WhatsApp or phone — usually within office hours the same day.</p>
      <form id="enq" class="form-grid" novalidate>
        <div><label for="e-name">Your name *</label><input id="e-name" name="name" autocomplete="name" required></div>
        <div><label for="e-phone">Phone / WhatsApp *</label><input id="e-phone" name="phone" type="tel" autocomplete="tel" required></div>
        <div class="full"><label for="e-email">Email (optional)</label><input id="e-email" name="email" type="email" autocomplete="email"></div>
        <div class="full"><label for="e-pkg">Package</label><select id="e-pkg" name="packageId">${pkgOpts}</select></div>
        <div class="full"><label for="e-dep">Departure</label><select id="e-dep" name="departureId"></select></div>
        <div><label for="e-month">Preferred travel month</label><input id="e-month" name="travelMonth" type="month"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label for="e-ad">Adults</label><input id="e-ad" name="adults" type="number" min="1" value="2"></div><div><label for="e-ch">Children</label><input id="e-ch" name="children" type="number" min="0" value="0"></div></div>
        <div class="full"><label for="e-msg">Anything else? (interests, budget, occasion)</label><textarea id="e-msg" name="message" rows="3"></textarea></div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="full err" id="e-err" role="alert"></div>
        <div class="full"><button class="btn btn-gold btn-block" id="e-go">Send enquiry</button><p class="note" style="margin:12px 0 0">By submitting you agree to be contacted about your trip. See our <a href="/page/privacy" data-close>privacy policy</a>.</p></div>
      </form></div></div></div>`;
    root.classList.add('lock');
    const depSel = $('#e-dep');
    const fillDeps = sel => {
      const id = $('#e-pkg').value, list = D.departures.filter(d => (!id || d.packageId === id) && !seat(d).sold);
      depSel.innerHTML = '<option value="">Private / my own dates</option>' + list.map(d => `<option value="${esc(d.id)}" ${d.id === sel ? 'selected' : ''}>${fd(d.date)} · ${esc(d.fromCity)}${id ? '' : ' · ' + esc((pkgOf(d.packageId) || {}).name || '')}</option>`).join('');
    };
    fillDeps(o.dep); $('#e-pkg').onchange = () => fillDeps('');
    setTimeout(() => { const n = $('#e-name'); if (n) n.focus({ preventScroll: true }); }, 60);
    $('#enq').onsubmit = async ev => {
      ev.preventDefault(); const f = ev.target, b = Object.fromEntries(new FormData(f)); $('#e-err').textContent = '';
      $('#e-go').disabled = true; $('#e-go').textContent = 'Sending…';
      try {
        const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...b, source: o.source || location.pathname, attr: ATTR }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Something went wrong');
        const p = pkgOf(b.packageId), d = D.departures.find(x => x.id === b.departureId);
        const text = `Hello ${S.brand}, I'm ${b.name} (ref ${j.ref}). I'd like to plan a Bhutan trip` + (p ? ` — ${p.name} ${dur(p)}` : '') + (d ? `, departing ${fd(d.date)} from ${d.fromCity}` : (b.travelMonth ? ` in ${fm(b.travelMonth)}` : '')) + ` for ${b.adults} adult(s)` + (+b.children ? ` + ${b.children} child(ren)` : '') + '.' + (b.message ? ' ' + b.message : '');
        $('#enq-body').innerHTML = `<div class="eyebrow">Received</div><h3>Thank you, ${esc(b.name.split(' ')[0])}!</h3><p>Your enquiry <b>#${esc(j.ref)}</b> has reached our team. We'll contact you on <b>${esc(b.phone)}</b> shortly.</p><p>Want a faster reply? Continue the chat on WhatsApp — your details are pre-filled.</p><a class="btn btn-wa btn-block" href="${esc(wa(text))}" target="_blank" rel="noopener">Continue on WhatsApp</a><p style="text-align:center;margin:14px 0 0"><button class="btn btn-line btn-sm noarrow" data-close type="button">Close</button></p>`;
      } catch (e) { $('#e-err').textContent = e.message; $('#e-go').disabled = false; $('#e-go').textContent = 'Send enquiry'; }
    };
  }
  function closeModal() {
    if (!$('.modal-bg')) return;
    $('#modal').innerHTML = ''; root.classList.toggle('lock', document.body.classList.contains('menu-open'));
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  /* ---------- view building blocks ---------- */
  const PM = ['Paro', 'Thimphu', 'Punakha', 'Gangtey', 'Bumthang', 'Haa Valley', 'Tiger\'s Nest', 'Dochula Pass', 'Phobjikha', 'Land of the Thunder Dragon'];
  function phero(crumb, title, lead, img, extra, mq) {
    return `<section class="phero"><div class="phero-bg" data-par><img src="${PH + img}" alt=""></div><div class="wrap"><div class="crumb"><a href="/">Home</a> › ${crumb}</div><h1 data-sp>${sp(title)}</h1>${lead ? `<p class="lead rv" style="--d:.25s">${lead}</p>` : ''}${extra || ''}</div>${mq ? `<div class="phero-m" aria-hidden="true"><div class="phero-mt">${[0, 1].map(() => PM.map(x => `<span>${x}</span>`).join('')).join('')}</div></div>` : ''}</section>`;
  }
  const cta = (title, text, img) => `<section class="cta"><div class="band-bg" data-par><img class="lz" src="${PH + img}.jpg" alt="" loading="lazy" decoding="async"></div><div class="wrap"><h2 data-sp>${sp(title, { em: 1 })}</h2><p class="lead rv" style="--d:.2s">${text}</p><div class="cta-row rv" style="--d:.3s"><button class="btn btn-gold" data-enq type="button">Send enquiry</button><a class="btn btn-line" href="${esc(wa(HELLO()))}" target="_blank" rel="noopener">Chat on WhatsApp</a></div></div></section>`;

  const EXPERIENCES = [['Family Holidays', 'Relaxed holidays with comfortable stays, scenic sightseeing and thoughtfully planned experiences for families of all ages.', 'paro-town'], ['Honeymoon Journeys', 'Romantic landscapes, peaceful monasteries and handpicked hotels for a new beginning.', 'punakha-river'], ['Cultural Journeys', 'Ancient monasteries, traditional villages, museums and historic landmarks.', 'dzong-white'], ['Spiritual Retreats', 'Sacred monasteries and meditation centres reflecting Bhutan\'s timeless Buddhist traditions.', 'monks-window'], ['Festival Experiences', 'Colourful Tshechu festivals, traditional mask dances and authentic local celebrations.', 'dancer'], ['Photography Journeys', 'Himalayan landscapes, ancient monasteries, festivals and everyday Bhutanese life through carefully planned photography experiences.', 'archers'], ['Adventure Holidays', 'Mountain trails, hidden valleys and spectacular Himalayan scenery through safe, well-planned adventure.', 'road']];
  const PLACES = [['Paro', 'Home of Tiger\'s Nest and Bhutan\'s only international airport.', 'paro-valley'], ['Thimphu', 'The capital — dzongs, markets, museums and monasteries.', 'thimphu-valley'], ['Punakha', 'Bhutan\'s most beautiful dzong at the river confluence.', 'dzong-river'], ['Gangtey', 'Glacial Phobjikha valley, home of black-necked cranes.', 'valley-town'], ['Bumthang', 'The spiritual heartland with Bhutan\'s oldest temples.', 'chortens']];
  const CHAPTERS = [['Arrive in the clouds', 'Fly into Paro, one of the world\'s most dramatic landings, and step into a valley of rice terraces, prayer flags and mountain air. Your guide is waiting — and so is the slowest, most welcoming pace you have ever travelled at.', 'paro-valley'], ['Climb to the sacred', 'A morning hike through pine and prayer flags leads to Tiger\'s Nest, a monastery clinging to a cliff 900 metres above the valley. The reward is quiet, wide and unforgettable.', 'tiger'], ['Sit with silence', 'Share butter tea with monks, light a lamp at a hilltop temple and let the rhythm of horns and chanting reset your own. Bhutan does not hurry — and neither will you.', 'monk-sit'], ['Celebrate with the valley', 'Time your journey with a Tshechu and watch masked dancers whirl through a dzong courtyard as families in their finest gho and kira cheer on. It is the Bhutan that no postcard captures.', 'mask']];
  const SEASONS = [['Spring', 'March — May', 'Rhododendrons in bloom', 'Valleys flush with colour and the great festivals begin — Paro Tshechu, Thimphu\'s prayer-flag hillsides, rhododendron forests above Dochula. Warm days, clear mountain views; the most loved time to visit.', ['Paro Tshechu festival', 'Rhododendron blossom', 'Tiger\'s Nest in perfect light'], 'dzong-river'], ['Summer', 'June — August', 'Emerald quiet', 'The monsoon paints Bhutan in every shade of green. Afternoon showers, mist in the valleys and far fewer travellers — a slow season for culture, cuisine and photography.', ['Lush green valleys', 'Fewer visitors', 'Excellent value'], 'valley-town'], ['Autumn', 'September — November', 'Crystal skies', 'Crisp, dry, golden: the clearest Himalayan views of the year. Rice terraces turn to gold, Thimphu Tshechu fills the dzong, and black-necked cranes begin arriving in Phobjikha.', ['Thimphu Tshechu', 'Clearest mountain views', 'Black-necked cranes return'], 'paro-valley'], ['Winter', 'December — February', 'Snow & cranes', 'Cold, bright, uncrowded. Snow-dusted passes, steaming hot-stone baths and cranes gliding over Phobjikha. Monasteries are quiet, mornings are magical, and hotels are at their best value.', ['Snow-dusted Himalaya', 'Cranes in Phobjikha', 'Quiet monasteries'], 'chortens']];
  const STEPS = [['Tell us your plan', 'Dates, group and interests — by WhatsApp or the enquiry form.'], ['Get a tailored quote', 'Clear per-person pricing and a day-wise itinerary.'], ['Confirm with an advance', 'We handle permits, SDF, hotels and transfers.'], ['Travel with confidence', 'A local guide and 24×7 support in Bhutan.']];

  /* ---------- views ---------- */
  const HERO_CAP = { 'hero-tiger': 'Paro · Tiger\'s Nest', 'hero-punakha': 'Punakha · The Dzong', 'hero-flags': 'Prayer flags of the Himalaya', 'hero-chortens': 'Bumthang · Sacred chortens' };
  const heroCap = src => HERO_CAP[(String(src).split('/').pop() || '').replace(/\.\w+$/, '')] || 'The Last Shangri-La';
  function home() {
    const feat = D.packages.filter(p => p.featured), list = (feat.length >= 4 ? feat : D.packages).slice(0, 8);
    const prices = D.packages.filter(showPrice).map(p => p.price);
    const deps = D.departures.filter(d => !seat(d).sold).slice(0, 5);
    const heroes = (S.heroImages && S.heroImages.length ? S.heroImages : [PH + 'hero-tiger.jpg', PH + 'hero-punakha.jpg', PH + 'hero-flags.jpg', PH + 'hero-chortens.jpg']).slice(0, 5);
    const stmt = 'Bhutan is not a place you visit. It is a feeling you carry home.'.split(' ');
    pending = () => { heroSlider(); };
    return `<section class="hero" id="hero"><div class="hero-stick">
      <div class="hero-media" id="hero-media">${heroes.map((h, i) => `<div class="hs${i === 0 ? ' on' : ''}"><img src="${esc(h)}" alt="" ${i === 0 ? 'fetchpriority="high"' : ''} decoding="async"></div>`).join('')}<div class="hero-shade"></div><div class="hero-frame" aria-hidden="true"></div></div>
      <div class="hero-in" id="hero-in"><div class="hero-c"><div class="eyebrow rv">${esc(S.tagline)}</div><h1 data-sp>${sp(S.heroTitle, { em: 1 })}</h1><p class="lead rv" style="--d:.5s">${esc(S.heroSub)}</p>
        <div class="hero-cta rv" style="--d:.65s"><button class="btn btn-gold" data-enq type="button">Begin your journey</button><a class="link" href="/packages">Explore journeys</a></div></div></div>
      <div class="cue" aria-hidden="true">Scroll</div>
      <div class="hero-meta"><div class="wrap"><div class="hero-dots" id="hdots">${heroes.length > 1 ? heroes.map((h, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" aria-label="Show photo ${i + 1}"></button>`).join('') : ''}</div><div class="hero-cap"><b id="hcn">01</b><em id="hcap">${esc(heroCap(heroes[0]))}</em></div></div></div>
    </div></section>
    <div class="marq" aria-hidden="true"><div class="marq-t">${[0, 1].map(() => ['Paro', 'Thimphu', 'Punakha', 'Gangtey', 'Bumthang', 'Haa Valley', 'Tiger\'s Nest', 'Dochula Pass', 'Phobjikha', 'Land of the Thunder Dragon'].map(x => `<span>${x}</span>`).join('')).join('')}</div></div>

    <section class="sec stmt-sec"><div class="wrap"><div class="orn rv"><i></i></div><div class="eyebrow c rv">Why Bhutan</div><p class="stmt" data-lit>${stmt.map(w => `<span class="sw">${esc(w)}</span>`).join(' ')}</p>
      <div class="stmt-side rv" style="--d:.15s"><p>La Bhutanz Tours designs personalised journeys across the Kingdom of Happiness — hand-built around your dates, pace and curiosity, with local experts at every step.</p><a class="link" href="/page/about-us">About us</a></div>
      <div class="pillars rv"><div><span class="n">i.</span><h4>Private by design</h4><p>Every journey is shaped around your dates, your pace and your curiosity — never a fixed group script.</p></div><div><span class="n">ii.</span><h4>Local expertise</h4><p>Guides and hosts who know Paro, Thimphu, Punakha, Gangtey and Bumthang as home.</p></div><div><span class="n">iii.</span><h4>Handpicked stays</h4><p>Considered hotels and lodges, chosen for character, comfort and the views from the window.</p></div><div><span class="n">iv.</span><h4>Effortless arrangements</h4><p>Permits, fees, transfers and flights handled quietly in the background, with a team on call.</p></div></div></section>

    <section class="hg dark" id="hg"><div class="hg-pin"><div class="hg-head wrap"><div><div class="eyebrow">Popular journeys</div><h2>Journeys <em>worth</em> the climb</h2></div><div class="hg-count"><b id="hgn">01</b><span>/ ${String(list.length).padStart(2, '0')}</span><a class="link" href="/packages">All journeys</a></div></div>
      <div class="hg-track" id="hg-track">${list.map((p, i) => `<a class="hg-card" href="/package/${esc(p.slug)}" data-cur="View"><div class="hg-img"><img class="lz" src="${esc(pimg(p))}" alt="${esc(p.name)} ${dur(p)} Bhutan tour" loading="lazy" decoding="async" draggable="false"></div><div class="hg-t"><span class="hg-n">${String(i + 1).padStart(2, '0')}</span><span class="jc-meta">${p.nights} Nights · ${p.days} Days${p.category === 'fixed' ? ' · Fixed departure' : ''}</span><h3>${esc(p.name)}</h3><p>${esc(p.stay || CAT[p.category] || '')}</p><span class="jc-go">Discover</span></div></a>`).join('')}<a class="hg-end" href="/packages"><span>View all<br>journeys</span></a></div>
      <div class="hg-prog"><i id="hg-bar"></i></div></div></section>
    <section class="sec dark rail-sec" style="padding-bottom:clamp(50px,6vw,90px)"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">Popular journeys</div><h2 data-sp>${sp('Journeys worth the climb', { em: 1 })}</h2></div><div class="shead-r rv"><a class="link" href="/packages">All journeys</a></div></div></div>
      <div class="rail" id="rail">${list.map(p => jc(p)).join('')}</div>
      <div class="rail-ctl"><div class="rail-bar"><i></i></div><button class="arrow" type="button" data-rp aria-label="Previous">←</button><button class="arrow" type="button" data-rn aria-label="Next">→</button></div></section>

    <section class="sec"><div class="wrap"><div class="eyebrow rv">The way we travel</div><div class="story"><div class="story-media" aria-hidden="true">${CHAPTERS.map((c, i) => `<img src="${PH + c[2]}.jpg" alt="" loading="lazy" class="${i === 0 ? 'on' : ''}">`).join('')}<div class="story-n" id="sn">01</div></div>
      <div>${CHAPTERS.map((c, i) => `<div class="story-text" data-i="${i}"><div class="k">0${i + 1}</div><h3>${esc(c[0])}</h3><p class="lead">${esc(c[1])}</p><div class="story-m imgrv"><img src="${PH + c[2]}.jpg" alt="" loading="lazy" class="lz"></div></div>`).join('')}</div></div></div></section>

    <div class="giant" aria-hidden="true"><div class="giant-t">${[0, 1].map(() => '<span>Bhutan</span><span class="o">The Last Shangri-La</span>').join('')}</div></div>

    <section class="sec dark xp-sec"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">Travel your way</div><h2 data-sp>${sp('Experiences for every traveller')}</h2></div><p class="lead rv" style="max-width:40ch;--d:.2s">Every traveller discovers Bhutan in their own way. We shape the journey around your interests, travel style and pace.</p></div>
      <div class="xp"><ul class="xp-list" id="xp">${EXPERIENCES.map((e, i) => `<li class="rv${i === 0 ? ' on' : ''}" data-i="${i}" style="--d:${i * 0.05}s"><button type="button" class="xp-b" aria-expanded="${i === 0}"><span class="xn">0${i + 1}</span><span class="xt">${esc(e[0])}</span></button><div class="xp-d"><div><p>${esc(e[1])}</p><a class="link" href="/packages">Explore journeys</a><div class="xp-m"><img class="lz" src="${PH + e[2]}.jpg" alt="" loading="lazy" decoding="async"></div></div></div></li>`).join('')}</ul>
      <div class="xp-media">${EXPERIENCES.map((e, i) => `<img src="${PH + e[2]}.jpg" alt="" loading="lazy" aria-hidden="true" class="${i === 0 ? 'on' : ''}">`).join('')}<div class="xp-cap"><p id="xpc">${esc(EXPERIENCES[0][1])}</p><a class="link" href="/packages">Explore journeys</a></div></div></div></div></section>

    <section class="band"><div class="band-bg" data-par><img class="lz" src="${PH}flags-wheels.jpg" alt="" loading="lazy" decoding="async"></div><div class="wrap"><div class="eyebrow rv">The Kingdom of Happiness</div><h2 data-sp>${sp('Where progress is measured in happiness', { em: 1 })}</h2><p class="lead rv" style="--d:.25s">Bhutan guides its future by Gross National Happiness, protects its forests by law and welcomes visitors as honoured guests. Travel here is slow, deliberate and deeply human.</p><div class="rv" style="--d:.35s"><button class="btn btn-gold" data-enq type="button">Begin your journey</button></div></div></section>

    ${deps.length ? `<section class="sec"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">Fixed &amp; scheduled</div><h2 data-sp>${sp('Next departures from Mumbai')}</h2></div><div class="shead-r rv"><a class="link" href="/departures">All departures</a></div></div><div class="rv">${depTable(deps, true)}</div></div></section>` : ''}

    <section class="sec alt"><div class="wrap steps-wrap"><div><div class="eyebrow rv">Why ${esc(S.brand)}</div><h2 data-sp>${sp('Why choose La Bhutanz Tours')}</h2><p class="lead rv" style="--d:.2s">We focus on understanding your travel goals and creating thoughtfully planned journeys that combine local knowledge, personalised service and seamless planning.</p>
      <ul class="ticks rv" style="margin:26px 0"><li>Personalised journeys for couples, families, solo travellers and private groups</li><li>Local expertise across Paro, Thimphu, Punakha, Gangtey and Bumthang</li><li>Help with Bhutan permits, planning and documentation</li><li>Handpicked hotels, comfortable transport and dependable local support</li><li>Dedicated assistance before, during and after your journey</li></ul></div>
      <div><div class="eyebrow rv">How it works</div><div class="tl" id="tl">${STEPS.map((s, i) => `<div class="tl-i"><span class="n">Step 0${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div></div></div></section>

    <section class="sec seas-sec"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">When to go</div><h2 data-sp>${sp('Four seasons, four Bhutans')}</h2></div></div>
      <div class="se" id="se"><div class="se-tabs" role="tablist">${SEASONS.map((x, i) => `<button type="button" role="tab" class="se-t${i === 0 ? ' on' : ''}" data-i="${i}" aria-selected="${i === 0}"><span class="se-n">0${i + 1}</span><span class="se-l">${x[0]}</span><span class="se-m">${x[1]}</span></button>`).join('')}</div>
        <div class="se-body"><div class="se-img">${SEASONS.map((x, i) => `<img src="${PH + x[5]}.jpg" alt="" loading="lazy" class="${i === 0 ? 'on' : ''}">`).join('')}</div>
          <div class="se-txt">${SEASONS.map((x, i) => `<div class="se-p${i === 0 ? ' on' : ''}"><span class="se-mo">${x[1]}</span><h3>${x[2]}</h3><p>${x[3]}</p><ul class="ticks">${x[4].map(h => `<li>${h}</li>`).join('')}</ul><button class="link" data-enq type="button">Plan your ${x[0].toLowerCase()} journey</button></div>`).join('')}</div></div></div></div></section>

    <section class="sec"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">Destinations</div><h2 data-sp>${sp('Where we take you')}</h2></div></div>
      <div class="places">${PLACES.map((p, i) => `<a class="place rv" href="/packages" style="--d:${i * 0.06}s"><span class="pn">0${i + 1}</span><h3>${p[0]}</h3><p>${p[1]}</p><span class="pt"><img class="lz" src="${PH + p[2]}.jpg" alt="" loading="lazy" decoding="async"></span></a>`).join('')}</div></div></section>

    <section class="sec alt"><div class="wrap"><div class="eyebrow rv">Before you go</div><h2 data-sp>${sp('Entry permit &amp; fee essentials for Indian travellers'.replace(/&amp;/g, '&'))}</h2>
      <div class="ess"><div class="rv"><span class="n">01</span><h3>Entry permit</h3><p>No visa needed. Carry a valid passport (6 months) or voter ID; we arrange the permit.</p></div>
      <div class="rv" style="--d:.1s"><span class="n">02</span><h3>SDF</h3><p>${inr(S.sdfINR)} per person per night (children 6–12 half, under 6 free).</p></div>
      <div class="rv" style="--d:.2s"><span class="n">03</span><h3>GST &amp; insurance</h3><p>${S.gstPct}% GST on tour services. Travel insurance is mandatory.</p></div></div>
      <p class="rv" style="margin-top:30px"><a class="link" href="/page/visa">Read the full visa &amp; permit guide</a></p></div></section>

    ${D.testimonials.length ? `<section class="sec"><div class="wrap"><div class="eyebrow rv">Guest stories</div><h2 data-sp>${sp('Loved by travellers', { em: 1 })}</h2><div class="quotes">${D.testimonials.map((t, i) => `<figure class="rv" style="--d:${(i % 3) * 0.09}s"><div class="stars" aria-label="${Math.max(1, Math.min(5, t.rating || 5))} stars">${'★'.repeat(Math.max(1, Math.min(5, t.rating || 5)))}</div><blockquote>“${esc(t.text)}”</blockquote><figcaption><b>${esc(t.name)}</b><span>${esc(t.place)}</span></figcaption></figure>`).join('')}</div></div></section>` : ''}

    ${D.posts.length ? `<section class="sec${D.testimonials.length ? ' alt' : ''}"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">Journal</div><h2 data-sp>${sp('Bhutan travel guides')}</h2></div><div class="shead-r rv"><a class="link" href="/blog">All travelogues</a></div></div><div class="cards3">${D.posts.slice(0, 3).map(postCard).join('')}</div></div></section>` : ''}

    <section class="sec ${D.posts.length && !D.testimonials.length ? '' : (D.posts.length ? '' : 'alt')}"><div class="wrap steps-wrap"><div><div class="eyebrow rv">Good to know</div><h2 data-sp>${sp('Common questions', { em: 0 })}</h2><p class="rv"><a class="link" href="/faq">All FAQs</a></p></div><div class="rv">${D.faqs.slice(0, 6).map((f, i) => acc(f.q, f.a, i === 0)).join('')}</div></div></section>
    ${cta('Start planning your Bhutan journey', 'Whether you are planning your first visit or returning to explore more of the Kingdom of Happiness, we are here to help you create a personalised journey.', 'courtyard')}`;
  }

  function packagesView() {
    const q = new URLSearchParams(location.search);
    const st = { cat: q.get('cat') || '', dur: q.get('dur') || '', q: q.get('q') || '', sort: q.get('sort') || '' };
    pending = () => {
      $('#pk-dur').value = st.dur; $('#pk-sort').value = st.sort;
      const draw = () => {
        st.q = $('#pk-q').value; st.dur = $('#pk-dur').value; st.sort = $('#pk-sort').value;
        $('#pk-chips').innerHTML = ['', ...Object.keys(CAT)].map(c => `<button type="button" class="pill-b${st.cat === c ? ' on' : ''}" data-cat="${c}">${c ? CAT[c] : 'All journeys'}</button>`).join('');
        const l = D.packages.filter(p => (!st.cat || p.category === st.cat) && (!st.dur || (st.dur === 's' ? p.nights <= 5 : st.dur === 'm' ? p.nights >= 6 && p.nights <= 7 : p.nights >= 8)) &&
          (!st.q || (p.name + ' ' + p.summary + ' ' + p.stay + ' ' + p.highlights.join(' ')).toLowerCase().includes(st.q.toLowerCase())));
        if (st.sort === 'pa') l.sort((a, b) => a.price - b.price); if (st.sort === 'pd') l.sort((a, b) => b.price - a.price); if (st.sort === 'd') l.sort((a, b) => a.nights - b.nights);
        $('#pk-grid').innerHTML = l.length ? l.map((p, i) => jc(p, i, true)).join('') : '<div class="empty" style="grid-column:1/-1">No journeys match those filters. <button class="btn btn-gold btn-sm noarrow" data-enq type="button" style="margin-left:8px">Ask for a custom itinerary</button></div>';
        const cnt = $('#pk-count'); if (cnt) cnt.innerHTML = `<b>${String(l.length).padStart(2, '0')}</b> ${l.length === 1 ? 'journey' : 'journeys'}`;
        observe($('#pk-grid')); sweepImages($('#pk-grid')); driftEls = $$('.pc-img img,.jc-img img,.mz>img,.story-m img,.xp-m img,.strip img');
        const u = new URLSearchParams(); Object.entries(st).forEach(([k, v]) => v && u.set(k, v)); history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
      };
      $('#pk-chips').onclick = e => { const b = e.target.closest('[data-cat]'); if (b) { st.cat = b.dataset.cat; draw(); } };
      ['pk-q', 'pk-dur', 'pk-sort'].forEach(id => { $('#' + id).oninput = draw; });
      draw();
    };
    return `${phero('Journeys', 'Bhutan tour packages', 'Fly-in, drive-in, special-interest journeys and fixed departures. Prices are per person; every journey can be personalised.', 'hero-chortens.jpg', '', 1)}
      <div class="filters"><div class="wrap"><div class="pills" id="pk-chips"></div><div class="sel-row"><input id="pk-q" placeholder="Search: Tiger's Nest, honeymoon…" value="${esc(st.q)}" aria-label="Search journeys" style="min-width:220px"><select id="pk-dur" aria-label="Duration"><option value="">Any duration</option><option value="s">Up to 5 nights</option><option value="m">6–7 nights</option><option value="l">8+ nights</option></select><select id="pk-sort" aria-label="Sort"><option value="">Recommended</option><option value="pa">Price: low to high</option><option value="pd">Price: high to low</option><option value="d">Shortest first</option></select></div></div></div>
      <section class="sec" style="padding-top:clamp(36px,5vw,64px);padding-bottom:clamp(60px,8vw,120px)"><div class="wrap"><div class="pk-meta"><span id="pk-count"></span><span class="note">Prices per person · every journey can be personalised</span></div><div class="pgrid" id="pk-grid"></div></div></section>
      ${cta('Not sure which journey is yours?', 'Tell us your dates, who is travelling and what you love — we will shape a journey around you.', 'monk-sit')}`;
  }

  const STRIP = ['paro-valley', 'punakha-river', 'monk-sit', 'mask', 'dzong-white', 'courtyard', 'chortens', 'flags-wheels', 'thimphu-valley', 'archers', 'monks-window', 'festival-crowd'];
  const stripPicks = id => { const o = [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % STRIP.length; return [0, 1, 2].map(k => STRIP[(o + k * 4) % STRIP.length]); };
  function packageView(slug) {
    const p = D.packages.find(x => x.slug === slug); if (!p) return notFound();
    document.title = `${p.name} ${dur(p)} — Bhutan Tour Package | ${S.brand}`;
    const deps = D.departures.filter(d => d.packageId === p.id);
    const others = D.packages.filter(x => x.id !== p.id).slice(0, 6);
    pending = () => {
      const upd = () => {
        const pax = Math.max(1, +$('#x-pax').value || 1), ds = $('#x-dep').value, d = D.departures.find(x => x.id === ds), each = priceOf(p, d);
        const sdf = S.sdfINR * p.nights * pax, base = each * pax, gst = S.gstIncluded ? 0 : base * (S.gstPct / 100);
        $('#x-est').innerHTML = showPrice(p) ? `<div><span>Package × ${pax}</span><b>${inr(base)}</b></div>${gst ? `<div><span>GST ${S.gstPct}%</span><b>${inr(gst)}</b></div>` : ''}<div><span>SDF (${inr(S.sdfINR)} × ${p.nights}N × ${pax})</span><b>${inr(sdf)}</b></div><div class="tot"><span>Estimated total</span><b>${inr(base + gst + sdf)}</b></div>` : `<div><span>SDF (${inr(S.sdfINR)} × ${p.nights}N × ${pax})</span><b>${inr(sdf)}</b></div><div class="note">Package price on request.</div>`;
        $('#x-book').dataset.dep = ds;
      };
      $('#x-pax').oninput = upd; $('#x-dep').onchange = upd; upd();
    };
    const blk = (t, body) => body ? `<div class="block"><h2 class="rv">${t}</h2><div class="rv">${body}</div></div>` : '';
    return `<section class="pk-hero"><div class="band-bg" data-par><img src="${esc(pimg(p))}" alt="${esc(p.name)} ${dur(p)} Bhutan tour" fetchpriority="high"></div>
      <div class="wrap"><div class="crumb"><a href="/">Home</a> › <a href="/packages">Journeys</a> › ${esc(p.name)}</div><div class="pk-chips rv"><span class="chip g">${dur(p)}</span><span class="chip">${esc(CAT[p.category] || '')}</span>${p.flightIncluded ? '<span class="chip">✈ Flights included</span>' : '<span class="chip">Land package</span>'}</div>
      <h1 data-sp>${sp(p.name)}</h1><p class="lead rv" style="--d:.3s">${esc(p.summary)}</p></div></section>
      <div class="wrap"><div class="facts"><div><small>Duration</small><b>${p.nights} nights / ${p.days} days</b></div>${p.stay ? `<div><small>Stay</small><b>${esc(p.stay)}</b></div>` : ''}<div><small>Type</small><b>${esc(CAT[p.category] || '')}</b></div><div><small>Flights</small><b>${p.flightIncluded ? 'Included' : 'Land package'}</b></div></div>
      <div class="detail"><div>
        <div id="overview" class="rv">${para(p.intro)}${p.highlights.length ? `<h3 style="margin-top:1.6em">Journey highlights</h3><ul class="ticks">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>
        ${blk('Day-by-day itinerary', p.itinerary.length ? '<div class="dl">' + p.itinerary.map((d, i) => `<div class="day${i === 0 ? ' open' : ''}"><button type="button" aria-expanded="${i === 0}"><b>Day ${i + 1}</b><span>${esc(d.title)}</span></button><div class="day-b"><div>${d.meta ? `<div class="meta">${esc(d.meta)}</div>` : ''}<p>${esc(d.desc)}</p></div></div></div>`).join('') + '</div>' : '')}
        ${blk('What\'s included', `<div class="two"><div><h3>Included</h3><ul class="ticks">${p.inclusions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3>Not included</h3><ul class="ticks x">${p.exclusions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`)}
        ${blk('Documents needed to enter Bhutan', (S.documents || []).length ? `<ul class="ticks">${S.documents.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '')}
        ${blk('Departures &amp; flights', deps.length ? depTable(deps) + '<p class="note" style="margin-top:14px">Want different dates? Every journey can run privately on your preferred dates.</p>' : `<p>This journey runs privately on your preferred dates.</p><button class="btn btn-gold btn-sm" data-enq data-pkg="${esc(p.id)}" type="button">Check availability</button>`)}
        ${p.ideal.length ? blk('Who is this journey ideal for?', `<ul class="ticks">${p.ideal.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`) : ''}
        ${p.faqs.length ? blk('Frequently asked questions', p.faqs.map(f => acc(f.q, f.a)).join('')) : ''}
      </div>
      <aside class="side"><div class="note" style="text-transform:uppercase;letter-spacing:.2em;font-size:.66rem;margin-bottom:8px">${showPrice(p) ? 'From' : 'Pricing'}</div><div class="bigprice">${showPrice(p) ? inr(p.price) + ' <small>per person</small>' : 'On request'}</div>
        <div style="height:1px;background:var(--line);margin:20px 0"></div><label for="x-pax">Travellers</label><input id="x-pax" type="number" min="1" value="2">
        <label for="x-dep" style="margin-top:14px">Departure</label><select id="x-dep"><option value="">Private / my own dates</option>${deps.filter(d => !seat(d).sold).map(d => `<option value="${esc(d.id)}">${fd(d.date)} · ${esc(d.fromCity)}</option>`).join('')}</select>
        <div class="est" id="x-est"></div>
        <button class="btn btn-gold btn-block" id="x-book" data-enq data-pkg="${esc(p.id)}" type="button">Enquire / book this trip</button>
        <a class="btn btn-wa btn-block noarrow" style="margin-top:10px" target="_blank" rel="noopener" href="${esc(wa(`Hello ${S.brand}, I'm interested in the ${p.name} ${dur(p)} package.`))}">WhatsApp us</a>
        <p class="note" style="margin:14px 0 0">Estimate only — final quote confirms hotels, season and group size. ${esc(S.advanceInfo)} <a href="/how-to-book">How to book &amp; pay</a></p></aside></div></div>
      <section class="sec" style="padding-bottom:0"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">A glimpse of the journey</div><h2 data-sp>${sp('Moments you will remember')}</h2></div></div><div class="strip">${stripPicks(p.id).map((k, i) => `<div class="a a${i} imgrv" style="--d:${i * 0.12}s"><img class="lz" src="${PH + k}.jpg" alt="" loading="lazy" decoding="async"></div>`).join('')}</div></div></section>
      ${others.length ? `<section class="sec"><div class="wrap"><div class="shead"><div><div class="eyebrow rv">Keep exploring</div><h2 data-sp>${sp('You may also love')}</h2></div></div><div class="pgrid">${others.slice(0, 3).map((o, i) => jc(o, i, true)).join('')}</div></div></section>` : ''}
      ${cta('Make this journey yours', 'Private dates, your pace, your preferred stays — tell us what you have in mind and we will tailor every detail.', 'courtyard')}`;
  }

  function departuresView() {
    pending = () => {
      const draw = () => {
        const pk = $('#dp-pkg').value, mo = $('#dp-mo').value;
        $('#dp-out').innerHTML = depTable(D.departures.filter(d => (!pk || d.packageId === pk) && (!mo || d.date.slice(0, 7) === mo)));
      };
      $('#dp-pkg').onchange = $('#dp-mo').onchange = draw; draw();
    };
    const months = [...new Set(D.departures.map(d => d.date.slice(0, 7)))];
    return `${phero('Departures', 'Departures &amp; flight details'.replace(/&amp;/g, '&'), 'Scheduled departures from Mumbai with live seat availability. Prefer your own dates? Private departures are available on every package.', 'hero-punakha.jpg')}
      <div class="filters"><div class="wrap"><div class="sel-row" style="flex:1;max-width:640px"><select id="dp-pkg" aria-label="Package"><option value="">All packages</option>${[...new Set(D.departures.map(d => d.packageId))].map(id => { const p = pkgOf(id); return p ? `<option value="${esc(id)}">${esc(p.name)} ${dur(p)}</option>` : ''; }).join('')}</select><select id="dp-mo" aria-label="Month"><option value="">All months</option>${months.map(m => `<option value="${m}">${fm(m)}</option>`).join('')}</select></div></div></div>
      <section class="sec" style="padding-top:clamp(36px,5vw,64px)"><div class="wrap"><div id="dp-out"></div></div></section>`;
  }

  let tocHs = [], tocAs = [];
  function buildToc() {
    const t = $('#toc'), pr = $('.prose'); if (!t || !pr) return;
    let hs = $$('h2', pr); if (hs.length < 3) hs = $$('h2,h3', pr); hs = hs.slice(0, 12);
    if (hs.length < 3) { t.remove(); const d = $('.doc'); if (d) d.classList.add('no-toc'); return; }
    hs.forEach((h, i) => { if (!h.id) h.id = 'sec-' + (i + 1); });
    t.innerHTML = '<span class="toc-t">In this guide</span>' + hs.map(h => `<a href="#${h.id}" class="${h.tagName === 'H3' ? 'sub' : ''}">${esc(h.textContent)}</a>`).join('');
    tocHs = hs; tocAs = $$('a', t);
  }
  async function postView(slug) {
    const r = await fetch('/api/post/' + encodeURIComponent(slug)); if (!r.ok) return notFound(); const p = await r.json(); document.title = p.title + ' | ' + S.brand; pending = buildToc;
    return `<section class="phero"><div class="phero-bg"><img src="${esc(p.image || PH + 'thimphu-valley.jpg')}" alt=""></div><div class="wrap"><div class="crumb"><a href="/">Home</a> › <a href="/blog">Travelogues</a></div><div class="note" style="margin-bottom:14px">${fd(p.date)}</div><h1 data-sp>${sp(p.title)}</h1></div></section>
      <section class="sec" style="padding-top:clamp(30px,5vw,70px)"><div class="wrap doc"><aside class="toc" id="toc"></aside><div class="prose rv">${p.body}<p style="margin-top:40px"><button class="btn btn-gold" data-enq type="button">Plan my Bhutan trip</button></p></div></div></section>
      ${cta('Plan the trip you just read about', 'Our Bhutan specialists will turn it into a personalised itinerary.', 'flags-wheels')}`;
  }
  async function pageView(slug) {
    const r = await fetch('/api/page/' + encodeURIComponent(slug)); if (!r.ok) return notFound(); const p = await r.json(); document.title = p.title + ' | ' + S.brand; pending = buildToc;
    const img = { visa: 'dzong-white', festivals: 'dancer', 'about-us': 'paro-town', 'about-bhutan': 'hero-flags', 'dos-and-donts': 'monks-door' }[slug] || 'flags-wheels';
    return `${phero(esc(p.title), p.title, '', img + '.jpg')}
      <section class="sec" style="padding-top:clamp(30px,5vw,70px)"><div class="wrap doc"><aside class="toc" id="toc"></aside><div class="prose rv">${p.html}<p style="margin-top:40px;display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-gold" data-enq type="button">Ask us a question</button><a class="btn btn-line" target="_blank" rel="noopener" href="${esc(wa('Hello ' + S.brand + ', I have a question about ' + p.title + '.'))}">WhatsApp</a></p></div></div></section>
      ${cta('Questions about ' + p.title + '?', 'Ask our team — a real person replies on WhatsApp or phone.', 'monks-door')}`;
  }
  const blogView = () => {
    const [f, ...rest] = D.posts;
    return `${phero('Travelogues', 'Bhutan travelogues', 'Destination stories, cultural insights and practical planning guidance — from valleys, monasteries and festivals to local traditions and responsible ways of travelling.', 'thimphu-valley.jpg', `<p class="note rv" style="margin-top:22px;--d:.35s">Also see: <a href="/page/visa">Visa &amp; entry permit</a> · <a href="/faq">Travel FAQs</a> · <a href="/page/dos-and-donts">Do's &amp; Don'ts</a> · <a href="/page/about-bhutan">About Bhutan</a> · <a href="/page/festivals">Festivals</a></p>`)}
    <section class="sec" style="padding-top:clamp(40px,6vw,90px)"><div class="wrap">${(S.social || {}).blog ? `<p style="margin-bottom:30px"><a class="link" target="_blank" rel="noopener" href="${esc(S.social.blog)}">Read the La Bhutanz Tours blog</a></p>` : ''}
      ${f ? `<a class="feat-post rv" href="/blog/${esc(f.slug)}" data-cur="Read"><div class="fp-img imgrv">${f.image ? `<img class="lz" src="${esc(f.image)}" alt="${esc(f.title)}" loading="lazy" decoding="async">` : ''}</div><div class="fp-t"><span class="eyebrow">Featured · ${fd(f.date)}</span><h2>${esc(f.title)}</h2><p class="lead">${esc(f.excerpt)}</p><span class="link">Read the story</span></div></a>` : ''}
      <div class="cards3" style="margin-top:clamp(50px,7vw,110px)">${rest.map(postCard).join('') || (f ? '' : '<div class="empty">Articles coming soon.</div>')}</div></div></section>
    ${cta('Let a story become a journey', 'Found a place that speaks to you? Tell us — we will build a journey around it.', 'dzong-river')}`;
  };
  function faqView() {
    pending = () => { $('#fq').oninput = e => { const q = e.target.value.toLowerCase(); $$('#fq-list .acc').forEach(d => { d.style.display = d.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }; };
    return `${phero('FAQ', 'Bhutan travel FAQ', 'Visa, permits, SDF, GST, flights, weather and more.', 'courtyard.jpg')}
      <section class="sec" style="padding-top:clamp(30px,5vw,70px)"><div class="wrap"><div class="faq-w"><input id="fq" placeholder="Search questions…" style="margin-bottom:30px" aria-label="Search FAQ"><div id="fq-list">${D.faqs.map(f => acc(f.q, f.a)).join('')}</div>
      <p style="margin-top:34px">Can't find your answer? <button class="btn btn-gold btn-sm" data-enq type="button" style="margin-left:8px">Ask our team</button></p></div></div></section>
      ${cta('Still wondering?', 'Ask us anything — Bhutan is easier than it looks when someone local plans it.', 'paro-town')}`;
  }
  function contactView() {
    const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(S.address);
    const bl = (k, v, h, ext) => `<a class="big-link rv" href="${esc(h)}" ${ext || ''}><small>${k}</small><span>${esc(v)}</span></a>`;
    return `${phero('Contact', 'Let us plan your journey', 'Planning a Bhutan journey begins with understanding your travel style, preferred pace and the experiences that matter to you. Share your plans and our team will respond with clear, thoughtful guidance.', 'paro-town.jpg', '', 1)}
      <section class="sec"><div class="wrap ct"><div class="ct-l"><div class="eyebrow rv">Speak with us</div>
        ${bl('Call', S.phone, tel())}${bl('WhatsApp', '+' + S.whatsapp, wa('Hello'), 'target="_blank" rel="noopener"')}${S.emails.map(e => bl('Email', e, 'mailto:' + e)).join('')}
        <div class="ct-meta rv"><div><small>Mumbai office</small><p>${esc(S.address)}</p><a class="link" target="_blank" rel="noopener" href="${esc(map)}">Open in Google Maps</a></div><div><small>Office hours</small><p>${esc(S.hours)}</p></div></div></div>
        <div class="ct-r"><div class="ct-arch imgrv"><img class="lz" src="${PH}courtyard.jpg" alt="" loading="lazy" decoding="async"></div>
          <div class="side rv" style="position:static;margin-top:-90px;margin-inline:6%"><h3>Send an enquiry</h3><p style="color:var(--ink2)">Tell us about your trip and we'll respond with a personalised itinerary.</p><button class="btn btn-gold btn-block" data-enq type="button">Plan my trip</button><a class="btn btn-wa btn-block noarrow" style="margin-top:10px" target="_blank" rel="noopener" href="${esc(wa(HELLO()))}">Chat on WhatsApp</a></div></div></div></section>
      <div class="giant" aria-hidden="true"><div class="giant-t">${[0, 1].map(() => '<span>Tashi Delek</span><span class="o">Welcome to Bhutan</span>').join('')}</div></div>`;
  }
  function bookView() {
    const pay = S.payment || {}, has = pay.upiId || pay.bank || pay.accountNo;
    return `${phero('How to book &amp; pay'.replace(/&amp;/g, '&'), 'How to book & pay', '', 'dzong-white.jpg')}
      <section class="sec" style="padding-top:20px"><div class="wrap steps-wrap"><div class="tl" id="tl">${[['Enquire', 'Send an enquiry or WhatsApp us your dates and group size.'], ['Receive your quote', 'A personalised itinerary with clear per-person pricing.'], ['Pay the advance', esc(S.advanceInfo)], ['Documents & permits', 'Share ID details; we arrange your Entry Permit and SDF.']].map((s, i) => `<div class="tl-i"><span class="n">Step 0${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div>
      <div class="prose rv">${has ? `<h3>Payment details</h3>${pay.upiId ? `<p><b>UPI:</b> ${esc(pay.upiId)}</p>` : ''}${pay.accountName ? `<p><b>Account name:</b> ${esc(pay.accountName)}</p>` : ''}${pay.bank ? `<p><b>Bank:</b> ${esc(pay.bank)}</p>` : ''}${pay.accountNo ? `<p><b>Account no.:</b> ${esc(pay.accountNo)}</p>` : ''}${pay.ifsc ? `<p><b>IFSC:</b> ${esc(pay.ifsc)}</p>` : ''}${pay.note ? `<p class="note">${esc(pay.note)}</p>` : ''}` : '<p>We will share payment details (UPI / bank transfer) with your confirmed quotation.</p>'}
      ${(S.documents || []).length ? `<h3>Documents we need from you</h3><ul class="ticks">${S.documents.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="note">Please read our <a href="/page/terms">terms &amp; cancellation policy</a> before paying. ${S.gstPct}% GST applies on tour services where not already included.</p>
      <p><button class="btn btn-gold" data-enq type="button">Start my enquiry</button></p></div></div></section>
      ${cta('Ready when you are', 'Share your dates and who is travelling — your personalised quote follows.', 'dancer')}`;
  }
  const notFound = () => { document.title = 'Page not found | ' + S.brand; return `<section class="phero" style="min-height:80vh;display:flex;align-items:center"><div class="phero-bg"><img src="${PH}hero-flags.jpg" alt=""></div><div class="wrap" style="text-align:center"><h1 data-sp style="margin-inline:auto">${sp('Page not found')}</h1><p class="lead rv" style="margin:0 auto 30px">That page doesn't exist — but Bhutan is waiting.</p><a class="btn btn-gold" href="/packages">Browse journeys</a></div></section>`; };

  /* ---------- motion engine ---------- */
  let hgS = null, hgT = null, hgB = null, hgC = null, hgD = 0, hgN = 1, io = null, parEls = [], litEls = [], tlEls = [], counted = new WeakSet(), heroTimer = null, lastY = 0, ticking = false, pres = true;
  if (!('IntersectionObserver' in window)) { root.classList.add('rm'); }
  io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0 }) : null;
  const cio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !counted.has(e.target)) { counted.add(e.target); count(e.target); cio.unobserve(e.target); }
  }), { threshold: 0.6 }) : null;

  function observe(scope) {
    const items = $$('.rv,.imgrv,[data-sp]', scope || app).filter(el => !el.closest('.hero,.phero,.pk-hero'));
    items.forEach(el => { if (REDUCED || !io) el.classList.add('in'); else if (!el.classList.contains('in')) io.observe(el); });
  }
  function releaseHeads() {
    $$('.hero,.phero,.pk-hero').forEach(h => { h.classList.add('go'); $$('.rv,.imgrv,[data-sp]', h).forEach(el => el.classList.add('in')); });
  }
  function sweepImages(scope) {
    $$('img.lz', scope || document).forEach(im => { if (im.complete) im.classList.add('ld'); });
  }
  document.addEventListener('load', e => { if (e.target && e.target.tagName === 'IMG') e.target.classList.add('ld'); }, true);
  document.addEventListener('error', e => { if (e.target && e.target.tagName === 'IMG') { e.target.classList.add('ld'); } }, true);

  function count(el) {
    const to = +el.dataset.count, pre = el.dataset.pre || '', t0 = performance.now(), d = 1600;
    if (REDUCED) { el.textContent = pre + Math.round(to).toLocaleString('en-IN'); return; }
    const f = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); el.textContent = pre + Math.round(to * e).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }

  function heroSlider() {
    clearInterval(heroTimer);
    const slides = $$('.hs'), dots = $$('#hdots button'); if (slides.length < 2) return;
    let i = 0;
    const show = n => {
      const prev = slides[i]; i = (n + slides.length) % slides.length;
      slides.forEach(s => s.classList.remove('prev'));
      if (prev !== slides[i]) { prev.classList.remove('on'); prev.classList.add('prev'); setTimeout(() => prev.classList.remove('prev'), 2000); }
      slides[i].classList.add('on'); const hn = $('#hcn'), hc = $('#hcap'); if (hn) hn.textContent = String(i + 1).padStart(2, '0'); if (hc) hc.textContent = heroCap($('img', slides[i]).getAttribute('src')); dots.forEach((d, k) => { d.classList.remove('on'); if (k === i) { void d.offsetWidth; d.classList.add('on'); } });
    };
    const start = () => { clearInterval(heroTimer); if (!REDUCED) heroTimer = setInterval(() => { if (!document.hidden) show(i + 1); }, 7000); };
    dots.forEach((d, k) => { d.onclick = () => { show(k); start(); }; });
    start();
  }

  function rail() {
    const r = $('#rail'); if (!r) return;
    const bar = $('.rail-bar i'), pv = $('[data-rp]'), nx = $('[data-rn]');
    const upd = () => { const max = r.scrollWidth - r.clientWidth, p = max > 0 ? r.scrollLeft / max : 1; bar.style.transform = `scaleX(${Math.max(0.1, p).toFixed(3)})`; pv.disabled = r.scrollLeft < 4; nx.disabled = r.scrollLeft >= max - 4; };
    const step = () => { const c = $('.jc', r); return c ? c.getBoundingClientRect().width + 20 : 320; };
    pv.onclick = () => r.scrollBy({ left: -step(), behavior: REDUCED ? 'auto' : 'smooth' });
    nx.onclick = () => r.scrollBy({ left: step(), behavior: REDUCED ? 'auto' : 'smooth' });
    r.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    let down = false, sx = 0, sl = 0, moved = 0;
    r.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = 0; sx = e.clientX; sl = r.scrollLeft; });
    window.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 6) { r.classList.add('drag'); r.scrollLeft = sl - dx; } });
    const end = () => { if (!down) return; down = false; setTimeout(() => r.classList.remove('drag'), 0); };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }

  function story() {
    const ts = $$('.story-text'); if (!ts.length || !('IntersectionObserver' in window)) return;
    const imgs = $$('.story-media img'), n = $('#sn');
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const k = +e.target.dataset.i; imgs.forEach((im, j) => im.classList.toggle('on', j === k)); if (n) n.textContent = '0' + (k + 1); }
    }), { rootMargin: '-42% 0px -42% 0px' });
    ts.forEach(t => sio.observe(t));
  }

  function magnet() {
    if (!FINE || REDUCED) return;
    $$('.hero-cta .btn,.cta-row .btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  function frame() {
    ticking = false;
    const y = window.scrollY || root.scrollTop, vh = window.innerHeight, max = root.scrollHeight - vh;
    $('#prog').style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
    const nav = $('#nav'), open = document.body.classList.contains('menu-open');
    const nh = nav.offsetHeight; if (nh && root.dataset.nh !== String(nh)) { root.dataset.nh = nh; root.style.setProperty('--navh', nh + 'px'); }
    nav.classList.toggle('solid', y > 40 || open);
    let hide = nav.classList.contains('hide');
    if (open || y < 500) hide = false; else if (y > lastY + 6) hide = true; else if (y < lastY - 6) hide = false;
    nav.classList.toggle('hide', hide); root.classList.toggle('nh', hide); lastY = y;
    if (!REDUCED) {
      const hi = $('#hero-in'), hm = $('#hero-media');
      if (hi && hm) {
        const hp = Math.max(0, Math.min(1, y / (vh * 0.85))), e = hp * hp * (3 - 2 * hp), sx = innerWidth < 720 ? 7 : 17, R = (e * 60).toFixed(1) + 'vw';
        hm.style.clipPath = hp > 0 ? `inset(${(e * 12).toFixed(2)}vh ${(e * sx).toFixed(2)}vw ${(e * 8).toFixed(2)}vh ${(e * sx).toFixed(2)}vw round ${R} ${R} 0 0)` : '';
        const o = Math.max(0, 1 - hp * 1.8); hi.style.opacity = o.toFixed(3); hi.style.transform = `translate3d(0,${(-hp * 50).toFixed(1)}px,0)`; hi.style.pointerEvents = o < 0.2 ? 'none' : '';
        const hmeta = $('.hero-meta'), hcue = $('.cue'); if (hmeta) hmeta.style.opacity = Math.max(0, 1 - hp * 3).toFixed(3); if (hcue) hcue.style.opacity = Math.max(0, 1 - hp * 4).toFixed(3);
      }
      if (hgS && hgS.offsetParent) {
        const r = hgS.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(1, hgS.offsetHeight - vh)));
        hgT.style.transform = `translate3d(${(-p * hgD).toFixed(1)}px,0,0)`; hgB.style.transform = `scaleX(${p.toFixed(3)})`;
        const n = Math.min(hgN, Math.floor(p * hgN) + 1); if (hgC.textContent !== String(n).padStart(2, '0')) hgC.textContent = String(n).padStart(2, '0');
      }
      driftFrame(vh);
      parEls.forEach(el => {
        const pr = el.parentElement.getBoundingClientRect(); if (pr.bottom < -200 || pr.top > vh + 200) return;
        const extra = (el.offsetHeight - pr.height) / 2, p = (pr.top + pr.height / 2 - vh / 2) / (vh / 2 + pr.height / 2);
        el.style.transform = `translate3d(0,${Math.max(-extra, Math.min(extra, -p * extra)).toFixed(1)}px,0)`;
      });
    }
    litEls.forEach(el => {
      const ws = el._w || (el._w = $$('.sw', el)), r = el.getBoundingClientRect();
      const p = REDUCED ? 1 : Math.max(0, Math.min(1, (vh * 0.88 - r.top) / (vh * 0.5 + r.height)));
      const k = Math.round(p * (ws.length + 1));
      ws.forEach((w, i) => w.classList.toggle('lit', i < k));
    });
    if (tocHs.length) { let k = 0; tocHs.forEach((h, i) => { if (h.getBoundingClientRect().top < vh * 0.35) k = i; }); tocAs.forEach((a, i) => a.classList.toggle('on', i === k)); }
    tlEls.forEach(t => {
      const r = t.getBoundingClientRect(), line = vh * 0.62;
      t.style.setProperty('--p', Math.max(0, Math.min(1, (line - r.top) / r.height)).toFixed(3));
      $$('.tl-i,.day', t).forEach(i => i.classList.toggle('lit', i.getBoundingClientRect().top < line));
    });
  }
  const tick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', () => { hgSetup(); tick(); if (innerWidth > 1024 && document.body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- signature cursor (mouse only) ---------- */
  function cursor() {
    if (!FINE || REDUCED || $('.cur')) return;
    const c = document.createElement('div'); c.className = 'cur'; c.innerHTML = '<span></span>'; document.body.appendChild(c);
    const lab = $('span', c); let x = 0, y = 0, cx = 0, cy = 0, run = false;
    const loop = () => { cx += (x - cx) * 0.28; cy += (y - cy) * 0.28; c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`; if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) requestAnimationFrame(loop); else run = false; };
    document.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; if (!c.classList.contains('on')) { cx = x; cy = y; c.classList.add('on'); root.classList.add('has-cur'); } if (!run) { run = true; requestAnimationFrame(loop); } }, { passive: true });
    document.addEventListener('mouseover', e => {
      const t = e.target, form = t.closest && t.closest('input,select,textarea,.modal');
      c.classList.toggle('hide', !!form);
      const card = t.closest && t.closest('[data-cur]'), rl = t.closest && t.closest('.rail');
      const lk = t.closest && t.closest('a,button,.acc>button,.day>button,.pill-b');
      lab.textContent = card ? card.dataset.cur : rl ? 'Drag' : '';
      c.classList.toggle('lbl', !!(card || rl)); c.classList.toggle('link', !!lk && !card && !rl);
    }, { passive: true });
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
    document.addEventListener('mouseenter', () => c.classList.add('on'));
  }

  /* ---------- inertial smooth scrolling (desktop mouse/trackpad only) ---------- */
  let sT = 0, sC = 0, sLast = 0, sRaf = 0, sOn = false;
  function smoothInit() {
    if (!FINE || REDUCED || sOn) return; sOn = true; root.classList.add('smooth');
    sC = sT = sLast = window.scrollY;
    const step = () => {
      sRaf = 0; const d = sT - sC; sC = Math.abs(d) < 0.5 ? sT : sC + d * 0.095;
      sLast = sC; window.scrollTo({ top: sC, behavior: 'instant' }); sLast = window.scrollY;
      if (Math.abs(sT - sC) >= 0.5) sRaf = requestAnimationFrame(step);
    };
    window.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      if (root.classList.contains('lock') || document.body.classList.contains('menu-open')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const t = e.target; if (t && t.closest && t.closest('.modal,textarea,select,.pills,.tbl-wrap,.prose pre')) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if (!sRaf) { sC = sT = window.scrollY; }          // start from where the page really is
      const max = root.scrollHeight - innerHeight; sT = Math.max(0, Math.min(max, sT + dy));
      if (!sRaf) sRaf = requestAnimationFrame(step);
    }, { passive: false });
    window.addEventListener('scroll', () => { if (Math.abs(window.scrollY - sLast) > 3) { if (sRaf) { cancelAnimationFrame(sRaf); sRaf = 0; } sC = sT = sLast = window.scrollY; } }, { passive: true });
  }

  /* ---------- image drift (parallax inside frames) + 3D tilt on cards ---------- */
  let driftEls = [];
  function driftFrame(vh) {
    driftEls.forEach(im => {
      const r = im.parentElement.getBoundingClientRect(); if (r.bottom < -80 || r.top > vh + 80) return;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
      im.style.translate = `0 ${(-p * 5.5).toFixed(2)}%`;
    });
  }
  if (FINE && !REDUCED) {
    let tiltEl = null;
    document.addEventListener('pointermove', e => {
      const t = e.target.closest && e.target.closest('.jc-img,.pc-img,.hg-img');
      if (tiltEl && tiltEl !== t) { tiltEl.style.transform = ''; tiltEl = null; }
      if (!t) return; tiltEl = t; const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      t.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    }, { passive: true });
  }

  function seasInit() {
    const se = $('#se'); if (!se) return; const tabs = $$('.se-t', se), imgs = $$('.se-img img', se), ps = $$('.se-p', se);
    const set = i => { tabs.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', k === i); }); imgs.forEach((m, k) => m.classList.toggle('on', k === i)); ps.forEach((q, k) => q.classList.toggle('on', k === i)); };
    tabs.forEach((t, i) => { t.addEventListener('click', () => set(i)); t.addEventListener('mouseenter', () => { if (FINE) set(i); }); });
  }
  function hgSetup() {
    hgS = $('#hg'); if (!hgS) return; hgT = $('#hg-track'); hgB = $('#hg-bar'); hgC = $('#hgn'); hgN = $$('.hg-card', hgT).length || 1;
    if (!hgS.offsetParent) return;
    hgD = Math.max(0, hgT.offsetWidth - innerWidth + 0); hgS.style.height = (hgD + innerHeight) + 'px';
  }
  function xpInit() {
    const ul = $('#xp'); if (!ul) return; const lis = $$('li', ul), imgs = $$('.xp-media img');
    const cap = $('#xpc'), descs = EXPERIENCES.map(e => e[1]); const set = i => { if (cap) cap.textContent = descs[i]; lis.forEach((l, k) => { l.classList.toggle('on', k === i); $('.xp-b', l).setAttribute('aria-expanded', k === i); }); imgs.forEach((m, k) => m.classList.toggle('on', k === i)); };
    lis.forEach((l, i) => {
      l.addEventListener('mouseenter', () => { if (FINE) set(i); });
      $('.xp-b', l).addEventListener('click', () => set(i));
      $('.xp-b', l).addEventListener('focus', () => set(i));
    });
  }

  function afterRender() {
    parEls = $$('[data-par]'); litEls = $$('[data-lit]'); tlEls = $$('.tl,.dl'); hgS = null; hgSetup(); xpInit(); seasInit(); driftEls = $$('.pc-img img,.jc-img img,.mz>img,.story-m img,.xp-m img,.strip img');
    sweepImages(app); observe(app); rail(); story(); magnet(); cursor();
    $$('[data-count]').forEach(el => { if (REDUCED || !cio) return; el.textContent = (el.dataset.pre || '') + '0'; cio.observe(el); });
    setTimeout(() => $$('[data-count]').forEach(el => { if (!counted.has(el)) { counted.add(el); el.textContent = (el.dataset.pre || '') + Math.round(+el.dataset.count).toLocaleString('en-IN'); } }), 7000);
    const path = location.pathname.replace(/\/$/, '') || '/';
    $$('.menu > a').forEach(a => a.classList.toggle('on', a.getAttribute('href') !== '/' && (path === a.getAttribute('href') || path.startsWith(a.getAttribute('href') + '/') || (a.getAttribute('href') === '/packages' && path.startsWith('/package/')))));
    if (!pres) { requestAnimationFrame(() => requestAnimationFrame(releaseHeads)); }
    tick(); frame();
  }

  /* ---------- router ---------- */
  async function render(first) {
    const my = ++rid; pending = null; tocHs = []; tocAs = [];
    const wipe = $('#wipe'); if (!first && wipe) { wipe.className = 'wipe in'; await wait(REDUCED ? 0 : 580); }
    const p = location.pathname.replace(/\/$/, '') || '/'; let m, html;
    document.title = S.seo.title;
    try {
      if (p === '/') html = home();
      else if (p === '/packages') { document.title = 'Bhutan Tour Packages | ' + S.brand; html = packagesView(); }
      else if ((m = p.match(/^\/package\/([\w-]+)$/))) html = packageView(m[1]);
      else if (p === '/departures') { document.title = 'Departures & Flights | ' + S.brand; html = departuresView(); }
      else if (p === '/blog') { document.title = 'Travelogues | ' + S.brand; html = blogView(); }
      else if ((m = p.match(/^\/blog\/([\w-]+)$/))) html = await postView(m[1]);
      else if ((m = p.match(/^\/page\/([\w-]+)$/))) html = await pageView(m[1]);
      else if (p === '/faq') { document.title = 'FAQ | ' + S.brand; html = faqView(); }
      else if (p === '/contact') { document.title = 'Contact | ' + S.brand; html = contactView(); }
      else if (p === '/how-to-book') { document.title = 'How to book & pay | ' + S.brand; html = bookView(); }
      else html = notFound();
    } catch (e) { html = '<section class="sec"><div class="wrap" style="padding-top:140px"><h2>Something went wrong</h2><p>Please refresh, or WhatsApp us on ' + esc(S.phone) + '.</p></div></section>'; }
    if (my !== rid) return;
    clearInterval(heroTimer); app.innerHTML = html;
    setMenu(false);
    if (location.hash && $(location.hash)) $(location.hash).scrollIntoView(); else window.scrollTo({ top: 0, behavior: 'instant' });
    lastY = window.scrollY; $('#nav').classList.remove('hide'); root.classList.remove('nh');
    if (pending) { const f = pending; pending = null; try { f(); } catch (e) { console.error(e); } }
    app.classList.remove('leaving');
    afterRender();
    if (!first && wipe) { await wait(120); wipe.className = 'wipe out'; setTimeout(() => { if (wipe.className === 'wipe out') wipe.className = 'wipe'; }, 900); }
  }
  function go(url) { history.pushState(null, '', url); render(); }

  document.addEventListener('click', e => {
    const t = e.target;
    const lk = t.closest && t.closest('a[href]'); if (lk) { const h0 = lk.getAttribute('href') || ''; if (/^https:\/\/wa\.me\//.test(h0)) ping('whatsapp'); else if (h0.startsWith('tel:')) ping('call'); }
    const enq = t.closest('[data-enq]'); if (enq) { e.preventDefault(); openEnquiry({ pkg: enq.dataset.pkg, dep: enq.dataset.dep }); return; }
    if (t.closest('[data-close]') && !t.closest('a[href^="/"]')) { closeModal(); return; }
    if (t.id === 'mbg') { closeModal(); return; }
    if (t.closest('#burger')) { setMenu(!document.body.classList.contains('menu-open')); return; }
    const ab = t.closest('.acc > button, .day > button'); if (ab) { const w = ab.parentElement, o = w.classList.toggle('open'); ab.setAttribute('aria-expanded', o); return; }
    const a = t.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const h = a.getAttribute('href');
    if (h && h.startsWith('/') && !/^\/(admin|uploads|api|sitemap|robots|img|fonts)/.test(h)) {
      e.preventDefault(); closeModal(); setMenu(false);
      if (h.split('#')[0] === location.pathname && h.includes('#')) { const el = $('#' + h.split('#')[1]); el && el.scrollIntoView({ behavior: 'smooth' }); } else go(h);
    } else if (h && h.startsWith('#') && h.length > 1) { e.preventDefault(); const el = $(h); el && el.scrollIntoView({ behavior: 'smooth' }); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); setMenu(false); } });
  window.addEventListener('popstate', () => render());
  document.addEventListener('visibilitychange', () => { if (!document.hidden && $('.hs')) heroSlider(); });

  function finishPreloader() {
    const pre = $('#pre'); pres = false;
    if (pre) { pre.classList.add('done'); setTimeout(() => pre.remove(), 900); }
    requestAnimationFrame(() => requestAnimationFrame(releaseHeads));
  }

  (async function init() {
    const t0 = performance.now();
    try { D = await (await fetch('/api/site')).json(); S = D.settings; } catch (e) {
      app.innerHTML = '<div class="wrap" style="padding:160px var(--gut)"><h2>We\'ll be right back</h2><p>Please WhatsApp us on +91 93244 55999.</p></div>'; const pre = $('#pre'); if (pre) pre.remove(); return;
    }
    const wp = document.createElement('div'); wp.className = 'wipe'; wp.id = 'wipe'; wp.innerHTML = '<span>La Bhutanz</span>'; document.body.appendChild(wp);
    layout(); smoothInit(); await render(true); firstDone = true;
    const hero = $('.hs img'); const imgReady = hero && !hero.complete ? Promise.race([new Promise(r => { hero.addEventListener('load', r, { once: true }); hero.addEventListener('error', r, { once: true }); }), wait(1800)]) : Promise.resolve();
    await imgReady; await wait(Math.max(0, 1100 - (performance.now() - t0)));
    finishPreloader();
    setTimeout(() => $$('img.lz').forEach(im => im.classList.add('ld')), 6000);
  })();
})();
