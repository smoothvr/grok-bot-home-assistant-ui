// SPDX-License-Identifier: MIT
// Flat 2D view for a landscape tablet. Same look parameters and formulas as the eye preview.
// Dark background, soft eye glow, and a colored edge for the current state.
import { poseToPrims2d } from './augen.js';

export const LOOK = {
  BG_IN: [23, 22, 23], BG_OUT: [7, 7, 8], VIGNETTE: 0.55, SHEEN: 0.075,
  EYE: 0.68, EYE_GLOW: 0.34, GLOW_SIGMA: 0.030, EYE_TINT: [1.0, 0.965, 0.92],
  CORNER: 0.055, RING_TAU: 0.040, RING_LINE: 0.010, RING_LINE_W: 0.0035, RING_TOP: 0.28, FLOOR: 0.85, RIM: 0.10,
};
// Bold is the high-contrast theme. No rounded outline. Colour is drawn later, only as an acknowledgement.
const BOLD = {
  BG_IN: [8, 8, 8], BG_OUT: [0, 0, 0], VIGNETTE: 0.08, SHEEN: 0,
  EYE: 1, EYE_GLOW: 0, GLOW_SIGMA: 0, EYE_TINT: [1, 1, 1],
  CORNER: 0, RING_TAU: 0, RING_LINE: 0, RING_LINE_W: 0, RING_TOP: 0, FLOOR: 0, RIM: 0,
};
const sst = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// Portrait phones are narrow. Shrink the eyes so they keep a side margin. Landscape stays at 1.
export function portraitEyeScale(aspect) {
  if (!(aspect > 0) || aspect >= 1) return 1;
  const fit = (aspect - 0.12) / 0.45;
  return Math.max(0.62, Math.min(1, fit));
}

