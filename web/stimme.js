// SPDX-License-Identifier: MIT
// Procedural droid chatter. Short beeps, no samples.
// Safari 10: the page unlocks webkitAudioContext; this only schedules oscillators.

import { waehleIndex } from './wahl.js';

export const PHRASEN = ['happy', 'curious', 'sad', 'think', 'startle', 'sleepy', 'yes', 'no', 'shy', 'content', 'relieved'];

// count is the syllable range. base is Hz. step walks the phrase. glide is the last pitch move.
const MUSTER = {
  happy: { count: [3, 4], base: 520, step: 68, dur: 0.08, gap: 0.045, glide: 46, form: 'up' },
  curious: { count: [2, 3], base: 400, step: 96, dur: 0.11, gap: 0.06, glide: 140, form: 'up' },
  sad: { count: [2, 3], base: 330, step: -58, dur: 0.15, gap: 0.07, glide: -70, form: 'down' },
  think: { count: [3, 4], base: 370, step: 22, dur: 0.09, gap: 0.075, glide: 0, form: 'wobble' },
  startle: { count: [1, 2], base: 620, step: 70, dur: 0.06, gap: 0.03, glide: 160, form: 'up' },
  sleepy: { count: [1, 2], base: 250, step: -28, dur: 0.26, gap: 0.08, glide: -36, form: 'down' },
  yes: { count: [2, 2], base: 470, step: 100, dur: 0.075, gap: 0.04, glide: 36, form: 'up' },
  no: { count: [2, 3], base: 390, step: -84, dur: 0.085, gap: 0.05, glide: -48, form: 'down' },
  shy: { count: [2, 3], base: 360, step: 18, dur: 0.11, gap: 0.065, glide: -24, form: 'down' },
  content: { count: [2, 2], base: 340, step: 12, dur: 0.15, gap: 0.08, glide: -16, form: 'down' },
  relieved: { count: [2, 3], base: 430, step: 36, dur: 0.11, gap: 0.055, glide: 28, form: 'up' },
};

const VARIANTEN = 3;
const MAX_DUR = 1.45;
const ZIEL_GAIN = 0.55;

function zahl(rnd) {
  const n = Number(typeof rnd === 'function' ? rnd() : Math.random());
  return Number.isFinite(n) ? n : 0;
}

function silben(muster, index, rnd) {
  const lo = muster.count[0];
  const hi = muster.count[1];
  let n = lo + Math.floor(zahl(rnd) * (hi - lo + 1));
  if (index === 1 && n > lo) n -= 1;
  if (index === 2 && n < hi) n += 1;
  if (n < 1) n = 1;
  if (n > 5) n = 5;
  return n;
}

export function musterVon(id) {
  return MUSTER[id] || MUSTER.yes;
}

export function bauePhrase(id, rnd, letzte) {
  const zufall = typeof rnd === 'function' ? rnd : Math.random;
  const key = MUSTER[id] ? id : 'yes';
  const muster = MUSTER[key];
  const index = waehleIndex(VARIANTEN, letzte == null ? null : letzte, zufall);
  const pitch = (0.94 + index * 0.045) * (0.96 + zahl(zufall) * 0.08);
  const tempo = (index === 1 ? 1.12 : index === 2 ? 0.9 : 1) * (0.94 + zahl(zufall) * 0.12);
  const n = silben(muster, index, zufall);
  const notes = [];
  let t = 0.02;
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 1 : i / (n - 1);
    let freq = muster.base * pitch + muster.step * i;
    if (muster.form === 'wobble') freq += Math.sin(i * 1.7 + index) * 28;
    freq = Math.max(180, Math.min(980, freq));
    const dur = (muster.dur / tempo) * (i === n - 1 ? 1.12 : 0.94);
    const glide = Math.max(160, Math.min(1100, freq + muster.glide * (0.55 + 0.45 * u)));
    notes.push({
      at: t,
      dur,
      freq,
      glide,
      warble: (zahl(zufall) - 0.5) * 0.045,
      gain: muster.form === 'startle' || key === 'startle' ? 0.5 : 0.42 + 0.12 * (1 - u * 0.35),
    });
    t += dur + muster.gap / tempo;
  }
  let ende = notes[notes.length - 1].at + notes[notes.length - 1].dur;
  if (ende > MAX_DUR) {
    const k = MAX_DUR / ende;
    for (let i = 0; i < notes.length; i++) {
      notes[i].at *= k;
      notes[i].dur *= k;
    }
    ende = MAX_DUR;
  }
  let spitze = 0;
  for (let i = 0; i < notes.length; i++) if (notes[i].gain > spitze) spitze = notes[i].gain;
  if (spitze > 0) {
    const skala = ZIEL_GAIN / spitze;
    for (let i = 0; i < notes.length; i++) notes[i].gain = Math.min(0.7, notes[i].gain * skala);
  }
  return { id: key, index, notes, dur: ende };
}

