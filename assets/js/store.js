(function () {
  var KEY = "bhutanz_data_v1";
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var Store = {
    hasOverride: function () { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } },
    load: function () {
      try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {}
      return clone(window.BHUTANZ_DEFAULT);
    },
    save: function (d) { localStorage.setItem(KEY, JSON.stringify(d)); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    defaults: function () { return clone(window.BHUTANZ_DEFAULT); }
  };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var money = function (n) { return n > 0 ? "USD " + Number(n).toLocaleString("en-US") : "On request"; };
  var parseDate = function (s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var date = function (s) {
    if (!s) return "";
    return parseDate(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  var wa = function (settings, text) {
    return "https://wa.me/" + settings.whatsapp + "?text=" + encodeURIComponent(text);
  };
  var upcoming = function (d) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return d.departures.filter(function (x) { return parseDate(x.date) >= t && x.status !== "cancelled"; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  };
  var seatInfo = function (dep) {
    if (dep.status === "full" || Number(dep.seats) <= 0) return { cls: "full", label: "Sold out" };
    if (dep.status === "few" || Number(dep.seats) <= 5) return { cls: "few", label: Number(dep.seats) + " seats left" };
    return { cls: "open", label: Number(dep.seats) + " seats" };
  };
  var priceOf = function (pkg, dep) { return dep && Number(dep.price) > 0 ? Number(dep.price) : Number(pkg.price) || 0; };
  window.Store = Store;
  window.U = { esc: esc, money: money, date: date, parseDate: parseDate, wa: wa, upcoming: upcoming, seatInfo: seatInfo, priceOf: priceOf };
})();
