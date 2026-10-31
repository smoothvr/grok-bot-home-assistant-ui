// SPDX-License-Identifier: MIT
// Renderer interface.
// The eye engine supplies a pose and a ring [rgb, intensity, sweep|null].
// A renderer only draws. It does not know states, Home Assistant, or sound.
//
// Buehne draws fullscreen, the flat 2D view, or an LED preview.
// ledFrame(pose, opt) is an optional experimental hardware buffer:
// brightness per point (0..1), split across lines. Default 1330 points, 4 lines.
// Nothing is sent from here.
import { poseToPrims } from './augen.js';
import { Szene2D, portraitEyeScale } from './zwei_d.js';
import { L, LedScene, ledLevels, ledPositions } from './led.js';
import {
  buildField, buildRuhig, lebhaftFrame, lebhaftSet, lebhaftStart, ruhigFrame, ruhigSet, ruhigStart,
} from './licht.js';

// One distance to the nearest edge. Corners are not the sum of two rims.
export function alarmAlpha(dist, band) {
  if (!(band > 0)) return 0;
  const u = Math.max(0, Math.min(1, dist / band));
  const s = u * u * (3 - 2 * u);
  return 1 - s;
}

export const LED_VORGABE = { pitch: 2.5, anzahl: 1330, leitungen: 4 };

// Even split. The remainder goes on the first lines. An array is the real wiring and must sum to anzahl.
export function leitungenVon(anzahl, leitungen = LED_VORGABE.leitungen) {
  const n = Math.max(0, Math.round(Number(anzahl) || 0));
  if (Array.isArray(leitungen)) {
    const laengen = leitungen.map((x) => Math.max(0, Math.round(Number(x) || 0)));
    const summe = laengen.reduce((a, b) => a + b, 0);
    if (summe !== n) throw new Error(`Lines add up to ${summe}, not ${n}`);
    let start = 0;
    return laengen.map((laenge, leitung) => {
      const stueck = { leitung, start, laenge };
      start += laenge;
      return stueck;
    });
  }
  const bahnen = Math.max(1, Math.round(Number(leitungen) || 0));
  const basis = Math.floor(n / bahnen);
  const rest = n % bahnen;
  let start = 0;
  const linien = [];
  for (let i = 0; i < bahnen; i++) {
    const laenge = basis + (i < rest ? 1 : 0);
    linien.push({ leitung: i, start, laenge });
    start += laenge;
  }
  return linien;
}

function aufAnzahl(levels, anzahl) {
  if (levels.length === anzahl) return levels;
  const out = new Float32Array(anzahl);
  if (!levels.length || anzahl <= 0) return out;
  const last = levels.length - 1;
  const nenner = Math.max(1, anzahl - 1);
  for (let i = 0; i < anzahl; i++) out[i] = levels[Math.round(i * last / nenner)];
  return out;
}

// opt may be { pitch, anzahl, leitungen } or a number (pitch in mm, the older signature).
export function ledFrame(pose, opt = {}) {
  const vorgabe = typeof opt === 'number' ? { pitch: opt } : (opt || {});
  const pitch = Number(vorgabe.pitch ?? LED_VORGABE.pitch);
  if (!(pitch > 0)) throw new Error('Pitch must be positive');
  const anzahl = Math.max(0, Math.round(Number(vorgabe.anzahl ?? LED_VORGABE.anzahl)));
  const leitungen = vorgabe.leitungen ?? LED_VORGABE.leitungen;
  const positionen = ledPositions(pitch, L.R_LED, L.CAP);
  const helligkeit = aufAnzahl(ledLevels(pose, positionen, pitch), anzahl);
  const linien = leitungenVon(anzahl, leitungen).map((linie) => ({
    ...linie,
    helligkeit: helligkeit.subarray(linie.start, linie.start + linie.laenge),
  }));
  return { pitch, anzahl, leitungen: linien.length, helligkeit, linien };
}

