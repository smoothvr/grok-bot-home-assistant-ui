// SPDX-License-Identifier: MIT
// Living edge light. Lively is the shipped profile. Quiet is the other one.
// Sleep is a little brighter than that reference so it still reads on a wall.
// ES2015, läuft in Safari 10.1 (iPad 4) und aktuellem iOS/Chrome. Keine Abhängigkeiten.
// Grundidee: EIN Lichtfeld entlang des ganzen Bildschirmrands. Jeder Punkt hat
//   d = Abstand zum Rand (p-Norm, ohne Diagonalknick) und s = Position entlang des Umfangs (0..1, ab unten Mitte, im Uhrzeigersinn).
// Profile: D "ruhig" (Standard, buildRuhig/ruhigFrame) und B "lebhaft" (buildField/wave, umlaufende Welle).
// Helligkeit(x,y,t) = Profil(d, dicke(s,t)) * Wellenpegel(s,t) * Zustandspegel(t). Ecken werden nie doppelt gezählt.
'use strict';
  // Farben = RING aus web/zustaende.js. gain = perzeptiver Ausgleich.
  var STATES = {
    idle:       { rgb: [255, 106, 0],   gain: 1.00, label: 'Idle',       lo: 0.20, hi: 0.32, T: 4.0 },
    zuhoeren:   { rgb: [0, 200, 255],   gain: 0.85, label: 'Zuhören',    lo: 0.55, hi: 1.00, T: 1.2 },
    nachdenken: { rgb: [138, 60, 255],  gain: 1.10, label: 'Nachdenken', lo: 0.50, hi: 0.90, T: 1.0 },
    sprechen:   { rgb: [255, 176, 102], gain: 0.90, label: 'Sprechen',   lo: 0.45, hi: 0.85, T: 0.9 },
    bestaetigt: { rgb: [43, 255, 136],  gain: 0.70, label: 'Bestätigt',  lo: 0.30, hi: 1.00, T: 1.6 },
    fehler:     { rgb: [255, 26, 26],   gain: 1.05, label: 'Fehler',     lo: 0.25, hi: 1.00, T: 2.2 },
    schlafen:   { rgb: [58, 21, 0],     gain: 1.00, label: 'Schlafen',   lo: 0.15, hi: 0.35, T: 4.5 },
    musik:      { rgb: [255, 122, 0],   gain: 0.95, label: 'Musik',      lo: 0.50, hi: 0.90, T: 1.0 }   // RING musik; in B wie nachdenken
  };
  // Geometrie als Anteil der kurzen Seite m = min(W,H), mit Mindestwerten in CSS px.
  var GEO = {
    RIM_SIGMA: 0.0070, RIM_MIN: 3,      // Kernlinie (Gauss)
    RIM_A: 0.38,
    TAU: 0.060, TAU_MIN: 26,            // Innenschein (Exponential), "dünnes" Profil
    THICK: 2.6,                         // "dickes" Profil: TAU * 2.2 (Wellenberg)
    BLOOM_A: 0.55,
    HAZE_SIGMA: 0.21, HAZE_MIN: 95, HAZE_A: 0.16,
    PNORM: 6,                           // Isolinien am Rand fast eckig, nach innen runder
    TOP: 0.40,                          // Grundgewicht oben (unten 1.0), LED-Ring-Gefühl
    PART_K: 0.07,                       // Weichheit der Kantenzuordnung
    DEPTH: 0.50,                        // Randlicht blendet zwischen 0.30 m und 0.50 m weich (smoothstep) auf 0
    SECTORS: 24                         // Umfang in 24 weich überlappende Sektoren (Partition der Eins)
  };
  // Welle "nachdenken" — Ableitung vom Original-Lauflicht (original LED firmware: 0.25 + 0.75*exp(-d²/4), 1 Umlauf/s auf 12 LEDs)
  var WAVE = {
    FLOOR: 0.25,       // Grundglut wie Original
    SIGMA: 0.075,      // Breite des Wellenbergs (Anteil Umfang). Original: σ = √2 LED von 12 = 0.118, hier etwas schlanker
    PERIOD: 2.4,       // s pro Umlauf (Original 1.0 s auf 12-cm-Ring; auf 1024 px Bildschirm wirkt 2.4 s gleich ruhig)
    TRAIL: 0.45,       // zweiter, schwächerer Berg (gegenüber, 0.5 Umfang versetzt), gibt organischen Fluss
    WOBBLE: 0.22       // langsame Amplituden-/Dickenschwankung (Rauschen aus 3 Sinus), "lebendig"
  };
  function sst(a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); }
  function sdfSigned(x, y, W, H, R) {
    var qx = Math.abs(x - W / 2) - (W / 2 - R), qy = Math.abs(y - H / 2) - (H / 2 - R);
    return -(Math.sqrt(Math.max(qx, 0) * Math.max(qx, 0) + Math.max(qy, 0) * Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R);
  }
  function edgeDist(x, y, W, H, R, P) {
    var dx = Math.max(1e-3, W / 2 - Math.abs(x - W / 2)), dy = Math.max(1e-3, H / 2 - Math.abs(y - H / 2));
    var d = Math.pow(Math.pow(dx, -P) + Math.pow(dy, -P), -1 / P);
    if (R > 0) { var dr = Math.max(0, sdfSigned(x, y, W, H, R)), k = R / 3, hh = Math.max(0, Math.min(1, 0.5 + 0.5 * (dr - d) / k)); d = dr + (d - dr) * hh - k * hh * (1 - hh); }
    return Math.max(0, d);
  }
  // Umfangsposition s (0..1): ab unten Mitte, im Uhrzeigersinn (unten -> links -> oben -> rechts). Weich an den Ecken.
  function perimS(x, y, W, H, k) {
    var P = 2 * (W + H);
    var sB = (W / 2 - x), sL = W / 2 + (H - y), sT = W / 2 + H + x, sR = W / 2 + H + W + y;   // Bogenlänge je Kante
    var e = [Math.exp(-(H - y) / k), Math.exp(-x / k), Math.exp(-y / k), Math.exp(-(W - x) / k)], ss = [sB, sL, sT, sR];
    var best = 0; for (var i = 1; i < 4; i++) if (e[i] > e[best]) best = i;
    var ref = ss[best], sum = 0, acc = 0;
    for (var j = 0; j < 4; j++) { var v = ss[j]; while (v - ref > P / 2) v -= P; while (v - ref < -P / 2) v += P; acc += e[j] * v; sum += e[j]; }
    var s = (acc / sum) / P; s -= Math.floor(s); return s;
  }
  function rngFactory(seed) { return function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }
  // Baut: haze (ganzflächig) + je Sektor ein dünnes und ein dickes Randprofil, auf Bounding-Box beschnitten.
  // Rückgabe { w, h, scale, haze: canvas, sectors: [{x,y,c,thin,thick,s}] }  (thin/thick = canvas)
  function buildField(W, H, opt) {
    opt = opt || {};
    var s = opt.scale || 1, w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s)), m = Math.min(w, h), G = GEO, N = G.SECTORS;
    var R = (opt.cornerR || 0) * s;
    var rimS = Math.max(G.RIM_SIGMA * m, G.RIM_MIN * s), tau = Math.max(G.TAU * m, G.TAU_MIN * s), hazeS = Math.max(G.HAZE_SIGMA * m, G.HAZE_MIN * s);
    var k = G.PART_K * m, depth = G.DEPTH * m;
    var rnd = rngFactory(1234567);
    var hazeC = document.createElement('canvas'); hazeC.width = w; hazeC.height = h;
    var hzImg = hazeC.getContext('2d').createImageData(w, h), HZ = hzImg.data;
    var thin = [], thick = [], box = [];
    for (var q = 0; q < N; q++) { thin.push(new Uint8ClampedArray(w * h)); thick.push(new Uint8ClampedArray(w * h)); box.push([w, h, -1, -1]); }
    for (var j = 0; j < h; j++) {
      var y = j + 0.5, ny = (y - h / 2) / (h / 2), wy = G.TOP + (1 - G.TOP) * sst(-0.9, 0.95, ny);
      for (var i = 0; i < w; i++) {
        var x = i + 0.5, d = edgeDist(x, y, w, h, R, G.PNORM), p = j * w + i;
        var outC = R > 0 ? -sdfSigned(x, y, w, h, R) : 0, clip = outC > 0 ? Math.exp(-Math.pow(outC / (1.5 * s), 2)) : 1;
        var hz = G.HAZE_A * Math.exp(-(d / hazeS) * (d / hazeS)) * wy * clip * (1 - sst(0.35 * m, 0.62 * m, d)) * 255 + rnd() + rnd() - 1;
        HZ[4 * p] = HZ[4 * p + 1] = HZ[4 * p + 2] = 255; HZ[4 * p + 3] = hz < 0 ? 0 : hz > 255 ? 255 : hz;
        if (d > depth) continue;
        var fade = (1 - sst(depth * 0.6, depth, d)) * clip * wy;
        var rim = G.RIM_A * Math.exp(-(d / rimS) * (d / rimS));
        var vThin = (rim + G.BLOOM_A * Math.exp(-d / tau)) * fade, vThick = (rim + G.BLOOM_A * Math.exp(-d / (tau * G.THICK))) * fade;
        var sp = perimS(x, y, w, h, k) * N, q0 = Math.floor(sp), f = sp - q0, w1 = 0.5 - 0.5 * Math.cos(Math.PI * f), w0 = 1 - w1;   // Raised-Cosine zwischen 2 Sektoren
        var qs = [q0 % N, (q0 + 1) % N], ws = [w0, w1];
        for (var u = 0; u < 2; u++) {
          var qq = qs[u], a1 = 255 * vThin * ws[u] + rnd() + rnd() - 1, a2 = 255 * vThick * ws[u] + rnd() + rnd() - 1;
          if (a1 < 0.5 && a2 < 0.5) continue;
          thin[qq][p] = a1; thick[qq][p] = a2;
          var b = box[qq]; if (i < b[0]) b[0] = i; if (j < b[1]) b[1] = j; if (i > b[2]) b[2] = i; if (j > b[3]) b[3] = j;
        }
      }
    }
    hazeC.getContext('2d').putImageData(hzImg, 0, 0);
    function toCanvas(arr, b) {
      var bw = b[2] - b[0] + 1, bh = b[3] - b[1] + 1, c = document.createElement('canvas'); c.width = bw; c.height = bh;
      var g = c.getContext('2d'), img = g.createImageData(bw, bh), D = img.data;
      for (var yy = 0; yy < bh; yy++) for (var xx = 0; xx < bw; xx++) { var src = (yy + b[1]) * w + xx + b[0], o = 4 * (yy * bw + xx); D[o] = D[o + 1] = D[o + 2] = 255; D[o + 3] = arr[src]; }
      g.putImageData(img, 0, 0); return c;
    }
    var sectors = [];
    for (var z = 0; z < N; z++) { var bb = box[z]; if (bb[2] < 0) continue; sectors.push({ x: bb[0], y: bb[1], s: z / N, thin: toCanvas(thin[z], bb), thick: toCanvas(thick[z], bb) }); }
    return { w: w, h: h, scale: s, haze: hazeC, sectors: sectors };
  }
  // Ausgabe-Dither (statisch, ganz oben): Weiß mit Alpha 0 oder amp/255, nur im Randbereich.
  function buildGrain(W, H, dpr, opt) {
    opt = opt || {};
    var w = Math.round(W * dpr), h = Math.round(H * dpr), m = Math.min(w, h), amp = opt.amp || 2;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'), img = g.createImageData(w, h), D = img.data, rnd = rngFactory(424242), reach = 0.55 * m;
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var dx = Math.min(i, w - i), dy = Math.min(j, h - j), p = 4 * (j * w + i);
      if (Math.min(dx, dy) < reach && rnd() < 0.5) { D[p] = D[p + 1] = D[p + 2] = 255; D[p + 3] = amp; }
    }
    g.putImageData(img, 0, 0); return c;
  }
  // ---- Zeitverhalten: alle Zustände relativ zur Welle definiert ----
  function wrap(x) { x -= Math.floor(x); return x > 0.5 ? x - 1 : x; }   // Abstand auf dem Umfang (-0.5..0.5)
  function gauss(ds, sg) { return Math.exp(-(ds * ds) / (2 * sg * sg)); }
  function noise3(t, a) { return (Math.sin(t * 0.73 + a * 6.28) + Math.sin(t * 1.37 + a * 12.1 + 1.7) + Math.sin(t * 2.11 + a * 3.9 + 4.2)) / 3; }
  function breath(t, T) { var ph = (t / T) % 1, inh = 0.45; return ph < inh ? 0.5 - 0.5 * Math.cos(Math.PI * ph / inh) : 0.5 + 0.5 * Math.cos(Math.PI * (ph - inh) / (1 - inh)); }
  function easeOutCubic(u) { return 1 - Math.pow(1 - u, 3); }
  // Zustandspegel (global, 0..1)
  function level(st, t) {
    var S = STATES[st];
    if (st === 'bestaetigt' || st === 'fehler') {
      var cyc = S.T + 1.2, u = (t % cyc) / S.T; if (u > 1) return S.lo;
      if (st === 'fehler') { var tt = (t % cyc); return (tt < 0.12 || (tt > 0.17 && tt < 0.39)) ? S.hi : S.lo + (S.hi - S.lo) * 0.25 * (1 - sst(0.4, 1.4, tt)); }
      return S.lo + (S.hi - S.lo) * (u < 0.06 ? easeOutCubic(u / 0.06) : 1 - sst(0.5, 1, u));
    }
    if (st === 'sprechen') { var v = 0.5 + 0.22 * Math.sin(t * 7.3) + 0.17 * Math.sin(t * 11.9 + 1.3) + 0.11 * Math.sin(t * 3.1); return S.lo + (S.hi - S.lo) * Math.max(0, Math.min(1, v)); }
    if (st === 'nachdenken' || st === 'musik') return S.hi;          // Pegel konstant, die Bewegung macht die Welle
    return S.lo + (S.hi - S.lo) * breath(t, S.T);
  }
  // Wellenpegel entlang des Umfangs: liefert [hell 0..1.3, dick 0..1] für Position s (0 = unten Mitte)
  function wave(st, s, t) {
    var W = WAVE, a, th;
    switch (st) {
      case 'musik':
      case 'nachdenken': {   // REFERENZ: umlaufender Wellenberg + gegenüberliegender schwächerer Berg, organische Dicke
        var pos = t / W.PERIOD, g1 = gauss(wrap(s - pos), W.SIGMA * (1 + 0.25 * noise3(t, 0.1))), g2 = gauss(wrap(s - pos - 0.5), W.SIGMA * 1.6);
        var wob = 1 + W.WOBBLE * noise3(t * 1.3, s);
        a = (W.FLOOR + (1.25 - W.FLOOR) * Math.min(1, g1 + W.TRAIL * g2)) * wob; th = Math.min(1, g1 + 0.5 * g2); break; }
      case 'zuhoeren': {     // gleiche Welle, aber stehend: 3 langsame Berge "atmen" auf der Stelle, Fokus unten
        var st3 = 0.5 + 0.5 * Math.cos(2 * Math.PI * (3 * s) + t * 1.1);
        a = 0.70 + 0.30 * st3 * (1 + 0.5 * noise3(t, s)); th = 0.35 * st3; break; }
      case 'sprechen': {     // zwei Berge laufen von unten Mitte gleichzeitig nach links und rechts hoch (Stimme "steigt auf")
        var ph = (t / 1.4) % 1, gl = gauss(wrap(s - ph * 0.5), 0.09), gr = gauss(wrap(s + ph * 0.5), 0.09);
        a = 0.55 + 0.45 * Math.min(1, gl + gr) * (1 - 0.6 * ph); th = 0.6 * Math.min(1, gl + gr); break; }
      case 'bestaetigt': {   // ein Ring-Impuls: Berg startet unten, läuft beidseitig in 0.8 s nach oben, dann leuchtet alles kurz
        var u = Math.min(1, (t % (STATES.bestaetigt.T + 1.2)) / 0.8), front = u * 0.5, dist = Math.abs(wrap(s));
        a = 0.35 + 0.65 * sst(front + 0.06, front - 0.04, dist); th = gauss(dist - front, 0.05); break; }
      case 'fehler': a = 1; th = 0.3; break;
      default: {             // idle/schlafen: sehr langsame, kaum sichtbare Wanderung (Periode 14 s), Dicke ruht
        a = 0.88 + 0.12 * Math.cos(2 * Math.PI * (s - t / 14)) + 0.05 * noise3(t * 0.5, s); th = 0.15 + 0.1 * Math.cos(2 * Math.PI * (s - t / 14)); }
    }
    return [a, th];
  }
  function toLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSrgb(l) { var c = l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055; return Math.round(255 * Math.max(0, Math.min(1, c))); }
  function mixLin(a, b, u) { return [0, 1, 2].map(function (i) { return toSrgb(toLin(a[i]) + (toLin(b[i]) - toLin(a[i])) * u); }); }
  function opacity(st, lv) { return Math.min(1, STATES[st].gain * (0.15 + 0.85 * Math.pow(lv, 0.8))); }

  // =====================================================================================
  // Profil D "ruhig" (STANDARD). Profil B "lebhaft" = alles oben (umlaufende Welle).
  // Kein Umlauf. Licht kommt von UNTEN; ein weicher Schein verschiebt sich langsam links <-> rechts.
  //   kurz  (idle, zuhoeren, sprechen, bestaetigt, fehler, schlafen): nur unterer Rand, Rest atmet kaum sichtbar.
  //   lang  (nachdenken, musik): Licht steigt an den Seiten hoch und läuft zum oberen Rand hin aus (oben ~4 %).
  // Masken: 1 Atemrahmen + K senkrechte Streifen je Modus (Partition der Eins in x). Pro Frame <= 1 + 2K drawImage.
  // Kein Korn: Stufen werden mit unsichtbarem TPDF-Dither (±DITHER LSB) in den Masken und sehr weichen Abfällen vermieden.
  var RUHIG = {
    K: 10,
    LINE_SIGMA: 0.026, LINE_MIN: 6, LINE_A: 0.18,     // weiche Kernlinie (Gauss), kein Strich
    TAU: 0.085, TAU_MIN: 34, GLOW_A: 0.72,            // Innenschein (Exponential)
    FADE0: 0.30, FADE1: 0.58,                         // Randlicht blendet zwischen 0.30 m und 0.58 m weich aus
    KURZ_H: 0.32,                                     // kurz: Licht nur bis 0.32 m über dem unteren Rand (smoothstep), gleich auf iPad und iPhone
    LANG_TOP: 0.04, LANG_EXP: 1.5,                    // lang: Gewicht = TOP + (1-TOP)*ny^EXP, ny = 0 oben .. 1 unten
    RAHMEN_SIGMA: 0.035, RAHMEN_MIN: 12, RAHMEN_TOP: 0.6,
    DITHER: 3.0,
    T_STATE: 0.9,                                     // s, Farbe/Pegel/Shift, easeInOutSine
    T_MODUS: 1.8                                      // s, kurz <-> lang, smoothstep
  };
  // lo/hi = Pegel (Atmen über T s, Sinus), rahmen = Deckkraft Atemrahmen, shift = Links-rechts-Schein
  //   Fokus p(t) = 0.5 + amp*(0.8 sin(2πt/T) + 0.2 sin(2πt/(1.618T) + 1));  Streifen-Pegel a(u) = base + (1-base) exp(-(u-p)²/(2 sigma²))
  var RUHIG_STATES = {
    idle:       { modus: 'kurz', lo: 0.32, hi: 0.42, T: 6.0, rahmen: [0.025, 0.06], shift: { T: 16, amp: 0.14, sigma: 0.32, base: 0.72 } },
    zuhoeren:   { modus: 'kurz', lo: 0.58, hi: 0.72, T: 3.6, rahmen: [0.04, 0.08],  shift: { T: 8,  amp: 0.20, sigma: 0.28, base: 0.58 } },
    sprechen:   { modus: 'kurz', lo: 0.52, hi: 0.68, T: 2.8, rahmen: [0.04, 0.08],  shift: { T: 7,  amp: 0.18, sigma: 0.30, base: 0.62 } },
    bestaetigt: { modus: 'kurz', lo: 0.30, hi: 0.80, T: 3.2, rahmen: [0.04, 0.10],  shift: { T: 10, amp: 0.00, sigma: 0.38, base: 0.55 }, puls: 'einmal' },
    fehler:     { modus: 'kurz', lo: 0.30, hi: 0.85, T: 3.4, rahmen: [0.05, 0.12],  shift: { T: 10, amp: 0.00, sigma: 0.40, base: 1.00 }, puls: 'zweimal' },
    schlafen:   { modus: 'kurz', lo: 0.26, hi: 0.36, T: 8.0, rahmen: [0.015, 0.035], shift: { T: 20, amp: 0.10, sigma: 0.34, base: 0.75 } },
    nachdenken: { modus: 'lang', lo: 0.72, hi: 0.84, T: 5.0, rahmen: [0.05, 0.08],  shift: { T: 8,  amp: 0.30, sigma: 0.24, base: 0.38 } },
    musik:      { modus: 'lang', lo: 0.66, hi: 0.82, T: 3.0, rahmen: [0.05, 0.08],  shift: { T: 6,  amp: 0.32, sigma: 0.24, base: 0.40 } }
  };
  function sinBreath(t, T) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * t / T); }
  function easeInOutSine(u) { return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u))); }
  function levelRuhig(st, t) {
    var R = RUHIG_STATES[st], v;
    if (R.puls === 'einmal') { var tt = t % R.T; v = tt < 0.5 ? Math.sin(Math.PI / 2 * tt / 0.5) : 1 - sst(0.6, 2.4, tt); }
    else if (R.puls === 'zweimal') { var t2 = t % R.T, pl = function (s0) { var x = (t2 - s0) / 0.6; return x > 0 && x < 1 ? Math.pow(Math.sin(Math.PI * x), 2) : 0; }; v = Math.max(pl(0), 0.8 * pl(0.75)); }
    else v = sinBreath(t, R.T);
    return R.lo + (R.hi - R.lo) * v;
  }
  function rahmenRuhig(st, t) { var R = RUHIG_STATES[st]; return R.rahmen[0] + (R.rahmen[1] - R.rahmen[0]) * sinBreath(t, Math.max(5, R.T)); }
  function shiftRuhig(st, u, t) {
    var h = RUHIG_STATES[st].shift, p = 0.5 + h.amp * (0.8 * Math.sin(2 * Math.PI * t / h.T) + 0.2 * Math.sin(2 * Math.PI * t / (1.618 * h.T) + 1));
    return h.base + (1 - h.base) * Math.exp(-(u - p) * (u - p) / (2 * h.sigma * h.sigma));
  }
  function buildRuhig(W, H, opt) {
    opt = opt || {};
    var s = opt.scale || 1, w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s)), m = Math.min(w, h), Q = RUHIG, K = Q.K;
    var R = (opt.cornerR || 0) * s, rnd = rngFactory(7654321), A = Q.DITHER;
    var ls = Math.max(Q.LINE_SIGMA * m, Q.LINE_MIN * s), tau = Math.max(Q.TAU * m, Q.TAU_MIN * s), rs = Math.max(Q.RAHMEN_SIGMA * m, Q.RAHMEN_MIN * s);
    var f0 = Q.FADE0 * m, f1 = Q.FADE1 * m;
    var rahmenC = document.createElement('canvas'); rahmenC.width = w; rahmenC.height = h;
    var rImg = rahmenC.getContext('2d').createImageData(w, h), RD = rImg.data;
    var kurz = [], lang = [], bk = [], bl = [], q;
    for (q = 0; q < K; q++) { kurz.push(new Uint8ClampedArray(w * h)); lang.push(new Uint8ClampedArray(w * h)); bk.push([w, h, -1, -1]); bl.push([w, h, -1, -1]); }
    function grow(b, i, j) { if (i < b[0]) b[0] = i; if (j < b[1]) b[1] = j; if (i > b[2]) b[2] = i; if (j > b[3]) b[3] = j; }
    for (var j = 0; j < h; j++) {
      var y = j + 0.5, ny = y / h;
      var wk = 1 - sst(0, Q.KURZ_H * m, h - y), wl = Q.LANG_TOP + (1 - Q.LANG_TOP) * Math.pow(ny, Q.LANG_EXP), wr = Q.RAHMEN_TOP + (1 - Q.RAHMEN_TOP) * ny;
      for (var i = 0; i < w; i++) {
        var x = i + 0.5, d = edgeDist(x, y, w, h, R, G_PNORM), p = j * w + i;
        var outC = R > 0 ? -sdfSigned(x, y, w, h, R) : 0, clip = outC > 0 ? Math.exp(-Math.pow(outC / (1.5 * s), 2)) : 1;
        var vr = 255 * Math.exp(-d / rs) * (1 - sst(0.12 * m, 0.30 * m, d)) * wr * clip + A * (rnd() + rnd() - 1);
        RD[4 * p] = RD[4 * p + 1] = RD[4 * p + 2] = 255; RD[4 * p + 3] = vr < 0 ? 0 : vr > 255 ? 255 : vr;
        if (d > f1) continue;
        var v = (Q.LINE_A * Math.exp(-(d / ls) * (d / ls)) + Q.GLOW_A * Math.exp(-d / tau)) * (1 - sst(f0, f1, d)) * clip;
        var gx = (x / w) * (K - 1), k0 = Math.min(K - 2, Math.floor(gx)), fx = gx - k0, w1 = 0.5 - 0.5 * Math.cos(Math.PI * fx), ks = [k0, k0 + 1], wx = [1 - w1, w1];
        for (var u = 0; u < 2; u++) {
          var kk = ks[u], a1 = 255 * v * wk * wx[u] + A * (rnd() + rnd() - 1), a2 = 255 * v * wl * wx[u] + A * (rnd() + rnd() - 1);
          if (a1 >= 0.5) { kurz[kk][p] = a1; grow(bk[kk], i, j); }
          if (a2 >= 0.5) { lang[kk][p] = a2; grow(bl[kk], i, j); }
        }
      }
    }
    rahmenC.getContext('2d').putImageData(rImg, 0, 0);
    function toCanvas(arr, b) {
      var bw = b[2] - b[0] + 1, bh = b[3] - b[1] + 1, c = document.createElement('canvas'); c.width = bw; c.height = bh;
      var g = c.getContext('2d'), img = g.createImageData(bw, bh), D = img.data;
      for (var yy = 0; yy < bh; yy++) for (var xx = 0; xx < bw; xx++) { var src = (yy + b[1]) * w + xx + b[0], o = 4 * (yy * bw + xx); D[o] = D[o + 1] = D[o + 2] = 255; D[o + 3] = arr[src]; }
      g.putImageData(img, 0, 0); return c;
    }
    var streifen = [];
    for (q = 0; q < K; q++) streifen.push({ u: q / (K - 1),
      kurz: bk[q][2] < 0 ? null : { x: bk[q][0], y: bk[q][1], c: toCanvas(kurz[q], bk[q]) },
      lang: bl[q][2] < 0 ? null : { x: bl[q][0], y: bl[q][1], c: toCanvas(lang[q], bl[q]) } });
    return { w: w, h: h, scale: s, rahmen: rahmenC, streifen: streifen };
  }
  // Zustandsmaschine D. S = ruhigStart(state); ruhigSet(S, st, nowMs); ruhigFrame(ctx, F, S, nowMs, tFix)
  var G_PNORM = GEO.PNORM;
  // Sleep was too faint on a wall. A little more colour and opacity, still calm.
  STATES.schlafen.rgb = [96, 40, 10];
  STATES.schlafen.gain = 1.2;
  RUHIG_STATES.schlafen.lo = 0.42;
  RUHIG_STATES.schlafen.hi = 0.56;
  RUHIG_STATES.schlafen.rahmen = [0.045, 0.08];

  function keyOf(st) { return RUHIG_STATES[st] ? st : 'idle'; }
  function ruhigStart(st) {
    var key = keyOf(st);
    return { state: key, prev: key, named: st, tState: -1e9, colFrom: STATES[key].rgb, col: STATES[key].rgb, wl: RUHIG_STATES[key].modus === 'lang' ? 1 : 0, last: 0, rgb: null };
  }
  function zielFarbe(S, st) { return S.rgb || STATES[st].rgb; }
  function ruhigSet(S, st, now, rgb) {
    var key = keyOf(st);
    S.rgb = rgb && rgb.length ? rgb : null;
    if (key === S.state && S.named === st) return;
    S.colFrom = S.col;
    S.prev = S.state;
    S.state = key;
    S.named = st;
    S.tState = now;
  }
  function ruhigFrame(ctx, F, S, now, tFix) {
    var fixed = tFix !== undefined && tFix !== null, t = fixed ? tFix : now / 1000, dt = fixed ? 10 : Math.min(0.1, Math.max(0, (now - S.last) / 1000)); S.last = now;
    var ue = fixed ? 1 : easeInOutSine((now - S.tState) / 1000 / RUHIG.T_STATE);
    var st = S.state, pv = S.prev, gain = STATES[st].gain * ue + STATES[pv].gain * (1 - ue);
    var ziel = zielFarbe(S, st);
    S.col = ue < 1 ? mixLin(S.colFrom, ziel, ue) : ziel;
    var target = RUHIG_STATES[st].modus === 'lang' ? 1 : 0, step = dt / RUHIG.T_MODUS;
    S.wl = S.wl < target ? Math.min(target, S.wl + step) : Math.max(target, S.wl - step);
    var wlE = sst(0, 1, S.wl);
    var lv = levelRuhig(st, t) * ue + levelRuhig(pv, t) * (1 - ue), ra = rahmenRuhig(st, t) * ue + rahmenRuhig(pv, t) * (1 - ue);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, ra * gain); ctx.drawImage(F.rahmen, 0, 0);
    for (var k = 0; k < F.streifen.length; k++) {
      var sk = F.streifen[k], a = gain * lv * (shiftRuhig(st, sk.u, t) * ue + shiftRuhig(pv, sk.u, t) * (1 - ue));
      var ak = Math.min(1, a * (1 - wlE)), al = Math.min(1, a * wlE);
      if (sk.kurz && ak > 0.003) { ctx.globalAlpha = ak; ctx.drawImage(sk.kurz.c, sk.kurz.x, sk.kurz.y); }
      if (sk.lang && al > 0.003) { ctx.globalAlpha = al; ctx.drawImage(sk.lang.c, sk.lang.x, sk.lang.y); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = 'rgb(' + S.col.join(',') + ')'; ctx.fillRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = 'source-over';
  }
  function lebhaftStart(st) { return { state: keyOf(st), prev: keyOf(st), named: st, tState: -1e9, colFrom: STATES[keyOf(st)].rgb, col: STATES[keyOf(st)].rgb, lv: level(keyOf(st), 0), last: 0, rgb: null }; }
  function lebhaftSet(S, st, now, rgb) {
    var key = keyOf(st);
    S.rgb = rgb && rgb.length ? rgb : null;
    if (key === S.state && S.named === st) return;
    S.colFrom = S.col; S.prev = S.state; S.state = key; S.named = st; S.tState = now;
  }
  function lebhaftFrame(ctx, F, S, now, tFix) {
    var fixed = tFix !== undefined && tFix !== null, t = fixed ? tFix : now / 1000, dt = fixed ? 0.016 : Math.min(0.1, Math.max(0, (now - S.last) / 1000)); S.last = now;
    var ue = fixed ? 1 : easeOutCubic(Math.max(0, Math.min(1, (now - S.tState) / 450)));
    var st = S.state, pv = S.prev;
    var zielLv = level(st, t) * ue + level(pv, t) * (1 - ue);
    S.lv += (zielLv - S.lv) * (1 - Math.exp(-dt / 0.12));
    var ziel = zielFarbe(S, st);
    S.col = ue < 1 ? mixLin(S.colFrom, ziel, ue) : ziel;
    var o = Math.min(1, opacity(st, S.lv) * ue + opacity(pv, S.lv) * (1 - ue));
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, o * 0.6); ctx.drawImage(F.haze, 0, 0);
    var sectors = F.sectors;
    for (var i = 0; i < sectors.length; i++) {
      var sec = sectors[i];
      var wA = wave(st, sec.s, t), wB = wave(pv, sec.s, t);
      var hell = wA[0] * ue + wB[0] * (1 - ue), dick = wA[1] * ue + wB[1] * (1 - ue);
      var thinA = Math.min(1, o * hell * (1 - dick)), thickA = Math.min(1, o * hell * dick);
      if (thinA > 0.003) { ctx.globalAlpha = thinA; ctx.drawImage(sec.thin, sec.x, sec.y); }
      if (thickA > 0.003) { ctx.globalAlpha = thickA; ctx.drawImage(sec.thick, sec.x, sec.y); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = 'rgb(' + S.col.join(',') + ')'; ctx.fillRect(0, 0, F.w, F.h);
    ctx.globalCompositeOperation = 'source-over';
  }

// Short id to the 1.4.3 living-light key. Laugh, hello, and a glance breathe as idle.
// Speaking is the amber profile. Angry is not a living-light key.
function lichtZustandVon(kurz) {
  if (kurz === 'zuhoeren') return 'zuhoeren';
  if (kurz === 'sprechen') return 'sprechen';
  if (kurz === 'nachdenken') return 'nachdenken';
  if (kurz === 'verstanden' || kurz === 'erledigt') return 'bestaetigt';
  if (kurz === 'fehler' || kurz === 'nicht_verstanden') return 'fehler';
  if (kurz === 'schlafen') return 'schlafen';
  if (kurz === 'musik_an') return 'musik';
  return 'idle';
}

var ALARM_STARK = [255, 12, 8];
var ALARM_NORMAL = [214, 32, 22];

// Red alarm replaces Quiet and Lively only while the short id is angry.
// A fixed preview keeps the living profile, including over angry.
function lichtBefehl(kurz, opt) {
  opt = opt || {};
  var fest = opt.fest || '';
  var alarmStark = opt.alarmStark !== false;
  if (!fest && kurz === 'angry') {
    return { name: 'alarm', alarm: true, rgb: alarmStark ? ALARM_STARK.slice() : ALARM_NORMAL.slice() };
  }
  var name = fest || lichtZustandVon(kurz);
  if (!RUHIG_STATES[name]) name = 'idle';
  return { name: name, alarm: false, rgb: null };
}

export {
  STATES, GEO, WAVE, buildField, level, wave, opacity, mixLin, breath,
  RUHIG, RUHIG_STATES, buildRuhig, ruhigStart, ruhigSet, ruhigFrame, levelRuhig, shiftRuhig, rahmenRuhig,
  lebhaftStart, lebhaftSet, lebhaftFrame, sst, easeOutCubic, edgeDist, perimS,
  lichtZustandVon, lichtBefehl, ALARM_STARK, ALARM_NORMAL,
};
