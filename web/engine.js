// SPDX-License-Identifier: MIT
// Runtime: springs, blinks, state changes. Same step order as the original preview (clip playback)
// and like a live device (random blinks and glances while running).
import { P, DEFAULT, Spring, blinkMul } from './augen.js';
import { createBlick } from './blick.js';

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
    this.blick = createBlick(rnd);
    this.blinks = [];
    this.halb = false;
    this.schlafBlink = -10;
    this.touch = null;
    this.lebendigkeit = 0.7;
    this.onEnde = null; this.set('03_idle');
  }
  setLebendigkeit(v) {
    this.lebendigkeit = v;
    if (this.blick) this.blick.setLebendigkeit(v);
  }
  // Look toward a touch. gx/gy are gaze targets, about -1..1. Angry and sleep ignore it.
  schau(gx, gy) {
    this.touch = { gx, gy, t0: this.now, dur: 1.25 };
    this.blick.halte(this.now + 1.25);
    this.blick.merke(gx, gy, this.now);
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
    // Live idle: a slow breath, then saccades and glances from the gaze planner.
    let [tgt, blinks, ring] = this.c.fn(t);
    const p = { ...DEFAULT, ...tgt };
    let z = null;
    if (live) {
      p.scale = 1 + 0.02 * Math.sin(2 * Math.PI * t / 4.6);
      p.dy = 0.008 * Math.sin(2 * Math.PI * t / 5.2) + 0.004 * Math.sin(2 * Math.PI * t / 9.5);
      z = this.blick.tick(this.now, dt);
      p.gx = z.gx;
      p.gy = z.gy;
      p.tilt = z.tilt;
      p.roll = z.roll;
      if (Math.abs(z.tilt) > 1) {
        p.sx *= 1 + Math.min(0.06, Math.abs(z.tilt) * 0.008);
        p.sy *= 1 - Math.min(0.04, Math.abs(z.tilt) * 0.004);
      }
    }
    if (this.touch && this.c.name !== '15_angry' && this.c.name !== '01_schlafen') {
      const age = this.now - this.touch.t0;
      if (age >= 0 && age < this.touch.dur * 0.72) {
        p.gx = this.touch.gx;
        p.gy = this.touch.gy;
      } else if (age >= this.touch.dur) this.touch = null;
    }
    const loopy = live || ['05_zuhoeren', '06_nachdenken', '12_musik_an', '15_angry'].includes(this.c.name);
    if (live && z && z.blink) {
      this.halb = z.blink === 'halb';
      if (z.blink === 'doppelt') this.blinks = [this.now, this.now + 0.3];
      else if (z.blink === 'schlaf') { this.blinks = []; this.schlafBlink = this.now; }
      else this.blinks = [this.now];
    } else if (!live && loopy && this.now > this.nextBlink) {
      this.blinks = [this.now];
      this.halb = false;
      this.nextBlink = this.now + (this.rnd() < .25 ? .3 : 3 + this.rnd() * 5);
    }
    p.gx = this.sgx.step(p.gx, dt); p.gy = this.sgy.step(p.gy, dt); p.scale = this.ssc.step(p.scale, dt);
    const zeiten = this.blinks;
    const hatte = this.blinkAt > -5;
    if (hatte) zeiten.push(this.blinkAt);
    let m = blinkMul(this.now, zeiten);
    if (hatte) zeiten.pop();
    if (live && this.halb) m = 1 - (1 - m) * 0.42;
    if (live && this.schlafBlink > 0) {
      const u = (this.now - this.schlafBlink) / 0.92;
      if (u >= 0 && u < 1) m = Math.min(m, 1 - 0.5 * Math.sin(Math.PI * u));
    }
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
