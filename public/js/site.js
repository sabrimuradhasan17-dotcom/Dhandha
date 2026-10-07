(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const pd = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const fd = s => pd(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fm = s => new Date(s + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const CAT = { fly: 'Fly in · Fly out', drive: 'Drive in · Drive out', special: 'Special interest', fixed: 'Fixed departures' };
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.49-8.41Z"/></svg>';
  const MOUNT = '<svg viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true"><path fill="#27443a" opacity=".55" d="M0 120 L180 40 L330 110 L520 20 L700 100 L900 30 L1100 105 L1280 45 L1440 100 V180 H0Z"/><path fill="var(--cream)" d="M0 150 L200 90 L380 140 L600 80 L820 140 L1040 85 L1240 140 L1440 100 V180 H0Z"/></svg>';
  let D, S;
  const app = $('#app');

  /* ---------- helpers ---------- */
  const wa = t => 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(t);
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
  const priceBlock = p => showPrice(p) ? `<div><small>From</small><br><b>${inr(p.price)}</b> <small>per person</small></div>` : '<div><b>Price on request</b></div>';
  const nextDep = id => D.departures.find(d => d.packageId === id && !seat(d).sold);
  const bg = p => p.image ? `style="background-image:url('${esc(p.image)}')"` : '';
  const para = t => String(t || '').split(/\n\n+/).map(x => `<p>${esc(x)}</p>`).join('');

  function pkgCard(p) {
    const nd = nextDep(p.id);
    const top = p.poster ? `<a class="poster" href="/package/${esc(p.slug)}" aria-label="${esc(p.name)} ${dur(p)}"><img src="${esc(p.poster)}" alt="${esc(p.name)} ${dur(p)} Bhutan tour" loading="lazy">${p.category === 'fixed' ? '<div class="badge">Fixed departure</div>' : ''}</a>`
      : `<div class="art ${esc(p.category)}" ${bg(p)}>${p.category === 'fixed' ? '<div class="badge">Fixed departure</div>' : ''}<span>${esc(p.name)}<br>${dur(p)}</span></div>`;
    return `<article class="card">${top}
      <div class="body"><h3 style="margin:0;font-size:1.25rem">${esc(p.name)} · ${dur(p)}</h3><div class="note">${esc(p.stay || CAT[p.category])}</div><div>${esc(p.summary)}</div>
      <div class="tags">${p.highlights.slice(0, 2).map(h => `<span class="tag">${esc(h.length > 46 ? h.slice(0, 44) + '…' : h)}</span>`).join('')}${p.flightIncluded ? '<span class="tag">✈ Flights included</span>' : ''}</div>
      ${nd ? `<div class="note">Next departure: <b>${fd(nd.date)}</b> from ${esc(nd.fromCity)}</div>` : ''}
      <div class="price">${priceBlock(p)}<a class="btn btn-primary btn-sm" href="/package/${esc(p.slug)}">View details</a></div></div></article>`;
  }

  /* ---------- layout ---------- */
  function layout() {
    const logo = S.logo ? `<img src="${esc(S.logo)}" alt="${esc(S.brand)}"><span>La <b>Bhutanz</b><small>TOURS</small></span>` : `<svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#8d2a1b"/><path d="M6 50 L24 22 L34 38 L42 28 L58 50Z" fill="#f0a21b"/><circle cx="46" cy="16" r="6" fill="#fff" opacity=".9"/></svg><span>La <b>Bhutanz</b><small>TOURS</small></span>`;
    $('#hdr').innerHTML = `<div class="wrap"><a class="logo" href="/" aria-label="${esc(S.brand)} home">${logo}</a>
      <button class="burger" id="burger" aria-label="Menu">☰</button>
      <nav class="menu" id="menu"><a href="/packages">Packages</a><a href="/departures">Departures</a>
        <div class="dd"><button type="button">Plan your trip ▾</button><div class="dd-list"><a href="/page/visa">Visa &amp; permit</a><a href="/faq">FAQ</a><a href="/page/festivals">Festivals</a><a href="/page/about-us">About us</a><a href="/page/about-bhutan">About Bhutan</a><a href="/page/dos-and-donts">Do's &amp; Don'ts</a><a href="/how-to-book">How to book &amp; pay</a></div></div>
        <a href="/blog">Travelogues</a><a href="/contact">Contact</a>
        <a class="btn btn-wa btn-sm" href="${esc(wa('Hello ' + S.brand + ', I would like guidance for planning a Bhutan journey.'))}" target="_blank" rel="noopener">WhatsApp</a>
        <button class="btn btn-primary btn-sm" data-enq>Enquire</button></nav></div>`;
    if (S.favicon) { let l = $('link[rel=icon]'); if (l) l.href = S.favicon; }
    $('#banner').innerHTML = S.announcement && S.announcement.enabled && S.announcement.text ? `<div class="banner">${esc(S.announcement.text)}</div>` : '';
    const soc = Object.entries(S.social || {}).filter(([, v]) => v).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k[0].toUpperCase() + k.slice(1))}</a>`).join(' · ');
    $('#ftr').innerHTML = `<div class="wrap"><div class="cols" style="margin-bottom:28px"><div>${S.logo ? `<img src="${esc(S.logo)}" alt="" style="height:70px;margin-bottom:10px;filter:drop-shadow(0 0 6px rgba(255,255,255,.15))">` : ''}<h4>${esc(S.brand)}</h4><p>${esc(S.tagline)}</p><p>Personalised Bhutan journeys from Mumbai and across India.</p></div>
      <div><h4>Explore</h4><ul><li><a href="/packages">All packages</a></li><li><a href="/departures">Fixed departures</a></li><li><a href="/blog">Travelogues</a></li><li><a href="/page/about-us">About us</a></li><li><a href="/faq">FAQ</a></li></ul></div>
      <div><h4>Plan</h4><ul><li><a href="/page/visa">Visa &amp; permit guide</a></li><li><a href="/page/festivals">Festivals</a></li><li><a href="/how-to-book">How to book &amp; pay</a></li><li><a href="/page/terms">Terms &amp; cancellation</a></li><li><a href="/page/privacy">Privacy</a></li></ul></div>
      <div><h4>Contact</h4><p>${esc(S.address)}</p><p><a href="${tel()}">${esc(S.phone)}</a><br>${S.emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join('<br>')}</p><p class="note" style="color:#bba">${esc(S.hours)}</p></div></div>
      <div>${soc}</div><p class="note" style="color:#a99">© ${new Date().getFullYear()} ${esc(S.brand)}. All rights reserved.</p></div>`;
    $('#fab').innerHTML = `<a class="fab" href="${esc(wa('Hello ' + S.brand + ', I would like guidance for planning a Bhutan journey.'))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_ICON}</a>`;
    $('#mbar').innerHTML = `<a href="${tel()}">📞 Call</a><a href="${esc(wa('Hello ' + S.brand))}" target="_blank" rel="noopener">💬 WhatsApp</a><button data-enq>✉ Enquire</button>`;
  }

  /* ---------- enquiry modal ---------- */
  function openEnquiry(o = {}) {
    const pk = o.pkg || '', pkgOpts = '<option value="">Not sure yet — suggest something</option>' + D.packages.map(p => `<option value="${esc(p.id)}" ${p.id === pk ? 'selected' : ''}>${esc(p.name)} ${dur(p)}</option>`).join('');
    $('#modal').innerHTML = `<div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true" aria-label="Enquiry"><button class="x" data-close aria-label="Close">×</button>
      <div id="enq-body"><h3>Plan your Bhutan journey</h3><p class="note">Tell us a little and our Bhutan specialist will reply on WhatsApp or phone — usually within office hours the same day.</p>
      <form id="enq" class="form-grid" novalidate>
        <div><label for="e-name">Your name *</label><input id="e-name" name="name" autocomplete="name" required></div>
        <div><label for="e-phone">Phone / WhatsApp *</label><input id="e-phone" name="phone" type="tel" autocomplete="tel" required></div>
        <div class="full"><label for="e-email">Email (optional)</label><input id="e-email" name="email" type="email" autocomplete="email"></div>
        <div class="full"><label for="e-pkg">Package</label><select id="e-pkg" name="packageId">${pkgOpts}</select></div>
        <div class="full"><label for="e-dep">Departure</label><select id="e-dep" name="departureId"></select></div>
        <div><label for="e-month">Preferred travel month</label><input id="e-month" name="travelMonth" type="month"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label for="e-ad">Adults</label><input id="e-ad" name="adults" type="number" min="1" value="2"></div><div><label for="e-ch">Children</label><input id="e-ch" name="children" type="number" min="0" value="0"></div></div>
        <div class="full"><label for="e-msg">Anything else? (interests, budget, special occasion)</label><textarea id="e-msg" name="message" rows="3"></textarea></div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="full err" id="e-err" role="alert"></div>
        <div class="full"><button class="btn btn-primary btn-block" id="e-go">Send enquiry</button><p class="note" style="margin-top:8px">By submitting you agree to be contacted about your trip. See our <a href="/page/privacy" data-close>privacy policy</a>.</p></div>
      </form></div></div></div>`;
    const depSel = $('#e-dep');
    const fillDeps = (sel) => {
      const id = $('#e-pkg').value, list = D.departures.filter(d => (!id || d.packageId === id) && !seat(d).sold);
      depSel.innerHTML = '<option value="">Private / my own dates</option>' + list.map(d => `<option value="${esc(d.id)}" ${d.id === sel ? 'selected' : ''}>${fd(d.date)} · ${esc(d.fromCity)}${id ? '' : ' · ' + esc((pkgOf(d.packageId) || {}).name || '')}</option>`).join('');
    };
    fillDeps(o.dep); $('#e-pkg').onchange = () => fillDeps('');
    setTimeout(() => $('#e-name').focus(), 50);
    $('#enq').onsubmit = async ev => {
      ev.preventDefault(); const f = ev.target, b = Object.fromEntries(new FormData(f)); $('#e-err').textContent = '';
      $('#e-go').disabled = true; $('#e-go').textContent = 'Sending…';
      try {
        const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...b, source: o.source || location.pathname }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Something went wrong');
        const p = pkgOf(b.packageId), d = D.departures.find(x => x.id === b.departureId);
        const text = `Hello ${S.brand}, I'm ${b.name} (ref ${j.ref}). I'd like to plan a Bhutan trip` + (p ? ` — ${p.name} ${dur(p)}` : '') + (d ? `, departing ${fd(d.date)} from ${d.fromCity}` : (b.travelMonth ? ` in ${fm(b.travelMonth)}` : '')) + ` for ${b.adults} adult(s)` + (+b.children ? ` + ${b.children} child(ren)` : '') + '.' + (b.message ? ' ' + b.message : '');
        $('#enq-body').innerHTML = `<h3>Thank you, ${esc(b.name.split(' ')[0])}!</h3><p>Your enquiry <b>#${esc(j.ref)}</b> has reached our team. We'll contact you on <b>${esc(b.phone)}</b> shortly.</p><p>Want a faster reply? Continue the chat on WhatsApp — your details are pre-filled.</p><a class="btn btn-wa btn-block" href="${esc(wa(text))}" target="_blank" rel="noopener">Continue on WhatsApp</a><p style="text-align:center"><button class="btn btn-ghost btn-sm" data-close style="margin-top:12px">Close</button></p>`;
      } catch (e) { $('#e-err').textContent = e.message; $('#e-go').disabled = false; $('#e-go').textContent = 'Send enquiry'; }
    };
  }
  const closeModal = () => { $('#modal').innerHTML = ''; };

  /* ---------- views ---------- */
  const EXPERIENCES = [['👨‍👩‍👧', 'Family Holidays', 'Enjoy relaxed holidays with comfortable stays, scenic sightseeing and thoughtfully planned experiences for families of all ages.'], ['💞', 'Honeymoon Journeys', 'Celebrate your new beginning with romantic landscapes, peaceful monasteries, handpicked hotels and unforgettable moments together.'], ['🏯', 'Cultural Journeys', 'Explore Bhutan\'s rich cultural heritage through ancient monasteries, traditional villages, museums, local traditions and historic landmarks.'], ['🧘', 'Spiritual Retreats', 'Reconnect with yourself as you visit sacred monasteries, meditation centres and peaceful places that reflect Bhutan\'s timeless Buddhist traditions.'], ['🎭', 'Festival Experiences', 'Experience the vibrant spirit of Bhutan through colourful Tshechu festivals, traditional mask dances and authentic local celebrations.'], ['📷', 'Photography Journeys', 'Capture breathtaking Himalayan landscapes, ancient monasteries, colourful festivals, diverse wildlife and everyday Bhutanese life through carefully planned photography experiences.'], ['🥾', 'Adventure Holidays', 'Discover mountain trails, hidden valleys and spectacular Himalayan scenery through safe, well-planned adventure experiences designed for nature lovers.']];
  const PLACES = [['Paro', 'Home of Tiger\'s Nest and Bhutan\'s only international airport.'], ['Thimphu', 'The capital — dzongs, markets, museums and monasteries.'], ['Punakha', 'Bhutan\'s most beautiful dzong at the river confluence.'], ['Gangtey', 'Glacial Phobjikha valley, home of black-necked cranes.'], ['Bumthang', 'The spiritual heartland with Bhutan\'s oldest temples.']];

  function home() {
    const feat = D.packages.filter(p => p.featured).slice(0, 6), list = feat.length ? feat : D.packages.slice(0, 6);
    const prices = D.packages.filter(showPrice).map(p => p.price);
    const deps = D.departures.filter(d => !seat(d).sold).slice(0, 5);
    return `<div class="hero"><div class="wrap"><div class="eyebrow" style="color:#f0a21b">${esc(S.tagline)}</div><h1>${esc(S.heroTitle)}</h1><p>${esc(S.heroSub)}</p>
      <div class="hero-cta"><button class="btn btn-primary" data-enq>Plan my trip</button><a class="btn btn-wa" href="${esc(wa('Hello ' + S.brand + ', I would like guidance for planning a Bhutan journey.'))}" target="_blank" rel="noopener">Chat on WhatsApp</a></div>
      <form class="finder" id="finder"><div><label for="f-cat">Journey type</label><select id="f-cat"><option value="">Any</option>${Object.entries(CAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div><label for="f-dur">Duration</label><select id="f-dur"><option value="">Any</option><option value="s">Up to 5 nights</option><option value="m">6–7 nights</option><option value="l">8+ nights</option></select></div>
      <div style="align-self:end"><button class="btn btn-primary btn-block">Find journeys</button></div></form></div>${MOUNT}</div>
      <div class="wrap"><div class="stats"><div class="stat"><b>${D.packages.length}</b>Tour packages</div><div class="stat"><b>${D.departures.length}</b>Upcoming departures</div><div class="stat"><b>${prices.length ? inr(Math.min(...prices)) : '—'}</b>Starting per person</div><div class="stat"><b>Mumbai</b>Based · India-wide</div></div></div>
      <section><div class="wrap"><div class="eyebrow">Popular journeys</div><h2>Popular Bhutan Tour Packages</h2><p class="lead">Every traveller experiences Bhutan differently. Our personalised Bhutan journeys are thoughtfully designed around different travel styles, durations and interests, from short cultural escapes to longer, more immersive Himalayan experiences. Each itinerary can be personalised around your preferred travel dates, choice of stays, sightseeing interests and pace of travel.</p><div class="grid" style="margin-top:24px">${list.map(pkgCard).join('')}</div><p style="margin-top:26px"><a class="btn btn-ghost" href="/packages">See all packages →</a></p></div></section>
      ${deps.length ? `<section class="alt"><div class="wrap"><div class="eyebrow">Fixed &amp; scheduled</div><h2>Next departures from Mumbai</h2>${depTable(deps, true)}<p style="margin-top:20px"><a class="btn btn-ghost" href="/departures">All departures &amp; flights →</a></p></div></section>` : ''}
      <section><div class="wrap"><div class="eyebrow">Travel your way</div><h2>Bhutan Experiences for Every Traveller</h2><p class="lead">Every traveler discovers Bhutan in their own way. Whether you dream of peaceful moments in the Himalayas, meaningful cultural encounters or unforgettable adventures, we'll help you create a journey that reflects your interests, travel style and pace.</p><div class="cols" style="margin-top:22px">${EXPERIENCES.map(e => `<div class="feat"><div class="ic">${e[0]}</div><h3>${e[1]}</h3><p class="note" style="font-size:.92rem">${e[2]}</p></div>`).join('')}</div></div></section>
      <section class="alt"><div class="wrap"><div class="eyebrow">Why ${esc(S.brand)}</div><h2>Why Choose La Bhutanz Tours</h2><p class="lead">Choosing the right travel aspirations can make all the difference to your Bhutan experience. We focus on understanding your travel goals and creating thoughtfully planned journeys that combine local knowledge, personalized service and seamless travel planning.</p>
        <ul class="ticks" style="margin-top:14px;columns:2 340px"><li>Personalized Bhutan journeys tailored to your interests and travel style</li><li>Flexible itineraries for couples, families, solo travelers and private groups</li><li>Local destination expertise across Paro, Thimphu, Punakha, Gangtey and Bumthang</li><li>Assistance with Bhutan permits, travel planning and documentation</li><li>Handpicked hotels, comfortable transportation and dependable local support</li><li>Cultural, spiritual, photography, festival and adventure experiences</li><li>Dedicated assistance before, during and after your journey</li><li>Private departures and personalised holidays designed around your preferred travel dates, interests and pace</li></ul><p><a href="/page/about-us">About La Bhutanz Tours →</a></p>
        <h3 style="margin-top:46px">How it works</h3><div class="steps"><div><b>Tell us your plan</b><br>Dates, group and interests — by WhatsApp or the enquiry form.</div><div><b>Get a tailored quote</b><br>Clear per-person pricing and a day-wise itinerary.</div><div><b>Confirm with an advance</b><br>We handle permits, SDF, hotels and transfers.</div><div><b>Travel with confidence</b><br>A local guide and 24×7 support in Bhutan.</div></div></div></section>
      <section><div class="wrap"><div class="eyebrow">Destinations</div><h2>Where we take you</h2><div class="cols">${PLACES.map(p => `<div class="feat"><h3>${p[0]}</h3><p class="note" style="font-size:.92rem">${p[1]}</p></div>`).join('')}</div></div></section>
      <section class="alt"><div class="wrap"><div class="eyebrow">Before you go</div><h2>Entry permit &amp; fee essentials for Indian travellers</h2><div class="cols">
        <div class="feat"><h3>🛂 Entry Permit</h3><p>No visa needed. Carry a valid passport (6 months) or voter ID; we arrange the permit.</p></div>
        <div class="feat"><h3>🌿 SDF</h3><p>${inr(S.sdfINR)} per person per night (children 6–12 half, under 6 free).</p></div>
        <div class="feat"><h3>🧾 GST &amp; insurance</h3><p>${S.gstPct}% GST on tour services. Travel insurance is mandatory.</p></div></div>
        <p style="margin-top:18px"><a href="/page/visa">Read the full visa &amp; permit guide →</a></p></div></section>
      ${D.testimonials.length ? `<section><div class="wrap"><div class="eyebrow">Guest stories</div><h2>Loved by travellers</h2><div class="cols">${D.testimonials.map(t => `<div class="feat"><div style="color:#f0a21b">${'★'.repeat(Math.max(1, Math.min(5, t.rating || 5)))}</div><p class="tq">“${esc(t.text)}”</p><b>${esc(t.name)}</b><div class="note">${esc(t.place)}</div></div>`).join('')}</div></div></section>` : ''}
      ${D.posts.length ? `<section class="${D.testimonials.length ? 'alt' : ''}"><div class="wrap"><div class="eyebrow">Journal</div><h2>Bhutan travel guides</h2><div class="grid">${D.posts.slice(0, 3).map(postCard).join('')}</div></div></section>` : ''}
      <section class="alt"><div class="wrap"><div class="eyebrow">Good to know</div><h2>Common questions</h2><div style="max-width:820px">${D.faqs.slice(0, 6).map(faqItem).join('')}</div><p><a href="/faq">All FAQs →</a></p></div></section>
      <section><div class="wrap"><div class="cta"><div><h2 style="color:#fff">Start Planning Your Bhutan Journey</h2><p>Whether you are planning your first visit or returning to explore more of the Kingdom of Happiness, we are here to help you create a personalised journey.</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-wa" data-enq>Send enquiry</button><a class="btn btn-ghost" href="${tel()}">Call ${esc(S.phone)}</a></div></div></div></section>`;
  }
  const faqItem = f => `<details><summary>${esc(f.q)}</summary><div class="acc-b">${esc(f.a)}</div></details>`;
  const postCard = p => `<article class="card post-card"><div class="art special" ${bg(p)}><span>${esc(p.title)}</span></div><div class="body"><div class="note">${fd(p.date)}</div><div>${esc(p.excerpt)}</div><div class="price"><span></span><a class="btn btn-ghost btn-sm" href="/blog/${esc(p.slug)}">Read more</a></div></div></article>`;

  function depTable(list, compact) {
    if (!list.length) return '<div class="empty">No departures match. Message us for a private departure on your dates.</div>';
    return `<div class="table-wrap" style="margin-top:22px"><table><thead><tr><th>Departure</th><th>Package</th><th>Flight / route</th><th>Price / person</th><th>Seats</th><th></th></tr></thead><tbody>${list.map(d => {
      const p = pkgOf(d.packageId) || { name: 'Package', nights: '', days: '', price: 0 }, s = seat(d), price = priceOf(p, d);
      const fl = [d.airline, d.flightNo].filter(Boolean).join(' · ');
      return `<tr><td><b>${fd(d.date)}</b><br><span class="note">from ${esc(d.fromCity)}</span></td><td><a href="/package/${esc(p.slug || '')}"><b>${esc(p.name)}</b></a><br><span class="note">${p.nights ? dur(p) : ''}</span></td>
        <td>${fl ? esc(fl) + '<br>' : ''}<span class="note">${esc(d.route || (p.flightIncluded ? 'Flights included' : 'Land package — join us at Paro'))}${d.depTime ? ' · ' + esc(d.depTime) + (d.arrTime ? ' → ' + esc(d.arrTime) : '') : ''}</span>${d.notes && !compact ? `<br><span class="note">${esc(d.notes)}</span>` : ''}</td>
        <td><b>${S.showPrices && price > 0 ? inr(price) : 'On request'}</b></td><td><span class="pill ${s.c}">${s.t}</span></td>
        <td>${s.sold ? `<button class="btn btn-ghost btn-sm" data-enq data-pkg="${esc(d.packageId)}">Waitlist</button>` : `<button class="btn btn-primary btn-sm" data-enq data-pkg="${esc(d.packageId)}" data-dep="${esc(d.id)}">Reserve</button>`}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function packagesView() {
    const q = new URLSearchParams(location.search);
    const st = { cat: q.get('cat') || '', dur: q.get('dur') || '', q: q.get('q') || '', sort: q.get('sort') || '' };
    const html = `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Packages</div><h1>Bhutan tour packages</h1><p class="lead">Fly-in, drive-in, special-interest journeys and fixed departures. Prices are per person; all journeys can be personalised.</p>
      <div class="chips" id="pk-chips"></div><div class="form-grid" style="max-width:760px;grid-template-columns:2fr 1fr 1fr"><div><label for="pk-q">Search</label><input id="pk-q" placeholder="e.g. Tiger's Nest, honeymoon" value="${esc(st.q)}"></div>
      <div><label for="pk-dur">Duration</label><select id="pk-dur"><option value="">Any</option><option value="s">Up to 5 nights</option><option value="m">6–7 nights</option><option value="l">8+ nights</option></select></div>
      <div><label for="pk-sort">Sort</label><select id="pk-sort"><option value="">Recommended</option><option value="pa">Price: low to high</option><option value="pd">Price: high to low</option><option value="d">Shortest first</option></select></div></div>
      <div class="grid" id="pk-grid" style="margin-top:24px"></div></div></section>`;
    setTimeout(() => {
      $('#pk-dur').value = st.dur; $('#pk-sort').value = st.sort;
      const draw = () => {
        st.q = $('#pk-q').value; st.dur = $('#pk-dur').value; st.sort = $('#pk-sort').value;
        $('#pk-chips').innerHTML = ['', ...Object.keys(CAT)].map(c => `<button class="chip ${st.cat === c ? 'on' : ''}" data-cat="${c}">${c ? CAT[c] : 'All'}</button>`).join('');
        let l = D.packages.filter(p => (!st.cat || p.category === st.cat) && (!st.dur || (st.dur === 's' ? p.nights <= 5 : st.dur === 'm' ? p.nights >= 6 && p.nights <= 7 : p.nights >= 8)) &&
          (!st.q || (p.name + ' ' + p.summary + ' ' + p.stay + ' ' + p.highlights.join(' ')).toLowerCase().includes(st.q.toLowerCase())));
        if (st.sort === 'pa') l.sort((a, b) => a.price - b.price); if (st.sort === 'pd') l.sort((a, b) => b.price - a.price); if (st.sort === 'd') l.sort((a, b) => a.nights - b.nights);
        $('#pk-grid').innerHTML = l.length ? l.map(pkgCard).join('') : '<div class="empty" style="grid-column:1/-1">No packages match. <button class="btn btn-primary btn-sm" data-enq>Ask us for a custom itinerary</button></div>';
        const u = new URLSearchParams(); Object.entries(st).forEach(([k, v]) => v && u.set(k, v)); history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
      };
      $('#pk-chips').onclick = e => { if (e.target.dataset.cat !== undefined) { st.cat = e.target.dataset.cat; draw(); } };
      ['pk-q', 'pk-dur', 'pk-sort'].forEach(id => $('#' + id).oninput = draw); draw();
    }, 0);
    return html;
  }

  function packageView(slug) {
    const p = D.packages.find(x => x.slug === slug); if (!p) return notFound();
    document.title = `${p.name} ${dur(p)} — Bhutan Tour Package | ${S.brand}`;
    const deps = D.departures.filter(d => d.packageId === p.id);
    const sec = (id, t, body) => body ? `<section id="${id}" style="padding:26px 0 0"><h2>${t}</h2>${body}</section>` : '';
    setTimeout(() => {
      const upd = () => {
        const pax = Math.max(1, +$('#x-pax').value || 1), ds = $('#x-dep').value, d = D.departures.find(x => x.id === ds), each = priceOf(p, d);
        const sdf = S.sdfINR * p.nights * pax, base = each * pax, gst = S.gstIncluded ? 0 : base * (S.gstPct / 100);
        $('#x-est').innerHTML = showPrice(p) ? `<div><span>Package × ${pax}</span><b>${inr(base)}</b></div>${gst ? `<div><span>GST ${S.gstPct}%</span><b>${inr(gst)}</b></div>` : ''}<div><span>SDF (${inr(S.sdfINR)} × ${p.nights}N × ${pax})</span><b>${inr(sdf)}</b></div><div class="tot"><span>Estimated total</span><b>${inr(base + gst + sdf)}</b></div>` : `<div><span>SDF (${inr(S.sdfINR)} × ${p.nights}N × ${pax})</span><b>${inr(sdf)}</b></div><div class="note">Package price on request.</div>`;
        $('#x-book').dataset.dep = ds;
      };
      $('#x-pax').oninput = upd; $('#x-dep').onchange = upd; upd();
    }, 0);
    return `<section style="padding-top:34px"><div class="wrap"><div class="crumb"><a href="/">Home</a> › <a href="/packages">Packages</a> › ${esc(p.name)} ${dur(p)}</div>
      <div class="pkg-hero">${p.image && p.imageHasTitle ? `<img src="${esc(p.image)}" alt="${esc(p.name)} ${dur(p)} Bhutan tour" style="width:100%;height:auto">` : `<div class="art ${esc(p.category)}" ${bg(p)}><span>${esc(p.name)} · ${dur(p)}</span></div>`}</div>
      <div class="facts"><div><small>Duration</small><b>${p.nights} nights / ${p.days} days</b></div>${p.stay ? `<div><small>Stay</small><b>${esc(p.stay)}</b></div>` : ''}<div><small>Type</small><b>${CAT[p.category]}</b></div><div><small>Flights</small><b>${p.flightIncluded ? 'Included' : 'Land package'}</b></div></div>
      <div class="detail"><div>
        <div class="subnav"><a href="#overview">Overview</a><a href="#itinerary">Itinerary</a><a href="#inclusions">Inclusions</a><a href="#departures">Departures</a>${p.faqs.length ? '<a href="#faqs">FAQs</a>' : ''}</div>
        <section id="overview" style="padding:0"><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(p.name)} — ${dur(p)}</h1><p class="lead">${esc(p.summary)}</p>${para(p.intro)}
          ${p.highlights.length ? `<h3>Journey highlights</h3><ul class="ticks">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</section>
        ${sec('itinerary', 'Day-by-day itinerary', p.itinerary.length ? `<div class="days">${p.itinerary.map((d, i) => `<details ${i === 0 ? 'open' : ''}><summary><b>Day ${i + 1}</b> — ${esc(d.title)}</summary>${d.meta ? `<div class="meta">${esc(d.meta)}</div>` : ''}<div class="acc-b">${esc(d.desc)}</div></details>`).join('')}</div>` : '')}
        ${sec('inclusions', 'What\'s included', `<div class="cols" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))"><div><h3>Included</h3><ul class="ticks">${p.inclusions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3>Not included</h3><ul class="ticks x">${p.exclusions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`)}
        ${sec('documents', 'Documents needed to enter Bhutan', (S.documents || []).length ? `<ul class="ticks">${S.documents.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '')}
        ${sec('departures', 'Departures &amp; flights', deps.length ? depTable(deps) + '<p class="note">Want different dates? Every journey can run privately on your preferred dates.</p>' : '<p>This journey runs privately on your preferred dates. <button class="btn btn-primary btn-sm" data-enq data-pkg="' + esc(p.id) + '">Check availability</button></p>')}
        ${p.ideal.length ? sec('ideal', 'Who is this journey ideal for?', `<ul class="ticks">${p.ideal.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`) : ''}
        ${p.faqs.length ? sec('faqs', 'Frequently asked questions', p.faqs.map(faqItem).join('')) : ''}
      </div>
      <aside class="side"><div class="note">${showPrice(p) ? 'From' : 'Pricing'}</div><div style="font-family:'Cormorant Garamond',serif;font-size:2.3rem;font-weight:700;color:var(--maroon);line-height:1.1">${showPrice(p) ? inr(p.price) : 'On request'}${showPrice(p) ? ' <small style="font-size:.9rem;font-weight:400;font-family:Inter">per person</small>' : ''}</div>
        <hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><label for="x-pax">Travellers</label><input id="x-pax" type="number" min="1" value="2">
        <label for="x-dep" style="margin-top:10px">Departure</label><select id="x-dep"><option value="">Private / my own dates</option>${deps.filter(d => !seat(d).sold).map(d => `<option value="${esc(d.id)}">${fd(d.date)} · ${esc(d.fromCity)}</option>`).join('')}</select>
        <div class="est" id="x-est" style="margin:14px 0"></div>
        <button class="btn btn-primary btn-block" id="x-book" data-enq data-pkg="${esc(p.id)}">Enquire / book this trip</button>
        <a class="btn btn-wa btn-block" style="margin-top:8px" target="_blank" rel="noopener" href="${esc(wa(`Hello ${S.brand}, I'm interested in the ${p.name} ${dur(p)} package.`))}">WhatsApp us</a>
        <p class="note" style="margin-top:10px">Estimate only — final quote confirms hotels, season and group size. ${esc(S.advanceInfo)} <a href="/how-to-book">How to book &amp; pay</a></p></aside></div></div></section>`;
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
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Departures</div><h1>Departures &amp; flight details</h1><p class="lead">Scheduled departures from Mumbai with live seat availability. Prefer your own dates? Private departures are available on every package.</p>
      <div class="form-grid" style="max-width:640px;margin-top:16px"><div><label for="dp-pkg">Package</label><select id="dp-pkg"><option value="">All packages</option>${[...new Set(D.departures.map(d => d.packageId))].map(id => { const p = pkgOf(id); return p ? `<option value="${esc(id)}">${esc(p.name)} ${dur(p)}</option>` : ''; }).join('')}</select></div>
      <div><label for="dp-mo">Month</label><select id="dp-mo"><option value="">All months</option>${months.map(m => `<option value="${m}">${fm(m)}</option>`).join('')}</select></div></div>
      <div id="dp-out"></div></div></section>`;
  }

  async function postView(slug) {
    const r = await fetch('/api/post/' + encodeURIComponent(slug)); if (!r.ok) return notFound(); const p = await r.json(); document.title = p.title + ' | ' + S.brand;
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › <a href="/blog">Journal</a></div><div class="note">${fd(p.date)}</div><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(p.title)}</h1>${p.image ? `<img src="${esc(p.image)}" alt="" style="border-radius:var(--r);margin:16px 0">` : ''}${p.body}<p style="margin-top:30px"><button class="btn btn-primary" data-enq>Plan my Bhutan trip</button></p></div></section>`;
  }
  async function pageView(slug) {
    const r = await fetch('/api/page/' + encodeURIComponent(slug)); if (!r.ok) return notFound(); const p = await r.json(); document.title = p.title + ' | ' + S.brand;
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › ${esc(p.title)}</div><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(p.title)}</h1>${p.html}<p style="margin-top:30px"><button class="btn btn-primary" data-enq>Ask us a question</button> <a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(wa('Hello ' + S.brand + ', I have a question about ' + p.title + '.'))}">WhatsApp</a></p></div></section>`;
  }
  const blogView = () => `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Journal</div><h1>Bhutan Travelogues</h1><p class="lead">Explore Bhutan through destination stories, cultural insights, meaningful travel experiences and practical planning guidance prepared by La Bhutanz Tours. Our travelogues help travellers understand Bhutan beyond standard sightseeing — from its valleys, monasteries and festivals to local traditions, seasonal experiences and responsible ways of travelling.</p>${(S.social || {}).blog ? `<p><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(S.social.blog)}">Read the La Bhutanz Tours Blog ↗</a></p>` : ''}<p class="note">Also see: <a href="/page/visa">Visa &amp; Entry Permit Guide</a> · <a href="/faq">Travel FAQs</a> · <a href="/page/dos-and-donts">Do's &amp; Don'ts</a> · <a href="/page/about-bhutan">About Bhutan</a> · <a href="/page/festivals">Festivals</a></p><div class="grid" style="margin-top:24px">${D.posts.map(postCard).join('') || '<div class="empty">Articles coming soon.</div>'}</div></div></section>`;
  function faqView() {
    setTimeout(() => $('#fq').oninput = e => { const q = e.target.value.toLowerCase(); $$('#fq-list details').forEach(d => d.style.display = d.textContent.toLowerCase().includes(q) ? '' : 'none'); }, 0);
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › FAQ</div><h1>Bhutan travel FAQ</h1><p class="lead">Visa, permits, SDF, GST, flights, weather and more.</p><div style="max-width:820px"><input id="fq" placeholder="Search questions…" style="margin:16px 0" aria-label="Search FAQ"><div id="fq-list">${D.faqs.map(faqItem).join('')}</div></div>
      <p style="margin-top:20px">Can't find your answer? <button class="btn btn-primary btn-sm" data-enq>Ask our team</button></p></div></section>`;
  }
  function contactView() {
    const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(S.address);
    return `<section><div class="wrap"><div class="crumb"><a href="/">Home</a> › Contact</div><h1>Contact La Bhutanz Tours</h1><p class="lead">Planning a Bhutan journey begins with understanding your travel style, preferred pace and the experiences that matter to you. Share your travel plans with us or connect by phone, WhatsApp or email. Our team will provide clear and thoughtful guidance based on your dates, interests and expectations.</p>
      <div class="cols" style="margin-top:20px"><div class="feat"><h3>Call, Email or Visit — Mumbai Office</h3><p>${esc(S.address)}</p><p><b>Call:</b> <a href="${tel()}">${esc(S.phone)}</a><br><b>WhatsApp:</b> <a target="_blank" rel="noopener" href="${esc(wa('Hello'))}">+${esc(S.whatsapp)}</a><br><b>Email:</b> ${S.emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(' · ')}</p><p class="note">${esc(S.hours)}</p><p><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(map)}">Open in Google Maps</a></p></div>
      <div class="feat"><h3>Send an enquiry</h3><p>Tell us about your trip and we'll respond with a personalised itinerary.</p><button class="btn btn-primary btn-block" data-enq>Plan my trip</button><a class="btn btn-wa btn-block" style="margin-top:10px" target="_blank" rel="noopener" href="${esc(wa('Hello ' + S.brand + ', I would like guidance for planning a Bhutan journey.'))}">Chat on WhatsApp</a></div></div></div></section>`;
  }
  function bookView() {
    const pay = S.payment || {}, has = pay.upiId || pay.bank || pay.accountNo;
    return `<section><div class="wrap prose"><div class="crumb"><a href="/">Home</a> › How to book &amp; pay</div><h1>How to book &amp; pay</h1>
      <div class="steps" style="margin:24px 0"><div><b>Enquire</b><br>Send an enquiry or WhatsApp us your dates and group size.</div><div><b>Receive your quote</b><br>A personalised itinerary with clear per-person pricing.</div><div><b>Pay the advance</b><br>${esc(S.advanceInfo)}</div><div><b>Documents &amp; permits</b><br>Share ID details; we arrange your Entry Permit and SDF.</div></div>
      ${has ? `<h3>Payment details</h3><div class="feat">${pay.upiId ? `<p><b>UPI:</b> ${esc(pay.upiId)}</p>` : ''}${pay.accountName ? `<p><b>Account name:</b> ${esc(pay.accountName)}</p>` : ''}${pay.bank ? `<p><b>Bank:</b> ${esc(pay.bank)}</p>` : ''}${pay.accountNo ? `<p><b>Account no.:</b> ${esc(pay.accountNo)}</p>` : ''}${pay.ifsc ? `<p><b>IFSC:</b> ${esc(pay.ifsc)}</p>` : ''}${pay.note ? `<p class="note">${esc(pay.note)}</p>` : ''}</div>` : '<p>We will share payment details (UPI / bank transfer) with your confirmed quotation.</p>'}
      ${(S.documents || []).length ? `<h3>Documents we need from you</h3><ul class="ticks">${S.documents.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="note">Please read our <a href="/page/terms">terms &amp; cancellation policy</a> before paying. ${S.gstPct}% GST applies on tour services where not already included.</p>
      <p><button class="btn btn-primary" data-enq>Start my enquiry</button></p></div></section>`;
  }
  const notFound = () => { document.title = 'Page not found | ' + S.brand; return `<section><div class="wrap" style="text-align:center;padding:60px 0"><h1>Page not found</h1><p class="lead" style="margin:auto">That page doesn't exist — but Bhutan is waiting.</p><p style="margin-top:20px"><a class="btn btn-primary" href="/packages">Browse packages</a></p></div></section>`; };

  /* ---------- router ---------- */
  async function render() {
    const p = location.pathname.replace(/\/$/, '') || '/'; let m, html;
    document.title = S.seo.title;
    if (p === '/') html = home();
    else if (p === '/packages') { document.title = 'Bhutan Tour Packages | ' + S.brand; html = packagesView(); }
    else if ((m = p.match(/^\/package\/([\w-]+)$/))) html = packageView(m[1]);
    else if (p === '/departures') { document.title = 'Departures & Flights | ' + S.brand; html = departuresView(); }
    else if (p === '/blog') { document.title = 'Journal | ' + S.brand; html = blogView(); }
    else if ((m = p.match(/^\/blog\/([\w-]+)$/))) html = await postView(m[1]);
    else if ((m = p.match(/^\/page\/([\w-]+)$/))) html = await pageView(m[1]);
    else if (p === '/faq') { document.title = 'FAQ | ' + S.brand; html = faqView(); }
    else if (p === '/contact') { document.title = 'Contact | ' + S.brand; html = contactView(); }
    else if (p === '/how-to-book') { document.title = 'How to book & pay | ' + S.brand; html = bookView(); }
    else html = notFound();
    app.innerHTML = html;
    const fnd = $('#finder'); if (fnd) fnd.onsubmit = e => { e.preventDefault(); const u = new URLSearchParams(); if ($('#f-cat').value) u.set('cat', $('#f-cat').value); if ($('#f-dur').value) u.set('dur', $('#f-dur').value); go('/packages' + (u.toString() ? '?' + u : '')); };
    $('#menu') && $('#menu').classList.remove('open');
    if (location.hash && $(location.hash)) $(location.hash).scrollIntoView(); else window.scrollTo(0, 0);
  }
  function go(url) { history.pushState(null, '', url); render(); }
  document.addEventListener('click', e => {
    const t = e.target;
    const enq = t.closest('[data-enq]'); if (enq) { e.preventDefault(); openEnquiry({ pkg: enq.dataset.pkg, dep: enq.dataset.dep }); return; }
    if (t.closest('[data-close]') && !t.closest('a[href^="/"]')) { closeModal(); return; }
    if (t.id === 'mbg') { closeModal(); return; }
    if (t.id === 'burger') { $('#menu').classList.toggle('open'); return; }
    const a = t.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href');
    if (h && h.startsWith('/') && !/^\/(admin|uploads|api|sitemap|robots)/.test(h)) {
      e.preventDefault(); closeModal();
      if (h.startsWith('#') || (h.split('#')[0] === location.pathname && h.includes('#'))) { const el = $('#' + h.split('#')[1]); el && el.scrollIntoView(); } else go(h);
    } else if (h && h.startsWith('#')) { e.preventDefault(); const el = $(h); el && el.scrollIntoView({ behavior: 'smooth' }); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('popstate', render);

  (async function init() {
    try { D = await (await fetch('/api/site')).json(); S = D.settings; } catch (e) { app.innerHTML = '<div class="wrap" style="padding:80px 20px"><h2>We\'ll be right back</h2><p>Please WhatsApp us on +91 93244 55999.</p></div>'; return; }
    layout(); render();
  })();
})();
