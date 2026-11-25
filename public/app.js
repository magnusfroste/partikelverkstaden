/* Partikelverkstaden – kemi åk 4–6, Lgr22 KE.4-6.1.1.
   Partikelmodellerna ritas och animeras i canvas; ämnena ritas som SVG i kod.
   Inga bildfiler, inga tredjepartsförfrågningar utom kotten.js. */
(function () {
  'use strict';

  var P = window.PARTIKEL, $ = function (id) { return document.getElementById(id); };

  var S = {
    niva: 0, fraga: 0, aktuell: null, stjarnor: 0, nivaStjarnor: [0, 0, 0],
    ljud: true, last: false, anvanda: [], svar: null, forsok: 0, klar: false, forraOvergang: null
  };
  var FRAGOR_PER_NIVA = 6;
  var ANTAL_NIVAR = 3;

  var el = {
    spel: $('spel'), start: $('startskarm'), niva: $('niva'), stjarnor: $('stjarnor'),
    fraga: $('fraga'), fragetext: $('fragetext'), scen: $('scen'), scenin: $('scenin'),
    scennamn: $('scennamn'), kort: $('kort'), svar: $('svar'),
    overlay: $('overlay'), ovTitel: $('ov-titel'), ovText: $('ov-text'), ovStjarnor: $('ov-stjarnor'),
    ovNasta: $('ov-nasta'), ovOm: $('ov-om'),
    ljud: $('ljud'), ljudikon: $('ljudikon')
  };

  /* ---------------- ljud och tal ---------------- */
  var ac = null;
  function slappLjud() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) {}
  }
  function blipp(frekvens, langd, typ, volym) {
    if (!S.ljud) return;
    slappLjud();
    if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = typ || 'sine';
      o.frequency.value = frekvens;
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(volym || 0.12, ac.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (langd || 0.18));
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + (langd || 0.18) + 0.02);
    } catch (e) {}
  }
  var senasteTal = 0;
  function sag(text) {
          try { if (window.__rost && window.__rost(text, true)) return; } catch (e) { }
    if (!S.ljud || !('speechSynthesis' in window)) return;
    try {
      var nu = Date.now();
      if (nu - senasteTal < 200) return;
      senasteTal = nu;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'sv-SE'; u.rate = 0.97; u.pitch = 1.04;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function ritaLjudikon() {
    el.ljudikon.innerHTML = S.ljud
      ? '<path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/>'
      : '<path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/>';
    el.ljud.setAttribute('aria-label', S.ljud ? 'Stäng av ljudet' : 'Sätt på ljudet');
  }

  /* ---------------- partikelmodeller i canvas ---------------- */
  var MODELLER = [];

  function Modell(tillstand, canvas) {
    this.t = tillstand;
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.partiklar = [];
    this.tid = Math.random() * 10;
    this.matt();
    this.skapa();
  }
  Modell.prototype.matt = function () {
    var r = this.c.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(40, Math.round(r.width));
    this.h = Math.max(30, Math.round(r.height));
    this.c.width = Math.round(this.w * dpr);
    this.c.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.r = Math.max(3.4, Math.min(9, Math.min(this.w, this.h) * 0.024));
  };
  Modell.prototype.skapa = function () {
    var w = this.w, h = this.h, i, n;
    this.partiklar = [];
    if (this.t === 'fast') {
      var kol = 5, rad = 4;
      for (var y = 0; y < rad; y++) {
        for (var x = 0; x < kol; x++) {
          this.partiklar.push({
            hx: (x + 0.8) * (w / (kol + 0.6)),
            hy: (y + 0.8) * (h / (rad + 0.6)),
            fas: Math.random() * 6.28
          });
        }
      }
    } else if (this.t === 'flytande') {
      n = 24;
      for (i = 0; i < n; i++) {
        this.partiklar.push({
          x: Math.random() * w,
          y: h * 0.45 + Math.random() * h * 0.45,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12
        });
      }
    } else {
      n = 11;
      for (i = 0; i < n; i++) {
        var a = Math.random() * 6.28, f = 34 + Math.random() * 40;
        this.partiklar.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: Math.cos(a) * f, vy: Math.sin(a) * f
        });
      }
    }
  };
  Modell.prototype.steg = function (dt) {
    var w = this.w, h = this.h, r = this.r, i, p;
    this.tid += dt;
    if (this.t === 'fast') return; /* vibrerar bara i ritningen */
    if (this.t === 'flytande') {
      for (i = 0; i < this.partiklar.length; i++) {
        p = this.partiklar[i];
        p.vx += (Math.random() - 0.5) * 90 * dt;
        p.vy += (Math.random() - 0.5) * 90 * dt;
        p.vy += 26 * dt;               /* svag tyngd: vätskan ligger i botten */
        p.vx *= 0.96; p.vy *= 0.96;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < r) { p.x = r; p.vx = Math.abs(p.vx); }
        if (p.x > w - r) { p.x = w - r; p.vx = -Math.abs(p.vx); }
        if (p.y < h * 0.42) { p.y = h * 0.42; p.vy = Math.abs(p.vy); }
        if (p.y > h - r) { p.y = h - r; p.vy = -Math.abs(p.vy) * 0.6; }
      }
      return;
    }
    for (i = 0; i < this.partiklar.length; i++) {
      p = this.partiklar[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < r) { p.x = r; p.vx = Math.abs(p.vx); }
      if (p.x > w - r) { p.x = w - r; p.vx = -Math.abs(p.vx); }
      if (p.y < r) { p.y = r; p.vy = Math.abs(p.vy); }
      if (p.y > h - r) { p.y = h - r; p.vy = -Math.abs(p.vy); }
    }
  };
  Modell.prototype.rita = function () {
    var g = this.ctx, w = this.w, h = this.h, i, p, r = this.r;
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(43,106,97,.88)';
    if (this.t === 'fast') {
      for (i = 0; i < this.partiklar.length; i++) {
        p = this.partiklar[i];
        var dx = Math.sin(this.tid * 4 + p.fas) * Math.min(2.2, w * 0.012);
        var dy = Math.cos(this.tid * 3.4 + p.fas) * Math.min(2.2, h * 0.012);
        g.beginPath(); g.arc(p.hx + dx, p.hy + dy, r, 0, 6.2832); g.fill();
      }
    } else {
      for (i = 0; i < this.partiklar.length; i++) {
        p = this.partiklar[i];
        g.beginPath(); g.arc(p.x, p.y, r, 0, 6.2832); g.fill();
      }
    }
  };
  Modell.prototype.forstor = function () { this.matt(); this.skapa(); };

  var senasteTid = 0;
  function ritaAlla(ts) {
    var dt = senasteTid ? Math.min(0.05, (ts - senasteTid) / 1000) : 0.016;
    senasteTid = ts;
    for (var i = 0; i < MODELLER.length; i++) {
      MODELLER[i].steg(dt);
      MODELLER[i].rita();
    }
    requestAnimationFrame(ritaAlla);
  }
  requestAnimationFrame(ritaAlla);

  function nyModell(tillstand, stor) {
    var c = document.createElement('canvas');
    c.className = 'modell-canvas';
    c.setAttribute('aria-hidden', 'true');
    if (stor) c.style.maxWidth = '100%';
    var m = new Modell(tillstand, c);
    MODELLER.push(m);
    /* måtten är 0 innan elementet sitter i DOM – mät om nästa frame */
    requestAnimationFrame(function () { if (c.isConnected) m.forstor(); });
    return { canvas: c, modell: m };
  }

  /* ---------------- ämnesbilder som SVG ---------------- */
  function svgFor(a) {
    var k = a.ritning, s = '<svg viewBox="0 0 100 100" role="img" aria-label="' + a.namn + '">';
    if (k === 'is') {
      s += '<path d="M22 40 L50 24 L78 40 L78 74 L50 90 L22 74 Z" fill="#cfeaf4" stroke="#7fb9cf" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M22 40 L50 56 L78 40 M50 56 L50 90" fill="none" stroke="#8cc4d8" stroke-width="2.4"/>' +
        '<path d="M33 46 L44 52" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    } else if (k === 'smor') {
      s += '<rect x="18" y="46" width="64" height="34" rx="6" fill="#f4d57a" stroke="#c9a13c" stroke-width="3"/>' +
        '<path d="M18 56 h64" stroke="#e6c05c" stroke-width="3"/>' +
        '<path d="M30 46 v-8 h40 v8" fill="#f9e6a8" stroke="#c9a13c" stroke-width="2.6" stroke-linejoin="round"/>';
    } else if (k === 'jarn') {
      s += '<rect x="44" y="18" width="12" height="60" rx="3" fill="#9aa4a8" stroke="#5f6a6e" stroke-width="2.6"/>' +
        '<path d="M34 18 h32 v9 h-32 z" fill="#b3bdc1" stroke="#5f6a6e" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M50 82 l-8 9 l16 0 z" fill="#8a959a" stroke="#5f6a6e" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M47 32 v30" stroke="#e3e8ea" stroke-width="2.4"/>';
    } else if (k === 'socker') {
      s += '<path d="M28 42 L50 30 L72 42 L72 70 L50 82 L28 70 Z" fill="#fbfbf8" stroke="#cfc9ba" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M28 42 L50 54 L72 42 M50 54 L50 82" fill="none" stroke="#ded7c7" stroke-width="2.4"/>' +
        '<circle cx="39" cy="62" r="2.4" fill="#e6e0d1"/><circle cx="60" cy="58" r="2.4" fill="#e6e0d1"/>' +
        '<circle cx="57" cy="70" r="2.4" fill="#e6e0d1"/>';
    } else if (k === 'vatten' || k === 'mjolk') {
      var farg = k === 'vatten' ? '#8ccbd8' : '#f7f4ea';
      var kant = k === 'vatten' ? '#5fa6b6' : '#cfc6b2';
      s += '<path d="M30 22 h40 l-4 60 a6 6 0 0 1 -6 5 H40 a6 6 0 0 1 -6 -5 Z" fill="#ffffff" stroke="#b9c4c2" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M33 48 h34 l-3 34 a4 4 0 0 1 -4 3 H40 a4 4 0 0 1 -4 -3 Z" fill="' + farg + '" stroke="' + kant + '" stroke-width="2.4"/>' +
        '<path d="M40 26 v10" stroke="#e7eeec" stroke-width="3"/>';
      if (k === 'mjolk') s += '<path d="M35 62 q15 6 30 0" stroke="#e3ddcc" stroke-width="2.4" fill="none"/>';
    } else if (k === 'honung') {
      s += '<path d="M32 32 h36 v46 a8 8 0 0 1 -8 8 H40 a8 8 0 0 1 -8 -8 Z" fill="#f1c25e" stroke="#c48f2c" stroke-width="3" stroke-linejoin="round"/>' +
        '<rect x="28" y="24" width="44" height="10" rx="4" fill="#e9d9ae" stroke="#c48f2c" stroke-width="2.6"/>' +
        '<path d="M36 46 h28" stroke="#fff2c8" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M66 40 q14 10 6 26" stroke="#c48f2c" stroke-width="2.4" fill="none"/>';
    } else if (k === 'olja') {
      s += '<path d="M42 20 h16 v12 l10 12 v40 a8 8 0 0 1 -8 8 H40 a8 8 0 0 1 -8 -8 V44 l10 -12 Z" fill="#e7e2a8" stroke="#b7a83e" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M35 66 h30 v18 a5 5 0 0 1 -5 5 H40 a5 5 0 0 1 -5 -5 Z" fill="#d9c954" stroke="#b7a83e" stroke-width="2.4"/>' +
        '<rect x="41" y="14" width="18" height="7" rx="2.4" fill="#b9b6a4" stroke="#8b8878" stroke-width="2"/>';
    } else if (k === 'anga') {
      s += '<path d="M20 58 h60 v14 a12 12 0 0 1 -12 12 H32 a12 12 0 0 1 -12 -12 Z" fill="#c7cfd2" stroke="#8b989c" stroke-width="3" stroke-linejoin="round"/>' +
        '<rect x="12" y="52" width="76" height="8" rx="4" fill="#aeb9bc" stroke="#8b989c" stroke-width="2.4"/>' +
        '<path d="M34 44 q-8 -10 0 -18 q8 -8 0 -16" fill="none" stroke="#9fb3b8" stroke-width="5" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M50 46 q-8 -10 0 -18 q8 -8 0 -16" fill="none" stroke="#9fb3b8" stroke-width="5" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M66 44 q-8 -10 0 -18 q8 -8 0 -16" fill="none" stroke="#9fb3b8" stroke-width="5" stroke-linecap="round" opacity=".85"/>';
    } else if (k === 'ballong') {
      s += '<ellipse cx="50" cy="42" rx="26" ry="30" fill="#e88f8a" stroke="#c2655f" stroke-width="3"/>' +
        '<path d="M50 72 l-5 6 h10 z" fill="#c2655f"/>' +
        '<path d="M50 78 q-10 10 2 18" fill="none" stroke="#8b989c" stroke-width="2.6"/>' +
        '<ellipse cx="41" cy="32" rx="6" ry="9" fill="#fff" opacity=".45"/>';
    } else if (k === 'gasol') {
      s += '<rect x="30" y="30" width="40" height="56" rx="10" fill="#d9a65a" stroke="#a87833" stroke-width="3"/>' +
        '<rect x="43" y="20" width="14" height="12" rx="3" fill="#b8b2a4" stroke="#7f7a6d" stroke-width="2.4"/>' +
        '<path d="M30 48 h40" stroke="#a87833" stroke-width="2.4"/>' +
        '<path d="M38 62 h24 M38 72 h16" stroke="#fff1d4" stroke-width="3" stroke-linecap="round"/>';
    }
    return s + '</svg>';
  }

  /* ---------------- HUD ---------------- */
  function ritaNiva() {
    var s = '';
    for (var i = 0; i < ANTAL_NIVAR; i++) s += '<i class="' + (i < S.niva ? 'klar' : '') + '"></i>';
    el.niva.innerHTML = s;
    el.niva.setAttribute('aria-label', 'Nivå ' + (S.niva + 1) + ' av ' + ANTAL_NIVAR);
    var st = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
    el.stjarnor.innerHTML = st + '<span>' + S.stjarnor + '</span>';
    el.stjarnor.setAttribute('aria-label', S.stjarnor + ' stjärnor');
  }

  /* ---------------- rendering ---------------- */
  function rensaModeller() {
    MODELLER = [];
  }

  function visaFraga() {
    var f = S.aktuell;
    S.last = false; S.forsok = 0; S.svar = null;
    el.fraga.classList.remove('fel-text');
    el.svar.textContent = '';
    el.svar.className = 'svar';
    el.fragetext.textContent = f.fraga;
    rensaModeller();
    el.scenin.innerHTML = '';
    el.scennamn.textContent = '';
    el.kort.innerHTML = '';

    if (f.typ === 'L1') {
      el.scenin.innerHTML = svgFor(f.amne);
      el.scennamn.textContent = f.amne.namn;
      f.val.forEach(function (t, i) {
        lagKort(el.kort, i, 'modell', t, null);
      });
    } else if (f.typ === 'L2') {
      var mo = nyModell(f.modell, true);
      el.scenin.appendChild(mo.canvas);
      el.scennamn.textContent = 'Partikelmodell';
      f.val.forEach(function (a, i) {
        lagKort(el.kort, i, 'amne', a, a.namn);
      });
    } else {
      var mo2 = nyModell(f.fran, true);
      el.scenin.appendChild(mo2.canvas);
      var pil = document.createElement('div');
      pil.className = 'pil' + (f.riktning === 'kall' ? ' kall' : '');
      pil.innerHTML = '<span class="pil-pil" aria-hidden="true">' + (f.riktning === 'kall' ? '❄' : '☀') + '</span><span class="pil-text">' + (f.riktning === 'kall' ? 'kyls' : 'värms') + '</span>';
      pil.setAttribute('aria-label', f.riktning === 'kall' ? 'kyls' : 'värms');
      el.scenin.appendChild(pil);
      el.scennamn.textContent = P.TILLSTAND_NAMN[f.fran];
      f.val.forEach(function (t, i) {
        lagKort(el.kort, i, 'modell', t, null);
      });
    }
    sag(f.fraga);
  }

  function lagKort(container, i, typ, data, namn) {
    var b = document.createElement('button');
    b.className = 'kortväljare';
    b.type = 'button';
    if (typ === 'modell') {
      b.setAttribute('aria-label', 'Partikelmodell ' + (i + 1) + ': ' + P.MODELL_TEXT[data]);
      var box = document.createElement('div');
      box.className = 'kort-in';
      var mo = nyModell(data, false);
      box.appendChild(mo.canvas);
      b.appendChild(box);
      b.dataset.modell = data;
    } else {
      b.setAttribute('aria-label', data.namn);
      var box2 = document.createElement('div');
      box2.className = 'kort-in';
      box2.innerHTML = svgFor(data);
      b.appendChild(box2);
      var nm = document.createElement('span');
      nm.className = 'kort-namn';
      nm.textContent = data.namn;
      b.appendChild(nm);
    }
    b.addEventListener('click', function () { svara(i); });
    container.appendChild(b);
  }

  /* ---------------- spellogik ---------------- */
  function nastaFraga() {
    if (S.fraga >= FRAGOR_PER_NIVA) return nivaKlar();
    var f;
    if (S.niva === 0) f = P.fragaL1(Math.random, S.anvanda);
    else if (S.niva === 1) f = P.fragaL2(Math.random, S.anvanda);
    else f = P.fragaL3(Math.random, S.forraOvergang);
    if (S.niva < 2 && f.amne) S.anvanda.push(f.amne.id);
    S.forraOvergang = f.typ === 'L3' ? f.fran + '|' + f.riktning : null;
    S.aktuell = f;
    visaFraga();
  }

  function rattIndex() {
    var f = S.aktuell, r = -1;
    f.val.forEach(function (v, i) {
      var arRatt = f.typ === 'L2' ? v.id === f.svar : v === f.svar;
      if (arRatt) r = i;
    });
    return r;
  }

  function svara(i) {
    if (S.last || S.klar || el.spel.hidden) return;
    var f = S.aktuell, ratt = rattIndex(), vald = el.kort.children[i];
    if (i === ratt) {
      S.last = true; S.svar = true;
      if (S.forsok === 0) { S.stjarnor++; S.nivaStjarnor[S.niva]++; }
      ritaNiva();
      vald.classList.add('ratt');
      el.svar.className = 'svar';
      el.svar.textContent = 'Rätt! ' + f.forklaring;
      blipp(660, 0.12, 'sine', 0.14);
      setTimeout(function () { blipp(880, 0.16, 'sine', 0.12); }, 110);
      sag('Rätt. ' + f.forklaring);
      setTimeout(nasta, 2600);
    } else {
      S.forsok++;
      vald.classList.add('fel');
      blipp(190, 0.18, 'triangle', 0.1);
      if ('skolappar' in window && window.skolappar && window.skolappar.event) window.skolappar.event('hint');
      if (S.forsok === 1) {
        el.svar.className = 'svar fel-text';
        el.svar.textContent = f.typ === 'L3'
          ? 'Inte riktigt. Tänk på hur partiklarna rör sig när temperaturen ändras.'
          : 'Inte riktigt. Titta på hur partiklarna ligger och hur de rör sig.';
        sag('Inte riktigt. Titta en gång till.');
        setTimeout(function () { vald.classList.remove('fel'); }, 400);
      } else {
        S.last = true;
        el.kort.children[ratt].classList.add('ratt', 'andar');
        el.svar.className = 'svar';
        el.svar.textContent = 'Här är rätt svar: ' + f.forklaring;
        sag('Här är rätt svar. ' + f.forklaring);
        setTimeout(nasta, 3400);
      }
    }
  }

  function nasta() {
    if (S.klar) return;
    S.fraga++;
    nastaFraga();
  }

  function nivaKlar() {
    S.last = true;
    var sista = S.niva >= ANTAL_NIVAR - 1;
    el.ovTitel.textContent = sista ? 'Alla nivåer klara!' : 'Nivå ' + (S.niva + 1) + ' klar!';
    el.ovText.textContent = sista
      ? 'Du har sett hur partiklarna ligger i fast form, flytande form och gas – och vad som händer när ett ämne värms eller kyls. Partiklarna är alltid desamma; det är avståndet och rörelsen som ändras.'
      : 'Du fick ' + S.nivaStjarnor[S.niva] + ' av ' + FRAGOR_PER_NIVA + ' stjärnor på den här nivån.';
    var st = '';
    for (var i = 0; i < (sista ? ANTAL_NIVAR : FRAGOR_PER_NIVA); i++) {
      var ifyllt = sista ? true : i < S.nivaStjarnor[S.niva];
      st += '<i class="' + (ifyllt ? '' : 'tom') + '"></i>';
    }
    el.ovStjarnor.innerHTML = st;
    el.ovNasta.textContent = sista ? 'Spela igen' : 'Nästa nivå';
    el.ovOm.hidden = true;
    el.overlay.hidden = false;
    if (sista) {
      S.klar = true;
      blipp(660, 0.14, 'sine', 0.14);
      setTimeout(function () { blipp(880, 0.14, 'sine', 0.13); }, 130);
      setTimeout(function () { blipp(1046, 0.24, 'sine', 0.12); }, 270);
      sag('Alla nivåer klara! Du fick ' + S.stjarnor + ' stjärnor.');
      if ('skolappar' in window && window.skolappar && window.skolappar.event) {
        window.skolappar.event('round_done', Math.round(100 * S.stjarnor / (FRAGOR_PER_NIVA * ANTAL_NIVAR)));
      }
    } else {
      sag('Nivå ' + (S.niva + 1) + ' klar. Du fick ' + S.nivaStjarnor[S.niva] + ' av ' + FRAGOR_PER_NIVA + ' stjärnor.');
    }
  }

  function starta() {
    S.niva = 0; S.fraga = 0; S.stjarnor = 0; S.nivaStjarnor = [0, 0, 0];
    S.anvanda = []; S.klar = false; S.last = false; S.forraOvergang = null;
    el.start.hidden = true;
    el.spel.hidden = false;
    el.overlay.hidden = true;
    ritaNiva();
    if ('skolappar' in window && window.skolappar && window.skolappar.event) {
      window.skolappar.event('round_start');
      window.skolappar.event('level', 1);
    }
    nastaFraga();
  }

  el.ovNasta.addEventListener('click', function () {
    el.overlay.hidden = true;
    if (S.klar) { starta(); return; }
    S.niva++;
    S.fraga = 0;
    S.nivaStjarnor[S.niva] = 0;
    S.anvanda = [];
    S.forraOvergang = null;
    ritaNiva();
    if ('skolappar' in window && window.skolappar && window.skolappar.event) window.skolappar.event('level', S.niva + 1);
    nastaFraga();
  });

  $('spela').addEventListener('click', function () {
    slappLjud();
    starta();
  });

  el.ljud.addEventListener('click', function () {
    S.ljud = !S.ljud;
    if (!S.ljud) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      if ('skolappar' in window && window.skolappar && window.skolappar.event) window.skolappar.event('sound_off');
    } else {
      slappLjud();
    }
    ritaLjudikon();
  });

  window.addEventListener('resize', function () {
    MODELLER.forEach(function (m) { m.forstor(); });
  });

  ritaLjudikon();

  /* test- och felsökningshandtag */
  window.__game = {
    S: S, starta: starta, nastaFraga: nastaFraga, svara: svara, rattIndex: rattIndex,
    visaFraga: visaFraga,
    modeller: function () { return MODELLER; }
  };
})();