export function pulsHuelle(now, pulse) {
  let a = 0;
  if (!pulse || !pulse.length) return 0;
  for (let i = 0; i < pulse.length; i++) {
    const p = pulse[i];
    const ms = p.ms > 1 ? p.ms : 1;
    const u = (now - p.at) / ms;
    if (u >= 0 && u < 1) {
      const bell = Math.sin(Math.PI * u) * (p.amp > 0 ? p.amp : 0);
      if (bell > a) a = bell;
    }
  }
  return a > 1 ? 1 : a;
}

// Red only while the alarm is on. Any other red input falls back to the idle amber.
export function scheinFarbe(alarm, rgb) {
  if (alarm) return 'rgba(255, 18, 8, 0.88)';
  const c = rgb && rgb.length >= 3 ? rgb : [255, 106, 0];
  const r = c[0] | 0;
  const g = c[1] | 0;
  const b = c[2] | 0;
  if (r > 200 && g < 60 && b < 60) return 'rgba(255, 106, 0, 0.8)';
  return 'rgba(' + r + ', ' + g + ', ' + b + ', 0.8)';
}

export function createStimme(opt) {
  const o = opt || {};
  const rnd = typeof o.rnd === 'function' ? o.rnd : Math.random;
  const cooldown = o.cooldownMs == null ? 1200 : Number(o.cooldownMs);
  const letzte = {};
  let frei = 0;
  let ziel = null;

  function ausgang(ctx) {
    if (typeof o.getDest === 'function') {
      const ext = o.getDest();
      if (ext) return ext;
    }
    if (ziel && ziel.ctx === ctx) return ziel.node;
    const node = ctx.createGain();
    node.gain.value = 1;
    node.connect(ctx.destination);
    ziel = { ctx, node };
    return node;
  }

  function note(ctx, dest, t0, n, laut) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    const f0 = n.freq;
    osc.frequency.setValueAtTime(f0, t0);
    if (n.warble) osc.frequency.linearRampToValueAtTime(f0 * (1 + n.warble), t0 + n.dur * 0.42);
    osc.frequency.linearRampToValueAtTime(n.glide || f0, t0 + n.dur);
    const peak = Math.max(0.0002, n.gain * laut);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.028, n.dur * 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
    osc.connect(g);
    g.connect(dest);
    try {
      osc.start(t0);
      osc.stop(t0 + n.dur + 0.04);
    } catch (err) { /* already running or a locked context */ }
  }

  return {
    plan(id, now) {
      const t = Number(now) || 0;
      if (t < frei) return null;
      const phrase = bauePhrase(id, rnd, letzte[id] == null ? null : letzte[id]);
      letzte[id] = phrase.index;
      frei = t + (cooldown > 0 ? cooldown : 0);
      return phrase;
    },
    spiel(ctx, phrase, volume, nowMs) {
      if (!phrase || !phrase.notes) return [];
      const start = Number(nowMs) || 0;
      const pulses = [];
      for (let i = 0; i < phrase.notes.length; i++) {
        const n = phrase.notes[i];
        pulses.push({
          at: start + n.at * 1000,
          ms: Math.max(80, n.dur * 1000),
          amp: 0.45 + Math.min(0.4, n.gain),
        });
      }
      const laut = Math.max(0, Math.min(1, Number(volume) || 0));
      if (!ctx || ctx.state !== 'running' || !(laut > 0)) return pulses;
      const dest = ausgang(ctx);
      const t0 = ctx.currentTime || 0;
      for (let i = 0; i < phrase.notes.length; i++) {
        const n = phrase.notes[i];
        note(ctx, dest, t0 + n.at, n, laut);
      }
      return pulses;
    },
  };
}
