// SPDX-License-Identifier: MIT
// Short reactions. Each one has a few renditions, and the same rendition never plays twice in a row.

import { kf } from './augen.js';
import { waehleIndex } from './wahl.js';

export const FELDER = ['gx', 'gy', 'roll', 'dx', 'dy', 'scale', 'sx', 'sy', 'tilt', 'lidT', 'lidA', 'happy', 'bright', 'sep'];
const EINS = { scale: 1, sx: 1, sy: 1, bright: 1, sep: 1 };

export const REAKTION_IDS = [
  'surprised', 'curious', 'shy', 'pleased', 'thinking', 'confused',
  'nod', 'sad', 'happy', 'relieved', 'sleepy', 'startled', 'grumpy', 'content',
];

const SATZ = {};
for (let i = 0; i < REAKTION_IDS.length; i++) SATZ[REAKTION_IDS[i]] = true;

export function istReaktion(id) {
  return !!SATZ[id];
}

function spur(dauer, werte) {
  const n = werte.length;
  const keys = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (dauer * i) / (n - 1);
    keys[i] = [t, werte[i], i === 0 ? 'lin' : 'io'];
  }
  return keys;
}

function baue(phrase, dur, n, fn) {
  const liste = [];
  for (let i = 0; i < n; i++) {
    const dauer = dur * (0.92 + i * 0.05);
    const roh = fn(i);
    const rend = { phrase, dur: dauer, index: i };
    for (const key in roh) {
      if (Object.prototype.hasOwnProperty.call(roh, key)) rend[key] = spur(dauer, roh[key]);
    }
    liste.push(rend);
  }
  return liste;
}

function seite(i) {
  if (i % 3 === 2) return 0;
  return i % 2 === 0 ? -1 : 1;
}

