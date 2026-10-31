// SPDX-License-Identifier: MIT
// Presence wake. Four short looks, and no second wake until the eyes have slept again.

export const WAKE_SOUNDS = ['15_hmmm_a', '16_hmmm_b', '17_hmmm_c', '18_hmmm_d'];

export const WAKE_VARIANTS = [
  { gx: 0.62, gy: 0.14, hold: 0.85, blink: 0.28, sound: WAKE_SOUNDS[0] },
  { gx: -0.7, gy: 0.06, hold: 1.15, blink: 0.62, sound: WAKE_SOUNDS[1] },
  { gx: 0.18, gy: -0.42, hold: 0.62, blink: 0.16, sound: WAKE_SOUNDS[2] },
  { gx: -0.24, gy: 0.46, hold: 1.35, blink: 0.92, sound: WAKE_SOUNDS[3] },
];

export function anwesend(state) {
  const s = String(state ?? '').trim().toLowerCase();
  return s === 'on' || s === 'home' || s === 'open' || s === 'detected' || s === 'occupied';
}

// `letzte` is the previous index, or null. The same index is never returned twice in a row.
export function waehleVariante(letzte, rnd) {
  const n = WAKE_VARIANTS.length;
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  let pick = Math.floor(Number(zufall()) * n);
  if (!(pick >= 0) || pick >= n) pick = 0;
  if (letzte == null || pick !== letzte) return pick;
  let hop = Math.floor(Number(zufall()) * (n - 1));
  if (!(hop >= 0) || hop >= n - 1) hop = 0;
  return (letzte + hop + 1) % n;
}

// One wake per sleep. Presence is a rising edge. A wake pulse (the select option) counts every time it is sent.
export function createWecker(rnd) {
  let letzte = null;
  let an = false;
  let bereit = true;
  return {
    eingeschlafen() { bereit = true; },
    impuls({ schlaeft, an: jetzt, puls } = {}) {
      const ein = !!jetzt;
      const kante = puls ? ein : (ein && !an);
      if (!puls) an = ein;
      if (!kante || !schlaeft || !bereit) return null;
      bereit = false;
      const index = waehleVariante(letzte, rnd);
      letzte = index;
      return { index, ...WAKE_VARIANTS[index] };
    },
  };
}
