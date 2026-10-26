// SPDX-License-Identifier: MIT
// Eye geometry, springs, and projection. Same formulas as the original preview
// (parity is checked by test_paritaet.mjs). Lengths are relative to the display radius R (= 1).
export const P = {
  EYE_W: 0.21, EYE_H: 0.50, SEP: 0.50, Y0: 0.06, RS: 1.10, YAW_MAX: 40.0, PITCH_MAX: 40.0, RIM: 0.95,
  BLINK_T: 0.22, BLINK_CLOSE: 0.40, BLINK_MIN: 0.10, GAZE_W: 16.0, GAZE_Z: 0.72, SCALE_W: 20.0, SCALE_Z: 0.55,
};
export const DEFAULT = { gx: 0, gy: 0, roll: 0, dx: 0, dy: 0, scale: 1, sx: 1, sy: 1, tilt: 0, lidT: 0, lidA: 0, happy: 0, bright: 1, sep: 1 };
const rad = (d) => d * Math.PI / 180;

export const EASE = {
  lin: (u) => u, i: (u) => u * u, o: (u) => 1 - (1 - u) ** 2, io: (u) => 3 * u * u - 2 * u ** 3,
  back: (u) => { const s = 1.7; u -= 1; return 1 + (s + 1) * u ** 3 + s * u ** 2; }, step: (u) => (u >= 1 ? 1 : 0),
};
// keys: [[t, v, ease]]; ease applies to the segment that ends at this key
export function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let k = 0; k < keys.length - 1; k++) {
    const [t0, v0] = keys[k], [t1, v1, e] = keys[k + 1];
    if (t < t1) { const u = t1 > t0 ? (t - t0) / (t1 - t0) : 1; return v0 + (v1 - v0) * EASE[e](u); }
  }
  return keys[keys.length - 1][1];
}
export function blinkMul(t, times) {
  let m = 1;
  for (const b of times) {
    const u = (t - b) / P.BLINK_T;
    if (u >= 0 && u < 1) {
      const c = P.BLINK_CLOSE, k = u < c ? EASE.i(u / c) : 1 - EASE.o((u - c) / (1 - c));
      m = Math.min(m, 1 - (1 - P.BLINK_MIN) * k);
    }
  }
  return m;
}
export class Spring {   // halbimplizites Euler, 120 Hz feste Teilschritte
  constructor(x, w, z) { this.x = x; this.v = 0; this.w = w; this.z = z; }
  step(target, dt) {
    const n = Math.max(1, Math.round(dt * 120)), h = dt / n;
    for (let i = 0; i < n; i++) { this.v += (-2 * this.z * this.w * this.v - this.w * this.w * (this.x - target)) * h; this.x += this.v * h; }
    return this.x;
  }
}
export function project(u, v, yaw, pitch) {
  const RS = P.RS, d = Math.hypot(u, v), th = d / RS;
  let sx = 0, sy = 0;
  if (d > 1e-9) { sx = u / d * Math.sin(th); sy = v / d * Math.sin(th); }
  let x = RS * sx, y = RS * sy, z = RS * Math.cos(th);
  const cy = Math.cos(yaw), sY = Math.sin(yaw); [x, z] = [x * cy + z * sY, -x * sY + z * cy];
  const cp = Math.cos(pitch), sp = Math.sin(pitch); [y, z] = [y * cp + z * sp, -y * sp + z * cp];
  return [x, y];
}
// Build pills, an upper lid, and a cut in face coordinates, then map them with scr(u, v).
export function buildEyes(p, W, H, sep, y0, scr) {
  const out = [];
  for (const side of [-1, 1]) {
    const cu = side * sep / 2, cv = y0, ta = rad(p.tilt) * -side;
    const a = [Math.sin(ta), Math.cos(ta)], n = [a[1], -a[0]];
    let half, r0, ax, wd;
    if (H >= W) { half = (H - W) / 2; r0 = W / 2; ax = a; wd = n; } else { half = (W - H) / 2; r0 = H / 2; ax = n; wd = a; }
    const P1 = scr(cu - ax[0] * half, cv - ax[1] * half), P2 = scr(cu + ax[0] * half, cv + ax[1] * half);
    const C = scr(cu, cv), eps = 1e-3, Cw = scr(cu + wd[0] * eps, cv + wd[1] * eps);
    const r = r0 * Math.hypot(Cw[0] - C[0], Cw[1] - C[1]) / eps;
    const Ca = scr(cu + a[0] * eps, cv + a[1] * eps), Cn = scr(cu + n[0] * eps, cv + n[1] * eps);
    const det = Math.abs((Ca[0] - C[0]) * (Cn[1] - C[1]) - (Ca[1] - C[1]) * (Cn[0] - C[0])) / eps ** 2;
    const e = { p1: P1, p2: P2, r, bright: p.bright, lid: null, cut: null };
    if (p.lidT > 1e-3) {
      const la = rad(p.lidA) * side;
      const ld = [n[0] * Math.cos(la) - a[0] * Math.sin(la), n[1] * Math.cos(la) - a[1] * Math.sin(la)];
      const hu = cu + a[0] * (H / 2 - p.lidT * H), hv = cv + a[1] * (H / 2 - p.lidT * H);
      e.lid = [scr(hu - ld[0] * W, hv - ld[1] * W), scr(hu + ld[0] * W, hv + ld[1] * W), scr(cu + a[0] * H, cv + a[1] * H)];
    }
    if (p.happy > 1e-3) {
      const rc = 0.80 * W, off0 = -H / 2 - rc, off1 = H / 2 - 0.42 * W - rc, off = off0 + (off1 - off0) * p.happy;
      e.cut = [scr(cu + a[0] * off, cv + a[1] * off), rc * Math.sqrt(det)];
    }
    out.push(e);
  }
  return out;
}
function primsK(p, k) {
  const yaw = rad(p.gx * P.YAW_MAX) * k, pitch = rad(p.gy * P.PITCH_MAX) * k, rr = rad(p.roll), cr = Math.cos(rr), sr = Math.sin(rr);
  const scr = (u, v) => { const [x, y] = project(u, v, yaw, pitch); return [x * cr - y * sr + p.dx, x * sr + y * cr + p.dy]; };
  return buildEyes(p, P.EYE_W * p.scale * p.sx, P.EYE_H * p.scale * p.sy, P.SEP * p.sep, P.Y0, scr);
}
export const extent = (pr) => Math.max(...pr.map((e) => Math.max(Math.hypot(...e.p1), Math.hypot(...e.p2)) + e.r));
export function poseToPrims(pose) {
  const q = { ...DEFAULT, ...pose };
  let pr = primsK(q, 1);
  if (extent(pr) <= P.RIM) return pr;
  let lo = 0, hi = 1;
  for (let j = 0; j < 8; j++) { const m = (lo + hi) / 2; if (extent(primsK(q, m)) <= P.RIM) lo = m; else hi = m; }
  return primsK(q, lo);
}

