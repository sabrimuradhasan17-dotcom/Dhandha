(function () {
  var $ = function (id) { return document.getElementById(id); }, esc = U.esc;
  var H = function (s) { var h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
  var PWK = "bhutanz_admin_hash", DEFAULT_HASH = H("bhutanz@2026");
  var getHash = function () { try { return localStorage.getItem(PWK) || DEFAULT_HASH; } catch (e) { return DEFAULT_HASH; } };
  var D, dirty = false;
  var uid = function (p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };

  function signIn() {
    if (H($("pw").value) === getHash()) { try { sessionStorage.setItem("bz_in", "1"); } catch (e) {} start(); }
    else $("err").textContent = "Incorrect password.";
  }
  $("go").onclick = signIn; $("pw").onkeydown = function (e) { if (e.key === "Enter") signIn(); };
  $("out").onclick = function () { try { sessionStorage.removeItem("bz_in"); } catch (e) {} location.reload(); };
  try { if (sessionStorage.getItem("bz_in")) start(); } catch (e) {}

  function mark(d) { dirty = d; $("state").textContent = d ? "Unsaved changes" : "Saved"; $("state").className = "note " + (d ? "dirty" : "ok"); }
  function start() {
    $("login").style.display = "none"; $("app").style.display = "block"; D = Store.load(); render(); mark(false);
  }
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  $("save").onclick = function () { Store.save(D); mark(false); };
  $("tabs").onclick = function (e) {
    var t = e.target.dataset.t; if (!t) return;
    Array.from($("tabs").children).forEach(function (b) { b.classList.toggle("on", b === e.target); });
    ["dep", "pkg", "set", "bak"].forEach(function (k) { $("p-" + k).classList.toggle("on", k === t); });
  };

  var statusOpts = ["open", "few", "full", "cancelled"];
  function input(list, i, f, type, val) { return '<input data-l="' + list + '" data-i="' + i + '" data-f="' + f + '" type="' + (type || "text") + '" value="' + esc(val) + '">'; }
  function render() {
    var pkgOpts = function (sel) { return D.packages.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? " selected" : "") + ">" + esc(p.name) + " " + p.nights + "N/" + p.days + "D</option>"; }).join(""); };
    var deps = D.departures.map(function (d, i) { return { d: d, i: i }; }).sort(function (a, b) { return a.d.date < b.d.date ? -1 : 1; });
    $("depRows").innerHTML = deps.map(function (x) {
      var d = x.d, i = x.i;
      return "<tr><td>" + input("departures", i, "date", "date", d.date) + '</td><td><select data-l="departures" data-i="' + i + '" data-f="packageId">' + pkgOpts(d.packageId) + "</select></td><td>" +
        input("departures", i, "from", "text", d.from) + "</td><td>" + input("departures", i, "airline", "text", d.airline) + "</td><td>" + input("departures", i, "flight", "text", d.flight) + "</td><td>" +
        input("departures", i, "route", "text", d.route) + "</td><td>" + input("departures", i, "depTime", "time", d.depTime) + "</td><td>" + input("departures", i, "arrTime", "time", d.arrTime) + "</td><td>" +
        input("departures", i, "seats", "number", d.seats) + "</td><td>" + input("departures", i, "price", "number", d.price) + '</td><td><select data-l="departures" data-i="' + i + '" data-f="status">' +
        statusOpts.map(function (s) { return "<option" + (s === d.status ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select></td><td><button class="btn btn-ghost btn-sm" data-del="departures" data-i="' + i + '">✕</button></td></tr>';
    }).join("") || '<tr><td colspan="12">No departures yet.</td></tr>';

    $("pkgRows").innerHTML = D.packages.map(function (p, i) {
      return "<tr><td>" + input("packages", i, "name", "text", p.name) + '</td><td><select data-l="packages" data-i="' + i + '" data-f="category">' +
        ["fly", "drive", "special", "fixed"].map(function (c) { return "<option" + (c === p.category ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></td><td>" +
        input("packages", i, "nights", "number", p.nights) + "</td><td>" + input("packages", i, "days", "number", p.days) + "</td><td>" + input("packages", i, "price", "number", p.price) + "</td><td>" +
        input("packages", i, "route", "text", p.route) + "</td><td>" + input("packages", i, "summary", "text", p.summary) + '</td><td><input type="checkbox" data-l="packages" data-i="' + i + '" data-f="active"' + (p.active !== false ? " checked" : "") +
        ' style="width:auto;min-width:0"></td><td><button class="btn btn-ghost btn-sm" data-del="packages" data-i="' + i + '">✕</button></td></tr>';
    }).join("");

    var S = D.settings, set = function (k, v) { var el = document.querySelector('[data-s="' + k + '"]'); if (el.type === "checkbox") el.checked = !!v; else el.value = v == null ? "" : v; };
    set("whatsapp", S.whatsapp); set("phone", S.phone); set("email0", S.emails[0]); set("email1", S.emails[1]); set("hours", S.hours); set("sdfUSD", S.sdfUSD);
    set("address", S.address); set("annText", S.announcement.text); set("annOn", S.announcement.enabled);
  }

  var NUM = { seats: 1, price: 1, nights: 1, days: 1 };
  document.addEventListener("input", function (e) { handle(e.target); });
  document.addEventListener("change", function (e) { handle(e.target); if (e.target.dataset.f === "date" || e.target.dataset.f === "packageId") render(); });
  function handle(t) {
    if (t.dataset.l) {
      var o = D[t.dataset.l][+t.dataset.i], f = t.dataset.f;
      o[f] = t.type === "checkbox" ? t.checked : NUM[f] ? Number(t.value) || 0 : t.value; mark(true);
    } else if (t.dataset.s) {
      var S = D.settings, k = t.dataset.s, v = t.type === "checkbox" ? t.checked : t.value;
      if (k === "email0") S.emails[0] = v; else if (k === "email1") S.emails[1] = v; else if (k === "annText") S.announcement.text = v; else if (k === "annOn") S.announcement.enabled = v;
      else if (k === "sdfUSD") S.sdfUSD = Number(v) || 0; else if (k === "whatsapp") S.whatsapp = v.replace(/\D/g, ""); else S[k] = v;
      mark(true);
    }
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.dataset.del) { if (confirm("Delete this row?")) { D[t.dataset.del].splice(+t.dataset.i, 1); mark(true); render(); } }
  });
  $("addDep").onclick = function () {
    var p = D.packages[0], today = new Date().toISOString().slice(0, 10);
    D.departures.push({ id: uid("d"), packageId: p ? p.id : "", date: today, from: "Mumbai", airline: "Drukair", flight: "", route: "Mumbai → Paro", depTime: "", arrTime: "", seats: 10, price: 0, status: "open" });
    mark(true); render();
  };
  $("addPkg").onclick = function () {
    D.packages.push({ id: uid("pkg-"), category: "fly", name: "New package", nights: 5, days: 6, price: 0, active: true, route: "", summary: "", highlights: [], itinerary: [] });
    mark(true); render();
  };
  $("applyPct").onclick = function () {
    var pct = Number($("pct").value); if (!isFinite(pct)) return;
    if (!confirm("Change every package price by " + pct + "%?")) return;
    D.packages.forEach(function (p) { if (p.price > 0) p.price = Math.round(p.price * (1 + pct / 100) / 5) * 5; });
    mark(true); render();
  };
  $("setPw").onclick = function () {
    var v = $("np").value; if (v.length < 8) return alert("Use at least 8 characters.");
    try { localStorage.setItem(PWK, H(v)); $("np").value = ""; alert("Password updated for this browser."); } catch (e) { alert("Could not save password."); }
  };
  function download(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  $("dlJs").onclick = function () { download("site-data.js", "window.BHUTANZ_DEFAULT = " + JSON.stringify(D, null, 2) + ";\n", "text/javascript"); };
  $("dlJson").onclick = function () { download("bhutanz-backup.json", JSON.stringify(D, null, 2), "application/json"); };
  $("imp").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { var j = JSON.parse(r.result); if (!j.packages || !j.departures || !j.settings) throw 0; D = j; mark(true); render(); } catch (x) { alert("That file isn't a valid backup."); } };
    r.readAsText(f);
  };
  $("reset").onclick = function () { if (confirm("Discard all edits made in this browser?")) { Store.reset(); D = Store.load(); mark(false); render(); } };
})();
