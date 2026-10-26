// SPDX-License-Identifier: MIT
// Demo tour. Emotions only, music last, then it starts again.
// The page drives this from the frame loop so it keeps moving in fullscreen and under an overlay.

export const DEMO_REIHE = [
  'hallo',
  'zuhoeren',
  'nachdenken',
  'verstanden',
  'erledigt',
  'lachen',
  'nicht_verstanden',
  'angry',
  'schlafen',
  'blicke',
  'fehler',
  'musik_an',
];

export const DEMO_SCHRITT_MS = 4000;
export const DEMO_MUSIK_MS = 30000;

export function demoSchritt(index) {
  const n = DEMO_REIHE.length;
  const i = ((index % n) + n) % n;
  const kurz = DEMO_REIHE[i];
  const musik = kurz === 'musik_an';
  return {
    index: i,
    kurz,
    ms: musik ? DEMO_MUSIK_MS : DEMO_SCHRITT_MS,
    musik,
    naechster: (i + 1) % n,
  };
}