export class Buehne {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'vollbild';
    this.scale = 1;
    this.ledOpt = { pitch: LED_VORGABE.pitch, h: 4.5, T: 0.15, grid: false };
    this.szene2d = null;
    this.led = null;
    this.ledImg = null;
    this.ledCanvas = document.createElement('canvas');
    this.preview = null;
    this.lichtProfil = 'ruhig';
    this.lichtT = null;
    this.lichtZustand = 'idle';
    this.lichtRgb = null;
    this.lichtFeld = null;
    this.lichtCv = document.createElement('canvas');
    this.lichtCtx = this.lichtCv.getContext('2d');
    this.lichtMaschine = null;
    this.lichtKey = '';
  }

  // CSS pixels. Null draws the eyes at full size. The 2D vignette stays full either way.
  setPreview(box) {
    this.preview = box && box.size > 0 ? box : null;
  }

  previewPx() {
    if (!this.preview) return null;
    const dpr = this.cv.width / Math.max(1, window.innerWidth || 1);
    const b = this.preview;
    return { x: b.x * dpr, y: b.y * dpr, size: b.size * dpr };
  }

  setMode(mode) {
    this.mode = mode;
    this.resize();
  }

  resize() {
    const dpr = this.sparsam ? 1 : Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(1, Math.floor(window.innerWidth * dpr));
    const H = Math.max(1, Math.floor(window.innerHeight * dpr));
    this.cv.width = W;
    this.cv.height = H;
    if (this.mode === '2d') {
      this.szene2d = new Szene2D(W, H, { cheap: !!this.sparsam, flat: true });
    } else if (this.mode === 'vollbild') {
      this.szene2d = new Szene2D(W, H, { cheap: true, bold: true });
    }
    if (this.mode === 'led') {
      const opt = this.ledOpt;
      const cap = this.sparsam ? 300 : 480;
      const s = Math.min(cap, Math.floor(Math.min(W, H) * 0.92 / 2) * 2);
      this.led = new LedScene(s, { pitch: opt.pitch, h: opt.h, T: opt.T, grid: opt.grid });
      this.ledCanvas.width = this.ledCanvas.height = s;
      this.ledImg = this.ledCanvas.getContext('2d').createImageData(s, s);
    }
  }

  setLicht(opt) {
    const o = opt || {};
    if (o.profil === 'ruhig' || o.profil === 'lebhaft') this.lichtProfil = o.profil;
    if ('t' in o) this.lichtT = o.t === '' || o.t == null ? null : Number(o.t);
    if (o.zustand) this.lichtZustand = o.zustand;
    if ('rgb' in o) this.lichtRgb = o.rgb && o.rgb.length ? o.rgb : null;
    if ('alarmStark' in o) this.alarmStark = o.alarmStark !== false;
    if ('huelle' in o) {
      const n = Number(o.huelle);
      this.lichtHuelle = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    }
  }

  // Screen-edge light under the eyes. Bold only flashes it while a tap is acknowledged.
  // The name "alarm" is the red rim, and only while the state is angry. Every other name is the 1.4.3 Quiet or Lively field.
  zeichneLicht(name, rgb, force) {
    if (name === 'alarm') {
      this.zeichneAlarm(rgb);
      return;
    }
    const dauer = this.mode === '2d' || this.mode === 'led' || force;
    if (!dauer) return;
    const W = this.cv.width, H = this.cv.height;
    if (W < 2 || H < 2) return;
    const cssMin = Math.min(window.innerWidth || W, window.innerHeight || H);
    const phone = cssMin < 600;
    const scale = phone ? 1 : (this.sparsam ? 0.33 : 0.5);
    const cornerR = phone ? 47 : 0;
    const key = `${this.lichtProfil}:${W}x${H}:${scale}:${cornerR}`;
    if (this.lichtKey !== key) {
      const opt = { scale, cornerR };
      this.lichtFeld = this.lichtProfil === 'lebhaft' ? buildField(W, H, opt) : buildRuhig(W, H, opt);
      this.lichtCv.width = this.lichtFeld.w;
      this.lichtCv.height = this.lichtFeld.h;
      this.lichtMaschine = this.lichtProfil === 'lebhaft' ? lebhaftStart('idle') : ruhigStart('idle');
      this.lichtKey = key;
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const st = name || 'idle';
    if (this.lichtProfil === 'lebhaft') lebhaftSet(this.lichtMaschine, st, now, rgb);
    else ruhigSet(this.lichtMaschine, st, now, rgb);
    this.lichtMaschine.huelle = this.lichtHuelle > 0 ? this.lichtHuelle : 0;
    const frameFn = this.lichtProfil === 'lebhaft' ? lebhaftFrame : ruhigFrame;
    frameFn(this.lichtCtx, this.lichtFeld, this.lichtMaschine, now, this.lichtT);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.lichtCv, 0, 0, W, H);
    ctx.restore();
  }

  render(pose, ring) {
    if (!this.cv.width || !this.cv.height) return;
    if ((this.mode === '2d' || this.mode === 'vollbild') && !this.szene2d) return;
    if (this.mode === 'led' && !this.led) return;
    const ctx = this.ctx;
    ctx.save();
    try {
      if (this.mode === 'led') this.drawLed(pose, ring);
      else if (this.mode === '2d') this.drawFlach(pose, ring);
      else if (this.mode === 'vollbild') {
        // Bold hides the living edge. The red rim is only while the state is angry, not from a leftover ring flag.
        this.szene2d.render(ctx, pose, [ring[0], 0, null], this.previewPx());
        if (this.lichtZustand === 'alarm') this.zeichneAlarm(this.lichtRgb || (ring && ring[0]));
        if (this.ackAlpha() > 0) this.zeichneLicht('bestaetigt', this.ackRgb, true);
      }
      else this.drawVollbild(pose, ring);
    } finally {
      ctx.restore();
    }
  }

  acknowledge(rgb) {
    this.ackRgb = rgb && rgb.length >= 3 ? rgb : [255, 236, 214];
    this.ackUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 900;
  }

  ackAlpha() {
    if (!this.ackUntil) return 0;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const left = this.ackUntil - now;
    if (left <= 0) return 0;
    return Math.min(1, left / 900);
  }

  // Alarm replaces Quiet and Lively only while the state is angry. One distance field, so corners are not doubled.
  zeichneAlarm(rgb) {
    const ctx = this.ctx;
    const W = this.cv.width, H = this.cv.height;
    if (W < 2 || H < 2) return;
    const farbe = (rgb && rgb.length >= 3) ? rgb : (this.lichtRgb || [255, 12, 8]);
    const [r, g, b] = farbe.map((x) => Math.round(Math.max(0, Math.min(255, x))));
    const stark = this.alarmStark !== false;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const pulse = 0.5 + 0.5 * Math.sin((2 * Math.PI * now) / (stark ? 700 : 1200));
    const a = stark ? 0.78 + 0.22 * pulse : 0.4 + 0.22 * pulse;
    const band = Math.min(W, H) * (stark ? 0.11 : 0.07);
    const kurz = Math.min(W, H);
    const scale = kurz > 280 ? 280 / kurz : 1;
    const w = Math.max(2, Math.round(W * scale));
    const h = Math.max(2, Math.round(H * scale));
    const bandS = band * (w / W);
    if (!this.alarmCv) {
      this.alarmCv = document.createElement('canvas');
      this.alarmCtx = this.alarmCv.getContext('2d');
    }
    if (this.alarmCv.width !== w || this.alarmCv.height !== h) {
      this.alarmCv.width = w;
      this.alarmCv.height = h;
    }
    const img = this.alarmCtx.createImageData(w, h);
    const data = img.data;
    const deck = Math.max(0, Math.min(1, a));
    for (let y = 0; y < h; y++) {
      const dy = Math.min(y + 0.5, h - (y + 0.5));
      for (let x = 0; x < w; x++) {
        const dx = Math.min(x + 0.5, w - (x + 0.5));
        const alpha = alarmAlpha(Math.min(dx, dy), bandS) * deck;
        const o = (y * w + x) * 4;
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
      }
    }
    this.alarmCtx.putImageData(img, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.alarmCv, 0, 0, W, H);
    ctx.restore();
  }

  drawAck() {
    const a = this.ackAlpha();
    if (!(a > 0)) return;
    const ctx = this.ctx;
    const W = this.cv.width, H = this.cv.height;
    const [r, g, b] = this.ackRgb.map((x) => Math.round(Math.max(0, Math.min(255, x))));
    const cx = W / 2, cy = H * 0.46;
    const rad = Math.min(W, H) * 0.42;
    const gr = ctx.createRadialGradient(cx, cy, rad * 0.25, cx, cy, rad);
    gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gr.addColorStop(0.62, `rgba(${r},${g},${b},${0.05 * a})`);
    gr.addColorStop(1, `rgba(${r},${g},${b},${0.62 * a})`);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Eyes on a black screen. The only colour is the screen-edge glow, drawn afterwards.
  drawFlach(pose, ring) {
    const ctx = this.ctx;
    const W = this.cv.width, H = this.cv.height;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    this.szene2d.render(ctx, pose, [ring[0], 0, null], this.previewPx(), true);
    const farbe = this.lichtRgb || (this.lichtZustand === 'schlafen' ? null : (ring && ring[0]));
    this.zeichneLicht(this.lichtZustand, farbe);
  }

  drawVollbild(pose, ring) {
    const ctx = this.ctx;
    const W = this.cv.width, H = this.cv.height;
    const R = 0.47 * Math.min(W, H) * (this.scale || 1) * portraitEyeScale(W / Math.max(1, H));
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const [r, g, b] = ring[0].map(Math.round), a = Math.min(1, ring[1]);
    const k = 0.25;
    const gr = ctx.createRadialGradient(W / 2, H * 1.02 / k, 0, W / 2, H * 1.02 / k, Math.max(W, H) * 0.32);
    gr.addColorStop(0, `rgba(${r},${g},${b},${0.9 * a})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.scale(1, k);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H / k);
    ctx.restore();
    const X = (p) => cx + p[0] * R, Y = (p) => cy - p[1] * R;
    for (const e of poseToPrims(pose)) {
      const v = Math.round(255 * Math.max(0, Math.min(1, e.bright)));
      ctx.strokeStyle = ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2 * e.r * R;
      ctx.beginPath();
      ctx.moveTo(X(e.p1), Y(e.p1));
      ctx.lineTo(X(e.p2) + 0.01, Y(e.p2));
      ctx.stroke();
      ctx.fillStyle = '#000';
      if (e.lid) {
        const [l1, l2, up] = e.lid;
        let nx = -(l2[1] - l1[1]), ny = l2[0] - l1[0];
        const nl = Math.hypot(nx, ny);
        nx /= nl;
        ny /= nl;
        if ((up[0] - l1[0]) * nx + (up[1] - l1[1]) * ny < 0) { nx = -nx; ny = -ny; }
        const big = 0.6;
        const q1 = [l1[0] + nx * big, l1[1] + ny * big], q2 = [l2[0] + nx * big, l2[1] + ny * big];
        ctx.beginPath();
        ctx.moveTo(X(l1), Y(l1));
        ctx.lineTo(X(l2), Y(l2));
        ctx.lineTo(X(q2), Y(q2));
        ctx.lineTo(X(q1), Y(q1));
        ctx.fill();
      }
      if (e.cut) {
        ctx.beginPath();
        ctx.arc(X(e.cut[0]), Y(e.cut[0]), e.cut[1] * R, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  drawLed(pose, ring) {
    const ctx = this.ctx;
    this.led.render(this.ledImg, pose, ring);
    this.ledCanvas.getContext('2d').putImageData(this.ledImg, 0, 0);
    const W = this.cv.width, H = this.cv.height;
    const s = Math.min(W, H) * 0.95 * portraitEyeScale(W / Math.max(1, H));
    ctx.fillStyle = 'rgb(11,11,11)';
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    if ('webkitImageSmoothingEnabled' in ctx) ctx.webkitImageSmoothingEnabled = false;
    const box = this.previewPx();
    if (box) ctx.drawImage(this.ledCanvas, box.x, box.y, box.size, box.size);
    else ctx.drawImage(this.ledCanvas, (W - s) / 2, (H - s) / 2, s, s);
    const farbe = this.lichtRgb || (this.lichtZustand === 'schlafen' ? null : (ring && ring[0]));
    this.zeichneLicht(this.lichtZustand, farbe);
  }
}
