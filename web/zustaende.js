// SPDX-License-Identifier: MIT
// States. Each clip function: fn(t) -> [pose targets, blinks, ring]
// gx/gy/scale are spring targets. Everything else is applied directly. ring = [rgb, intensity, sweep|null]
import { kf } from './augen.js';

export const RING = {
  schlafen: [58, 21, 0], idle: [255, 106, 0], hallo: [255, 176, 102], zuhoeren: [0, 200, 255],
  nachdenken: [138, 60, 255], verstanden: [43, 255, 136], erledigt: [43, 255, 136],
  nicht_verstanden: [255, 160, 0], fehler: [255, 26, 26], lachen: [255, 90, 138],
  musik: [255, 122, 0], licht_an: [255, 230, 168], licht_aus: [58, 21, 0],
};
let alarmStark = true;
export function setAlarmStaerke(wert) {
  alarmStark = wert !== 'normal';
}

// Strong is the default: a slammed glare, a lunge, then a scan with twitches.
// Normal is the same idea, pulled back. t keeps growing while the clip holds.
export function angryFrame(t) {
  const stark = alarmStark;
  const slam = Math.min(1, t / 0.11);
  const ease = slam * slam * (3 - 2 * slam);
  const lidT = (stark ? 0.64 : 0.5) * ease;
  const lidA = (stark ? -46 : -28) * ease;
  const sy = 1 + ((stark ? 0.46 : 0.64) - 1) * ease;
  const sx = 1 + ((stark ? 1.18 : 1.08) - 1) * ease;
  let scale = 1;
  let dx = 0;
  if (t < 0.14) scale = stark ? 1.34 : 1.16;
  else if (t < 0.4) scale = stark ? 1.02 : 1;
  if (t < 0.3) {
    const u = t / 0.3;
    dx = (stark ? 0.075 : 0.04) * Math.sin(2 * PI * 24 * t) * (1 - u);
  }
  const tw = t > 0.7 ? (t - 0.7) % 3.2 : 99;
  if (tw < 0.16) {
    const u = tw / 0.16;
    dx += (stark ? 0.045 : 0.022) * Math.sin(2 * PI * 18 * tw) * (1 - u);
    if (tw < 0.07) scale = stark ? 1.14 : 1.06;
  }
  const scan = stark ? 0.78 : 0.4;
  const period = stark ? 0.7 : 1.35;
  const gx = t > 0.9 ? scan * Math.sin((2 * PI * (t - 0.9)) / period) : 0;
  const gy = 0;
  const fl = stark
    ? 0.82 + 0.18 * Math.sin((2 * PI * t) / 0.72)
    : 0.5 + 0.16 * Math.sin((2 * PI * t) / 1.4);
  const rgb = stark ? [255, 12, 8] : [214, 32, 22];
  return [{ lidT, lidA, sy, sx, scale, dx, gx, gy, bright: 1 }, [], [rgb, fl, null, 'angry']];
}

const clamp01 = (u) => Math.max(0, Math.min(1, u));
export const mix = (c1, c2, u) => c1.map((a, i) => a + (c2[i] - a) * clamp01(u));
const pulse = (t, period, lo, hi) => lo + (hi - lo) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / period));
const breathe = (t, period = 4.0, amp = 0.025) => amp * Math.sin(2 * Math.PI * t / period);
const PI = Math.PI;

