// SPDX-License-Identifier: MIT
// Runtime: springs, blinks, state changes. Same step order as the original preview (clip playback)
// and like a live device (random blinks and glances while running).
import { P, DEFAULT, Spring, blinkMul } from './augen.js';

export function* clipPoses(c, fps = 30) {
  const nf = Math.round(c.dur * fps);
  const [p0] = c.fn(0);
  const sp = { gx: new Spring(p0.gx ?? 0, P.GAZE_W, P.GAZE_Z), gy: new Spring(p0.gy ?? 0, P.GAZE_W, P.GAZE_Z), scale: new Spring(p0.scale ?? 1, P.SCALE_W, P.SCALE_Z) };
  for (let i = 0; i < nf; i++) {
    const t = i / fps, [tgt, blinks, ring] = c.fn(t), p = { ...DEFAULT, ...tgt };
    for (const k in sp) p[k] = sp[k].step(p[k], 1 / fps);
    const m = blinkMul(t, blinks); p.sy *= m; p.sx *= 1 + 0.15 * (1 - m) / (1 - P.BLINK_MIN);
    yield [p, ring];
  }
}

// Live playback: one state runs. One-shot states return to idle.
export class Augen {
  constructor(clips, rnd = Math.random) {
    this.clips = Object.fromEntries(clips.map((c) => [c.name, c])); this.rnd = rnd;
    this.sgx = new Spring(0, P.GAZE_W, P.GAZE_Z); this.sgy = new Spring(0, P.GAZE_W, P.GAZE_Z); this.ssc = new Spring(1, P.SCALE_W, P.SCALE_Z);
    this.now = 0; this.blinkAt = -10; this.nextBlink = 3; this.nextGlance = 4; this.glance = [0, 0];
    this.onEnde = null; this.set('03_idle');
  }
  set(name) {
    const prev = this.c && this.c.name;
    this.c = this.clips[name];
    this.t0 = this.now;
    if (prev === '15_angry' && name !== '15_angry' && this.pose) {
      this.calm = {
        until: this.now + 0.62,
        from: {
          lidT: this.pose.lidT || 0,
          lidA: this.pose.lidA || 0,
          sy: Math.max(this.pose.sy || 1, 0.42),
          sx: this.pose.sx || 1,
        },
      };
    } else this.calm = null;
    if (name === '03_idle') this.nextGlance = this.now + 1.5;
  }
  tick(dt) {
    this.now += dt; let t = this.now - this.t0; const c = this.c;
    if (!c.loop && t >= c.dur) { const alt = c.name; this.set('03_idle'); t = 0; if (this.onEnde) this.onEnde(alt); }
    const live = this.c.name === '03_idle';
    // Live idle: breathing from the clip, random glances and blinks.
    let [tgt, blinks, ring] = this.c.fn(t);
    const p = { ...DEFAULT, ...tgt };
    if (live) {
      p.scale = 1 + 0.025 * Math.sin(2 * Math.PI * t / 4); p.dy = 0.008 * Math.sin(2 * Math.PI * t / 4);
      if (this.now > this.nextGlance) {
        const weit = this.rnd() < 1 / 3, r = weit ? 0.9 : 0.35, w = this.rnd() * 2 * Math.PI;
        this.glance = [this.rnd() < 1 / 3 ? 0 : r * Math.cos(w), this.rnd() < 1 / 3 ? 0 : r * Math.sin(w)];
        this.nextGlance = this.now + 1.2 + this.rnd() * 3;
      }
      p.gx = this.glance[0]; p.gy = this.glance[1];
    }
    const loopy = live || ['05_zuhoeren', '06_nachdenken', '12_musik_an', '15_angry'].includes(this.c.name);
    if (loopy && this.now > this.nextBlink) { this.blinkAt = this.now; this.nextBlink = this.now + (this.rnd() < .25 ? .3 : 3 + this.rnd() * 5); }
    p.gx = this.sgx.step(p.gx, dt); p.gy = this.sgy.step(p.gy, dt); p.scale = this.ssc.step(p.scale, dt);
    let m = blinkMul(this.now, [this.blinkAt]);
    if (!live) m = Math.min(m, blinkMul(t, blinks));
    p.sy *= m; p.sx *= 1 + 0.15 * (1 - m) / (1 - P.BLINK_MIN);
    if (this.calm && this.now < this.calm.until) {
      const left = (this.calm.until - this.now) / 0.62;
      const e = left * left;
      const f = this.calm.from;
      p.lidT = (p.lidT || 0) + (f.lidT - (p.lidT || 0)) * e;
      p.lidA = (p.lidA || 0) + (f.lidA - (p.lidA || 0)) * e;
      p.sy = p.sy + (f.sy - p.sy) * e;
      p.sx = p.sx + (f.sx - p.sx) * e;
      const smile = Math.sin(Math.PI * Math.max(0, Math.min(1, 1 - left)));
      p.happy = Math.max(p.happy || 0, smile);
      if (ring && ring[0]) {
        const mix = (a, b) => a + (b - a) * e;
        const base = ring[0];
        ring = [[mix(base[0], 255), mix(base[1], 18), mix(base[2], 8)], (ring[1] || 0) * (1 - e) + 0.85 * e, ring[2], e > 0.35 ? 'angry' : ring[3]];
      }
    } else if (this.calm) this.calm = null;
    this.pose = p; this.ring = ring; return p;
  }
}
