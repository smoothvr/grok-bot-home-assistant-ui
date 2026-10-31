// SPDX-License-Identifier: MIT
// Idle gaze. Saccades, side and upward glances, a slow drift, and blink variety.
// Targets change on a timer. Springs in the eye engine smooth them, so nothing jitters.

import { waehleIndex } from './wahl.js';

export const BLINK_ARTEN = ['einfach', 'doppelt', 'schlaf', 'halb'];
export const BLICK_ARTEN = ['ruhe', 'saccade', 'links', 'rechts', 'oben', 'obenlinks', 'obenrechts', 'gemerkt'];

const GLANCES = ['links', 'rechts', 'oben', 'obenlinks', 'obenrechts'];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, 0, 1);
}

export function waehleBlinzel(letzte, rnd) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const r = Number(zufall());
  let art = 'einfach';
  if (r > 0.84) art = 'schlaf';
  else if (r > 0.68) art = 'halb';
  else if (r > 0.48) art = 'doppelt';
  if (art !== letzte) return art;
  const rest = [];
  for (let i = 0; i < BLINK_ARTEN.length; i++) if (BLINK_ARTEN[i] !== letzte) rest.push(BLINK_ARTEN[i]);
  return rest[waehleIndex(rest.length, null, zufall)];
}

export function blinkPause(lebendigkeit, art, rnd) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const live = clamp01(lebendigkeit);
  const lo = 4.8 - live * 2.8;
  const hi = 8.2 - live * 3.6;
  let t = lo + Number(zufall()) * (hi - lo);
  if (!(t > 0)) t = lo;
  if (art === 'doppelt') t += 0.35;
  if (art === 'schlaf') t += 0.8;
  return t;
}

export function blickIntervall(lebendigkeit, rnd) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const live = clamp01(lebendigkeit);
  const lo = 2.8 - live * 1.5;
  const hi = 6.4 - live * 3.1;
  const t = lo + Number(zufall()) * Math.max(0.2, hi - lo);
  return t > 0.4 ? t : 0.4;
}

export function waehleBlick(letzte, rnd, lebendigkeit, hatMerker) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const live = clamp01(lebendigkeit);
  const r = Number(zufall());
  const pRuhe = 0.58 - live * 0.36;
  const pSacc = pRuhe + 0.22 + live * 0.12;
  let art = 'ruhe';
  if (r < pRuhe) art = 'ruhe';
  else if (r < pSacc) art = 'saccade';
  else if (hatMerker && r > 0.9 - live * 0.06) art = 'gemerkt';
  else art = GLANCES[waehleIndex(GLANCES.length, null, zufall)];
  if (art !== 'ruhe' && art === letzte) {
    const rest = ['links', 'rechts', 'oben', 'obenlinks', 'obenrechts', 'saccade'];
    const i = rest.indexOf(art);
    const hop = waehleIndex(rest.length - 1, null, zufall);
    art = rest[(Math.max(0, i) + hop + 1) % rest.length];
  }
  return art;
}

export function zielVon(art, rnd, merker) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  if (art === 'gemerkt' && merker) {
    return {
      gx: merker.gx * 0.75,
      gy: merker.gy * 0.75,
      tilt: -merker.gx * 5,
      roll: merker.gx * 2.2,
      art,
    };
  }
  if (art === 'saccade') {
    const gx = (Number(zufall()) - 0.5) * 0.34;
    const gy = (Number(zufall()) - 0.35) * 0.28;
    return { gx, gy, tilt: gx * -6, roll: gx * 3, art };
  }
  const tabelle = {
    ruhe: [0, 0, 0, 0],
    links: [-0.64, 0.06, 6, -2.4],
    rechts: [0.64, 0.05, -6, 2.4],
    oben: [0.04, 0.58, 1.5, 0],
    obenlinks: [-0.46, 0.52, 7, -3],
    obenrechts: [0.48, 0.5, -7, 3],
  };
  const v = tabelle[art] || tabelle.ruhe;
  return { gx: v[0], gy: v[1], tilt: v[2], roll: v[3], art };
}

// A slow orbit around the current target. The step from one frame to the next stays small.
export function drift(t, seed) {
  const s = Number(seed) || 0;
  const zeit = Number(t) || 0;
  return {
    gx: 0.04 * Math.sin(zeit * 0.31 + s),
    gy: 0.026 * Math.sin(zeit * 0.22 + s * 1.3),
  };
}

// x/y are viewport pixels. Up on the screen is a positive gy, matching the eye engine.
export function blickZumPunkt(x, y, w, h) {
  const ww = w > 1 ? w : 1;
  const hh = h > 1 ? h : 1;
  const nx = (Number(x) / ww - 0.5) * 2;
  const ny = (Number(y) / hh - 0.5) * 2;
  return {
    gx: clamp(nx * 0.62, -0.78, 0.78),
    gy: clamp(-ny * 0.55, -0.5, 0.72),
  };
}

export function createBlick(rnd) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  let lebendigkeit = 0.7;
  let naechster = 0.7 + Number(zufall()) * 0.8;
  let naechsterBlink = 2.2 + Number(zufall()) * 1.6;
  let letzteArt = 'ruhe';
  let letzteBlink = null;
  let ziel = zielVon('ruhe', zufall, null);
  let tilt = 0;
  let roll = 0;
  let seed = Number(zufall()) * Math.PI * 2;
  let merker = null;
  const aus = { gx: 0, gy: 0, tilt: 0, roll: 0, art: 'ruhe', blink: '' };

  return {
    setLebendigkeit(v) { lebendigkeit = clamp01(v); },
    merke(gx, gy, now) {
      merker = { gx, gy, bis: (Number(now) || 0) + 18 };
    },
    halte(bis) {
      if (bis > naechster) naechster = bis;
    },
    bis(zeit) {
      naechster = Number(zeit) || 0;
    },
    tick(now, dt) {
      const zeit = Number(now) || 0;
      const schritt = dt > 0 ? dt : 0.016;
      const frisch = !!(merker && zeit < merker.bis);
      if (zeit >= naechster) {
        const art = waehleBlick(letzteArt, zufall, lebendigkeit, frisch);
        letzteArt = art;
        ziel = zielVon(art, zufall, frisch ? merker : null);
        naechster = zeit + blickIntervall(lebendigkeit, zufall);
      }
      const live = 0.55 + lebendigkeit * 0.65;
      const d = drift(zeit, seed);
      aus.gx = clamp(ziel.gx + d.gx * live, -0.9, 0.9);
      aus.gy = clamp(ziel.gy + d.gy * live, -0.62, 0.82);
      const folgen = Math.min(1, schritt * 2.1);
      tilt += ((ziel.tilt || 0) - tilt) * folgen;
      roll += ((ziel.roll || 0) - roll) * folgen;
      aus.tilt = tilt;
      aus.roll = roll;
      aus.art = ziel.art || 'ruhe';
      aus.blink = '';
      if (zeit >= naechsterBlink) {
        const art = waehleBlinzel(letzteBlink, zufall);
        letzteBlink = art;
        aus.blink = art;
        naechsterBlink = zeit + blinkPause(lebendigkeit, art, zufall);
      }
      return aus;
    },
  };
}
