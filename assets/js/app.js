(function () {
  var D = Store.load(), S = D.settings, esc = U.esc;
  var $ = function (id) { return document.getElementById(id); };
  var pkgs = D.packages.filter(function (p) { return p.active !== false; });
  var byId = {}; D.packages.forEach(function (p) { byId[p.id] = p; });
  var catNames = { all: "All", fly: "Fly in · Fly out", drive: "Drive in · Drive out", special: "Special interest", fixed: "Fixed departures" };

  var wa = function (t) { return U.wa(S, t); };
  $("navWa").href = $("fab").href = wa("Hello " + S.brand + ", I would like guidance for planning a Bhutan journey.");
  $("menuBtn").onclick = function () { $("nav").classList.toggle("open"); };
  $("nav").onclick = function () { $("nav").classList.remove("open"); };
  $("yr").textContent = new Date().getFullYear();
  if (S.announcement && S.announcement.enabled) $("banner").innerHTML = '<div class="banner">' + esc(S.announcement.text) + "</div>";

  /* quick enquiry */
  $("qPkg").innerHTML = '<option value="">Not sure yet</option>' + pkgs.map(function (p) {
    return '<option value="' + esc(p.id) + '">' + esc(p.name) + " " + p.nights + "N/" + p.days + "D</option>";
  }).join("");
  $("quick").onsubmit = function (e) {
    e.preventDefault();
    var p = byId[$("qPkg").value];
    var msg = "Hello " + S.brand + ", I'm " + $("qName").value + ". I'd like to plan a Bhutan trip" +
      (p ? " (" + p.name + " " + p.nights + "N/" + p.days + "D)" : "") +
      ($("qDate").value ? " in " + $("qDate").value : "") + " for " + $("qPax").value + " traveller(s).";
    window.open(wa(msg), "_blank");
  };
  $("contactForm").onsubmit = function (e) {
    e.preventDefault();
    window.open(wa("Hello, I'm " + $("cName").value + ". " + $("cMsg").value), "_blank");
  };

  /* stats */
  var deps = U.upcoming(D);
  var prices = pkgs.map(function (p) { return Number(p.price); }).filter(function (n) { return n > 0; });
  $("stats").innerHTML = [
    [pkgs.length, "Tour packages"], [deps.length, "Upcoming departures"],
    [prices.length ? "USD " + Math.min.apply(null, prices).toLocaleString() : "—", "Starting from / person"], ["5+", "Valleys covered"]
  ].map(function (s) { return '<div class="stat"><b>' + esc(s[0]) + "</b>" + esc(s[1]) + "</div>"; }).join("");

  /* packages */
  var cat = "all";
  function drawChips() {
    var cats = ["all"].concat(["fly", "drive", "special", "fixed"].filter(function (c) { return pkgs.some(function (p) { return p.category === c; }); }));
    $("chips").innerHTML = cats.map(function (c) {
      return '<button class="chip ' + (c === cat ? "on" : "") + '" data-c="' + c + '">' + catNames[c] + "</button>";
    }).join("");
  }
  function drawPkgs() {
    $("pkgGrid").innerHTML = pkgs.filter(function (p) { return cat === "all" || p.category === cat; }).map(function (p) {
      var next = deps.filter(function (d) { return d.packageId === p.id; })[0];
      return '<article class="card"><div class="art ' + esc(p.category) + '">' + esc(p.name) + "<br>" + p.nights + "N / " + p.days + "D</div>" +
        '<div class="body"><div class="note">' + esc(p.route) + "</div><div>" + esc(p.summary) + "</div>" +
        '<div class="tags">' + p.highlights.map(function (h) { return '<span class="tag">' + esc(h) + "</span>"; }).join("") + "</div>" +
        (next ? '<div class="note">Next departure: <b>' + U.date(next.date) + "</b> from " + esc(next.from) + "</div>" : "") +
        '<div class="price"><div><small>From</small><br><b>' + U.money(Number(p.price)) + '</b> <small>pp</small></div>' +
        '<a class="btn btn-primary" href="tour.html?id=' + encodeURIComponent(p.id) + '">View details</a></div></div></article>';
    }).join("");
  }
  $("chips").onclick = function (e) { if (e.target.dataset.c) { cat = e.target.dataset.c; drawChips(); drawPkgs(); } };
  drawChips(); drawPkgs();

  /* departures */
  var city = "All";
  function drawCities() {
    var cities = ["All"].concat(Array.from(new Set(deps.map(function (d) { return d.from; }))));
    $("cityChips").innerHTML = cities.map(function (c) {
      return '<button class="chip ' + (c === city ? "on" : "") + '" data-c="' + esc(c) + '">' + (c === "All" ? "All cities" : "From " + esc(c)) + "</button>";
    }).join("");
  }
  function drawDeps() {
    var rows = deps.filter(function (d) { return city === "All" || d.from === city; });
    $("depBody").innerHTML = rows.length ? rows.map(function (d) {
      var p = byId[d.packageId] || { name: "Package", nights: "", days: "", price: 0 }, s = U.seatInfo(d);
      var msg = "Hello, I'd like to book the " + p.name + " " + p.nights + "N/" + p.days + "D departing " + U.date(d.date) + " from " + d.from + ".";
      return "<tr><td><b>" + U.date(d.date) + "</b><br><span class='note'>from " + esc(d.from) + "</span></td>" +
        "<td>" + esc(p.name) + "<br><span class='note'>" + p.nights + "N / " + p.days + "D</span></td>" +
        "<td>" + esc(d.airline || "TBC") + (d.flight ? " · " + esc(d.flight) : "") + "<br><span class='note'>" + esc(d.route || "") + "</span></td>" +
        "<td>" + (d.depTime || d.arrTime ? esc(d.depTime || "—") + " → " + esc(d.arrTime || "—") : "<span class='note'>To be confirmed</span>") + "</td>" +
        "<td><b>" + U.money(U.priceOf(p, d)) + "</b></td>" +
        "<td><span class='pill " + s.cls + "'>" + s.label + "</span></td>" +
        "<td>" + (s.cls === "full" ? "" : '<a class="btn btn-wa" style="padding:8px 14px" target="_blank" rel="noopener" href="' + wa(msg) + '">Book</a>') + "</td></tr>";
    }).join("") : '<tr><td colspan="7">No departures scheduled right now — message us for private departures on your dates.</td></tr>';
  }
  $("cityChips").onclick = function (e) { if (e.target.dataset.c) { city = e.target.dataset.c; drawCities(); drawDeps(); } };
  drawCities(); drawDeps();

  /* faq, contact, footer */
  $("faqList").innerHTML = D.faqs.map(function (f) { return "<details><summary>" + esc(f[0]) + "</summary><p>" + esc(f[1]) + "</p></details>"; }).join("");
  var mails = S.emails.map(function (m) { return '<a href="mailto:' + esc(m) + '">' + esc(m) + "</a>"; }).join("<br>");
  $("contactCard").innerHTML = "<h3>Mumbai office</h3><p>" + esc(S.address) + "</p><p><b>Call:</b> <a href='tel:" + esc(S.phone.replace(/\s/g, "")) + "'>" + esc(S.phone) +
    "</a><br><b>WhatsApp:</b> <a target='_blank' rel='noopener' href='" + wa("Hello") + "'>+" + esc(S.whatsapp) + "</a><br>" + mails + "</p><p class='note'>" + esc(S.hours) + "</p>";
  var soc = S.social || {};
  $("footCols").innerHTML = "<div><h3 style='color:#fff'>La Bhutanz Tours</h3><p>" + esc(S.tagline) + "</p></div><div><h3 style='color:#fff'>Follow &amp; reviews</h3>" +
    Object.keys(soc).map(function (k) { return '<a target="_blank" rel="noopener" href="' + esc(soc[k]) + '">' + esc(k[0].toUpperCase() + k.slice(1)) + "</a>"; }).join(" · ") +
    "</div><div><h3 style='color:#fff'>Contact</h3>" + esc(S.phone) + "<br>" + mails + "</div>";
})();
