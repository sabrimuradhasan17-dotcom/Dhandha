(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- helpers ----------
  var inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  function emi(p, annualRate, months) {
    var r = annualRate / 12 / 100;
    if (r === 0) return p / months;
    var f = Math.pow(1 + r, months);
    return p * r * f / (f - 1);
  }
  function tenureLabel(m) {
    if (m < 24) return m + ' months';
    var y = Math.floor(m / 12), rem = m % 12;
    return y + ' yr' + (y > 1 ? 's' : '') + (rem ? ' ' + rem + ' mo' : '');
  }

  // ---------- mobile menu ----------
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('#menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  // ---------- quick estimate (hero) ----------
  var qAmt = $('#q-amt'), qTen = $('#q-ten');
  function quick() {
    var a = +qAmt.value, t = +qTen.value;
    $('#q-amt-o').textContent = inr.format(a);
    $('#q-ten-o').textContent = t + ' months';
    $('#q-emi').textContent = inr.format(Math.round(emi(a, 11, t)));
  }
  qAmt.addEventListener('input', quick);
  qTen.addEventListener('input', quick);
  quick();

  // ---------- full calculator ----------
  var cAmt = $('#c-amt'), cRate = $('#c-rate'), cTen = $('#c-ten');
  function calc() {
    var p = +cAmt.value, rate = +cRate.value, m = +cTen.value;
    var e = emi(p, rate, m), total = e * m, interest = total - p;
    $('#c-amt-o').textContent = inr.format(p);
    $('#c-rate-o').textContent = rate.toFixed(1) + '%';
    $('#c-ten-o').textContent = tenureLabel(m);
    $('#c-emi').textContent = inr.format(Math.round(e));
    $('#c-prin').textContent = inr.format(p);
    $('#c-int').textContent = inr.format(Math.round(interest));
    $('#c-tot').textContent = inr.format(Math.round(total));
    $('#donut').style.setProperty('--p', (p / total * 100).toFixed(1));
    $('#donut').setAttribute('aria-label', 'Principal ' + Math.round(p / total * 100) + ' percent, interest ' + Math.round(interest / total * 100) + ' percent');
  }
  [cAmt, cRate, cTen].forEach(function (el) { el.addEventListener('input', calc); });
  calc();

  // ---------- card filter ----------
  var tabs = $$('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');
      var cat = tab.dataset.cat;
      $$('#card-grid .cc').forEach(function (c) {
        c.hidden = cat !== 'all' && c.dataset.cat.split(' ').indexOf(cat) === -1;
      });
    });
  });

  // ---------- pre-select product from "Apply" links ----------
  $$('[data-product]').forEach(function (a) {
    a.addEventListener('click', function () {
      $('#f-product').value = a.dataset.product;
    });
  });

  // ---------- lead form ----------
  var form = $('#lead-form');
  function setErr(input, msg) {
    var field = input.closest('.field');
    if (field) {
      field.classList.toggle('bad', !!msg);
      field.querySelector('.err').textContent = msg || '';
    }
    return !msg;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#f-name'), phone = $('#f-phone'), email = $('#f-email'), product = $('#f-product'), consent = $('#f-consent');
    var ok = true;
    ok = setErr(name, name.value.trim().length < 2 ? 'Please enter your full name.' : '') && ok;
    ok = setErr(phone, /^[6-9]\d{9}$/.test(phone.value.replace(/[\s-]/g, '')) ? '' : 'Enter a valid 10-digit mobile number.') && ok;
    ok = setErr(email, email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value) ? 'Enter a valid email address.' : '') && ok;
    ok = setErr(product, product.value ? '' : 'Please choose a product.') && ok;
    $('#consent-err').textContent = consent.checked ? '' : 'Please accept to continue.';
    ok = ok && consent.checked;
    if (!ok) return;

    // No backend yet: wire this to your CRM / form service / API here.
    var data = Object.fromEntries(new FormData(form).entries());
    console.info('Lead captured (demo):', data);
    var msg = $('#form-ok');
    msg.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '! Our advisor will call you within one working day.';
    msg.hidden = false;
    form.reset();
  });

  // ---------- scroll reveal ----------
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  $('#yr').textContent = new Date().getFullYear();
})();