export class Szene2D {
  constructor(W, H, opt) {
    this.W = W; this.H = H; this.aspect = W / H; this.R = H / 2;
    this.bold = !!(opt && opt.bold);
    this.cheap = !!(opt && opt.cheap) || this.bold;
    this.flat = !!(opt && opt.flat);
    const basis = this.bold ? BOLD : LOOK;
    // The living edge light replaces the old frame. This buffer stays uncoloured so the eye
    // pixels, and the parity hash, stay as they shipped. A second glow here would sit under the eyes.
    this.look = opt && (opt.cube || opt.flat) ? { ...basis, CORNER: 0, RING_TAU: 0, RING_LINE: 0, RING_LINE_W: 0, FLOOR: 0, RIM: 0, VIGNETTE: 0, SHEEN: 0, BG_IN: [0, 0, 0], BG_OUT: [0, 0, 0] } : basis;
    // Flat is only the eyes. The screen stays black. No panel, no inner frame.
    if (this.flat) {
      this.gq = 4;
      if (!this.cheap) {
        this.glow = canvas(Math.ceil(W / this.gq), Math.ceil(H / this.gq));
        this.small = canvas(this.glow.width, this.glow.height);
      }
      return;
    }
    // Static layers at half resolution. Soft gradients are scaled up. Old devices stay coarser.
    const q = this.cheap || W * H > 1.5e6 ? 2 : 1, w = Math.round(W / q), h = Math.round(H / q), L = this.look, A = this.aspect;
    this.bg = canvas(w, h); this.mask = canvas(w, h);
    const bgI = this.bg.getContext('2d').createImageData(w, h), mI = this.mask.getContext('2d').createImageData(w, h);
    const cr = L.CORNER * h;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const nx = (i + 0.5 - w / 2) / (h / 2), ny = (j + 0.5 - h / 2) / (h / 2), rr = Math.hypot(nx / A, ny);
      const g = Math.exp(-((rr / 0.95) ** 2)), vig = 1 - L.VIGNETTE * sst(0.55, 1.45, rr);
      let sheen = Math.exp(-(((nx + 0.62 * A) / 0.55) ** 2 + ((ny + 0.62) / 0.22) ** 2)) * L.SHEEN;
      sheen += Math.exp(-(((nx + 0.55 * A) / 1.1) ** 2 + ((ny + 0.55) / 0.5) ** 2)) * L.SHEEN * 0.25;
      const qx = Math.abs(i + 0.5 - w / 2) - (w / 2 - cr), qy = Math.abs(j + 0.5 - h / 2) - (h / 2 - cr);
      const out = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cr, d = Math.max(-out, 0), inside = out < 0 ? 1 : 0;
      const tau = L.RING_TAU * h;
      const lineW = L.RING_LINE_W * h;
      const edge = (tau > 0 ? Math.exp(-d / tau) * 0.42 : 0) + (lineW > 0 ? Math.exp(-(((d - L.RING_LINE * h) / lineW) ** 2)) * 0.40 : 0);
      const wy = L.RING_TOP + (1 - L.RING_TOP) * sst(-0.9, 0.95, ny);
      const floor = Math.exp(-((nx / (0.62 * A)) ** 2 + ((ny - 1.04) / 0.20) ** 2)) * L.FLOOR;
      const rim = Math.exp(-(((d - 0.004 * h) / (0.0025 * h)) ** 2)) * L.RIM * (1 - sst(-1.0, 0.2, ny)) * (0.6 + 0.4 * Math.exp(-(((nx + 0.5 * A) / A) ** 2)));
      const k = 4 * (j * w + i), tint = [0.92, 0.93, 0.95];
      const dither = (((i * 17 + j * 29) & 15) / 16) - 0.5;
      for (let c = 0; c < 3; c++) {
        const bo = L.BG_OUT[c] / 255, bi = L.BG_IN[c] / 255;
        const shade = inside * Math.min(1, (bo + (bi - bo) * g) * vig + sheen * tint[c] + rim);
        bgI.data[k + c] = Math.max(0, Math.min(255, Math.round(255 * shade + dither * 0.65)));
      }
      bgI.data[k + 3] = 255;
      // One field for the edge and the floor. A soft knee keeps the bottom from clipping into a bar.
      const glow = inside * (edge * wy + floor);
      const knee = glow / (1 + glow * 0.42);
      mI.data[k] = mI.data[k + 1] = mI.data[k + 2] = 255;
      mI.data[k + 3] = Math.max(0, Math.min(255, Math.round(255 * knee + dither)));
    }
    this.bg.getContext('2d').putImageData(bgI, 0, 0); this.mask.getContext('2d').putImageData(mI, 0, 0);
    this.tint = canvas(w, h);
    this.bgFull = canvas(W, H); const bc = this.bgFull.getContext('2d'); bc.imageSmoothingQuality = 'high'; bc.drawImage(this.bg, 0, 0, W, H);
    this.gq = 4;
    if (!this.cheap) {
      this.glow = canvas(Math.ceil(W / this.gq), Math.ceil(H / this.gq));
      this.small = canvas(this.glow.width, this.glow.height);
    }
  }
  // Draw the eyes directly (additive). The lid and the "^^" cut are an even-odd clip, so no extra buffer is needed.
  drawEyes(c, prims, color, sc = 1) {
    const R = this.R * sc, cx = this.W * sc / 2, cy = this.H * sc / 2, X = (p) => cx + p[0] * R, Y = (p) => cy - p[1] * R, BIG = 1e5;
    for (const e of prims) {
      c.save();
      if (e.lid) {
        const [l1, l2, up] = e.lid; let nx = -(l2[1] - l1[1]), ny = l2[0] - l1[0]; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        if ((up[0] - l1[0]) * nx + (up[1] - l1[1]) * ny < 0) { nx = -nx; ny = -ny; }
        const big = 0.6, q1 = [l1[0] + nx * big, l1[1] + ny * big], q2 = [l2[0] + nx * big, l2[1] + ny * big];
        c.beginPath(); c.rect(-BIG, -BIG, 2 * BIG, 2 * BIG);
        c.moveTo(X(l1), Y(l1)); c.lineTo(X(l2), Y(l2)); c.lineTo(X(q2), Y(q2)); c.lineTo(X(q1), Y(q1)); c.closePath(); c.clip('evenodd');
      }
      if (e.cut) { c.beginPath(); c.rect(-BIG, -BIG, 2 * BIG, 2 * BIG); c.arc(X(e.cut[0]), Y(e.cut[0]), e.cut[1] * R, 0, 2 * Math.PI); c.clip('evenodd'); }
      c.strokeStyle = color; c.lineCap = 'round'; c.lineWidth = 2 * e.r * R;
      c.beginPath(); c.moveTo(X(e.p1), Y(e.p1)); c.lineTo(X(e.p2) + 0.01 * sc, Y(e.p2)); c.stroke();
      c.restore();
    }
  }
  render(ctx, pose, ring, box, eyesOnly) {
    const { W, H, aspect } = this, L = this.look;
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (!eyesOnly) {
      ctx.globalCompositeOperation = 'copy'; ctx.globalAlpha = 1; ctx.drawImage(this.bgFull, 0, 0);
      // Colored edge (mask times color times intensity, additive). One pass, so the floor does not sit on a second bar.
      const t = this.tint.getContext('2d'), tw = this.tint.width, th = this.tint.height, [r, g, b] = ring[0].map((x) => Math.round(Math.max(0, Math.min(255, x))));
      t.globalCompositeOperation = 'copy'; t.drawImage(this.mask, 0, 0);
      t.globalCompositeOperation = 'source-in'; t.fillStyle = `rgb(${r},${g},${b})`; t.fillRect(0, 0, tw, th);
      if (ring[2] !== null && ring[2] !== undefined) {   // A highlight travels sideways.
        const gr = t.createLinearGradient(0, 0, tw, 0);
        for (let k = 0; k <= 32; k++) { const u = -1 + 2 * k / 32; gr.addColorStop(k / 32, `rgba(0,0,0,${0.35 + 0.65 * Math.exp(-((u - ring[2]) ** 2) * 6)})`); }
        t.globalCompositeOperation = 'destination-in'; t.fillStyle = gr; t.fillRect(0, 0, tw, th);
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.max(0, Math.min(1, ring[1]));
      ctx.drawImage(this.tint, 0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Eyes: a soft glow at quarter resolution, cropped to the eyes, then a sharp core.
    // Low power skips the blur and draws the pills once.
    // A preview box scales only the eyes. The vignette and the frame stay full size.
    const prims = poseToPrims2d(pose, aspect), br = Math.max(0, Math.min(1, prims[0]?.bright ?? 1));
    const T = `rgb(${L.EYE_TINT.map((x) => Math.round(255 * x)).join(',')})`;
    const eyeScale = box && box.size > 0 ? 1 : portraitEyeScale(aspect);
    if (eyeScale < 1) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(eyeScale, eyeScale);
      ctx.translate(-W / 2, -H / 2);
    }
    if (box && box.size > 0) {
      const k = box.size / H;
      ctx.save();
      ctx.translate(box.x + box.size / 2, box.y + box.size / 2);
      ctx.scale(k, k);
      ctx.translate(-W / 2, -H / 2);
    }
    if (this.cheap) {
      ctx.globalAlpha = Math.min(1, (L.EYE + L.EYE_GLOW * 0.35) * br);
      this.drawEyes(ctx, prims, T);
      if (box) ctx.restore();
      if (eyeScale < 1) ctx.restore();
      ctx.restore();
      return;
    }
    const gc = this.glow.getContext('2d'), gw = this.glow.width, gh = this.glow.height, q = this.gq, off = gw + 50;
    const sc_ = this.small.getContext('2d'); sc_.clearRect(0, 0, gw, gh); this.drawEyes(sc_, prims, T, 1 / q);   // clipped shape, small
    gc.clearRect(0, 0, gw, gh); gc.save();
    gc.shadowColor = T; gc.shadowBlur = 2 * L.GLOW_SIGMA * H / q; gc.shadowOffsetX = off;
    gc.drawImage(this.small, -off, 0); gc.restore();   // The shape sits off-screen. Only the soft shadow remains.
    let x0 = 1e9, x1 = -1e9, yA = 1e9, yB = -1e9;
    for (const e of prims) for (const p of [e.p1, e.p2]) { x0 = Math.min(x0, p[0] - e.r); x1 = Math.max(x1, p[0] + e.r); yA = Math.min(yA, p[1] - e.r); yB = Math.max(yB, p[1] + e.r); }
    const pad = 4 * L.GLOW_SIGMA * 2, sx0 = Math.max(0, Math.floor((W / 2 + (x0 - pad) * this.R) / q)), sx1 = Math.min(gw, Math.ceil((W / 2 + (x1 + pad) * this.R) / q));
    const sy0 = Math.max(0, Math.floor((H / 2 - (yB + pad) * this.R) / q)), sy1 = Math.min(gh, Math.ceil((H / 2 - (yA - pad) * this.R) / q));
    ctx.globalAlpha = L.EYE_GLOW * br;
    if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(this.glow, sx0, sy0, sx1 - sx0, sy1 - sy0, sx0 * q, sy0 * q, (sx1 - sx0) * q, (sy1 - sy0) * q);
    ctx.globalAlpha = L.EYE * br; this.drawEyes(ctx, prims, T);
    if (box) ctx.restore();
    if (eyeScale < 1) ctx.restore();
    ctx.restore();
  }
}
