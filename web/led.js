// SPDX-License-Identifier: MIT
// Optional experimental LED buffer. Measurements are millimetres.
// At a pitch of 2.5 and a 60° cap this grid has 1326 points.
// ledFrame() resamples when the configured count differs.
import { DEFAULT, P as PA, buildEyes } from './augen.js';

export const L = {
  R_GLAS: 60.0, R_DIFF: 56.5, R_LED: 52.0, CAP: 60.0, PITCH: 2.5,
  EYE_W: 17.5, EYE_H: 31.5, SEP: 36.0, REST_POLAR: 30.0, YAW: 60.0, UP: 28.0, DOWN: 10.0,
  T_GLAS: 0.15, CAM_EL: 24.0,
};
const rad = (d) => d * Math.PI / 180;
const K_MM = () => L.SEP / PA.SEP;

export function ledPositions(pitch, R, cap) {
  const pts = [[0, 1, 0]];
  for (let k = 1; k * pitch / R <= rad(cap) + 1e-9; k++) {
    const th = k * pitch / R, n = Math.max(1, Math.round(2 * Math.PI * R * Math.sin(th) / pitch));
    for (let j = 0; j < n; j++) { const ph = 2 * Math.PI * (j + 0.5 * (k % 2)) / n; pts.push([Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]); }
  }
  return pts;
}
function axes() {
  const p0 = rad(L.REST_POLAR);
  return { c0: [0, Math.cos(p0), Math.sin(p0)], er: [1, 0, 0], eu: [0, Math.sin(p0), -Math.cos(p0)] };
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function sdf(prims, u, v) {
  let d = 1e9;
  for (const e of prims) {
    const [ax, ay] = e.p1, [bx, by] = e.p2, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    const t = L2 > 1e-12 ? Math.min(1, Math.max(0, ((u - ax) * dx + (v - ay) * dy) / L2)) : 0;
    let de = Math.hypot(u - ax - t * dx, v - ay - t * dy) - e.r;
    if (e.lid) {
      const [[l1x, l1y], [l2x, l2y], [ux, uy]] = e.lid; let nx = -(l2y - l1y), ny = l2x - l1x; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      if ((ux - l1x) * nx + (uy - l1y) * ny < 0) { nx = -nx; ny = -ny; }
      de = Math.max(de, (u - l1x) * nx + (v - l1y) * ny);
    }
    if (e.cut) { const [[cx, cy], rc] = e.cut; de = Math.max(de, rc - Math.hypot(u - cx, v - cy)); }
    d = Math.min(d, de);
  }
  return d;
}
export function ledLevels(pose, V, pitch) {
  const q = { ...DEFAULT, ...pose }, rr = rad(q.roll), cr = Math.cos(rr), sr = Math.sin(rr), K = K_MM();
  const scr = (u, v) => [u * cr - v * sr + q.dx * K, u * sr + v * cr + q.dy * K];
  const prims = buildEyes(q, L.EYE_W * q.scale * q.sx, L.EYE_H * q.scale * q.sy, L.SEP * q.sep, 0, scr);
  const yaw = rad(q.gx * L.YAW), pit = rad(q.gy * (q.gy > 0 ? L.UP : L.DOWN));
  const { c0, er, eu } = axes(), out = new Float32Array(V.length);
  const cyw = Math.cos(-yaw), syw = Math.sin(-yaw), cp = Math.cos(-pit), sp = Math.sin(-pit);
  for (let i = 0; i < V.length; i++) {
    let [x, y, z] = V[i];
    [x, z] = [x * cyw + z * syw, -x * syw + z * cyw];
    [y, z] = [y * cp + z * sp, -y * sp + z * cp];
    const W = [x, y, z], ct = Math.max(-1, Math.min(1, dot(W, c0))), th = Math.acos(ct);
    const t = [x - ct * c0[0], y - ct * c0[1], z - ct * c0[2]], tl = Math.hypot(...t) + 1e-12, f = th * L.R_LED / tl;
    out[i] = Math.min(1, Math.max(0, 0.5 - sdf(prims, dot(t, er) * f, dot(t, eu) * f) / pitch)) * q.bright;
  }
  return out;
}

export class LedScene {
  constructor(size, opt = {}) { this.size = size; this.pitch = opt.pitch ?? L.PITCH; this.h = opt.h ?? (L.R_DIFF - L.R_LED); this.T = opt.T ?? L.T_GLAS; this.grid = !!opt.grid; this.build(); }
  build() {
    const S = this.size, px = this.px = S * 0.40 / L.R_GLAS, cx = this.cx = S / 2, cy = this.cy = S * 0.47;
    this.V = ledPositions(this.pitch, L.R_LED, L.CAP);
    const el = rad(L.CAM_EL); this.right = [1, 0, 0]; this.up = [0, Math.cos(el), -Math.sin(el)]; this.view = [0, Math.sin(el), Math.cos(el)];
    const N = S * S, Rd = L.R_DIFF, Rg = L.R_GLAS, cosCap = Rd * Math.cos(rad(L.CAP + 1));
    this.D = new Float32Array(N * 3); this.cap = new Uint8Array(N); this.inG = new Float32Array(N); this.glass = new Float32Array(N); this.Yn = new Float32Array(N);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const k = j * S + i, X = (i + .5 - cx) / px, Y = (cy - j - .5) / px, r2 = X * X + Y * Y;
      const zc = Math.sqrt(Math.max(0, Rd * Rd - r2));
      const Dx = X, Dy = Y * this.up[1] + zc * this.view[1], Dz = Y * this.up[2] + zc * this.view[2];
      this.D[k * 3] = Dx; this.D[k * 3 + 1] = Dy; this.D[k * 3 + 2] = Dz;
      this.cap[k] = (r2 < Rd * Rd && Dy >= cosCap) ? 1 : 0;
      const rho = Math.sqrt(r2) / Rg;
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, rho * rho)));
      // The outer band of the disc fades out. The preview has no hard specular lip.
      const u = rho <= 0.84 ? 1 : rho >= 1.05 ? 0 : (1.05 - rho) / 0.21;
      const inG = u * u * (3 - 2 * u);
      this.inG[k] = inG;
      this.glass[k] = (0.012 + 0.02 * (1 - nz) * (1 - nz)) * inG;
      this.Yn[k] = Y / Rg;
    }
    this.ledXY = this.V.map((v) => [cx + dot(v, this.right) * L.R_LED * px, cy - dot(v, this.up) * L.R_LED * px]);
    this.lum = new Float32Array(N);
  }
  render(img, pose, ring) {
    const S = this.size, lv = ledLevels(pose, this.V, this.pitch), lum = this.lum.fill(0);
    // A tight disc per lit point. Neighbours overlap into a solid eye, and the edge stays a pixel or two.
    const radius = Math.max(1.4, this.pitch * this.px * 0.58);
    const win = Math.ceil(radius + 1.4);
    for (let n = 0; n < lv.length; n++) {
      if (lv[n] <= 0.05) continue;
      const [x, y] = this.ledXY[n];
      const x0 = Math.max(0, Math.floor(x - win)), x1 = Math.min(S, Math.ceil(x + win));
      const y0 = Math.max(0, Math.floor(y - win)), y1 = Math.min(S, Math.ceil(y + win));
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) {
        const k = j * S + i;
        if (!this.cap[k]) continue;
        const dist = Math.hypot(i + 0.5 - x, j + 0.5 - y);
        if (dist >= radius + 1.2) continue;
        const cover = dist <= radius - 0.6 ? 1 : (radius + 1.2 - dist) / 1.8;
        const v = lv[n] * cover;
        if (v > lum[k]) lum[k] = v;
      }
    }
    const col = ring[0].map((c) => c / 255 * ring[1]), yb = this.cy + L.R_GLAS * this.px * 0.97, wR = L.R_GLAS * this.px * 0.85;
    const d = img.data;
    for (let j = 0; j < S; j++) {
      const gy = ((j - yb) / 16) ** 2;
      for (let i = 0; i < S; i++) {
        const k = j * S + i, inG = this.inG[k];
        const dim = Math.max(0.4, Math.min(1, this.T / 0.15));
        const shaped = lum[k] <= 0.12 ? 0 : lum[k] >= 0.72 ? 1 : (lum[k] - 0.12) / 0.6;
        const eye = shaped * dim;
        const capg = 0.012 * this.cap[k];
        const u = (i - this.cx) / wR; let g = Math.exp(-(u * u + gy) * 2.2);
        if (ring[2] !== null && ring[2] !== undefined) g *= 0.35 + 0.65 * Math.exp(-((u - ring[2]) ** 2) * 6);
        const rf = Math.min(1, Math.max(0, (-this.Yn[k] - 0.55) / 0.45)) ** 2 * inG * 0.45;
        const base = 0.045 * (1 - inG) + this.glass[k], gl = g * (1 - 0.7 * inG);
        d[k * 4] = 255 * Math.min(1, base + (eye * 1.0 + capg) * inG + col[0] * (gl + rf));
        d[k * 4 + 1] = 255 * Math.min(1, base + (eye * 0.98 + capg) * inG + col[1] * (gl + rf));
        d[k * 4 + 2] = 255 * Math.min(1, base + (eye * 0.95 + capg) * inG + col[2] * (gl + rf));
        d[k * 4 + 3] = 255;
      }
    }
    if (this.grid) for (let n = 0; n < this.V.length; n++) {
      if (dot(this.V[n], this.view) <= 0) continue;
      const i = Math.floor(this.ledXY[n][0]), j = Math.floor(this.ledXY[n][1]); if (i < 0 || j < 0 || i >= S || j >= S) continue;
      const k = (j * S + i) * 4; for (let c = 0; c < 3; c++) d[k + c] = Math.max(d[k + c], 41);
    }
  }
}