// ---------- Flat 2D primitives (landscape tablet), same formulas as the original preview ----------
// Unit = half the image height, origin at the center. x runs from -A to A (A = width / height). Gaze shifts the pair across the surface.
export const P2 = { K: 1.15, MARGIN: 0.10, FILL_X: 0.92, FILL_Y: 0.92, PERSP_X: 0.10, PERSP_Y: 0.07 };
export function travel2d(aspect) {
  const K = P2.K, hw = K * (P.SEP / 2 + P.EYE_W / 2), hh = K * P.EYE_H / 2;
  return [(aspect - P2.MARGIN - hw) * P2.FILL_X, (1 - P2.MARGIN - hh - K * P.Y0) * P2.FILL_Y];
}
function prims2dK(p, k, aspect) {
  const K = P2.K, [tx, ty] = travel2d(aspect), gx = p.gx * k, gy = p.gy * k;
  const fx = 1 - P2.PERSP_X * gx * gx, fy = 1 - P2.PERSP_Y * gy * gy;
  const rr = rad(p.roll), cr = Math.cos(rr), sr = Math.sin(rr), ox = gx * tx + K * p.dx, oy = gy * ty + K * p.dy;
  const scr = (u, v) => { const x = K * u * fx, y = K * v * fy; return [x * cr - y * sr + ox, x * sr + y * cr + oy]; };
  return buildEyes(p, P.EYE_W * p.scale * p.sx, P.EYE_H * p.scale * p.sy, P.SEP * p.sep, P.Y0, scr);
}
export function inside2d(pr, aspect) {
  const m = P2.MARGIN;
  for (const e of pr) for (const [x, y] of [e.p1, e.p2]) if (Math.abs(x) + e.r > aspect - m * 0.5 || Math.abs(y) + e.r > 1 - m * 0.5) return false;
  return true;
}
export function poseToPrims2d(pose, aspect = 2388 / 1668) {
  const q = { ...DEFAULT, ...pose };
  const pr = prims2dK(q, 1, aspect);
  if (inside2d(pr, aspect)) return pr;
  let lo = 0, hi = 1;
  for (let j = 0; j < 8; j++) { const m = (lo + hi) / 2; if (inside2d(prims2dK(q, m, aspect), aspect)) lo = m; else hi = m; }
  return prims2dK(q, lo, aspect);
}
