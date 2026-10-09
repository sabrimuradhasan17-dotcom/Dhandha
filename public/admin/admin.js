(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
  const fd = s => s ? new Date(s.length === 10 ? s + 'T00:00:00' : s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const root = $('#root');
  let state = { tab: 'dash', pkgs: [], mustChange: false, newCount: 0 };

  async function api(method, url, body, raw) {
    const o = { method, headers: {}, credentials: 'same-origin' };
    if (raw) { o.body = raw; } else if (body !== undefined) { o.headers['content-type'] = 'application/json'; o.body = JSON.stringify(body); }
    const r = await fetch('/api/admin' + url, o);
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && url !== '/login') { showLogin(); throw new Error('Please sign in'); } // expired session
    if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
  }
  function toast(msg, bad) { const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

  /* ---------- login ---------- */
  function showLogin() {
    root.innerHTML = `<div class="login"><h2>Admin sign in</h2><p class="note">La Bhutanz Tours — manage departures, prices, packages and enquiries.</p>
      <label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" autofocus><p class="err" id="err"></p>
      <button class="btn btn-primary btn-block" id="go">Sign in</button><p class="note" style="margin-top:14px"><a href="/">← Back to website</a></p></div>`;
    const go = async () => { try { const j = await api('POST', '/login', { password: $('#pw').value.trim() }); state.mustChange = j.mustChange; boot(); } catch (e) { $('#err').textContent = e.message; } };
    $('#go').onclick = go; $('#pw').onkeydown = e => e.key === 'Enter' && go();
  }

  /* ---------- shell ---------- */
  const TABS = [['dash', '📊 Dashboard'], ['enq', '📨 Enquiries'], ['dep', '✈ Departures & flights'], ['pkg', '💰 Packages & prices'], ['posts', '📝 Journal'], ['faqs', '❓ FAQs'], ['tst', '⭐ Testimonials'], ['pages', '📄 Pages'], ['set', '⚙ Settings'], ['sec', '🔒 Security & backup']];
  function shell() {
    root.innerHTML = `<div class="shell"><nav class="side-nav"><div class="brand">La <b>Bhutanz</b> Admin</div>${TABS.map(([k, l]) => `<button data-tab="${k}" class="${state.tab === k ? 'on' : ''}">${l}${k === 'enq' && state.newCount ? `<span class="badge">${state.newCount}</span>` : ''}</button>`).join('')}<a href="/" target="_blank">↗ View website</a><button id="out">Sign out</button></nav><div class="main" id="main"></div></div>`;
    $$('[data-tab]').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; shell(); view(); });
    $('#out').onclick = async () => { await fetch('/api/admin/logout', { method: 'POST' }); location.reload(); };
  }
  async function boot() {
    try {
      const me = await (await fetch('/api/admin/me')).json(); if (!me.signedIn) return showLogin();
      state.mustChange = me.mustChange;
      state.pkgs = await api('GET', '/packages'); const st = await api('GET', '/stats'); state.newCount = st.byStatus.new || 0;
      shell(); view();
    } catch (e) { showLogin(); }
  }
  function view() {
    const old = $('#main'), m = old.cloneNode(false); old.replaceWith(m); m.innerHTML = '<p>Loading…</p>'; // fresh node = no stale listeners
    ({ dash, enq, dep, pkg, posts, faqs, tst, pages, set, sec }[state.tab])(m).catch(e => { m.innerHTML = `<p class="err">${esc(e.message)}</p>`; });
  }
  const pkgName = id => { const p = state.pkgs.find(x => x.id === id); return p ? `${p.name} ${p.nights}N/${p.days}D` : '—'; };

  /* ---------- dashboard ---------- */
  async function dash(m) {
    const s = await api('GET', '/stats');
    m.innerHTML = `<h1>Dashboard</h1>
      ${s.mustChange ? '<div class="alert red"><b>Change the default admin password</b> — go to Security &amp; backup. Anyone who knows the default can sign in.</div>' : ''}
      ${s.unpriced ? `<div class="alert"><b>${s.unpriced} package(s) have no price yet</b> — the website shows “Price on request” for them. Open <a href="#" data-go="pkg">Packages &amp; prices</a> to enter ₹ per person.</div>` : ''}
      ${!s.upcomingCount ? '<div class="alert"><b>No departures scheduled.</b> Add dates, seats and flight details in <a href="#" data-go="dep">Departures &amp; flights</a> — until then visitors are invited to enquire for private dates.</div>' : ''}
      <div class="cards4"><div class="kpi"><b>${s.byStatus.new || 0}</b>New enquiries</div><div class="kpi"><b>${s.last7}</b>Last 7 days</div><div class="kpi"><b>${s.enquiries}</b>Total enquiries</div><div class="kpi"><b>${s.upcomingCount}</b>Upcoming departures</div><div class="kpi"><b>${s.byStatus.booked || 0}</b>Booked</div></div>
      <div class="panel"><h3>Next departures</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Package</th><th>Seats left</th><th>Status</th></tr></thead><tbody>${s.upcoming.map(d => `<tr><td>${fd(d.date)}</td><td>${esc(pkgName(d.packageId))}</td><td>${Math.max(0, d.seats - d.booked)} / ${d.seats}</td><td>${esc(d.status)}</td></tr>`).join('') || '<tr><td colspan="4">None scheduled — add one in Departures.</td></tr>'}</tbody></table></div></div>
      <div class="panel"><h3>Recent enquiries</h3>${s.recent.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Name</th><th>Phone</th><th>Package</th><th>Status</th></tr></thead><tbody>${s.recent.map(e => `<tr><td>${fd(e.createdAt)}</td><td>${esc(e.name)}</td><td>${esc(e.phone)}</td><td>${esc(pkgName(e.packageId))}</td><td><span class="pill status-${e.status}">${e.status}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">No enquiries yet. They appear here as soon as someone submits the form.</p>'}</div>
      <div class="panel"><h3>Launch checklist</h3><ul class="ticks"><li>Enter the price (₹ per person) for every package</li><li>Add real departure dates, seats and flight details</li><li>Upload your logo and package photos (Settings / Packages)</li><li>Add UPI / bank details for booking advances (Settings → Payment)</li><li>Review the Terms and Privacy pages (Pages)</li><li>Set your website address in Settings (for SEO)</li><li>Change the admin password</li></ul></div>`;
    $$('[data-go]', m).forEach(a => a.onclick = e => { e.preventDefault(); state.tab = a.dataset.go; shell(); view(); });
  }

  /* ---------- enquiries ---------- */
  async function enq(m) {
    let list = await api('GET', '/enquiries'); const STAT = ['new', 'contacted', 'quoted', 'booked', 'lost'];
    m.innerHTML = `<div class="row"><h1 style="margin:0">Enquiries</h1><div class="tools"><select id="fs"><option value="">All statuses</option>${STAT.map(s => `<option>${s}</option>`).join('')}</select><input id="fq" placeholder="Search name / phone…" style="width:200px"><a class="btn btn-ghost btn-sm" href="/api/admin/enquiries.csv">⬇ Export CSV</a></div></div><div class="table-wrap"><table style="min-width:1000px"><thead><tr><th>When</th><th>Guest</th><th>Interest</th><th>Message</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>`;
    const waLink = e => { let d = e.phone.replace(/\D/g, ''); if (d.length === 10) d = '91' + d; return 'https://wa.me/' + d + '?text=' + encodeURIComponent(`Hello ${e.name}, this is La Bhutanz Tours regarding your Bhutan enquiry.`); };
    const draw = () => {
      const s = $('#fs').value, q = $('#fq').value.toLowerCase();
      const l = list.filter(e => (!s || e.status === s) && (!q || (e.name + e.phone + e.email).toLowerCase().includes(q)));
      $('#rows').innerHTML = l.map(e => `<tr data-id="${e.id}"><td>${fd(e.createdAt)}<div class="sub">${new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div></td>
        <td><b>${esc(e.name)}</b><div class="sub"><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a>${e.email ? ` · <a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : ''}</div></td>
        <td>${esc(pkgName(e.packageId))}<div class="sub">${e.departureId ? 'Dep. selected · ' : ''}${esc(e.travelMonth || '')} · ${e.adults}A${e.children ? ' + ' + e.children + 'C' : ''}</div></td>
        <td style="max-width:260px">${esc(e.message)}</td>
        <td><select data-st class="status-${e.status}">${STAT.map(x => `<option ${x === e.status ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
        <td><textarea data-notes rows="2" placeholder="Add notes…">${esc(e.notes)}</textarea></td>
        <td><div class="tools"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(e)}">WhatsApp</a><button class="btn btn-ghost btn-sm" data-del>✕</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No enquiries.</td></tr>';
    };
    draw(); $('#fs').onchange = $('#fq').oninput = draw;
    m.onchange = guard(async e => { const tr = e.target.closest('tr[data-id]'); if (!tr) return; const en = list.find(x => x.id === tr.dataset.id);
      if (e.target.matches('[data-st]')) { en.status = e.target.value; await api('PATCH', '/enquiries/' + en.id, { status: en.status }); e.target.className = 'status-' + en.status; toast('Status updated'); }
      if (e.target.matches('[data-notes]')) { en.notes = e.target.value; await api('PATCH', '/enquiries/' + en.id, { notes: en.notes }); toast('Notes saved'); } });
    m.onclick = guard(async e => { if (!e.target.matches('[data-del]')) return; const tr = e.target.closest('tr'); if (!confirm('Delete this enquiry permanently?')) return; await api('DELETE', '/enquiries/' + tr.dataset.id); list = list.filter(x => x.id !== tr.dataset.id); draw(); });
  }

  /* ---------- departures (inline editing) ---------- */
  async function dep(m) {
    let list = await api('GET', '/departures');
    const inp = (f, t, v, extra = '') => `<input data-f="${f}" type="${t}" value="${esc(v)}" ${extra}>`;
    const draw = () => {
      list.sort((a, b) => a.date < b.date ? -1 : 1);
      $('#rows').innerHTML = list.map(d => `<tr data-id="${d.id}"><td>${inp('date', 'date', d.date)}</td><td><select data-f="packageId">${state.pkgs.map(p => `<option value="${esc(p.id)}" ${p.id === d.packageId ? 'selected' : ''}>${esc(p.name)} ${p.nights}N/${p.days}D</option>`).join('')}</select></td>
        <td>${inp('fromCity', 'text', d.fromCity)}</td><td>${inp('seats', 'number', d.seats, 'min=0')}</td><td>${inp('booked', 'number', d.booked, 'min=0')}</td><td>${inp('priceOverride', 'number', d.priceOverride, 'min=0 placeholder="package price"')}</td>
        <td><select data-f="status">${['open', 'closed', 'cancelled'].map(s => `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td>${inp('airline', 'text', d.airline)}</td><td>${inp('flightNo', 'text', d.flightNo)}</td><td>${inp('route', 'text', d.route)}</td><td>${inp('depTime', 'time', d.depTime)}</td><td>${inp('arrTime', 'time', d.arrTime)}</td><td>${inp('notes', 'text', d.notes)}</td><td><button class="btn btn-ghost btn-sm" data-del>✕</button></td></tr>`).join('') || '<tr><td colspan="14" class="empty">No departures yet — click “Add departure”.</td></tr>';
    };
    m.innerHTML = `<div class="row"><h1 style="margin:0">Departures &amp; flights</h1><button class="btn btn-primary" id="add">+ Add departure</button></div><p class="note">Edit any cell — changes save automatically and go live on the website immediately. Price override blank/0 = use package price. Seats left = Seats − Booked.</p><div class="table-wrap"><table style="min-width:1500px"><thead><tr><th>Date</th><th>Package</th><th>From</th><th>Seats</th><th>Booked</th><th>Price ₹ / person</th><th>Status</th><th>Airline</th><th>Flight no.</th><th>Route</th><th>Dep.</th><th>Arr.</th><th>Notes</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>`;
    draw();
    $('#add').onclick = guard(async () => { const p = state.pkgs.find(x => x.category === 'fixed') || state.pkgs[0]; const d = await api('POST', '/departures', { packageId: p ? p.id : '', date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), fromCity: 'Mumbai', seats: 20, booked: 0, status: 'open' }); list.push(d); draw(); toast('Departure added — set its date & flight details'); });
    m.onchange = guard(async e => { const tr = e.target.closest('tr[data-id]'); const f = e.target.dataset.f; if (!tr || !f) return; const d = list.find(x => x.id === tr.dataset.id);
      const v = e.target.type === 'number' ? Number(e.target.value) || 0 : e.target.value; await api('PUT', '/departures/' + d.id, { [f]: v }); d[f] = v; toast('Saved'); if (f === 'date') draw(); });
    m.onclick = guard(async e => { if (!e.target.matches('[data-del]')) return; const tr = e.target.closest('tr'); if (!confirm('Delete this departure?')) return; await api('DELETE', '/departures/' + tr.dataset.id); list = list.filter(x => x.id !== tr.dataset.id); draw(); });
  }

  /* ---------- generic form + editors ---------- */
  function fieldHtml(f, v, prefix) {
    const id = prefix + f.k, val = v == null ? (f.t === 'checkbox' ? false : '') : v, cls = f.full ? 'full' : '';
    const lab = `<label for="${id}">${f.l}</label>`;
    if (f.t === 'checkbox') return `<div class="${cls}"><label><input type="checkbox" id="${id}" ${val ? 'checked' : ''} style="width:auto"> ${f.l}</label></div>`;
    if (f.t === 'select') return `<div class="${cls}">${lab}<select id="${id}">${f.o.map(o => `<option value="${esc(o[0])}" ${o[0] == val ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>`;
    if (f.t === 'lines') return `<div class="full">${lab}<textarea id="${id}" rows="${f.r || 6}">${esc((val || []).join('\n'))}</textarea><div class="sub">One item per line</div></div>`;
    if (f.t === 'textarea') return `<div class="full">${lab}<textarea id="${id}" rows="${f.r || 4}">${esc(val)}</textarea></div>`;
    if (f.t === 'html') return `<div class="full">${lab}<textarea id="${id}" class="code">${esc(val)}</textarea><div class="sub">HTML allowed: &lt;h3&gt; &lt;p&gt; &lt;ul&gt;&lt;li&gt; &lt;a&gt; &lt;b&gt; &lt;img&gt;. Scripts are stripped.</div></div>`;
    if (f.t === 'image') return `<div class="${cls || 'full'}">${lab}<div style="display:flex;gap:8px"><input id="${id}" value="${esc(val)}" placeholder="https://… or upload"><label class="btn btn-ghost btn-sm" style="margin:0;white-space:nowrap">Upload<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-up="${id}" style="display:none"></label></div>${val ? `<img class="imgprev" src="${esc(val)}" alt="">` : ''}</div>`;
    if (f.t === 'repeater') return `<div class="full"><label>${f.l}</label><div id="${id}" data-rep="${f.k}">${(val || []).map((it, i) => repItem(f, it, id, i)).join('')}</div><button type="button" class="btn btn-ghost btn-sm" data-add="${id}">+ Add</button></div>`;
    return `<div class="${cls}">${lab}<input id="${id}" type="${f.t || 'text'}" value="${esc(val)}" ${f.t === 'number' ? 'step="any"' : ''}></div>`;
  }
  const repItem = (f, it, id, i) => `<div class="rep" data-i="${i}"><button type="button" class="btn btn-ghost btn-sm del" data-rm>✕</button>${f.s.map(s => `<div><label>${s.l}</label>${s.t === 'textarea' ? `<textarea data-s="${s.k}" rows="${s.r || 3}">${esc(it[s.k])}</textarea>` : `<input data-s="${s.k}" value="${esc(it[s.k])}">`}</div>`).join('')}</div>`;
  function readForm(root, fields, prefix) {
    const o = {};
    fields.forEach(f => {
      const id = prefix + f.k, el = $('#' + id, root);
      if (f.t === 'checkbox') o[f.k] = el.checked;
      else if (f.t === 'lines') o[f.k] = el.value.split('\n').map(x => x.trim()).filter(Boolean);
      else if (f.t === 'number') o[f.k] = Number(el.value) || 0;
      else if (f.t === 'repeater') o[f.k] = $$('.rep', el).map(r => Object.fromEntries(f.s.map(s => [s.k, $(`[data-s="${s.k}"]`, r).value])));
      else o[f.k] = el.value;
    });
    return o;
  }
  function bindForm(root, fields, prefix) {
    (root._bound || []).forEach(([t, h]) => root.removeEventListener(t, h)); // avoid stacking handlers across form opens
    const onClick = e => {
      const add = e.target.closest('[data-add]'); if (add) { const box = $('#' + add.dataset.add), f = fields.find(x => prefix + x.k === add.dataset.add); box.insertAdjacentHTML('beforeend', repItem(f, {}, box.id, box.children.length)); }
      if (e.target.matches('[data-rm]')) e.target.closest('.rep').remove();
    };
    const onChange = guard(async e => {
      if (!e.target.dataset.up) return; const file = e.target.files[0]; if (!file) return;
      const r = await fetch('/api/admin/upload', { method: 'POST', body: file, credentials: 'same-origin' }); const j = await r.json(); if (!r.ok) throw new Error(j.error);
      $('#' + e.target.dataset.up, root).value = j.url; toast('Image uploaded — remember to save');
    });
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); root._bound = [['click', onClick], ['change', onChange]];
  }

  function editor(m, cfg) {
    return (async () => {
      let list = await api('GET', '/' + cfg.coll);
      const draw = () => {
        m.innerHTML = `<div class="row"><h1 style="margin:0">${cfg.title}</h1><button class="btn btn-primary" id="new">+ Add new</button></div>${cfg.intro ? `<p class="note">${cfg.intro}</p>` : ''}<div class="table-wrap"><table style="min-width:640px"><thead><tr>${cfg.cols.map(c => `<th>${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>${(cfg.sort ? [...list].sort(cfg.sort) : list).map(x => `<tr>${cfg.cols.map(c => `<td>${c[1](x)}</td>`).join('')}<td><div class="tools"><button class="btn btn-primary btn-sm" data-edit="${x.id}">Edit</button><button class="btn btn-ghost btn-sm" data-del="${x.id}">✕</button></div></td></tr>`).join('') || `<tr><td colspan="9" class="empty">Nothing here yet.</td></tr>`}</tbody></table></div>`;
        $('#new').onclick = () => form(null);
        m.onclick = guard(async e => { const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
          if (ed) form(list.find(x => x.id === ed.dataset.edit));
          if (dl && confirm('Delete this item?')) { await api('DELETE', '/' + cfg.coll + '/' + dl.dataset.del, undefined); list = list.filter(x => x.id !== dl.dataset.del); if (cfg.coll === 'packages') state.pkgs = list; draw(); } });
        m.onchange = null;
      };
      const form = item => {
        const v = item || cfg.blank(), pre = 'f_';
        m.innerHTML = `<div class="row"><h1 style="margin:0">${item ? 'Edit' : 'New'} — ${cfg.title}</h1><button class="btn btn-ghost" id="back">← Back to list</button></div><div class="panel"><div class="fgrid">${cfg.fields.map(f => fieldHtml(f, v[f.k], pre)).join('')}</div><p style="margin-top:18px"><button class="btn btn-primary" id="save">Save</button></p></div>`;
        bindForm(m, cfg.fields, pre); m.onclick = null; m.onchange = null;
        // re-attach handlers that bindForm adds on m (click/change listeners persist across forms; guard double-binding)
        $('#back').onclick = draw;
        $('#save').onclick = guard(async () => {
          const body = readForm(m, cfg.fields, pre);
          const saved = item ? await api('PUT', '/' + cfg.coll + '/' + item.id, body) : await api('POST', '/' + cfg.coll, body);
          if (item) Object.assign(item, saved); else list.push(saved);
          if (cfg.coll === 'packages') state.pkgs = list; toast('Saved'); draw();
        });
      };
      draw();
    })();
  }
  const YN = [['true', 'Yes'], ['false', 'No']];

  /* packages: quick price list + full editor */
  const PKG_FIELDS = [
    { k: 'name', l: 'Name' }, { k: 'slug', l: 'URL slug (e.g. fly-5n6d)' },
    { k: 'category', l: 'Type', t: 'select', o: [['fly', 'Fly in · Fly out'], ['drive', 'Drive in · Drive out'], ['special', 'Special interest'], ['fixed', 'Fixed departure']] },
    { k: 'nights', l: 'Nights', t: 'number' }, { k: 'days', l: 'Days', t: 'number' }, { k: 'price', l: 'Price ₹ per person (0 = on request)', t: 'number' },
    { k: 'stay', l: 'Stay summary (e.g. Thimphu 2N | Punakha 1N | Paro 2N)', full: true },
    { k: 'summary', l: 'Short summary (shown on cards)', t: 'textarea', r: 2 }, { k: 'intro', l: 'Introduction (blank line = new paragraph)', t: 'textarea', r: 6 },
    { k: 'poster', l: 'Card poster (square image used on package cards)', t: 'image' }, { k: 'image', l: 'Banner (wide image at top of package page)', t: 'image' }, { k: 'imageHasTitle', l: 'Banner already contains the package title (hide the text overlay)', t: 'checkbox' },
    { k: 'highlights', l: 'Journey highlights', t: 'lines' },
    { k: 'itinerary', l: 'Day-by-day itinerary', t: 'repeater', s: [{ k: 'title', l: 'Day title' }, { k: 'meta', l: 'Travel info (distance · time)' }, { k: 'desc', l: 'Description', t: 'textarea', r: 4 }] },
    { k: 'inclusions', l: 'Inclusions', t: 'lines' }, { k: 'exclusions', l: 'Exclusions', t: 'lines' }, { k: 'ideal', l: 'Who is it ideal for?', t: 'lines' },
    { k: 'faqs', l: 'Package FAQs', t: 'repeater', s: [{ k: 'q', l: 'Question' }, { k: 'a', l: 'Answer', t: 'textarea' }] },
    { k: 'flightIncluded', l: 'Flights included in price', t: 'checkbox' }, { k: 'featured', l: 'Show on home page', t: 'checkbox' }, { k: 'active', l: 'Visible on website', t: 'checkbox' }, { k: 'order', l: 'Sort order (small = first)', t: 'number' }
  ];
  async function pkg(m) {
    let list = await api('GET', '/packages'); state.pkgs = list;
    const draw = () => {
      m.innerHTML = `<div class="row"><h1 style="margin:0">Packages &amp; prices</h1><div class="tools"><input id="pct" type="number" value="5" style="width:80px" aria-label="Percent"><button class="btn btn-ghost btn-sm" id="bulk">Change all prices by %</button><button class="btn btn-primary" id="new">+ Add package</button></div></div>
      <p class="note">Edit prices in the table (₹ per person) — they save automatically and show on the website straight away. Click “Full details” to edit itinerary, inclusions, photo and more.</p>
      <div class="table-wrap"><table style="min-width:820px"><thead><tr><th>Package</th><th>Type</th><th>Price ₹ / person</th><th>Visible</th><th>Home page</th><th></th></tr></thead><tbody>${[...list].sort((a, b) => a.order - b.order).map(p => `<tr data-id="${p.id}"><td><b>${esc(p.name)}</b> ${p.nights}N/${p.days}D<div class="sub">${p.price > 0 ? '' : '⚠ no price yet — shown as “On request”'}</div></td><td>${esc(p.category)}</td>
        <td><input type="number" min="0" data-f="price" value="${p.price}"></td><td><input type="checkbox" data-f="active" ${p.active ? 'checked' : ''}></td><td><input type="checkbox" data-f="featured" ${p.featured ? 'checked' : ''}></td>
        <td><div class="tools"><button class="btn btn-primary btn-sm" data-edit="${p.id}">Full details</button><a class="btn btn-ghost btn-sm" target="_blank" href="/package/${esc(p.slug)}">View</a><button class="btn btn-ghost btn-sm" data-del="${p.id}">✕</button></div></td></tr>`).join('')}</tbody></table></div>`;
      $('#new').onclick = () => full(null);
      $('#bulk').onclick = guard(async () => { const pc = Number($('#pct').value); if (!isFinite(pc) || !confirm(`Change every price by ${pc}%?`)) return;
        for (const p of list) if (p.price > 0) { const np = Math.round(p.price * (1 + pc / 100) / 100) * 100; await api('PUT', '/packages/' + p.id, { price: np }); p.price = np; p.priceConfirmed = true; } toast('Prices updated'); draw(); });
      m.onchange = guard(async e => { const tr = e.target.closest('tr[data-id]'), f = e.target.dataset.f; if (!tr || !f) return; const p = list.find(x => x.id === tr.dataset.id);
        const v = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value) || 0; const s = await api('PUT', '/packages/' + p.id, { [f]: v }); Object.assign(p, s); toast('Saved'); if (f === 'price') draw(); });
      m.onclick = guard(async e => { const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]'); if (ed) full(list.find(x => x.id === ed.dataset.edit));
        if (dl && confirm('Delete this package? Its departures will remain but show as “Package”.')) { await api('DELETE', '/packages/' + dl.dataset.del); list = list.filter(x => x.id !== dl.dataset.del); state.pkgs = list; draw(); } });
    };
    const full = item => {
      const v = item || { category: 'fly', nights: 5, days: 6, price: 0, active: true, featured: false, flightIncluded: false, order: list.length, highlights: [], itinerary: [], inclusions: [], exclusions: [], ideal: [], faqs: [] };
      m.innerHTML = `<div class="row"><h1 style="margin:0">${item ? 'Edit' : 'New'} package</h1><button class="btn btn-ghost" id="back">← Back</button></div><div class="panel"><div class="fgrid">${PKG_FIELDS.map(f => fieldHtml(f, v[f.k], 'f_')).join('')}</div><p style="margin-top:18px"><button class="btn btn-primary" id="save">Save package</button></p></div>`;
      m.onclick = null; m.onchange = null; bindForm(m, PKG_FIELDS, 'f_'); $('#back').onclick = draw;
      $('#save').onclick = guard(async () => { const body = readForm(m, PKG_FIELDS, 'f_'); const s = item ? await api('PUT', '/packages/' + item.id, body) : await api('POST', '/packages', body); if (item) Object.assign(item, s); else list.push(s); state.pkgs = list; toast('Saved'); draw(); });
    };
    draw();
  }

  const posts = m => editor(m, { coll: 'posts', title: 'Journal', intro: 'Travel guides shown at /blog and on the home page.', sort: (a, b) => a.date < b.date ? 1 : -1,
    cols: [['Title', x => esc(x.title)], ['Date', x => fd(x.date)], ['Published', x => x.published ? '✓' : 'Draft']],
    blank: () => ({ date: new Date().toISOString().slice(0, 10), published: true }),
    fields: [{ k: 'title', l: 'Title', full: true }, { k: 'slug', l: 'URL slug' }, { k: 'date', l: 'Date', t: 'date' }, { k: 'excerpt', l: 'Short excerpt', t: 'textarea', r: 2 }, { k: 'image', l: 'Cover image', t: 'image' }, { k: 'body', l: 'Article', t: 'html' }, { k: 'published', l: 'Published', t: 'checkbox' }] });
  const faqs = m => editor(m, { coll: 'faqs', title: 'FAQs', sort: (a, b) => a.order - b.order, cols: [['#', x => x.order], ['Question', x => esc(x.q)], ['Visible', x => x.active ? '✓' : '—']],
    blank: () => ({ active: true, order: 99 }), fields: [{ k: 'q', l: 'Question', full: true }, { k: 'a', l: 'Answer', t: 'textarea', r: 5 }, { k: 'order', l: 'Order', t: 'number' }, { k: 'active', l: 'Visible', t: 'checkbox' }] });
  const tst = m => editor(m, { coll: 'testimonials', title: 'Testimonials', intro: 'Add real guest reviews (with permission). The section stays hidden until you add one.', cols: [['Guest', x => esc(x.name)], ['Place', x => esc(x.place)], ['Rating', x => '★'.repeat(x.rating || 5)], ['Visible', x => x.active ? '✓' : '—']],
    blank: () => ({ active: true, rating: 5 }), fields: [{ k: 'name', l: 'Guest name' }, { k: 'place', l: 'City / trip' }, { k: 'rating', l: 'Rating (1–5)', t: 'number' }, { k: 'text', l: 'Review', t: 'textarea', r: 4 }, { k: 'active', l: 'Visible', t: 'checkbox' }] });
  const pages = m => editor(m, { coll: 'pages', title: 'Pages', intro: 'Content pages at /page/&lt;slug&gt; — visa guide, festivals, terms, privacy and more.', cols: [['Title', x => esc(x.title)], ['URL', x => '/page/' + esc(x.slug)], ['Published', x => x.published ? '✓' : 'Draft']],
    blank: () => ({ published: true }), fields: [{ k: 'title', l: 'Title', full: true }, { k: 'slug', l: 'URL slug' }, { k: 'html', l: 'Content', t: 'html' }, { k: 'published', l: 'Published', t: 'checkbox' }] });

  /* ---------- settings ---------- */
  async function set(m) {
    const s = await api('GET', '/settings'), g = (path) => path.split('.').reduce((o, k) => (o || {})[k], s);
    const F = [['Brand & home page', [['brand', 'Brand name'], ['tagline', 'Tagline'], ['heroTitle', 'Home headline'], ['heroSub', 'Home sub-headline', 'textarea'], ['logo', 'Logo', 'image'], ['heroImages', 'Home page slideshow photos (one address per line, 3–5 wide photos)', 'lines'], ['favicon', 'Favicon', 'image'], ['ogImage', 'Social share image', 'image'], ['siteUrl', 'Website address (https://…, for SEO)']]],
      ['Contact', [['whatsapp', 'WhatsApp number (digits, with country code)'], ['phone', 'Phone'], ['emails', 'Emails (one per line)', 'lines'], ['address', 'Office address', 'textarea'], ['hours', 'Office hours']]],
      ['Pricing & fees', [['sdfINR', 'SDF ₹ per person per night', 'number'], ['gstPct', 'GST %', 'number'], ['gstIncluded', 'Package prices already include GST', 'checkbox'], ['showPrices', 'Show prices publicly', 'checkbox'], ['advanceInfo', 'Booking advance message', 'textarea']]],
      ['Payment details (shown on How to book)', [['payment.upiId', 'UPI ID'], ['payment.accountName', 'Account name'], ['payment.bank', 'Bank & branch'], ['payment.accountNo', 'Account number'], ['payment.ifsc', 'IFSC'], ['payment.note', 'Note', 'textarea']]],
      ['Documents guests must provide', [['documents', 'One per line', 'lines']]],
      ['Announcement banner', [['announcement.enabled', 'Show banner', 'checkbox'], ['announcement.text', 'Banner text']]],
      ['Social links', ['instagram', 'facebook', 'youtube', 'tripadvisor', 'trustpilot', 'linkedin', 'pinterest', 'blog'].map(k => ['social.' + k, k[0].toUpperCase() + k.slice(1) + ' URL'])],
      ['SEO', [['seo.title', 'Home page title'], ['seo.description', 'Home page description', 'textarea']]]];
    const flat = F.flatMap(([, f]) => f);
    m.innerHTML = `<div class="row"><h1 style="margin:0">Settings</h1><button class="btn btn-primary" id="save">Save settings</button></div>${F.map(([t, fs]) => `<div class="panel"><h3>${t}</h3><div class="fgrid">${fs.map(([k, l, ty]) => fieldHtml({ k: k.replace(/\./g, '_'), l, t: ty || 'text', full: ty === 'textarea' || ty === 'image' }, g(k), 's_')).join('')}</div></div>`).join('')}`;
    bindForm(m, flat.map(([k, l, ty]) => ({ k: k.replace(/\./g, '_'), t: ty })), 's_');
    $('#save').onclick = guard(async () => {
      const body = {}; flat.forEach(([k, , ty]) => { const el = $('#s_' + k.replace(/\./g, '_')); const v = ty === 'checkbox' ? el.checked : ty === 'lines' ? el.value.split('\n').map(x => x.trim()).filter(Boolean) : ty === 'number' ? Number(el.value) || 0 : el.value;
        const parts = k.split('.'); let o = body; parts.slice(0, -1).forEach(p => o = o[p] = o[p] || {}); o[parts[parts.length - 1]] = v; });
      await api('PUT', '/settings', body); toast('Settings saved');
    });
  }

  /* ---------- security & backup ---------- */
  async function sec(m) {
    m.innerHTML = `<h1>Security &amp; backup</h1>
      <div class="panel"><h3>Change admin password</h3><div class="fgrid"><div><label for="cp">Current password</label><input id="cp" type="password" autocomplete="current-password"></div><div><label for="np">New password (min. 10 characters)</label><input id="np" type="password" autocomplete="new-password"></div></div><p style="margin-top:14px"><button class="btn btn-primary" id="chg">Update password</button></p></div>
      <div class="panel"><h3>Backup &amp; restore</h3><p class="note">The backup contains packages, departures, enquiries, pages and settings (not your password). A copy is also kept automatically before every restore.</p>
      <a class="btn btn-ghost" href="/api/admin/backup">⬇ Download backup</a> <label class="btn btn-ghost" style="margin:0">⬆ Restore from file<input type="file" id="rs" accept=".json" style="display:none"></label></div>`;
    $('#chg').onclick = guard(async () => { await api('POST', '/password', { current: $('#cp').value, next: $('#np').value }); state.mustChange = false; $('#cp').value = $('#np').value = ''; toast('Password updated'); });
    $('#rs').onchange = guard(async e => { const f = e.target.files[0]; if (!f || !confirm('Replace ALL current data with this backup?')) return; const j = JSON.parse(await f.text()); await api('POST', '/restore', j); toast('Restored'); boot(); });
  }

  boot();
})();