export function makeClips(ON) {
  const C = [];
  const clip = (name, label, dur, sound, s_off, loop, fn) => C.push({ name, label, dur, sound, s_off, loop, fn });
  const off = (n, s) => ON[n].map((x) => s + x);

  clip('01_schlafen', 'schlafen', 6.0, '08_schlafen', 0.4, true, (t) => {
    const o = off('08_schlafen', 0.4);
    const p = {
      gy: kf([[0, 0, 'lin'], [o[0], 0, 'lin'], [o[0] + .4, -.3, 'io']], t),
      lidT: kf([[0, 0, 'lin'], [o[0], 0, 'lin'], [o[0] + .3, .45, 'io']], t),
      sy: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .6, .16, 'io']], t),
      sx: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .6, 1.08, 'io']], t),
      bright: kf([[0, 1, 'lin'], [o[1], .8, 'lin'], [o[1] + .8, .28, 'io']], t),
    };
    if (t > 1.6) { p.bright = pulse(t - 1.6, 4.5, 0.18, 0.32); p.dy = -0.015 * Math.sin(2 * PI * (t - 1.6) / 4.5); }
    return [p, [0.2], [mix(RING.idle, RING.schlafen, (t - o[0]) / 1.2), t > 1.6 ? pulse(t, 4.5, .15, .35) : .3, null]];
  });

  clip('02_hallo', 'wake / hallo', 3.0, '01_hallo', 0.0, false, (t) => {
    const o = ON['01_hallo'];
    const p = {
      sy: kf([[0, .16, 'lin'], [o[0], .16, 'lin'], [o[0] + .16, 1.12, 'o'], [o[1] + .05, 1.12, 'lin'], [o[2] + .02, 1.08, 'lin'], [o[2] + .22, .86, 'i'], [o[2] + .45, 1.0, 'back']], t),
      sx: kf([[0, 1.08, 'lin'], [o[0] + .16, .94, 'o'], [o[2] + .02, .95, 'lin'], [o[2] + .22, 1.1, 'i'], [o[2] + .45, 1.0, 'back']], t),
      dy: kf([[0, 0, 'lin'], [o[1], 0, 'lin'], [o[2] + .02, .12, 'o'], [o[2] + .22, 0, 'i']], t),
      bright: kf([[0, .28, 'lin'], [o[0], .28, 'lin'], [o[0] + .2, 1, 'o']], t),
      gy: kf([[0, -.3, 'lin'], [o[0], -.3, 'step'], [o[0] + .01, .15, 'step'], [1.4, .15, 'lin'], [1.41, 0, 'step']], t),
    };
    const ring = [mix(RING.hallo, RING.idle, (t - 0.8) / 1.0), kf([[0, .2, 'lin'], [o[0], .2, 'lin'], [o[0] + .2, 1, 'o'], [1.2, .5, 'io'], [2.5, .3, 'io']], t), null];
    return [p, [1.75], ring];
  });

  clip('03_idle', 'idle (wach)', 9.0, null, 0, true, (t) => {
    const g = [[0, 0, 0], [2.4, .4, .12], [3.6, -.7, .35], [5.6, 0, 0], [7.0, .25, -.45], [8.2, 0, 0]];
    let gx = 0, gy = 0;
    for (const [tt, x, y] of g) if (t >= tt) { gx = x; gy = y; }
    const p = { gx, gy, scale: 1 + breathe(t), dy: 0.008 * Math.sin(2 * PI * t / 4.0) };
    return [p, [1.4, 4.7, 4.98, 7.9], [RING.idle, pulse(t, 4.0, .2, .32), null]];
  });

  clip('04_blicke', 'Blicke: oben, unten, links, rechts', 8.0, null, 0, false, (t) => {
    const seq = [[0, 0, 0], [.4, 0, 1], [1.3, 0, -1], [2.2, -1, 0], [3.1, 1, 0], [4.0, -.72, .72], [4.9, .72, .72], [5.8, -.72, -.72], [6.7, .72, -.72], [7.5, 0, 0]];
    let gx = 0, gy = 0;
    for (const [tt, x, y] of seq) if (t >= tt) { gx = x; gy = y; }
    return [{ gx, gy }, [7.75], [RING.idle, .28, null]];
  });

  clip('05_zuhoeren', 'zuhören (listening)', 4.0, '02_zuhoeren', 0.1, true, (t) => {
    const o = off('02_zuhoeren', 0.1);
    let sc = kf([[0, 1, 'lin'], [o[0], 1, 'step'], [o[0] + .01, 1.15, 'step']], t);
    if (t > 0.9) sc = 1.15 + 0.02 * Math.sin(2 * PI * (t - 0.9) / 1.2);
    const p = {
      scale: sc, roll: kf([[0, 0, 'lin'], [o[0], 0, 'lin'], [o[0] + .35, 9, 'back']], t),
      sy: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .06, 1.07, 'o'], [o[1] + .25, 1, 'io']], t),
      gx: t > o[0] ? .12 : 0, gy: t > o[0] ? .1 : 0,
    };
    if (t > 2.0) p.gx = .12 + ((t > 2.0 && t < 2.6) ? .06 : 0);
    const ring = [mix(RING.idle, RING.zuhoeren, (t - o[0]) / .2), t > o[0] ? pulse(t - o[0], 1.2, .55, 1.0) : .3, null];
    return [p, [3.3], ring];
  });

  clip('06_nachdenken', 'nachdenken (processing)', 4.0, '07_nachdenken', 0.1, true, (t) => {
    const o = off('07_nachdenken', 0.1);
    let gx = 0, gy = 0;
    if (t >= o[0]) { gx = -.55; gy = .78; }
    if (t >= o[2]) gx = .55;
    if (t >= o[4]) gx = -.55;
    if (t >= o[5] + .3) gx = .55 * Math.sin(2 * PI * (t - o[5] - .3) / 1.6 + PI / 2) * -1;
    const p = { gx, gy, scale: t > o[0] ? .95 : 1 };
    const spot = Math.sin(2 * PI * t / 1.0);
    return [p, [2.9], [mix(RING.idle, RING.nachdenken, (t - o[0]) / .2), t > o[0] ? pulse(t, 1.0, .5, .9) : .3, t > o[0] ? spot : null]];
  });

  clip('07_verstanden', 'verstanden', 2.2, '03_verstanden', 0.1, false, (t) => {
    const o = off('03_verstanden', 0.1);
    const hop = (t0, h = .05) => { const u = (t - t0) / .18; return (u >= 0 && u < 1) ? h * Math.sin(PI * u) : 0; };
    const p = {
      dy: hop(o[0]) + hop(o[1], .06),
      happy: kf([[0, 0, 'lin'], [o[1], 0, 'lin'], [o[1] + .12, .85, 'o'], [1.4, .85, 'lin'], [1.75, 0, 'io']], t),
      sx: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .12, 1.2, 'o'], [1.4, 1.2, 'lin'], [1.75, 1, 'io']], t),
      sy: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .12, .8, 'o'], [1.4, .8, 'lin'], [1.75, 1, 'io']], t),
    };
    const inten = kf([[0, .3, 'lin'], [o[0], .3, 'lin'], [o[0] + .08, 1, 'o'], [1.0, 1, 'lin'], [1.6, .3, 'io']], t);
    return [p, [], [mix(RING.verstanden, RING.idle, (t - 1.1) / .5), inten, null]];
  });

  clip('08_erledigt', 'erledigt / danke', 2.6, '04_erledigt_danke', 0.1, false, (t) => {
    const o = off('04_erledigt_danke', 0.1);
    const p = {
      dy: kf([[0, 0, 'lin'], [o[0], .015, 'o'], [o[1], .03, 'o'], [o[2], .045, 'o'], [o[3] + .14, .11, 'o'], [o[3] + .36, 0, 'i'], [o[3] + .5, .015, 'o'], [o[3] + .62, 0, 'i']], t),
      happy: kf([[0, 0, 'lin'], [o[3], 0, 'lin'], [o[3] + .1, 1, 'o'], [1.8, 1, 'lin'], [2.15, 0, 'io']], t),
      sx: kf([[0, 1, 'lin'], [o[3], 1, 'lin'], [o[3] + .1, 1.25, 'o'], [o[3] + .36, 1.25, 'lin'], [o[3] + .42, 1.35, 'o'], [o[3] + .6, 1.25, 'io'], [1.8, 1.25, 'lin'], [2.15, 1, 'io']], t),
      sy: kf([[0, 1, 'lin'], [o[3], 1, 'lin'], [o[3] + .1, .78, 'o'], [o[3] + .36, .78, 'lin'], [o[3] + .42, .66, 'o'], [o[3] + .6, .78, 'io'], [1.8, .78, 'lin'], [2.15, 1, 'io']], t),
      scale: kf([[0, 1, 'lin'], [o[0], 1.02, 'step'], [o[1], 1.04, 'step'], [o[2], 1.06, 'step'], [o[3], 1.06, 'lin'], [2.0, 1, 'step']], t),
    };
    const inten = kf([[0, .3, 'lin'], [o[0], .5, 'o'], [o[3], 1, 'o'], [1.6, 1, 'lin'], [2.4, .3, 'io']], t);
    return [p, [], [mix(RING.erledigt, RING.idle, (t - 1.7) / .6), inten, null]];
  });

  clip('09_nicht_verstanden', 'nicht verstanden', 3.0, '06_nicht_verstanden', 0.1, false, (t) => {
    const o = off('06_nicht_verstanden', 0.1), back = 2.3;
    const p = {
      scale: kf([[0, 1, 'lin'], [o[0], 1, 'step'], [o[0] + .01, .86, 'step'], [back, .86, 'lin'], [back + .01, 1, 'step']], t),
      gy: kf([[0, 0, 'lin'], [o[0], 0, 'step'], [o[0] + .01, -.15, 'step'], [o[1], -.15, 'step'], [o[1] + .01, -.4, 'step'], [back, -.4, 'step'], [back + .01, 0, 'step']], t),
      lidT: kf([[0, 0, 'lin'], [o[1], 0, 'lin'], [o[1] + .35, .36, 'io'], [back, .36, 'lin'], [back + .35, 0, 'io']], t),
      lidA: 22, tilt: kf([[0, 0, 'lin'], [o[1], 0, 'lin'], [o[1] + .4, 8, 'io'], [back, 8, 'lin'], [back + .35, 0, 'io']], t),
      bright: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .4, .8, 'io'], [back, .8, 'lin'], [back + .3, 1, 'io']], t),
    };
    const inten = (t > o[0] && t < o[0] + .9) ? .3 + .5 * Math.max(0, Math.sin(PI * (t - o[0]) / .45)) : .3;
    return [p, [], [mix(RING.nicht_verstanden, RING.idle, (t - 1.6) / .6), inten, null]];
  });

  clip('10_fehler', 'fehler', 2.2, '09_fehler', 0.1, false, (t) => {
    const o = off('09_fehler', 0.1);
    let sh = 0;
    if (t >= o[0] && t < o[0] + .6) { const u = t - o[0]; sh = 0.05 * Math.sin(2 * PI * 14 * u) * (1 - u / .6); }
    const p = { dx: sh, lidT: kf([[0, 0, 'lin'], [o[0], 0, 'lin'], [o[0] + .06, .3, 'o'], [1.3, .3, 'lin'], [1.6, 0, 'io']], t), lidA: -6, scale: (t > o[0] && t < 1.3) ? .9 : 1 };
    const fl = ((t > o[0] && t < o[0] + .12) || (t > o[1] && t < o[1] + .22)) ? 1 : .25;
    return [p, [1.75], [t < 1.3 ? RING.fehler : mix(RING.fehler, RING.idle, (t - 1.3) / .5), fl, null]];
  });

  // Holds until the next state. Outside the parity hash. The fourth ring value marks the alarm.
  clip('15_angry', 'angry', 2.4, '14_angry', 0.05, true, (t) => angryFrame(t));

  clip('11_lachen', 'lachen', 2.6, '05_lachen', 0.1, false, (t) => {
    const o = off('05_lachen', 0.1);
    let dy = 0, roll = 0;
    const ts = [...o, o[o.length - 1] + .14, o[o.length - 1] + .28];
    ts.forEach((t0, i) => {
      const u = (t - t0) / .11;
      if (u >= 0 && u < 1) {
        const amp = i < o.length ? .05 : .05 * (i === o.length ? 0.6 : .35);
        dy = amp * Math.sin(PI * u); roll = (i % 2 ? 6 : -6) * Math.sin(PI * u);
      }
    });
    const p = {
      dy, roll,
      happy: kf([[0, 0, 'lin'], [o[0] - .05, 0, 'lin'], [o[0] + .04, 1, 'o'], [1.7, 1, 'lin'], [2.05, 0, 'io']], t),
      sx: kf([[0, 1, 'lin'], [o[0] - .05, 1, 'lin'], [o[0] + .04, 1.25, 'o'], [1.7, 1.25, 'lin'], [2.05, 1, 'io']], t),
      sy: kf([[0, 1, 'lin'], [o[0] - .05, 1, 'lin'], [o[0] + .04, .75, 'o'], [1.7, .75, 'lin'], [2.05, 1, 'io']], t),
    };
    let fl = .3;
    for (const t0 of o) if (t >= t0 && t < t0 + .08) fl = 1;
    return [p, [], [mix(RING.lachen, RING.idle, (t - 1.6) / .5), t < 1.6 ? fl : .3, null]];
  });

  clip('12_musik_an', 'musik an', 5.0, '10_musik_an', 0.1, true, (t) => {
    const o = off('10_musik_an', 0.1), BEAT = 0.5, tb = o[o.length - 1] + .25;
    let sc = 1.0;
    o.forEach((t0, i) => { if (t >= t0) sc = 1 + .025 * (i + 1); });
    let dy = 0, roll = 0;
    if (t >= tb) { const u = (t - tb) / BEAT; dy = 0.035 * Math.abs(Math.sin(PI * u)); roll = 7 * Math.sin(PI * u); sc = 1.05; }
    const p = {
      scale: sc, dy, roll, happy: kf([[0, 0, 'lin'], [tb, 0, 'lin'], [tb + .3, .35, 'io']], t),
      sx: 1 + .08 * Math.min(1, Math.max(0, (t - tb) / .3)), sy: 1 - .06 * Math.min(1, Math.max(0, (t - tb) / .3)),
    };
    let inten = .3;
    if (t >= o[0]) inten = .6;
    if (t >= tb) { const ph = ((t - tb) / BEAT) % 1; inten = .45 + .5 * Math.max(0, Math.cos(PI * ph)) ** 2; }
    const col = mix(RING.musik, [255, 176, 0], .5 + .5 * Math.sin(2 * PI * t / 2.0));
    return [p, [3.6], [col, inten, null]];
  });

  clip('13_licht_an', 'licht an', 2.6, '11_licht_an', 0.3, false, (t) => {
    const o = off('11_licht_an', 0.3);
    const p = {
      bright: kf([[0, .4, 'lin'], [o[0], .4, 'lin'], [o[0] + .2, 1, 'o']], t),
      lidT: kf([[0, .25, 'lin'], [o[0], .25, 'lin'], [o[0] + .2, 0, 'o']], t),
      scale: kf([[0, .95, 'lin'], [o[0], .95, 'step'], [o[0] + .01, 1.08, 'step'], [1.6, 1.08, 'step'], [1.61, 1, 'step']], t),
      sy: kf([[0, 1, 'lin'], [o[1], 1, 'lin'], [o[1] + .06, 1.08, 'o'], [o[1] + .3, 1, 'io']], t),
      gy: kf([[0, -.15, 'lin'], [o[0], -.15, 'step'], [o[0] + .01, .45, 'step'], [1.5, .45, 'step'], [1.51, 0, 'step']], t),
    };
    const inten = kf([[0, .12, 'lin'], [o[0], .12, 'lin'], [o[0] + .25, 1, 'o'], [2.6, .8, 'lin']], t);
    return [p, [2.0], [mix(RING.licht_aus, RING.licht_an, (t - o[0]) / .2), inten, null]];
  });

  clip('14_licht_aus', 'licht aus', 2.6, '12_licht_aus', 0.3, false, (t) => {
    const o = off('12_licht_aus', 0.3);
    const p = {
      bright: kf([[0, 1, 'lin'], [o[0], 1, 'lin'], [o[0] + .25, .38, 'io']], t),
      lidT: kf([[0, 0, 'lin'], [o[0], 0, 'lin'], [o[0] + .25, .28, 'io']], t),
      scale: kf([[0, 1, 'lin'], [o[0], 1, 'step'], [o[0] + .01, .95, 'step']], t),
      gy: kf([[0, 0, 'lin'], [o[0], 0, 'step'], [o[0] + .01, -.25, 'step']], t),
    };
    const inten = kf([[0, .8, 'lin'], [o[0], .8, 'lin'], [o[0] + .3, .12, 'io']], t);
    return [p, [1.9], [mix(RING.licht_an, RING.licht_aus, (t - o[0]) / .3), inten, null]];
  });
  return C;
}
