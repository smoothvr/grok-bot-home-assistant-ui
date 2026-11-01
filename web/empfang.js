// SPDX-License-Identifier: MIT
// First open without Home Assistant: asleep. The first tap plays every reaction once, then loops.
import { istDemoHost } from './konfig.js';
import { REAKTION_IDS, REAKTIONEN } from './reaktionen.js';
import { waehleIndex } from './wahl.js';

export const SHOW_PAUSE = 1.0;
export const LOOP_PAUSE = 1.55;

const FENSTER_MS = 2200;

function paramsVon(params) {
  return params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
}

export function ohneHaus(konfig, ort) {
  const host = ort && (ort.hostname || ort.host) || '';
  if (istDemoHost(host)) return true;
  const url = konfig && String(konfig.haUrl || '').trim();
  const token = konfig && String(konfig.haToken || '').trim();
  return !url && !token;
}

// Sleeping start for the public demo and for a fresh page with no Home Assistant address or token.
// An explicit visit (demo tour, a state, a sequence, the showcase link) skips it.
export function sollWillkommen(konfig, ort, params) {
  const p = paramsVon(params);
  if (p.get('demo') === '1' || p.get('tour') || p.get('ablauf')) return false;
  if (p.get('lauf') === '1') return false;
  if (p.get('state') || p.get('zustand') || p.get('reaction') || p.get('reaktion')) return false;
  if (p.get('sequence') || p.get('sequenz')) return false;
  if (p.get('ha') === 'mock') return false;
  if (p.get('welcome') === '0') return false;
  if (p.get('klingel') === '1') return false;
  return ohneHaus(konfig, ort);
}

// One variant of every reaction, in the fixed order, for the first pass.
export function ersteRunde(rnd) {
  const out = [];
  for (let i = 0; i < REAKTION_IDS.length; i++) {
    const id = REAKTION_IDS[i];
    const n = REAKTIONEN[id].length;
    out.push({ id, index: waehleIndex(n, null, rnd) });
  }
  return out;
}

// Endless loop. The same reaction never follows itself. A rendition never repeats immediately.
export function createSchleife(rnd) {
  let letzte = null;
  const varianten = {};
  return {
    naechste() {
      const vorher = letzte == null ? null : REAKTION_IDS.indexOf(letzte);
      const idI = waehleIndex(REAKTION_IDS.length, vorher, rnd);
      const id = REAKTION_IDS[idI];
      const n = REAKTIONEN[id].length;
      const index = waehleIndex(n, varianten[id] == null ? null : varianten[id], rnd);
      varianten[id] = index;
      letzte = id;
      return { id, index };
    },
  };
}

export function schrittPause(loop) {
  return loop ? LOOP_PAUSE : SHOW_PAUSE;
}

// Five quick taps open settings. The list is the taps still inside the window, including this one.
export function tippFenster(zeiten, now, fenster) {
  const grenze = fenster > 0 ? fenster : FENSTER_MS;
  const t = Number(now) || 0;
  const offen = [];
  const liste = zeiten || [];
  for (let i = 0; i < liste.length; i++) if (t - liste[i] < grenze) offen.push(liste[i]);
  offen.push(t);
  return { zeiten: offen.length >= 5 ? [] : offen, settings: offen.length >= 5 };
}
