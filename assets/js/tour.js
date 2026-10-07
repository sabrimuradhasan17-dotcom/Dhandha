(function () {
  var D = Store.load(), S = D.settings, esc = U.esc, main = document.getElementById("main");
  var id = new URLSearchParams(location.search).get("id");
  var p = D.packages.filter(function (x) { return x.id === id; })[0];
  var wa = function (t) { return U.wa(S, t); };
  document.getElementById("navWa").href = document.getElementById("fab").href = wa("Hello " + S.brand + ", I'd like help with a Bhutan trip.");
  if (!p) { main.innerHTML = '<h1>Package not found</h1><p><a href="index.html#packages">Browse all packages</a></p>'; return; }
  document.title = p.name + " " + p.nights + "N/" + p.days + "D — " + S.brand;
  var deps = U.upcoming(D).filter(function (d) { return d.packageId === p.id; });
  var sdfNote = "SDF (international): USD " + S.sdfUSD + " per person per night, paid separately.";

  main.innerHTML =
    '<div class="breadcrumb"><a href="index.html">Home</a> › <a href="index.html#packages">Packages</a> › ' + esc(p.name) + "</div>" +
    '<div class="detail"><div>' +
    '<div class="eyebrow">' + esc(p.route) + "</div><h1>" + esc(p.name) + " · " + p.nights + "N / " + p.days + "D</h1><p class='lead'>" + esc(p.summary) + "</p>" +
    '<div class="tags" style="margin:14px 0 30px">' + p.highlights.map(function (h) { return '<span class="tag">' + esc(h) + "</span>"; }).join("") + "</div>" +
    "<h2>Itinerary</h2><ol class='timeline' style='padding-left:22px'>" +
    p.itinerary.map(function (t, i) { return "<li><b>Day " + (i + 1) + "</b> — " + esc(t) + "</li>"; }).join("") + "</ol>" +
    "<h2 style='margin-top:36px'>Departures &amp; flights</h2>" +
    (deps.length ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>From</th><th>Flight</th><th>Seats</th></tr></thead><tbody>' +
      deps.map(function (d) {
        var s = U.seatInfo(d);
        return "<tr><td><b>" + U.date(d.date) + "</b></td><td>" + esc(d.from) + "</td><td>" + esc(d.airline || "TBC") + (d.flight ? " · " + esc(d.flight) : "") +
          "<br><span class='note'>" + esc(d.route || "") + (d.depTime ? " · " + esc(d.depTime) + " → " + esc(d.arrTime || "—") : "") + "</span></td><td><span class='pill " + s.cls + "'>" + s.label + "</span></td></tr>";
      }).join("") + "</tbody></table></div>" : "<p>No scheduled departure — this journey runs privately on your dates.</p>") +
    "<h2 style='margin-top:36px'>Good to know</h2><ul><li>Prices are per person on twin sharing; single supplement on request.</li><li>" + esc(sdfNote) + " 5% GST applies to tour services.</li><li>Entrance fees, camera fees, personal expenses and tips are excluded.</li><li>Travel insurance is mandatory.</li></ul>" +
    '</div><aside class="side"><div class="note">From</div><div style="font-family:Cormorant Garamond,serif;font-size:2.2rem;font-weight:700;color:var(--maroon)">' + U.money(Number(p.price)) +
    ' <small style="font-size:.9rem;font-weight:400">per person</small></div>' +
    '<hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><label for="pax">Travellers</label><input id="pax" type="number" min="1" value="2">' +
    '<label for="dep" style="margin-top:10px">Departure</label><select id="dep"><option value="">Private / my own dates</option>' +
    deps.filter(function (d) { return U.seatInfo(d).cls !== "full"; }).map(function (d) { return '<option value="' + esc(d.id) + '">' + U.date(d.date) + " · " + esc(d.from) + "</option>"; }).join("") + "</select>" +
    '<div id="est" style="margin:14px 0;font-size:.92rem"></div>' +
    '<a id="book" class="btn btn-wa" style="width:100%;justify-content:center" target="_blank" rel="noopener" href="#">Enquire on WhatsApp</a>' +
    "<p class='note' style='margin-top:10px'>Estimate only — final quote confirms hotels, season and flights.</p></aside></div>";

  function update() {
    var pax = Math.max(1, +document.getElementById("pax").value || 1), did = document.getElementById("dep").value;
    var dep = D.departures.filter(function (x) { return x.id === did; })[0], each = U.priceOf(p, dep);
    var sdf = S.sdfUSD * p.nights * pax;
    document.getElementById("est").innerHTML = each > 0
      ? "Package: <b>USD " + (each * pax).toLocaleString() + "</b><br>SDF (intl.): <b>USD " + sdf.toLocaleString() + "</b><br>Estimated total: <b>USD " + (each * pax + sdf).toLocaleString() + "</b>"
      : "Package price on request.<br>SDF (intl.): <b>USD " + sdf.toLocaleString() + "</b>";
    var msg = "Hello, I'm interested in the " + p.name + " " + p.nights + "N/" + p.days + "D for " + pax + " traveller(s)" +
      (dep ? ", departing " + U.date(dep.date) + " from " + dep.from : "") + ".";
    document.getElementById("book").href = wa(msg);
  }
  document.getElementById("pax").oninput = update; document.getElementById("dep").onchange = update; update();
})();