export const REAKTIONEN = {
  surprised: baue('startle', 0.88, 4, (i) => {
    const s = seite(i);
    const hoch = i === 2 ? 0.34 : 0.1;
    return {
      scale: [1, 1.14, 1.04, 1],
      sy: [1, 1.16, 1.05, 1],
      sx: [1, 0.9, 0.97, 1],
      sep: [1, 1.07, 1.03, 1],
      gy: [0, hoch, hoch * 0.4, 0],
      gx: [0, s * 0.2, s * 0.08, 0],
      dy: [0, 0.035, 0, 0],
    };
  }),
  curious: baue('curious', 1.4, 4, (i) => {
    const s = i % 2 === 0 ? -1 : 1;
    const seit = (i === 2 ? 0.16 : 0.52) * (i === 3 ? 1 : s);
    const hoch = 0.4 + (i % 3) * 0.1;
    return {
      gx: [0, seit, seit * 0.72, 0.04 * s],
      gy: [0, hoch, hoch * 0.82, 0.08],
      tilt: [0, -s * (5 + i), -s * 3.5, 0],
      roll: [0, s * 2.4, s * 1.2, 0],
      sy: [1, 1.06, 1.04, 1],
      scale: [1, 1.03, 1.02, 1],
    };
  }),
  shy: baue('shy', 1.28, 4, (i) => {
    const s = i % 2 === 0 ? -1 : 1;
    return {
      gx: [0, s * (0.28 + i * 0.04), s * 0.36, s * 0.1],
      gy: [0, -0.26, -0.34, -0.08],
      sy: [1, 0.9, 0.84, 0.96],
      happy: [0, 0.12, 0.32, 0.08],
      tilt: [0, s * (4 + i), s * 5, 0],
      scale: [1, 0.97, 0.95, 1],
    };
  }),
  pleased: baue('happy', 1.15, 4, (i) => {
    const s = seite(i);
    return {
      happy: [0, 0.4, 0.58 + i * 0.03, 0.16],
      sx: [1, 1.06, 1.1, 1],
      sy: [1, 0.94, 0.9, 1],
      dy: [0, 0.015, 0.028, 0],
      gx: [0, s * 0.1, 0, 0],
    };
  }),
  thinking: baue('think', 1.55, 3, (i) => {
    const s = i === 1 ? 1 : -1;
    const seit = i === 2 ? 0.12 : 0.48;
    return {
      gx: [0, s * seit, s * seit * 0.85, s * 0.16],
      gy: [0, 0.5, 0.62, 0.28],
      scale: [1, 0.95, 0.94, 0.98],
      lidT: [0, 0.05, 0.1, 0.04],
      tilt: [0, -s * 4, -s * 5, -s],
    };
  }),
  confused: baue('curious', 1.35, 3, (i) => {
    const s = i === 1 ? -1 : 1;
    return {
      roll: [0, s * 7, -s * 5, s * 2, 0],
      lidA: [0, 12 + i, 8, 0],
      gy: [0, -0.1, 0.16, 0],
      gx: [0, s * 0.22, -s * 0.14, 0],
      scale: [1, 0.93, 0.97, 1],
      sy: [1, 0.96, 1.02, 1],
    };
  }),
  nod: baue('yes', 1.05, 3, (i) => {
    const hop = 0.045 + i * 0.012;
    const zweiter = i === 0 ? 0 : -hop * 0.7;
    return {
      dy: [0, -hop, 0.012, zweiter, 0],
      scale: [1, 0.98, 1.02, 1, 1],
      happy: [0, 0.05, i === 2 ? 0.28 : 0.08, 0],
    };
  }),
  sad: baue('sad', 1.55, 3, (i) => {
    const s = i === 2 ? -0.16 : i === 1 ? 0.14 : 0;
    return {
      gy: [0, -0.28, -0.4, -0.22],
      gx: [0, s, s * 1.2, s * 0.4],
      lidT: [0, 0.16, 0.28, 0.14],
      sy: [1, 0.86, 0.76, 0.9],
      bright: [1, 0.78, 0.66, 0.82],
      scale: [1, 0.98, 0.96, 0.98],
    };
  }),
  happy: baue('happy', 1.2, 4, (i) => {
    const hop = 0.05 + i * 0.012;
    const s = seite(i);
    return {
      dy: [0, hop, 0, i === 0 ? 0 : hop * 0.65, 0],
      happy: [0, 0.7, 0.85, 0.45, 0.05],
      sx: [1, 1.14, 1.18, 1.08, 1],
      sy: [1, 0.82, 0.78, 0.9, 1],
      gx: [0, s * 0.08, 0, 0],
    };
  }),
  relieved: baue('relieved', 1.35, 3, (i) => ({
    lidT: [0.2, 0.08, 0.02, 0],
    happy: [0, 0.18 + i * 0.06, 0.46, 0.12],
    dy: [0, -0.02, 0.03, 0],
    scale: [0.96, 1.04, 1.02, 1],
    sy: [0.88, 1.04, 1, 1],
    gx: [0, (i - 1) * 0.12, 0, 0],
  })),
  sleepy: baue('sleepy', 1.9, 3, (i) => ({
    lidT: [0, 0.1, 0.24 + i * 0.04, 0.38],
    gy: [0, -0.08, -0.26, -0.34],
    sy: [1, 0.9, 0.74, 0.62],
    bright: [1, 0.82, 0.64, 0.5],
    scale: [1, 0.99, 0.96, 0.94],
    gx: [0, (i - 1) * 0.06, 0, 0],
  })),
  startled: baue('startle', 0.72, 4, (i) => {
    const s = seite(i);
    return {
      scale: [1, 1.2, 1.06, 1],
      sy: [1, 1.22, 1.08, 1],
      sx: [1, 0.88, 0.96, 1],
      sep: [1, 1.09, 1.03, 1],
      dy: [0, 0.045, 0, 0],
      gx: [0, s * 0.16, s * 0.04, 0],
      gy: [0, i === 2 ? 0.28 : 0.12, 0.04, 0],
    };
  }),
  grumpy: baue('no', 1.12, 3, (i) => {
    const s = i === 1 ? -1 : 1;
    return {
      lidT: [0, 0.18, 0.32, 0.14],
      lidA: [0, -12, -18 - i, -6],
      sy: [1, 0.84, 0.74, 0.9],
      sx: [1, 1.05, 1.1, 1.02],
      gx: [0, s * 0.26, -s * 0.16, 0],
      scale: [1, 0.98, 0.97, 1],
    };
  }),
  content: baue('content', 1.45, 3, (i) => ({
    happy: [0, 0.28, 0.48 + i * 0.04, 0.32],
    lidT: [0, 0.04, 0.1, 0.05],
    scale: [1, 1.02, 1.04, 1.02],
    dy: [0, 0.008, 0.016, 0.008],
    sy: [1, 0.97, 0.94, 0.98],
    gx: [0, (i - 1) * 0.08, 0, 0],
  })),
};

