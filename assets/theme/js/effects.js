/*!
 * saisonal.js — SkyX Games · effets saisonniers "Zero Point"
 * ---------------------------------------------------------------------------
 *  • Deux rails d'énergie (gauche/droite) façon tentacules du Point Zéro :
 *    filaments translucides, effilés, dégradés, impulsions lumineuses.
 *  • Guirlande d'ornements vectoriels (citrouilles/chauves-souris/fantômes,
 *    flocons/étoiles/boules, étoiles/étincelles) accrochée au rail.
 *  • Le rail est TOUJOURS clippé entre le bas de la navbar et le haut du footer
 *    (clip-path recalculé au scroll) → aucun z-index à toucher dans tes pages.
 *  • Effets texte : neige posée sur les titres (Noël), halo + chauve-souris
 *    dorée (Halloween), étincelle dorée (Nouvel An).
 *  • Feux d'artifice (Nouvel An, PC uniquement).
 *  • Mobile : version statique, couleur unie, sans animation, quasi collée au bord.
 *  • Mode TEST : ?sx=noel  ?sx=halloween  ?sx=nouvelan  ?sx=off  ?sx=auto
 *                ?sxdate=12-24  ou  ?sxdate=2026-12-31
 *                ?sxtest=1 (panneau)  ·  Ctrl+Alt+S (panneau)  ·  ?sx=reset
 *    Les réglages sont mémorisés (localStorage) pour naviguer sur tes 50 pages.
 *
 *  Aucune image externe, aucun asset : un seul fichier, ~0 requête réseau.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';
  var hostname = window.location.hostname;
  var isAllowed = hostname === 'skyxgames.com' || 
                  hostname.endsWith('.skyxgames.com') || 
                  hostname === 'localhost' || 
                  hostname === '127.0.0.1';

  if (!isAllowed) return;
  if (window.SaisonalFX) return;

  /* ======================= CONFIG (surchargeable) ======================= */
  // Pour surcharger : <script>window.SAISONAL_CONFIG = { zIndex: 800 }</script> avant ce script.
  var CFG = Object.assign({
    // Fenêtres de dates (MMJJ). from > to = chevauche le 31/12.
    windows: [
      { s: 'halloween', from: 1020, to: 1101 },
      { s: 'noel',      from: 1201, to: 1228 },
      { s: 'nouvelan',  from: 1229, to: 103  }
    ],
    // Éléments qui bornent l'effet (haut = navbar, bas = footer)
    navSelector: 'nav.navbar, .menu .navbar, [once="menu"], header, nav',
    footerSelector: '[once="footers"], footer',
    zIndex: 900,              // sous la navbar (1030) et sous les modales (99999)
    storageKey: 'saisonal_test',
    textFX: true              // effets sur les titres (h1/h2/h3)
  }, window.SAISONAL_CONFIG || {});

  var TAU = Math.PI * 2, rnd = Math.random;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ============================== ÉTAT / TEST ============================ */
  function defaults() { return { season: 'auto', date: '', lite: false, text: CFG.textFX, zone: false, panel: false }; }
  var state = defaults();
  try { var saved = JSON.parse(localStorage.getItem(CFG.storageKey) || 'null'); if (saved) for (var k in saved) state[k] = saved[k]; } catch (e) {}
  function save() { try { localStorage.setItem(CFG.storageKey, JSON.stringify(state)); } catch (e) {} }

  (function readURL() {
    try {
      var p = new URLSearchParams(location.search), touched = false;
      if (p.get('sx') === 'reset') { state = defaults(); try { localStorage.removeItem(CFG.storageKey); } catch (e) {} return; }
      if (p.has('sx')) { state.season = p.get('sx').toLowerCase().replace(/[^a-z]/g, ''); touched = true; }
      if (p.has('sxdate')) { state.date = p.get('sxdate'); touched = true; }
      if (p.has('sxlite')) { state.lite = p.get('sxlite') === '1'; touched = true; }
      if (p.has('sxtest')) { state.panel = p.get('sxtest') !== '0'; touched = true; }
      if (touched) save();
    } catch (e) {}
  })();

  function getNow() {
    if (state.date) {
      var m = /^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})$/.exec(state.date);
      if (m) return new Date(+(m[1] || new Date().getFullYear()), +m[2] - 1, +m[3], 12);
    }
    return new Date();
  }
  function detectSeason(d) {
    var v = (d.getMonth() + 1) * 100 + d.getDate();
    for (var i = 0; i < CFG.windows.length; i++) {
      var w = CFG.windows[i];
      if (w.from <= w.to ? (v >= w.from && v <= w.to) : (v >= w.from || v <= w.to)) return w.s;
    }
    return null;
  }
  function currentSeason() {
    var s = state.season;
    if (s === 'off') return null;
    if (s === 'halloween' || s === 'noel' || s === 'nouvelan') return s;
    return detectSeason(getNow());
  }

  /* ================================ THÈMES =============================== */
  var THEMES = {
    halloween: {
      a: ['#ff5a00', '#ffb000', '#ffe27a', '#ff7a1a', '#c23cff'],
      b: ['#6d28ff', '#c13dff', '#ff5ad9', '#9a35ff', '#ff7a1a'],
      c: ['#fff1c9', '#ffd27a', '#ffffff', '#ffc06a', '#fff1c9'],
      mono: '#ff8a1f', dot: '#ffa64a', glow: '#ffb347',
      sprites: ['pumpkin', 'bat', 'pumpkin', 'ghost', 'bat']
    },
    noel: {
      a: ['#ffffff', '#a8e6ff', '#4db3ff', '#bfe9ff', '#ffffff'],
      b: ['#4a6dff', '#8fb4ff', '#e0f6ff', '#9d8cff', '#4a6dff'],
      c: ['#ffffff', '#e6f8ff', '#ffffff', '#cfeeff', '#ffffff'],
      mono: '#a9e0ff', dot: '#ffffff', glow: '#bfe9ff',
      sprites: ['snow0', 'baubleBlue', 'snow1', 'star', 'baubleRed']
    },
    nouvelan: {
      a: ['#ffd24a', '#fff0a8', '#ffb300', '#ffe68a', '#ff9a1f'],
      b: ['#ff3d9a', '#ff8ac8', '#b84dff', '#ff5fa8', '#ff3d9a'],
      c: ['#fff6d0', '#ffffff', '#ffe9a0', '#ffffff', '#fff6d0'],
      mono: '#ffd166', dot: '#ffd86b', glow: '#ffe08a',
      fw: ['#ffd24a', '#ff5fa8', '#5fd7ff', '#b8ff7a', '#ffffff', '#b184ff'],
      sprites: ['star', 'sparkleGold', 'diamondPink', 'sparkleCyan', 'diamondCyan', 'star']
    }
  };

  /* ============================ SPRITES VECTORIELS ======================= */
  function mkSprite(draw) {
    var c = document.createElement('canvas'); c.width = c.height = 80;
    var x = c.getContext('2d'); x.scale(1.25, 1.25); x.translate(32, 32); draw(x); return c;
  }
  function lg(x, x0, y0, x1, y1, stops) { var g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s, i) { g.addColorStop(i / (stops.length - 1), s); }); return g; }
  function tri(x, a, b, c, d, e, f) { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.lineTo(e, f); x.closePath(); x.fill(); }

  var DRAW = {
    pumpkin: function (x) {
      x.translate(0, 3); x.shadowColor = 'rgba(255,140,20,.95)'; x.shadowBlur = 9;
      var g = x.createRadialGradient(-5, -6, 2, 0, 0, 24);
      g.addColorStop(0, '#ffc15a'); g.addColorStop(.55, '#ff7a00'); g.addColorStop(1, '#b83a00'); x.fillStyle = g;
      [[-11, 0, 11, 16], [11, 0, 11, 16], [0, 0, 12, 18]].forEach(function (e) { x.beginPath(); x.ellipse(e[0], e[1], e[2], e[3], 0, 0, TAU); x.fill(); });
      x.shadowBlur = 0; x.strokeStyle = 'rgba(110,25,0,.5)'; x.lineWidth = 1.3;
      [-6.5, 6.5].forEach(function (sx) { x.beginPath(); x.ellipse(sx, 0, 5, 17, 0, 0, TAU); x.stroke(); });
      x.fillStyle = '#4f7a1a'; x.beginPath(); x.moveTo(-3, -17); x.quadraticCurveTo(-1, -26, 5, -25); x.lineTo(4, -20); x.quadraticCurveTo(2, -19, 3, -16); x.closePath(); x.fill();
      x.fillStyle = '#fff2b0'; x.shadowColor = '#ffd34d'; x.shadowBlur = 6;
      tri(x, -10, -4, -4, -4, -7, -11); tri(x, 4, -4, 10, -4, 7, -11);
      x.beginPath(); x.moveTo(-9, 4); x.lineTo(-5, 8); x.lineTo(-2, 4); x.lineTo(2, 8); x.lineTo(5, 4); x.lineTo(9, 4); x.lineTo(6, 11); x.lineTo(-6, 11); x.closePath(); x.fill();
    },
    bat: function (x) {
      x.shadowColor = 'rgba(255,200,80,.85)'; x.shadowBlur = 8;
      x.fillStyle = lg(x, 0, -15, 0, 15, ['#fff0a8', '#d4af37', '#8a6a12']);
      [1, -1].forEach(function (s) {
        x.save(); x.scale(s, 1); x.beginPath();
        x.moveTo(0, -8); x.lineTo(3, -14); x.lineTo(5, -7); x.quadraticCurveTo(15, -15, 28, -9);
        x.quadraticCurveTo(23, -3, 25, 6); x.quadraticCurveTo(18, 1, 14, 8); x.quadraticCurveTo(11, 1, 7, 10);
        x.quadraticCurveTo(4, 5, 0, 15); x.closePath(); x.fill(); x.restore();
      });
      x.shadowBlur = 0; x.fillStyle = '#7a1d00'; x.fillRect(-3.4, -4, 2, 2); x.fillRect(1.4, -4, 2, 2);
    },
    ghost: function (x) {
      x.shadowColor = 'rgba(190,220,255,.9)'; x.shadowBlur = 9;
      x.fillStyle = lg(x, 0, -17, 0, 20, ['#ffffff', '#cfd8ff']);
      x.beginPath(); x.moveTo(-13, 20); x.lineTo(-13, -4); x.arc(0, -4, 13, Math.PI, 0); x.lineTo(13, 20);
      x.quadraticCurveTo(9, 14, 6.5, 20); x.quadraticCurveTo(3, 14, 0, 20); x.quadraticCurveTo(-3, 14, -6.5, 20); x.quadraticCurveTo(-9, 14, -13, 20);
      x.closePath(); x.fill(); x.shadowBlur = 0; x.fillStyle = '#2a2250';
      x.beginPath(); x.ellipse(-5, -5, 2.4, 3.4, 0, 0, TAU); x.ellipse(5, -5, 2.4, 3.4, 0, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(0, 3, 2.2, 3, 0, 0, TAU); x.fill();
    },
    snow: function (x, v) {
      x.shadowColor = 'rgba(150,215,255,.95)'; x.shadowBlur = 8; x.strokeStyle = lg(x, 0, -24, 0, 24, ['#ffffff', '#bfe9ff', '#ffffff']);
      x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = v ? 2.5 : 1.9;
      for (var i = 0; i < 6; i++) {
        x.save(); x.rotate(i * TAU / 6); x.beginPath();
        x.moveTo(0, 0); x.lineTo(0, -24);
        x.moveTo(-5, -15.5); x.lineTo(0, -10); x.lineTo(5, -15.5);
        x.moveTo(-3.5, -22); x.lineTo(0, -17.5); x.lineTo(3.5, -22);
        x.stroke(); x.restore();
      }
      if (v) { x.beginPath(); x.arc(0, 0, 3.4, 0, TAU); x.stroke(); }
    },
    star: function (x) {
      x.shadowColor = 'rgba(255,210,90,.95)'; x.shadowBlur = 9; x.fillStyle = lg(x, 0, -24, 0, 22, ['#fff6bf', '#ffd24a', '#c98a10']);
      x.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? 10.5 : 24, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r + 1); } x.closePath(); x.fill();
    },
    bauble: function (x, c1, c2) {
      x.shadowColor = c1; x.shadowBlur = 9;
      var g = x.createRadialGradient(-6, 0, 1, 0, 5, 19); g.addColorStop(0, '#ffffff'); g.addColorStop(.28, c1); g.addColorStop(1, c2); x.fillStyle = g;
      x.beginPath(); x.arc(0, 5, 17, 0, TAU); x.fill(); x.shadowBlur = 0;
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.4; x.beginPath(); x.ellipse(0, 5, 17, 6, 0, .15, Math.PI - .15); x.stroke();
      x.fillStyle = lg(x, -5, -14, 5, -8, ['#fff0a8', '#d4af37']); x.fillRect(-5, -14, 10, 6);
      x.strokeStyle = '#d4af37'; x.lineWidth = 1.6; x.beginPath(); x.arc(0, -17, 3, 0, TAU); x.stroke();
    },
    sparkle: function (x, col) {
      x.shadowColor = col; x.shadowBlur = 10; x.fillStyle = lg(x, 0, -24, 0, 24, ['#ffffff', col, '#ffffff']);
      x.beginPath(); x.moveTo(0, -25); x.quadraticCurveTo(2, -2, 25, 0); x.quadraticCurveTo(2, 2, 0, 25); x.quadraticCurveTo(-2, 2, -25, 0); x.quadraticCurveTo(-2, -2, 0, -25); x.fill();
    },
    diamond: function (x, col) {
      x.rotate(.45); x.shadowColor = col; x.shadowBlur = 9; x.fillStyle = lg(x, -8, -12, 8, 12, ['#ffffff', col, col]);
      x.beginPath(); x.moveTo(0, -17); x.lineTo(9, 0); x.lineTo(0, 17); x.lineTo(-9, 0); x.closePath(); x.fill();
    }
  };
  function buildSprites(th) {
    var map = {
      pumpkin: function (x) { DRAW.pumpkin(x); }, bat: DRAW.bat, ghost: DRAW.ghost,
      snow0: function (x) { DRAW.snow(x, 0); }, snow1: function (x) { DRAW.snow(x, 1); }, star: DRAW.star,
      baubleBlue: function (x) { DRAW.bauble(x, '#6fc3ff', '#1b4fa8'); },
      baubleRed: function (x) { DRAW.bauble(x, '#ff5a64', '#9b1220'); },
      sparkleGold: function (x) { DRAW.sparkle(x, '#ffd24a'); }, sparkleCyan: function (x) { DRAW.sparkle(x, '#5fd7ff'); },
      diamondPink: function (x) { DRAW.diamond(x, '#ff5fa8'); }, diamondCyan: function (x) { DRAW.diamond(x, '#5fd7ff'); }
    };
    return th.sprites.map(function (n) { return mkSprite(map[n]); });
  }
  function mkDot(col) {
    var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d');
    var g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, '#fff'); g.addColorStop(.25, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c;
  }

  /* ============================ MESURE NAVBAR / FOOTER =================== */
  var navEls = [], footEls = [], lastQuery = 0;
  function requery(force) {
    var now = performance.now(); if (!force && now - lastQuery < 1500) return; lastQuery = now;
    try { navEls = [].slice.call(document.querySelectorAll(CFG.navSelector)); footEls = [].slice.call(document.querySelectorAll(CFG.footerSelector)); } catch (e) {}
  }
  var clipT = 0, clipB = 0;
  function measure() {
    requery(false);
    var vh = window.innerHeight, top = 0, bot = 0, i, r;
    for (i = 0; i < navEls.length; i++) { r = navEls[i].getBoundingClientRect(); if (r.height > 0 && r.height <= 220 && r.top <= 2 && r.bottom > top) top = r.bottom; }
    var ft = vh;
    for (i = 0; i < footEls.length; i++) { r = footEls[i].getBoundingClientRect(); if (r.height > 0 && r.top < ft) ft = r.top; }
    bot = Math.max(0, vh - ft);
    top = clamp(Math.round(top), 0, vh); bot = clamp(Math.round(bot), 0, vh);
    return top !== clipT || bot !== clipB ? (clipT = top, clipB = bot, true) : false;
  }

  /* ================================= LAYOUT ============================== */
  var qCap = null;
  function layout() {
    var w = window.innerWidth, h = window.innerHeight;
    var tier = w < 768 ? 'm' : w < 1200 ? 's' : 'l';
    var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sd = navigator.connection && navigator.connection.saveData;
    var q = (state.lite || reduce || sd || tier === 'm' || (coarse && w < 1024)) ? 0 : (tier === 'l' && (navigator.hardwareConcurrency || 4) >= 4 ? 2 : 1);
    if (qCap !== null) q = Math.min(q, qCap);
    var g = tier === 'm' ? { off: 10, W: 44, amp: 5, sz: 17, wmax: 1.4 }
          : tier === 's' ? { off: 25, W: 130, amp: 16, sz: 25, wmax: 3.4 }
          : { off: 50, W: 210, amp: 30, sz: 32, wmax: 4.6 };
    g.q = q; g.H = h; g.w = w; g.dpr = Math.min(window.devicePixelRatio || 1, q === 0 ? 2 : 1.5);
    g.nFil = q === 2 ? 16 : 11; g.nPts = q === 2 ? 34 : 24; g.nPart = q === 2 ? 18 : 8; g.tier = tier;
    return g;
  }

  /* ================================== RAILS ============================== */
  var rails = [], theme = null, season = null, sprites = [], dotSpr = null, glowSpr = null, L = null;
  var running = false, raf = 0, lastTs = 0, time = 0, emaCost = 0, frames = 0, emaDt = 16;

  function mkGrad(c, H, cols) { return lg(c, 0, 0, 0, H, cols); }

  function makeRail(side) {
    var cv = document.createElement('canvas');
    cv.className = 'sx-rail'; cv.setAttribute('aria-hidden', 'true');
    cv.width = Math.round(L.W * L.dpr); cv.height = Math.round(L.H * L.dpr);
    cv.style.cssText = 'position:fixed;top:0;' + side + ':0;width:' + L.W + 'px;height:100%;pointer-events:none;z-index:' + CFG.zIndex +
      ';contain:strict;' + (state.zone ? 'background:rgba(255,0,90,.14);' : '');
    document.body.appendChild(cv);
    var c = cv.getContext('2d'); c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    var r = {
      side: side, cv: cv, c: c, W: L.W, H: L.H, dpr: L.dpr, off: L.off, amp: L.amp, n: L.nPts,
      cx: side === 'left' ? L.off : L.W - L.off, dir: side === 'left' ? 1 : -1, sp: side === 'left' ? 0 : 1.7,
      gsw: L.amp * 0.6, wmax: L.wmax, flow: 34, clipT: 0, clipB: 0, fil: [], icons: [], parts: [], fw: [], fwT: 2 + rnd() * 2,
      fwOn: season === 'nouvelan' && L.q === 2
    };
    r.g = { a: mkGrad(c, L.H, theme.a), b: mkGrad(c, L.H, theme.b), c: mkGrad(c, L.H, theme.c) };
    r.env = new Float32Array(r.n + 1); r.wp = new Float32Array(r.n + 1);
    for (var i = 0; i <= r.n; i++) { var s = Math.sin(Math.PI * i / r.n); r.env[i] = Math.pow(s, .8); r.wp[i] = Math.pow(s, .9) * .5; }
    if (L.q > 0) {
      for (i = 0; i < L.nFil; i++) { var f = { xs: new Float32Array(r.n + 1), ys: new Float32Array(r.n + 1) }; spawnFil(r, f, true); r.fil.push(f); }
      for (i = 0; i < L.nPart; i++) { var p = {}; spawnPart(r, p, true); r.parts.push(p); }
      var ni = clamp(Math.round(L.H / (L.q === 2 ? 170 : 210)), 3, 7);
      for (i = 0; i < ni; i++) r.icons.push({ i: i, spr: sprites[(i + (side === 'left' ? 0 : 2)) % sprites.length], ph: rnd() * TAU, sz: L.sz * (.88 + rnd() * .3), rot: .18 + rnd() * .22 });
      r.nIcons = ni;
    }
    return r;
  }

  function spawnFil(r, f, initial) {
    f.L = r.H * (.35 + rnd() * .55); f.k = .6 + rnd() * 1.8; f.k2 = f.k * (1.7 + rnd() * 1.1);
    f.ph = rnd() * TAU; f.ph2 = rnd() * TAU; f.sp = (.5 + rnd() * 1.1) * (rnd() < .5 ? -1 : 1);
    f.amp = r.amp * (.35 + rnd() * .75); f.off = (rnd() - .5) * r.amp * .5; f.w = r.wmax * (.4 + rnd() * 1.0);
    f.speed = r.flow * (.6 + rnd() * .9); var gr = rnd(); f.g = gr < .5 ? 'a' : gr < .8 ? 'b' : 'c';
    f.a = .5 + rnd() * .45; f.u = initial ? rnd() : 0;
    f.hasP = rnd() < .65; f.p = -rnd() * 1.2; f.ps = .22 + rnd() * .4;
  }
  function spawnPart(r, p, initial) {
    p.x = r.cx + (rnd() - .5) * r.amp * 2.6; p.y = initial ? rnd() * r.H : (season === 'noel' ? -6 : r.H + 6);
    p.sz = season === 'noel' ? 3 + rnd() * 5 : 3 + rnd() * 4; p.ph = rnd() * TAU; p.a = .35 + rnd() * .5;
    var v = 14 + rnd() * 22; p.vy = season === 'noel' ? v : (season === 'halloween' ? -v : (rnd() < .5 ? v * .6 : -v * .6));
    p.wob = 6 + rnd() * 10;
  }

  function ribbon(c, xs, ys, i0, i1, wp, wm) {
    var i; c.beginPath(); c.moveTo(xs[i0] - wp[i0] * wm, ys[i0]);
    for (i = i0 + 1; i <= i1; i++) c.lineTo(xs[i] - wp[i] * wm, ys[i]);
    for (i = i1; i >= i0; i--) c.lineTo(xs[i] + wp[i] * wm, ys[i]);
    c.closePath(); c.fill();
  }
  var tmpW = new Float32Array(64);
  function ribbonLocal(c, xs, ys, i0, i1, w) {
    var i, n = i1 - i0; for (i = 0; i <= n; i++) tmpW[i] = Math.pow(Math.sin(Math.PI * i / n), .8) * w;
    c.beginPath(); c.moveTo(xs[i0] - tmpW[0], ys[i0]);
    for (i = 1; i <= n; i++) c.lineTo(xs[i0 + i] - tmpW[i], ys[i0 + i]);
    for (i = n; i >= 0; i--) c.lineTo(xs[i0 + i] + tmpW[i], ys[i0 + i]);
    c.closePath(); c.fill();
  }

  function drawRail(r, dt) {
    var c = r.c, H = r.H, W = r.W, n = r.n, i, j, q = L.q;
    c.setTransform(r.dpr, 0, 0, r.dpr, 0, 0); c.clearRect(0, 0, W, H);
    r.clipT = clipT; r.clipB = clipB;
    c.globalCompositeOperation = 'lighter';
    var sw = function (y) { return r.gsw * Math.sin(y * .0045 + time * .55 + r.sp); };

    // câble central (fil conducteur de la guirlande)
    c.globalAlpha = .38; c.strokeStyle = r.g.c; c.lineWidth = 1; c.beginPath();
    for (var y = 0; y <= H; y += 20) { var xx = r.cx + sw(y); y ? c.lineTo(xx, y) : c.moveTo(xx, y); } c.stroke();

    // filaments
    for (i = 0; i < r.fil.length; i++) {
      var f = r.fil[i]; f.u += f.speed * dt / (H + f.L); if (f.u >= 1) spawnFil(r, f, false);
      var u = f.u, top = r.dir > 0 ? -f.L + u * (H + f.L) : H - u * (H + f.L);
      var al = f.a * Math.pow(Math.sin(Math.PI * u), .6); if (al < .02) continue;
      var xs = f.xs, ys = f.ys, t, y2, e;
      for (j = 0; j <= n; j++) {
        t = j / n; y2 = top + t * f.L; e = r.env[j]; ys[j] = y2;
        xs[j] = r.cx + sw(y2) + f.off * e + f.amp * e * (.72 * Math.sin(TAU * f.k * t + f.ph + time * f.sp) + .28 * Math.sin(TAU * f.k2 * t + f.ph2 - time * f.sp * .7));
      }
      c.fillStyle = r.g[f.g];
      c.globalAlpha = al * .2; ribbon(c, xs, ys, 0, n, r.wp, f.w * 5.5);
      c.globalAlpha = al; ribbon(c, xs, ys, 0, n, r.wp, f.w);
      // impulsion lumineuse
      if (f.hasP) {
        f.p += f.ps * dt; if (f.p > 1.25) f.p = -.2 - rnd() * .9;
        if (f.p > 0 && f.p < 1) {
          var tp = r.dir > 0 ? f.p : 1 - f.p, i0, i1, ih;
          if (r.dir > 0) { i1 = Math.floor(tp * n); i0 = Math.max(0, i1 - Math.round(n * .22)); ih = i1; }
          else { i0 = Math.floor(tp * n); i1 = Math.min(n, i0 + Math.round(n * .22)); ih = i0; }
          if (i1 - i0 >= 3) {
            c.fillStyle = r.g.c; c.globalAlpha = Math.min(1, al * 1.5); ribbonLocal(c, xs, ys, i0, i1, f.w * .95);
            if (q === 2) { var gs = 15 + f.w * 7; c.globalAlpha = Math.min(1, al * 1.1); c.drawImage(glowSpr, xs[ih] - gs / 2, ys[ih] - gs / 2, gs, gs); }
          }
        }
      }
    }

    // particules (braises / neige / étincelles)
    for (i = 0; i < r.parts.length; i++) {
      var p = r.parts[i]; p.y += p.vy * dt; p.ph += dt * 1.4;
      if (p.y < -10 || p.y > H + 10) spawnPart(r, p, false);
      var px = p.x + Math.sin(p.ph) * p.wob, tw = season === 'nouvelan' ? .6 + .4 * Math.sin(time * 5 + p.ph * 3) : 1;
      c.globalAlpha = p.a * tw * clamp(Math.min(p.y - clipT, H - clipB - p.y) / 40, 0, 1);
      if (c.globalAlpha > .01) c.drawImage(dotSpr, px - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
    }

    // guirlande d'ornements
    c.globalCompositeOperation = 'source-over';
    var loop = H + 80, sy = window.pageYOffset || 0;
    for (i = 0; i < r.icons.length; i++) {
      var ic = r.icons[i];
      var iy = (((ic.i * loop / r.nIcons + time * 7 * r.dir + sy * .1) % loop) + loop) % loop - 40;
      var a = clamp(Math.min(iy - clipT, H - clipB - iy) / 45, 0, 1); if (a < .02) continue;
      var ix = r.cx + sw(iy);
      c.save(); c.globalAlpha = a * .95; c.translate(ix, iy); c.rotate(ic.rot * Math.sin(time * 1.3 + ic.ph));
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * .5; c.drawImage(glowSpr, -ic.sz * .9, -ic.sz * .9, ic.sz * 1.8, ic.sz * 1.8);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a * .96; c.drawImage(ic.spr, -ic.sz / 2, -ic.sz / 2, ic.sz, ic.sz);
      c.restore();
    }

    if (r.fwOn) fireworks(r, dt);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  function fireworks(r, dt) {
    var c = r.c, i, k, fw;
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    r.fwT -= dt;
    if (r.fwT <= 0 && r.fw.length < 3) {
      r.fwT = 1.6 + rnd() * 2.4; var lo = r.clipT + 90, hi = r.H - r.clipB - 90;
      if (hi > lo) {
        var span = Math.max(20, r.W - r.off - 85), pal = theme.fw;
        r.fw.push({ ph: 0, t: 0, x: r.cx + r.dir * (10 + rnd() * span), sy: r.H - r.clipB, ty: lo + rnd() * (hi - lo), col: pal[(rnd() * pal.length) | 0], p: [] });
      }
    }
    for (i = r.fw.length - 1; i >= 0; i--) {
      fw = r.fw[i];
      if (fw.ph === 0) {
        fw.t += dt; var e = clamp(fw.t / .6, 0, 1), y = fw.sy + (fw.ty - fw.sy) * (1 - Math.pow(1 - e, 2));
        c.globalAlpha = .9; c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fw.x, y + 12); c.lineTo(fw.x, y); c.stroke();
        if (e >= 1) {
          fw.ph = 1; fw.life = 0; var cnt = 30;
          for (k = 0; k < cnt; k++) { var ang = k / cnt * TAU + rnd() * .2, sp = 40 + rnd() * 55; fw.p.push({ x: fw.x, y: fw.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp }); }
        }
      } else {
        fw.life += dt; if (fw.life > 1.4) { r.fw.splice(i, 1); continue; }
        var fade = 1 - fw.life / 1.4, dr = Math.pow(.5, dt);
        c.strokeStyle = fw.col; c.lineWidth = 1.7; c.globalAlpha = fade; c.beginPath();
        for (k = 0; k < fw.p.length; k++) {
          var q = fw.p[k]; q.vx *= dr; q.vy = q.vy * dr + 40 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          c.moveTo(q.x - q.vx * .045, q.y - q.vy * .045); c.lineTo(q.x, q.y);
        }
        c.stroke();
        c.globalAlpha = fade * .5; var gs = 60 * (1 - fade * .4); c.drawImage(glowSpr, fw.x - gs / 2, fw.ty - gs / 2, gs, gs);
      }
    }
  }

  // Version statique (mobile / reduced-motion / lite) : couleur unie, déterministe
  function drawStatic(r) {
    var c = r.c, H = r.H, W = r.W, rng = mulberry(r.side === 'left' ? 1337 : 7331), period = L.tier === 'm' ? 52 : 70, A = r.amp;
    c.setTransform(r.dpr, 0, 0, r.dpr, 0, 0); c.clearRect(0, 0, W, H);
    var wave = function (y, ph) { return r.cx + A * Math.sin(y / period * TAU + ph); };
    [[0, 1.7, .22], [Math.PI, 1, .6]].forEach(function (s) {
      c.lineCap = 'round'; c.strokeStyle = theme.mono;
      [[s[1] * 4, s[2] * .22], [s[1], s[2]]].forEach(function (pass) {
        c.globalAlpha = pass[1]; c.lineWidth = pass[0]; c.beginPath();
        for (var y = -4; y <= H + 4; y += 6) { var x = wave(y, s[0]); y < 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
      });
    });
    c.globalAlpha = .55; var gap = L.sz * 2.9, off0 = rng() * gap, n = 0;
    for (var y = off0; y < H; y += gap, n++) {
      var x = wave(y, 0), s = sprites[(n + (r.side === 'left' ? 0 : 2)) % sprites.length], sz = L.sz * (.9 + rng() * .2);
      c.globalAlpha = .9; c.save(); c.translate(x, y); c.rotate((rng() - .5) * .5); c.drawImage(s, -sz / 2, -sz / 2, sz, sz); c.restore();
    }
    c.globalAlpha = 1;
  }

  /* ============================ BOUCLE / ADAPTATIF ======================= */
  function setClip() {
    var s = 'inset(' + clipT + 'px 0 ' + clipB + 'px 0)';
    for (var i = 0; i < rails.length; i++) { rails[i].cv.style.clipPath = s; rails[i].cv.style.webkitClipPath = s; }
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    var dt = ts - lastTs; if (dt < 27) return; lastTs = ts;
    emaDt += (dt - emaDt) * .05; dt = Math.min(dt, 100) / 1000; time += dt;
    var t0 = performance.now();
    if (measure()) setClip();
    for (var i = 0; i < rails.length; i++) drawRail(rails[i], dt);
    emaCost += ((performance.now() - t0) - emaCost) * .08; frames++;
    if (frames % 120 === 0) { // dégradation automatique si la machine peine
      if ((emaCost > 6 || emaDt > 55) && L.q > 0) { qCap = L.q - 1; rebuild(); }
    }
  }
  function startLoop() { if (running || L.q === 0) return; running = true; lastTs = performance.now(); raf = requestAnimationFrame(frame); }
  function stopLoop() { running = false; cancelAnimationFrame(raf); }

  var scrollTick = false;
  function onScroll() {
    if (L && L.q === 0 && !scrollTick) { scrollTick = true; requestAnimationFrame(function () { scrollTick = false; if (measure()) setClip(); }); }
  }
  document.addEventListener('visibilitychange', function () { if (!season || !L || L.q === 0) return; document.hidden ? stopLoop() : startLoop(); });
  var rzT; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { if (season) rebuild(); }, 180); });
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============================= CSS TEXTE / PANEL ======================= */
  var styleEl = null;
  function enc(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
  var ICO = {
    halloween: enc("<svg xmlns='http://www.w3.org/2000/svg' viewBox='-30 -17 60 34'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff0a8'/><stop offset='.5' stop-color='#d4af37'/><stop offset='1' stop-color='#8a6a12'/></linearGradient></defs><g fill='url(#g)'><path d='M0 -8L3 -14L5 -7Q15 -15 28 -9Q23 -3 25 6Q18 1 14 8Q11 1 7 10Q4 5 0 15Z'/><path d='M0 -8L-3 -14L-5 -7Q-15 -15 -28 -9Q-23 -3 -25 6Q-18 1 -14 8Q-11 1 -7 10Q-4 5 0 15Z'/></g></svg>"),
    noel: enc("<svg xmlns='http://www.w3.org/2000/svg' viewBox='-26 -26 52 52'><g stroke='#e4f6ff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' fill='none'><g id='a'><path d='M0 -23V23M-5 -16L0 -11L5 -16M-5 16L0 11L5 16'/></g><use href='#a' transform='rotate(60)'/><use href='#a' transform='rotate(120)'/></g></svg>"),
    nouvelan: enc("<svg xmlns='http://www.w3.org/2000/svg' viewBox='-26 -26 52 52'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff6bf'/><stop offset='.5' stop-color='#ffd24a'/><stop offset='1' stop-color='#c98a10'/></linearGradient></defs><path fill='url(#g)' d='M0 -25Q2 -2 25 0Q2 2 0 25Q-2 2 -25 0Q-2 -2 0 -25Z'/></svg>")
  };
  var HSEL = ':is(h1,h2,h3,.mbr-section-title):not(.sx-off,.skyx-glow-text,nav *,footer *,.modal *,[class*="navbar"] *)';
  var ISEL = ':is(h2,h3):not(.sx-off,.sx-noico,.skyx-glow-text,nav *,footer *,.modal *,[class*="navbar"] *)';
  function textCSS(s) {
    var b = 'body.sx-text.sx-' + s, shadow, shadow3;
    if (s === 'noel') {
      shadow = '0 -1px 0 rgba(255,255,255,.95),0 -2px 2px rgba(255,255,255,.6),0 0 16px rgba(140,210,255,.45),0 3px 6px rgba(0,30,80,.35)';
      shadow3 = '0 -1px 0 rgba(255,255,255,.8),0 0 10px rgba(140,210,255,.35)';
    } else if (s === 'halloween') {
      shadow = shadow3 = '0 0 10px rgba(255,122,0,.5),0 0 26px rgba(150,60,230,.38)';
    } else { shadow = shadow3 = '0 0 10px rgba(255,210,90,.5),0 0 24px rgba(255,90,170,.25)'; }
    var w = s === 'halloween' ? '1.1em' : '.85em', h = s === 'halloween' ? '.62em' : '.85em';
    return ':where(' + b + ' ' + HSEL + '){text-shadow:' + shadow + '}' +
      ':where(' + b + ' :is(h3,h4)' + HSEL.slice(HSEL.indexOf(':not')) + '){text-shadow:' + shadow3 + '}' +
      ':where(' + b + ' ' + ISEL + ')::before{content:"";display:inline-block;width:' + w + ';height:' + h + ';margin-right:.45em;vertical-align:-.04em;background:' + ICO[s] + ' center/contain no-repeat}';
  }
  var BASE_CSS =
    '#sx-panel{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;font:12px/1.35 system-ui,sans-serif;color:#e8f1ff;background:rgba(14,18,34,.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(160,200,255,.28);border-radius:12px;padding:10px 12px;box-shadow:0 10px 40px rgba(0,0,0,.5);display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;max-width:94vw}' +
    '#sx-panel b{font-weight:700;letter-spacing:.04em;color:#bfe3ff}#sx-panel select,#sx-panel input[type=date]{background:#0b1020;color:#e8f1ff;border:1px solid rgba(160,200,255,.3);border-radius:6px;padding:3px 6px;font:inherit}' +
    '#sx-panel button{background:rgba(120,170,255,.16);color:#e8f1ff;border:1px solid rgba(160,200,255,.3);border-radius:6px;padding:3px 8px;font:inherit;cursor:pointer}#sx-panel button:hover{background:rgba(120,170,255,.32)}' +
    '#sx-panel label{display:flex;gap:4px;align-items:center;cursor:pointer}#sx-info{opacity:.7;font-variant-numeric:tabular-nums}';
  function applyCSS(s) {
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'sx-style'; document.head.appendChild(styleEl); }
    styleEl.textContent = BASE_CSS + (s ? textCSS(s) : '');
  }
  function detectNative() { // à appeler AVANT d'activer nos ::before
    var hs = document.querySelectorAll('h2,h3');
    for (var i = 0; i < hs.length; i++) {
      var ct = getComputedStyle(hs[i], '::before').content;
      if (ct && ct !== 'none' && ct !== 'normal') hs[i].classList.add('sx-noico');
    }
  }

  /* ================================ PANNEAU ============================== */
  var panel = null, infoT = 0;
  function buildPanel() {
    if (panel) return; panel = document.createElement('div'); panel.id = 'sx-panel';
    panel.innerHTML = '<b>SAISONAL · TEST</b>' +
      '<select id="sx-s"><option value="auto">Auto (date)</option><option value="halloween">🎃 Halloween</option><option value="noel">❄️ Noël</option><option value="nouvelan">🎆 Nouvel An</option><option value="off">Désactivé</option></select>' +
      '<input id="sx-d" type="date" title="Date simulée">' +
      '<button data-d="10-28">🎃</button><button data-d="12-24">🎄</button><button data-d="12-31">🎆</button><button data-d="">Aujourd’hui</button>' +
      '<label><input id="sx-l" type="checkbox">Mobile (statique)</label><label><input id="sx-t" type="checkbox">Titres</label><label><input id="sx-z" type="checkbox">Zone</label>' +
      '<span id="sx-info"></span><button id="sx-x">✕</button>';
    document.body.appendChild(panel);
    var $ = function (id) { return panel.querySelector('#' + id); };
    $('sx-s').value = state.season; $('sx-l').checked = state.lite; $('sx-t').checked = state.text; $('sx-z').checked = state.zone;
    if (state.date) $('sx-d').value = /^\d{4}-/.test(state.date) ? state.date : new Date().getFullYear() + '-' + state.date.replace(/^(\d)-/, '0$1-').replace(/-(\d)$/, '-0$1');
    $('sx-s').onchange = function () { state.season = this.value; save(); apply(); };
    $('sx-d').onchange = function () { state.date = this.value; state.season = 'auto'; $('sx-s').value = 'auto'; save(); apply(); };
    $('sx-l').onchange = function () { state.lite = this.checked; qCap = null; save(); apply(); };
    $('sx-t').onchange = function () { state.text = this.checked; save(); apply(); };
    $('sx-z').onchange = function () { state.zone = this.checked; save(); apply(); };
    $('sx-x').onclick = function () { setPanel(false); };
    [].forEach.call(panel.querySelectorAll('button[data-d]'), function (b) {
      b.onclick = function () { state.date = b.dataset.d; state.season = 'auto'; $('sx-s').value = 'auto'; $('sx-d').value = state.date ? new Date().getFullYear() + '-' + state.date : ''; save(); apply(); };
    });
    clearInterval(infoT); infoT = setInterval(function () {
      var i = $('sx-info'); if (!i) return;
      i.textContent = (season || 'aucun') + ' · q' + (L ? L.q : '-') + ' · ' + emaCost.toFixed(1) + 'ms · clip ' + clipT + '/' + clipB;
    }, 500);
  }
  function setPanel(on) {
    state.panel = !!on; save();
    if (on) buildPanel(); else if (panel) { panel.remove(); panel = null; clearInterval(infoT); }
  }
  document.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); setPanel(!panel); } });

  /* ============================ CYCLE DE VIE ============================= */
  function teardown() {
    stopLoop(); rails.forEach(function (r) { r.cv.remove(); }); rails = [];
    ['sx-halloween', 'sx-noel', 'sx-nouvelan', 'sx-text'].forEach(function (c) { document.body.classList.remove(c); });
  }
  function rebuild() { stopLoop(); rails.forEach(function (r) { r.cv.remove(); }); rails = []; build(); }
  function build() {
    L = layout(); clipT = clipB = -1; requery(true); measure();
    sprites = buildSprites(theme); dotSpr = mkDot(theme.dot); glowSpr = mkDot(theme.glow);
    rails = [makeRail('left'), makeRail('right')];
    setClip();
    if (L.q === 0) rails.forEach(drawStatic); else startLoop();
  }
  function apply() {
    teardown(); season = currentSeason(); applyCSS(season && state.text ? season : null);
    if (!season) return;
    theme = THEMES[season]; document.body.classList.add('sx-' + season); if (state.text) document.body.classList.add('sx-text');
    build();
  }

  function init() {
    detectNative(); // repère les h2/h3 qui ont déjà un ::before (avant d'ajouter les nôtres)
    apply(); if (state.panel) buildPanel();
  }
  function boot() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    function go() { // on attend le chargement complet pour ne jamais gêner le LCP
      var run = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 60); })(init); };
      document.readyState === 'complete' ? run() : window.addEventListener('load', run);
    }
  }

  /* ================================= API ================================= */
  window.SaisonalFX = {
    now: getNow,                                   // pour seasonal.js : new Date() → SaisonalFX.now()
    season: function () { return season; },
    setSeason: function (s) { state.season = s; save(); apply(); },
    setDate: function (d) { state.date = d || ''; state.season = 'auto'; save(); apply(); },
    refresh: apply, panel: setPanel,
    reset: function () { state = defaults(); try { localStorage.removeItem(CFG.storageKey); } catch (e) {} apply(); }
  };
  boot();
})();
