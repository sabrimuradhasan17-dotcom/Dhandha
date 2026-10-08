(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const pd = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const fd = s => pd(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fm = s => new Date(s + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const THEMES = { heritage: 'Heritage & culture', hills: 'Hills & mountains', beach: 'Beaches & islands', honeymoon: 'Honeymoon', adventure: 'Adventure', spiritual: 'Spiritual & pilgrimage', family: 'Family holidays' };
  const SERVICES = ['Holiday package', 'Honeymoon or anniversary trip', 'Pilgrimage tour', 'Group or corporate travel', 'Flights, trains or hotels only', 'Permits or documents help', 'Something else'];
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.49-8.41Z"/></svg>';
  let D, S;
  const app = $('#app');

  /* ---------- helpers ---------- */
  const hasWA = () => !!(S.whatsapp && S.whatsapp.length > 6);
  const hasPhone = () => !!(S.phone && S.phone.trim());
  const wa = t => 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(t);
  const tel = () => 'tel:' + S.phone.replace(/[^\d+]/g, '');
  const dur = p => p.nights + 'N / ' + p.days + 'D';
  const pkgOf = id => D.packages.find(p => p.id === id);
  const destOf = slug => D.destinations.find(d => d.slug === slug);
  const avail = d => Math.max(0, (+d.seats || 0) - (+d.booked || 0));
  function seat(d) {
    const a = avail(d);
    if (d.status === 'closed' || a <= 0) return { c: 'full', t: 'Sold out', sold: true };
    if (a <= 5) return { c: 'few', t: 'Only ' + a + ' left' };
    return { c: 'open', t: a + ' seats' };
  }
  const priceOf = (p, d) => (d && +d.priceOverride > 0) ? +d.priceOverride : +p.price;
  const showPrice = p => S.showPrices && p.price > 0;
  const priceBlock = p => showPrice(p) ? `<div><small>From</small><br><b>${inr(p.price)}</b> <small>per person</small></div>` : '<div><b>Price on request</b></div>';
  const nextDep = id => D.departures.find(d => d.packageId === id && !seat(d).sold);
  const para = t => String(t || '').split(/\n\n+/).map(x => `<p>${esc(x)}</p>`).join('');
  const greet = () => 'Hello ' + S.brand + ', I would like help planning a trip.';
  const waBtn = (cls, text, label) => hasWA() ? `<a class="btn btn-wa ${cls || ''}" href="${esc(wa(text))}" target="_blank" rel="noopener">${label || 'WhatsApp'}</a>` : '';
  const thumb = (src, alt) => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '';

  function pkgCard(p) {
    const nd = nextDep(p.id), ds = (p.destinations || []).map(destOf).filter(Boolean);
    return `<article class="card"><a class="photo" href="/package/${esc(p.slug)}" aria-label="${esc(p.name)}">${thumb(p.image, p.name)}<span class="badge">${esc(THEMES[p.category] || p.category)}</span><span class="dur">${dur(p)}</span></a>
      <div class="body"><div class="note">${esc(ds.map(d => d.name).join(' · ') || p.stay)}</div><h3 style="margin:0;font-size:1.25rem"><a href="/package/${esc(p.slug)}" style="color:inherit;text-decoration:none">${esc(p.name)}</a></h3>
      <div class="note">${esc(p.stay)}</div><div>${esc(p.summary)}</div>
      ${nd ? `<div class="note">Next group departure: <b>${fd(nd.date)}</b> from ${esc(nd.fromCity)}</div>` : ''}
      <div class="price">${priceBlock(p)}<a class="btn btn-primary btn-sm" href="/package/${esc(p.slug)}">View details</a></div></div></article>`;
  }
  const destCard = d => `<a class="dest" href="/destination/${esc(d.slug)}">${thumb(d.image, d.name)}<span class="dest-t"><b>${esc(d.name)}</b><small>${esc(d.tagline)}</small></span></a>`;

  /* ---------- layout ---------- */
  function layout() {
    const logo = `${S.logo ? `<img src="${esc(S.logo)}" alt="" width="42" height="42">` : ''}<span>Skyland<small>TOURS &amp; TRAVELS</small></span>`;
    $('#hdr').innerHTML = `<div class="wrap"><a class="logo" href="/" aria-label="${esc(S.brand)} home">${logo}</a>
      <button class="burger" id="burger" aria-label="Menu">☰</button>
      <nav class="menu" id="menu"><a href="/destinations">Destinations</a><a href="/packages">Packages</a><a href="/departures">Group departures</a>
        <div class="dd"><button type="button">Plan your trip ▾</button><div class="dd-list"><a href="/blog/best-time-to-visit-india-region-by-region">Best time to visit</a><a href="/page/travel-permits-and-documents">Permits &amp; documents</a><a href="/faq">FAQ</a><a href="/how-to-book">How to book &amp; pay</a><a href="/page/about-us">About us</a></div></div>
        <a href="/blog">Travel journal</a><a href="/contact">Contact</a>
        ${waBtn('btn-sm', greet())}<button class="btn btn-primary btn-sm" data-enq>Enquire</button></nav></div>`;
    if (S.favicon) { let l = $('link[rel=icon]'); if (l) l.href = S.favicon; }
    $('#banner').innerHTML = S.announcement && S.announcement.enabled && S.announcement.text ? `<div class="banner">${esc(S.announcement.text)}</div>` : '';
    const soc = Object.entries(S.social || {}).filter(([, v]) => v).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k === 'x' ? 'X' : k[0].toUpperCase() + k.slice(1))}</a>`).join(' · ');
    const contact = [S.address ? `<p>${esc(S.address)}</p>` : '', hasPhone() ? `<p><a href="${tel()}">${esc(S.phone)}</a></p>` : '', (S.emails || []).length ? `<p>${S.emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join('<br>')}</p>` : '', S.hours ? `<p class="note" style="color:#9fb3c8">${esc(S.hours)}</p>` : ''].join('') || '<p>Send us an enquiry and we will get back to you.</p>';
    $('#ftr').innerHTML = `<div class="wrap"><div class="cols" style="margin-bottom:28px"><div>${S.logo ? `<img src="${esc(S.logo)}" alt="" width="56" height="56" style="margin-bottom:10px;border-radius:14px">` : ''}<h4>${esc(S.brand)}</h4><p>${esc(S.tagline)}</p></div>
      <div><h4>Explore</h4><ul><li><a href="/destinations">Destinations</a></li><li><a href="/packages">Tour packages</a></li><li><a href="/departures">Group departures</a></li><li><a href="/blog">Travel journal</a></li></ul></div>
      <div><h4>Help</h4><ul><li><a href="/faq">FAQ</a></li><li><a href="/how-to-book">How to book &amp; pay</a></li><li><a href="/page/travel-permits-and-documents">Permits &amp; documents</a></li><li><a href="/page/terms">Terms &amp; cancellation</a></li><li><a href="/page/privacy">Privacy</a></li><li><a href="/credits">Photo credits</a></li></ul></div>
      <div><h4>Contact</h4>${contact}</div></div>
      ${soc ? `<div>${soc}</div>` : ''}<p class="note" style="color:#8aa0b8">© ${new Date().getFullYear()} ${esc(S.brand)}. All rights reserved.</p></div>`;
    $('#fab').innerHTML = hasWA() ? `<a class="fab" href="${esc(wa(greet()))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_ICON}</a>` : '';
    $('#mbar').innerHTML = `${hasPhone() ? `<a href="${tel()}">Call</a>` : ''}${hasWA() ? `<a href="${esc(wa(greet()))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<button data-enq>Enquire</button>`;
    $('#mbar').style.gridTemplateColumns = 'repeat(' + ($('#mbar').children.length) + ',1fr)';
  }

  /* ---------- enquiry modal ---------- */
  function openEnquiry(o = {}) {
    const dsel = o.dest || '', pk = o.pkg || '';
    const destOpts = '<option value="">Not decided yet</option>' + D.destinations.map(d => `<option value="${esc(d.slug)}" ${d.slug === dsel ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
    const pkgOpts = '<option value="">Not sure, suggest something</option>' + D.packages.map(p => `<option value="${esc(p.id)}" ${p.id === pk ? 'selected' : ''}>${esc(p.name)} (${dur(p)})</option>`).join('');
    $('#modal').innerHTML = `<div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true" aria-label="Enquiry"><button class="x" data-close aria-label="Close">×</button>
      <div id="enq-body"><h3>Plan your trip</h3><p class="note">Tell us a little and our team will reply with an itinerary and quote${hasWA() ? ' on WhatsApp or phone' : ''}.</p>
      <form id="enq" class="form-grid" novalidate>
        <div><label for="e-name">Your name *</label><input id="e-name" name="name" autocomplete="name" required></div>
        <div><label for="e-phone">Phone / WhatsApp *</label><input id="e-phone" name="phone" type="tel" autocomplete="tel" required></div>
        <div class="full"><label for="e-email">Email (optional)</label><input id="e-email" name="email" type="email" autocomplete="email"></div>
        <div class="full"><label for="e-svc">What do you need?</label><select id="e-svc" name="serviceType">${SERVICES.map(s => `<option>${esc(s)}</option>`).join('')}</select></div>
        <div><label for="e-dest">Destination</label><select id="e-dest" name="destination">${destOpts}</select></div>
        <div><label for="e-pkg">Package</label><select id="e-pkg" name="packageId">${pkgOpts}</select></div>
        <div class="full"><label for="e-dep">Group departure</label><select id="e-dep" name="departureId"></select></div>
        <div><label for="e-month">Preferred travel month</label><input id="e-month" name="travelMonth" type="month"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label for="e-ad">Adults</label><input id="e-ad" name="adults" type="number" min="1" value="2"></div><div><label for="e-ch">Children</label><input id="e-ch" name="children" type="number" min="0" value="0"></div></div>
        <div class="full"><label for="e-msg">Anything else? (budget, interests, special occasion)</label><textarea id="e-msg" name="message" rows="3"></textarea></div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="full err" id="e-err" role="alert"></div>
        <div class="full"><button class="btn btn-primary btn-block" id="e-go">Send enquiry</button><p class="note" style="margin-top:8px">By submitting you agree to be contacted about your trip. See our <a href="/page/privacy" data-close>privacy policy</a>.</p></div>
      </form></div></div></div>`;
    const depSel = $('#e-dep');
    const fillDeps = sel => {
      const id = $('#e-pkg').value, list = D.departures.filter(d => (!id || d.packageId === id) && !seat(d).sold);
      depSel.innerHTML = '<option value="">Private trip on my own dates</option>' + list.map(d => `<option value="${esc(d.id)}" ${d.id === sel ? 'selected' : ''}>${fd(d.date)} · ${esc(d.fromCity)}${id ? '' : ' · ' + esc((pkgOf(d.packageId) || {}).name || '')}</option>`).join('');
    };
    fillDeps(o.dep); $('#e-pkg').onchange = () => fillDeps('');
    setTimeout(() => $('#e-name').focus(), 50);
    $('#enq').onsubmit = async ev => {
      ev.preventDefault(); const f = ev.target, b = Object.fromEntries(new FormData(f)); $('#e-err').textContent = '';
      $('#e-go').disabled = true; $('#e-go').textContent = 'Sending…';
      try {
        const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...b, source: o.source || location.pathname }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Something went wrong');
        const p = pkgOf(b.packageId), d = D.departures.find(x => x.id === b.departureId), ds = destOf(b.destination);
        const text = `Hello ${S.brand}, I'm ${b.name} (ref ${j.ref}). I'd like help with: ${b.serviceType}` + (p ? ` — ${p.name} ${dur(p)}` : (ds ? ` — ${ds.name}` : '')) + (d ? `, departing ${fd(d.date)} from ${d.fromCity}` : (b.travelMonth ? ` in ${fm(b.travelMonth)}` : '')) + ` for ${b.adults} adult(s)` + (+b.children ? ` + ${b.children} child(ren)` : '') + '.' + (b.message ? ' ' + b.message : '');
        $('#enq-body').innerHTML = `<h3>Thank you, ${esc(b.name.split(' ')[0])}!</h3><p>Your enquiry <b>#${esc(j.ref)}</b> has reached our team. We'll contact you on <b>${esc(b.phone)}</b> shortly.</p>${hasWA() ? `<p>Want a faster reply? Continue on WhatsApp with your details pre-filled.</p><a class="btn btn-wa btn-block" href="${esc(wa(text))}" target="_blank" rel="noopener">Continue on WhatsApp</a>` : ''}<p style="text-align:center"><button class="btn btn-ghost btn-sm" data-close style="margin-top:12px">Close</button></p>`;
      } catch (e) { $('#e-err').textContent = e.message; $('#e-go').disabled = false; $('#e-go').textContent = 'Send enquiry'; }
    };
  }
  const closeModal = () => { $('#modal').innerHTML = ''; };

  /* ---------- views ---------- */
  const faqItem = f => `<details><summary>${esc(f.q)}</summary><div class="acc-b">${esc(f.a)}</div></details>`;
  const postCard = p => `<article class="card post-card"><a class="photo short" href="/blog/${esc(p.slug)}" aria-label="${esc(p.title)}">${thumb(p.image, p.title)}</a><div class="body"><div class="note">${fd(p.date)}</div><h3 style="margin:0;font-size:1.2rem"><a href="/blog/${esc(p.slug)}" style="color:inherit;text-decoration:none">${esc(p.title)}</a></h3><div>${esc(p.excerpt)}</div></div></article>`;

  function depTable(list, compact) {
    if (!list.length) return '<div class="empty">No group departures are scheduled right now. Every package can run privately on your dates, so <button class="btn btn-primary btn-sm" data-enq>send us an enquiry</button>.</div>';
    return `<div class="table-wrap" style="margin-top:22px"><table><thead><tr><th>Departure</th><th>Package</th><th>Travel</th><th>Price / person</th><th>Seats</th><th></th></tr></thead><tbody>${list.map(d => {
      const p = pkgOf(d.packageId) || { name: 'Package', nights: '', days: '', price: 0 }, s = seat(d), price = priceOf(p, d);
      const fl = [d.airline, d.flightNo].filter(Boolean).join(' · ');
      return `<tr><td><b>${fd(d.date)}</b><br><span class="note">from ${esc(d.fromCity)}</span></td><td><a href="/package/${esc(p.slug || '')}"><b>${esc(p.name)}</b></a><br><span class="note">${p.nights ? dur(p) : ''}</span></td>
        <td>${fl ? esc(fl) + '<br>' : ''}<span class="note">${esc(d.route || 'Land package')}${d.depTime ? ' · ' + esc(d.depTime) + (d.arrTime ? ' → ' + esc(d.arrTime) : '') : ''}</span>${d.notes && !compact ? `<br><span class="note">${esc(d.notes)}</span>` : ''}</td>
        <td><b>${S.showPrices && price > 0 ? inr(price) : 'On request'}</b></td><td><span class="pill ${s.c}">${s.t}</span></td>
        <td>${s.sold ? `<button class="btn btn-ghost btn-sm" data-enq data-pkg="${esc(d.packageId)}">Waitlist</button>` : `<button class="btn btn-primary btn-sm" data-enq data-pkg="${esc(d.packageId)}" data-dep="${esc(d.id)}">Reserve</button>`}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  const STEPS = [['Tell us your plan', 'Share dates, group and interests through the form or WhatsApp.'], ['Get a tailored quote', 'A day-wise itinerary with clear per-person pricing.'], ['Confirm with an advance', 'We book hotels, transport and permits.'], ['Travel with support', 'A trip coordinator is reachable throughout your journey.']];
  const WHY = [['One team, end to end', 'Hotels, vehicles, guides, permits and on-trip help from a single point of contact.'], ['Planned around you', 'Every package is a starting point. We change the route, hotels and pace to suit your group.'], ['Clear pricing', 'You see what is included and what is not before you pay anything.'], ['Honest local advice', 'We tell you the best season, realistic driving times and what to skip.']];
  const SERVICE_CARDS = [['Holiday packages', 'Family, friends and couples trips with hotels, transport and sightseeing included.'], ['Honeymoon & anniversary', 'Private, unhurried itineraries with houseboats, resorts and romantic stays.'], ['Pilgrimage tours', 'Comfortable, well-paced yatras for families and senior travellers.'], ['Group & corporate', 'Offsites, school trips and family reunions with dedicated coordination.'], ['Flights, trains & hotels', 'Tickets and stays booked on their own, or added to any package.'], ['Permits & documents', 'Guidance on ID, inner-line and protected-area permits where required.']];

  function home() {
    const feat = D.packages.filter(p => p.featured).slice(0, 6), list = feat.length ? feat : D.packages.slice(0, 6);
    const deps = D.departures.filter(d => !seat(d).sold).slice(0, 5);
    const prices = D.packages.filter(showPrice).map(p => p.price);
    const counts = Object.keys(THEMES).map(k => [k, D.packages.filter(p => p.category === k).length]).filter(x => x[1]);
    setTimeout(() => { const fnd = $('#finder'); if (fnd) fnd.onsubmit = e => { e.preventDefault(); const u = new URLSearchParams(); ['dest', 'cat', 'dur'].forEach(k => { const v = $('#f-' + k).value; if (v) u.set(k, v); }); go('/packages' + (u.toString() ? '?' + u : '')); }; }, 0);
    return `<div class="hero" ${S.heroImage ? `style="background-image:url('${esc(S.heroImage)}')"` : ''}><div class="wrap"><div class="eyebrow" style="color:#ffd9a8">${esc(S.tagline)}</div><h1>${esc(S.heroTitle)}</h1><p>${esc(S.heroSub)}</p>
      <div class="hero-cta"><button class="btn btn-sun" data-enq>Plan my trip</button>${waBtn('', greet(), 'Chat on WhatsApp')}</div>
      <form class="finder" id="finder"><div><label for="f-dest">Where to?</label><select id="f-dest"><option value="">Anywhere in India</option>${D.destinations.map(d => `<option value="${esc(d.slug)}">${esc(d.name)}</option>`).join('')}</select></div>
      <div><label for="f-cat">Trip style</label><select id="f-cat"><option value="">Any</option>${Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div><label for="f-dur">Duration</label><select id="f-dur"><option value="">Any</option><option value="s">Up to 4 nights</option><option value="m">5 to 6 nights</option><option value="l">7+ nights</option></select></div>
      <div style="align-self:end"><button class="btn btn-primary btn-block">Find trips</button></div></form></div></div>
      <div class="wrap"><div class="stats"><div class="stat"><b>${D.destinations.length}</b>Destinations</div><div class="stat"><b>${D.packages.length}</b>Tour packages</div><div class="stat">${prices.length ? `<b>${inr(Math.min(...prices))}</b>Starting per person` : '<b>Custom</b>Itineraries and quotes'}</div><div class="stat"><b>Pan-India</b>Coverage</div></div></div>
      <section><div class="wrap"><div class="eyebrow">Popular destinations</div><h2>Where do you want to go?</h2><p class="lead">From the Himalayas to the backwaters and the desert, choose a region and we will build the rest.</p><div class="dest-grid" style="margin-top:24px">${D.destinations.slice(0, 8).map(destCard).join('')}</div><p style="margin-top:24px"><a class="btn btn-ghost" href="/destinations">All ${D.destinations.length} destinations →</a></p></div></section>
      <section class="alt"><div class="wrap"><div class="eyebrow">Featured trips</div><h2>Popular tour packages</h2><p class="lead">Every itinerary can be customised: change the hotels, add a stop or stretch the days.</p><div class="grid" style="margin-top:24px">${list.map(pkgCard).join('')}</div><p style="margin-top:24px"><a class="btn btn-ghost" href="/packages">See all packages →</a></p></div></section>
      <section><div class="wrap"><div class="eyebrow">Browse by style</div><h2>What kind of trip do you want?</h2><div class="themes">${counts.map(([k, n]) => `<a class="theme" href="/packages?cat=${k}"><b>${esc(THEMES[k])}</b><small>${n} ${n === 1 ? 'package' : 'packages'}</small></a>`).join('')}</div></div></section>
      <section class="alt"><div class="wrap"><div class="eyebrow">What we do</div><h2>Everything for your journey</h2><div class="cols" style="margin-top:20px">${SERVICE_CARDS.map(s => `<div class="feat"><h3>${s[0]}</h3><p class="note" style="font-size:.95rem">${s[1]}</p></div>`).join('')}</div></div></section>
      ${deps.length ? `<section><div class="wrap"><div class="eyebrow">Fixed &amp; scheduled</div><h2>Upcoming group departures</h2>${depTable(deps, true)}<p style="margin-top:20px"><a class="btn btn-ghost" href="/departures">All departures →</a></p></div></section>` : ''}
      <section class="${deps.length ? 'alt' : ''}"><div class="wrap"><div class="eyebrow">Why ${esc(S.brand)}</div><h2>Planning that feels personal</h2><div class="cols">${WHY.map(w => `<div class="feat"><h3>${w[0]}</h3><p class="note" style="font-size:.95rem">${w[1]}</p></div>`).join('')}</div>
        <h3 style="margin-top:44px">How it works</h3><div class="steps">${STEPS.map(s => `<div><b>${s[0]}</b><br>${s[1]}</div>`).join('')}</div></div></section>
      ${D.testimonials.length ? `<section class="alt"><div class="wrap"><div class="eyebrow">Guest stories</div><h2>Loved by travellers</h2><div class="cols">${D.testimonials.map(t => `<div class="feat"><div style="color:#f28c28">${'★'.repeat(Math.max(1, Math.min(5, t.rating || 5)))}</div><p class="tq">“${esc(t.text)}”</p><b>${esc(t.name)}</b><div class="note">${esc(t.place)}</div></div>`).join('')}</div></div></section>` : ''}
      ${D.posts.length ? `<section class="${D.testimonials.length ? '' : 'alt'}"><div class="wrap"><div class="eyebrow">Travel journal</div><h2>Guides to plan your trip</h2><div class="grid" style="margin-top:20px">${D.posts.slice(0, 3).map(postCard).join('')}</div></div></section>` : ''}
      <section class="${D.posts.length && !D.testimonials.length ? '' : 'alt'}"><div class="wrap"><div class="eyebrow">Good to know</div><h2>Common questions</h2><div style="max-width:820px">${D.faqs.slice(0, 6).map(faqItem).join('')}</div><p><a href="/faq">All FAQs →</a></p></div></section>
      <section><div class="wrap"><div class="cta"><div><h2 style="color:#fff">Ready to plan your trip?</h2><p>Share your dates and interests and we will send a personalised itinerary and quote.</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-sun" data-enq>Send enquiry</button>${hasPhone() ? `<a class="btn btn-ghost" href="${tel()}">Call ${esc(S.phone)}</a>` : waBtn('', greet(), 'WhatsApp us')}</div></div></div></section>`;
  }

  function destinationsView() {
    const regions = [...new Set(D.destinations.map(d => d.region))];
    setTimeout(() => { $('#rg').onclick = e => { const r = e.target.dataset.r; if (r === undefined) return; $$('#rg .chip').forEach(c => c.classList.toggle('on', c.dataset.r === r)); $('#dg').innerHTML = D.destinations.filter(d => !r || d.region === r).map(destCard).join(''); }; }, 0);
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Destinations</div><h1>Destinations across India</h1><p class="lead">Pick a region to explore, or tell us what you want and we will suggest where to go.</p>
      <div class="chips" id="rg"><button class="chip on" data-r="">All regions</button>${regions.map(r => `<button class="chip" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div><div class="dest-grid" id="dg">${D.destinations.map(destCard).join('')}</div></div></section>`;
  }

  function destinationView(slug) {
    const d = destOf(slug); if (!d) return notFound();
    document.title = `${d.name} Tour Packages and Travel Guide | ${S.brand}`;
    const pk = D.packages.filter(p => (p.destinations || []).includes(slug));
    const others = D.destinations.filter(x => x.slug !== slug && x.region === d.region).slice(0, 4);
    return `<section style="padding-top:34px"><div class="wrap"><div class="crumb"><a href="/">Home</a> › <a href="/destinations">Destinations</a> › ${esc(d.name)}</div>
      <div class="pkg-hero">${d.image ? `<img src="${esc(d.image)}" alt="${esc(d.name)}">` : ''}<div class="pkg-cap"><h1>${esc(d.name)}</h1><p>${esc(d.tagline)}</p></div></div>
      <div class="facts"><div><small>State</small><b>${esc(d.state)}</b></div><div><small>Region</small><b>${esc(d.region)}</b></div><div><small>Best time</small><b>${esc(d.bestTime)}</b></div></div>
      <div class="prose" style="max-width:820px"><p class="lead">${esc(d.description)}</p><h3>Highlights</h3><ul class="ticks">${d.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul></div>
      <h2 style="margin-top:40px">${pk.length ? 'Tour packages for ' + esc(d.name) : 'Plan a trip to ' + esc(d.name)}</h2>
      ${pk.length ? `<div class="grid" style="margin-top:16px">${pk.map(pkgCard).join('')}</div>` : `<p class="lead">We build ${esc(d.name)} trips on request around your dates and budget.</p>`}
      <p style="margin-top:24px"><button class="btn btn-primary" data-enq data-dest="${esc(d.slug)}">Plan a trip to ${esc(d.name)}</button> ${waBtn('', `Hello ${S.brand}, I'm interested in a trip to ${d.name}.`)}</p>
      ${others.length ? `<h3 style="margin-top:40px">More in ${esc(d.region)} India</h3><div class="dest-grid" style="margin-top:12px">${others.map(destCard).join('')}</div>` : ''}</div></section>`;
  }

  function packagesView() {
    const q = new URLSearchParams(location.search);
    const st = { dest: q.get('dest') || '', cat: q.get('cat') || '', dur: q.get('dur') || '', q: q.get('q') || '', sort: q.get('sort') || '' };
    const html = `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Packages</div><h1>Tour packages</h1><p class="lead">Holidays, pilgrimages and adventures across India. Prices are per person; every itinerary can be customised.</p>
      <div class="chips" id="pk-chips"></div><div class="form-grid" style="max-width:900px;grid-template-columns:2fr 1.4fr 1fr 1fr"><div><label for="pk-q">Search</label><input id="pk-q" placeholder="e.g. houseboat, Taj Mahal, rafting" value="${esc(st.q)}"></div>
      <div><label for="pk-dest">Destination</label><select id="pk-dest"><option value="">All destinations</option>${D.destinations.map(d => `<option value="${esc(d.slug)}">${esc(d.name)}</option>`).join('')}</select></div>
      <div><label for="pk-dur">Duration</label><select id="pk-dur"><option value="">Any</option><option value="s">Up to 4 nights</option><option value="m">5 to 6 nights</option><option value="l">7+ nights</option></select></div>
      <div><label for="pk-sort">Sort</label><select id="pk-sort"><option value="">Recommended</option><option value="pa">Price: low to high</option><option value="pd">Price: high to low</option><option value="d">Shortest first</option></select></div></div>
      <div class="note" id="pk-count" style="margin-top:14px"></div><div class="grid" id="pk-grid" style="margin-top:12px"></div></div></section>`;
    setTimeout(() => {
      $('#pk-dest').value = st.dest; $('#pk-dur').value = st.dur; $('#pk-sort').value = st.sort;
      const draw = () => {
        st.q = $('#pk-q').value; st.dest = $('#pk-dest').value; st.dur = $('#pk-dur').value; st.sort = $('#pk-sort').value;
        $('#pk-chips').innerHTML = ['', ...Object.keys(THEMES)].map(c => `<button class="chip ${st.cat === c ? 'on' : ''}" data-cat="${c}">${c ? THEMES[c] : 'All styles'}</button>`).join('');
        let l = D.packages.filter(p => (!st.cat || p.category === st.cat) && (!st.dest || (p.destinations || []).includes(st.dest)) && (!st.dur || (st.dur === 's' ? p.nights <= 4 : st.dur === 'm' ? p.nights >= 5 && p.nights <= 6 : p.nights >= 7)) &&
          (!st.q || (p.name + ' ' + p.summary + ' ' + p.stay + ' ' + p.highlights.join(' ') + ' ' + (p.destinations || []).map(x => (destOf(x) || {}).name).join(' ')).toLowerCase().includes(st.q.toLowerCase())));
        if (st.sort === 'pa') l.sort((a, b) => a.price - b.price); if (st.sort === 'pd') l.sort((a, b) => b.price - a.price); if (st.sort === 'd') l.sort((a, b) => a.nights - b.nights);
        $('#pk-count').textContent = l.length + (l.length === 1 ? ' package' : ' packages');
        $('#pk-grid').innerHTML = l.length ? l.map(pkgCard).join('') : '<div class="empty" style="grid-column:1/-1">No packages match. <button class="btn btn-primary btn-sm" data-enq>Ask us for a custom itinerary</button></div>';
        const u = new URLSearchParams(); Object.entries(st).forEach(([k, v]) => v && u.set(k, v)); history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
      };
      $('#pk-chips').onclick = e => { if (e.target.dataset.cat !== undefined) { st.cat = e.target.dataset.cat; draw(); } };
      ['pk-q', 'pk-dest', 'pk-dur', 'pk-sort'].forEach(id => $('#' + id).oninput = draw); draw();
    }, 0);
    return html;
  }

  function packageView(slug) {
    const p = D.packages.find(x => x.slug === slug); if (!p) return notFound();
    document.title = `${p.name} ${dur(p)} | ${S.brand}`;
    const deps = D.departures.filter(d => d.packageId === p.id), ds = (p.destinations || []).map(destOf).filter(Boolean);
    const sec = (id, t, body) => body ? `<section id="${id}" style="padding:26px 0 0"><h2>${t}</h2>${body}</section>` : '';
    setTimeout(() => {
      const upd = () => {
        const pax = Math.max(1, +$('#x-pax').value || 1), dsel = $('#x-dep').value, d = D.departures.find(x => x.id === dsel), each = priceOf(p, d);
        const base = each * pax, gst = S.gstIncluded ? 0 : base * ((+S.gstPct || 0) / 100);
        $('#x-est').innerHTML = showPrice(p) ? `<div><span>Package × ${pax}</span><b>${inr(base)}</b></div>${gst ? `<div><span>GST ${S.gstPct}%</span><b>${inr(gst)}</b></div>` : ''}<div class="tot"><span>Estimated total</span><b>${inr(base + gst)}</b></div>` : '<div class="note">Price on request. Send an enquiry for a personalised quote.</div>';
        $('#x-book').dataset.dep = dsel;
      };
      $('#x-pax').oninput = upd; $('#x-dep').onchange = upd; upd();
    }, 0);
    return `<section style="padding-top:34px"><div class="wrap"><div class="crumb"><a href="/">Home</a> › <a href="/packages">Packages</a> › ${esc(p.name)}</div>
      <div class="pkg-hero">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : ''}<div class="pkg-cap"><h1>${esc(p.name)}</h1><p>${dur(p)} · ${esc(p.stay)}</p></div></div>
      <div class="facts"><div><small>Duration</small><b>${p.nights} nights / ${p.days} days</b></div><div><small>Destinations</small><b>${ds.length ? ds.map(d => `<a href="/destination/${esc(d.slug)}">${esc(d.name)}</a>`).join(', ') : '—'}</b></div><div><small>Trip style</small><b>${esc(THEMES[p.category] || p.category)}</b></div><div><small>Flights</small><b>${p.flightIncluded ? 'Included' : 'Not included'}</b></div></div>
      <div class="detail"><div>
        <div class="subnav"><a href="#overview">Overview</a><a href="#itinerary">Itinerary</a><a href="#inclusions">Inclusions</a><a href="#departures">Departures</a>${p.faqs.length ? '<a href="#faqs">FAQs</a>' : ''}</div>
        <section id="overview" style="padding:0"><p class="lead" style="font-size:1.15rem">${esc(p.summary)}</p>${para(p.intro)}
          ${p.highlights.length ? `<h3>Journey highlights</h3><ul class="ticks">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</section>
        ${sec('itinerary', 'Day-by-day itinerary', p.itinerary.length ? `<div class="days">${p.itinerary.map((d, i) => `<details ${i === 0 ? 'open' : ''}><summary><b>Day ${i + 1}</b> — ${esc(d.title)}</summary>${d.meta ? `<div class="meta">${esc(d.meta)}</div>` : ''}<div class="acc-b">${esc(d.desc)}</div></details>`).join('')}</div>` : '')}
        ${sec('inclusions', 'What’s included', `<div class="cols" style="grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))"><div><h3>Included</h3><ul class="ticks">${p.inclusions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3>Not included</h3><ul class="ticks x">${p.exclusions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`)}
        ${sec('departures', 'Group departures', deps.length ? depTable(deps) + '<p class="note">Prefer different dates? Every journey can run privately on your preferred dates.</p>' : '<p>This journey runs privately on your preferred dates. <button class="btn btn-primary btn-sm" data-enq data-pkg="' + esc(p.id) + '">Check availability</button></p>')}
        ${p.ideal.length ? sec('ideal', 'Who is this trip ideal for?', `<ul class="ticks">${p.ideal.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`) : ''}
        ${(S.documents || []).length ? sec('documents', 'Documents to carry', `<ul class="ticks">${S.documents.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`) : ''}
        ${p.faqs.length ? sec('faqs', 'Frequently asked questions', p.faqs.map(faqItem).join('')) : ''}
      </div>
      <aside class="side"><div class="note">${showPrice(p) ? 'From' : 'Pricing'}</div><div class="bigprice">${showPrice(p) ? inr(p.price) : 'On request'}${showPrice(p) ? ' <small>per person</small>' : ''}</div>
        <hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><label for="x-pax">Travellers</label><input id="x-pax" type="number" min="1" value="2">
        <label for="x-dep" style="margin-top:10px">Departure</label><select id="x-dep"><option value="">Private trip on my dates</option>${deps.filter(d => !seat(d).sold).map(d => `<option value="${esc(d.id)}">${fd(d.date)} · ${esc(d.fromCity)}</option>`).join('')}</select>
        <div class="est" id="x-est" style="margin:14px 0"></div>
        <button class="btn btn-primary btn-block" id="x-book" data-enq data-pkg="${esc(p.id)}">Enquire / book this trip</button>
        ${hasWA() ? `<a class="btn btn-wa btn-block" style="margin-top:8px" target="_blank" rel="noopener" href="${esc(wa(`Hello ${S.brand}, I'm interested in the ${p.name} (${dur(p)}) package.`))}">WhatsApp us</a>` : ''}
        <p class="note" style="margin-top:10px">Estimate only. The final quote confirms hotels, season and group size. ${esc(S.advanceInfo)} <a href="/how-to-book">How to book &amp; pay</a></p></aside></div></div></section>`;
  }

  function departuresView() {
    setTimeout(() => {
      const draw = () => {
        const pk = $('#dp-pkg').value, mo = $('#dp-mo').value;
        $('#dp-out').innerHTML = depTable(D.departures.filter(d => (!pk || d.packageId === pk) && (!mo || d.date.slice(0, 7) === mo)));
      };
      $('#dp-pkg').onchange = $('#dp-mo').onchange = draw; draw();
    }, 0);
    const months = [...new Set(D.departures.map(d => d.date.slice(0, 7)))];
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Group departures</div><h1>Group departures</h1><p class="lead">Scheduled departures with live seat availability. Prefer your own dates? Private departures are available on every package.</p>
      <div class="form-grid" style="max-width:640px;margin-top:16px"><div><label for="dp-pkg">Package</label><select id="dp-pkg"><option value="">All packages</option>${[...new Set(D.departures.map(d => d.packageId))].map(id => { const p = pkgOf(id); return p ? `<option value="${esc(id)}">${esc(p.name)}</option>` : ''; }).join('')}</select></div>
      <div><label for="dp-mo">Month</label><select id="dp-mo"><option value="">All months</option>${months.map(m => `<option value="${m}">${fm(m)}</option>`).join('')}</select></div></div>
      <div id="dp-out"></div></div></section>`;
  }

  async function postView(slug) {
    const r = await fetch('/api/post/' + encodeURIComponent(slug)); if (!r.ok) return notFound(); const p = await r.json(); document.title = p.title + ' | ' + S.brand;
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › <a href="/blog">Travel journal</a></div><div class="note">${fd(p.date)}</div><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(p.title)}</h1>${p.image ? `<img src="${esc(p.image)}" alt="" style="border-radius:var(--r);margin:16px 0;width:100%">` : ''}${p.body}<p style="margin-top:30px"><button class="btn btn-primary" data-enq>Plan my trip</button></p></div></section>`;
  }
  async function pageView(slug) {
    const r = await fetch('/api/page/' + encodeURIComponent(slug)); if (!r.ok) return notFound(); const p = await r.json(); document.title = p.title + ' | ' + S.brand;
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › ${esc(p.title)}</div><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(p.title)}</h1>${p.html}<p style="margin-top:30px"><button class="btn btn-primary" data-enq>Ask us a question</button> ${waBtn('', 'Hello ' + S.brand + ', I have a question about ' + p.title + '.')}</p></div></section>`;
  }
  const blogView = () => `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Travel journal</div><h1>Travel journal</h1><p class="lead">Practical guides and ideas to help you plan your trip.</p><div class="grid" style="margin-top:24px">${D.posts.map(postCard).join('') || '<div class="empty">Articles coming soon.</div>'}</div></div></section>`;
  function faqView() {
    setTimeout(() => $('#fq').oninput = e => { const q = e.target.value.toLowerCase(); $$('#fq-list details').forEach(d => d.style.display = d.textContent.toLowerCase().includes(q) ? '' : 'none'); }, 0);
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › FAQ</div><h1>Frequently asked questions</h1><p class="lead">Booking, payments, permits, seasons and more.</p><div style="max-width:820px"><input id="fq" placeholder="Search questions…" style="margin:16px 0" aria-label="Search FAQ"><div id="fq-list">${D.faqs.map(faqItem).join('')}</div></div>
      <p style="margin-top:20px">Can’t find your answer? <button class="btn btn-primary btn-sm" data-enq>Ask our team</button></p></div></section>`;
  }
  function contactView() {
    const map = S.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(S.address) : '';
    const lines = [S.address ? `<p>${esc(S.address)}</p>` : '', (hasPhone() || hasWA() || (S.emails || []).length) ? `<p>${hasPhone() ? `<b>Call:</b> <a href="${tel()}">${esc(S.phone)}</a><br>` : ''}${hasWA() ? `<b>WhatsApp:</b> <a target="_blank" rel="noopener" href="${esc(wa('Hello'))}">+${esc(S.whatsapp)}</a><br>` : ''}${(S.emails || []).length ? `<b>Email:</b> ${S.emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(' · ')}` : ''}</p>` : '', S.hours ? `<p class="note">${esc(S.hours)}</p>` : '', map ? `<p><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(map)}">Open in Google Maps</a></p>` : ''].join('') || '<p>Send us an enquiry and our team will get back to you.</p>';
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Contact</div><h1>Contact ${esc(S.brand)}</h1><p class="lead">Tell us where you want to go and when. We will reply with a personalised itinerary and quote.</p>
      <div class="cols" style="margin-top:20px"><div class="feat"><h3>Get in touch</h3>${lines}</div>
      <div class="feat"><h3>Send an enquiry</h3><p>Share your plan and we will respond with suggestions.</p><button class="btn btn-primary btn-block" data-enq>Plan my trip</button>${waBtn('btn-block', greet(), 'Chat on WhatsApp').replace('class="btn', 'style="margin-top:10px" class="btn')}</div></div></div></section>`;
  }
  function bookView() {
    const pay = S.payment || {}, has = pay.upiId || pay.bank || pay.accountNo;
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › How to book &amp; pay</div><h1>How to book &amp; pay</h1>
      <div class="steps" style="margin:24px 0"><div><b>Enquire</b><br>Send an enquiry or WhatsApp us your dates and group size.</div><div><b>Receive your quote</b><br>A personalised itinerary with clear per-person pricing.</div><div><b>Pay the advance</b><br>${esc(S.advanceInfo)}</div><div><b>Share documents</b><br>Send ID details so we can arrange hotels, tickets and any permits.</div></div>
      ${has ? `<h3>Payment details</h3><div class="feat">${pay.upiId ? `<p><b>UPI:</b> ${esc(pay.upiId)}</p>` : ''}${pay.accountName ? `<p><b>Account name:</b> ${esc(pay.accountName)}</p>` : ''}${pay.bank ? `<p><b>Bank:</b> ${esc(pay.bank)}</p>` : ''}${pay.accountNo ? `<p><b>Account no.:</b> ${esc(pay.accountNo)}</p>` : ''}${pay.ifsc ? `<p><b>IFSC:</b> ${esc(pay.ifsc)}</p>` : ''}${pay.note ? `<p class="note">${esc(pay.note)}</p>` : ''}</div>` : '<p>We will share payment details (UPI or bank transfer) with your confirmed quotation.</p>'}
      ${(S.documents || []).length ? `<h3>Documents we need from you</h3><ul class="ticks">${S.documents.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="note">Please read our <a href="/page/terms">terms &amp; cancellation policy</a> before paying. ${S.gstPct}% GST applies on tour services where it is not already included.</p>
      <p><button class="btn btn-primary" data-enq>Start my enquiry</button></p></div></section>`;
  }
  async function creditsView() {
    let c = {}; try { c = await (await fetch('/api/credits')).json(); } catch (e) {}
    const label = k => { const [t, s] = k.split('/'); if (k === 'hero') return 'Home page banner'; const n = t === 'destinations' ? (destOf(s) || {}).name : (pkgOf(s) || {}).name; return (n || s) + (t === 'packages' ? ' (package)' : ''); };
    const rows = Object.entries(c).map(([k, v]) => `<tr><td>${esc(label(k))}</td><td>${esc(v.who || 'Unsplash photographer')}</td><td><a href="${esc(v.page)}" target="_blank" rel="noopener">View photo</a></td></tr>`).join('');
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › Photo credits</div><h1>Photo credits</h1><p>Photographs on this website come from <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a> and are used under the Unsplash License, which allows free use. Thank you to the photographers below.</p>
      <div class="table-wrap" style="margin-top:20px"><table style="min-width:520px"><thead><tr><th>Used for</th><th>Photographer</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`;
  }
  const notFound = () => { document.title = 'Page not found | ' + S.brand; return `<section><div class="wrap" style="text-align:center;padding:60px 0"><h1>Page not found</h1><p class="lead" style="margin:auto">That page doesn't exist, but there is plenty of India to explore.</p><p style="margin-top:20px"><a class="btn btn-primary" href="/destinations">Browse destinations</a></p></div></section>`; };

  /* ---------- router ---------- */
  async function render() {
    const p = location.pathname.replace(/\/$/, '') || '/'; let m, html;
    document.title = S.seo.title;
    if (p === '/') html = home();
    else if (p === '/destinations') { document.title = 'Destinations across India | ' + S.brand; html = destinationsView(); }
    else if ((m = p.match(/^\/destination\/([\w-]+)$/))) html = destinationView(m[1]);
    else if (p === '/packages') { document.title = 'Tour packages | ' + S.brand; html = packagesView(); }
    else if ((m = p.match(/^\/package\/([\w-]+)$/))) html = packageView(m[1]);
    else if (p === '/departures') { document.title = 'Group departures | ' + S.brand; html = departuresView(); }
    else if (p === '/blog') { document.title = 'Travel journal | ' + S.brand; html = blogView(); }
    else if ((m = p.match(/^\/blog\/([\w-]+)$/))) html = await postView(m[1]);
    else if ((m = p.match(/^\/page\/([\w-]+)$/))) html = await pageView(m[1]);
    else if (p === '/faq') { document.title = 'FAQ | ' + S.brand; html = faqView(); }
    else if (p === '/contact') { document.title = 'Contact | ' + S.brand; html = contactView(); }
    else if (p === '/how-to-book') { document.title = 'How to book & pay | ' + S.brand; html = bookView(); }
    else if (p === '/credits') { document.title = 'Photo credits | ' + S.brand; html = await creditsView(); }
    else html = notFound();
    app.innerHTML = html;
    $('#menu') && $('#menu').classList.remove('open');
    if (location.hash && $(location.hash)) $(location.hash).scrollIntoView(); else window.scrollTo(0, 0);
  }
  function go(url) { history.pushState(null, '', url); render(); }
  document.addEventListener('click', e => {
    const t = e.target;
    const enq = t.closest('[data-enq]'); if (enq) { e.preventDefault(); openEnquiry({ pkg: enq.dataset.pkg, dep: enq.dataset.dep, dest: enq.dataset.dest }); return; }
    if (t.closest('[data-close]') && !t.closest('a[href^="/"]')) { closeModal(); return; }
    if (t.id === 'mbg') { closeModal(); return; }
    if (t.id === 'burger') { $('#menu').classList.toggle('open'); return; }
    const a = t.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href');
    if (h && h.startsWith('/') && !/^\/(admin|uploads|api|sitemap|robots|img)/.test(h)) {
      e.preventDefault(); closeModal();
      if (h.startsWith('#') || (h.split('#')[0] === location.pathname && h.includes('#'))) { const el = $('#' + h.split('#')[1]); el && el.scrollIntoView(); } else go(h);
    } else if (h && h.startsWith('#')) { e.preventDefault(); const el = $(h); el && el.scrollIntoView({ behavior: 'smooth' }); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('popstate', render);

  (async function init() {
    try { D = await (await fetch('/api/site')).json(); S = D.settings; } catch (e) { app.innerHTML = '<div class="wrap" style="padding:80px 20px"><h2>We’ll be right back</h2><p>Please try again in a few minutes.</p></div>'; return; }
    layout(); render();
  })();
})();