export function poseBei(rend, t) {
  const p = {};
  if (!rend) return p;
  for (let i = 0; i < FELDER.length; i++) {
    const key = FELDER[i];
    const keys = rend[key];
    if (keys && keys.length) p[key] = kf(keys, t);
  }
  return p;
}

export function staerke(t, dur) {
  const zeit = Number(t) || 0;
  const laenge = dur > 0.2 ? dur : 0.2;
  const ein = 0.09;
  const aus = 0.26;
  if (zeit <= 0 || zeit >= laenge) return 0;
  if (zeit < ein) return zeit / ein;
  if (zeit > laenge - aus) return (laenge - zeit) / aus;
  return 1;
}

export function mische(basis, extra, menge, mitBlick) {
  const out = {};
  const src = basis || {};
  for (const key in src) {
    if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
  }
  const s = Math.max(0, Math.min(1, Number(menge) || 0));
  if (!extra || s <= 0) return out;
  for (let i = 0; i < FELDER.length; i++) {
    const key = FELDER[i];
    if (extra[key] == null) continue;
    if (!mitBlick && (key === 'gx' || key === 'gy')) continue;
    const b = src[key] == null ? (EINS[key] || 0) : src[key];
    out[key] = b + (extra[key] - b) * s;
  }
  return out;
}

export const TOUCH_POOL = ['curious', 'shy', 'pleased', 'surprised'];
export const HINWEIS_POOL = ['nod', 'curious'];
export const ACK_POOL = ['pleased', 'nod'];
export const FEHLER_POOL = ['confused', 'sad'];

export function createStupser(rnd, fensterMs) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const fenster = fensterMs > 0 ? fensterMs : 2600;
  let zeiten = [];
  let letzte = null;
  return {
    tipp(now) {
      const t = Number(now) || 0;
      const offen = [];
      for (let i = 0; i < zeiten.length; i++) if (t - zeiten[i] < fenster) offen.push(zeiten[i]);
      offen.push(t);
      zeiten = offen;
      if (zeiten.length >= 3) {
        zeiten = [];
        letzte = null;
        return 'grumpy';
      }
      const index = waehleIndex(TOUCH_POOL.length, letzte, zufall);
      letzte = index;
      return TOUCH_POOL[index];
    },
  };
}

export function createReaktionLauf(rnd) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const letzte = {};
  const pools = {};
  let zuletzt = -10;
  return {
    aus(pool) {
      if (!pool || !pool.length) return '';
      const key = pool.join('|');
      const index = waehleIndex(pool.length, pools[key] == null ? null : pools[key], zufall);
      pools[key] = index;
      return pool[index];
    },
    start(id, now, opt) {
      const liste = REAKTIONEN[id];
      if (!liste) return null;
      const o = opt || {};
      const t = Number(now) || 0;
      const pause = id === 'grumpy' ? 0.32 : 0.48;
      if (!o.erzwingen && t - zuletzt < pause) return null;
      const index = waehleIndex(liste.length, letzte[id] == null ? null : letzte[id], zufall);
      letzte[id] = index;
      zuletzt = t;
      return liste[index];
    },
  };
}
