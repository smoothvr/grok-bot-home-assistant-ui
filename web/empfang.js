// SPDX-License-Identifier: MIT
// First open without Home Assistant: asleep, with a quiet demo and a short intro.
import { istDemoHost } from './konfig.js';

export const INTRO_KEYS = ['intro.1', 'intro.2', 'intro.3', 'intro.4', 'intro.5', 'intro.6'];
export const INTRO_MS = 3400;

export const EMPFANG_REIHE = [
  'hallo',
  'curious',
  'thinking',
  'nod',
  'happy',
  'wake',
  'reminder',
  'shy',
  'sad',
  'angry',
  'relieved',
  'sleepy',
  'content',
];
export const EMPFANG_MS = 3200;

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
// An explicit visit (demo, intro, a state, a sequence) skips it.
export function sollWillkommen(konfig, ort, params) {
  const p = paramsVon(params);
  if (p.get('demo') === '1' || p.get('tour') || p.get('ablauf')) return false;
  if (p.get('intro') === '1' || p.get('lauf') === '1') return false;
  if (p.get('state') || p.get('zustand') || p.get('reaction') || p.get('reaktion')) return false;
  if (p.get('sequence') || p.get('sequenz')) return false;
  if (p.get('ha') === 'mock') return false;
  if (p.get('welcome') === '0') return false;
  return ohneHaus(konfig, ort);
}

export function empfangSchritt(index) {
  const n = EMPFANG_REIHE.length;
  const i = ((index % n) + n) % n;
  const kurz = EMPFANG_REIHE[i];
  return { index: i, kurz, ms: EMPFANG_MS, naechster: (i + 1) % n };
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

export function eckeHinweisFaellig(gesehen, tipps) {
  return !gesehen && tipps >= 2;
}
