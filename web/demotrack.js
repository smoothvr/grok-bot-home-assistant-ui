// SPDX-License-Identifier: CC0-1.0
// Original music for the music state when no Home Assistant player is set.
// Generated in the browser. No samples, no names, no voices.
// The musical work is CC0. See THIRD_PARTY_NOTICES.md.

export const DEMO_LINE = 'Orbit Drift, HVUZ Demo (2026)';
export const DEMO_BPM = 96;
export const DEMO_BARS = 32;

const BEAT = 60 / DEMO_BPM;
export const DEMO_SECONDS = DEMO_BARS * 4 * BEAT;

const PROG = [62, 58, 65, 60, 62, 55, 58, 57];

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function noise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function env(t, attack, hold, release) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  if (t < attack + hold) return 1;
  return Math.max(0, 1 - (t - attack - hold) / release);
}

// One sample of the loop. t is seconds from the start of the piece.
export function demoSample(t) {
  const barLen = 4 * BEAT;
  const bar = Math.floor(t / barLen) % 8;
  const root = PROG[bar];
  const beat = (t / BEAT) % 4;
  let s = 0;
  const kick = beat % 2;
  if (kick < 0.2) {
    const k = kick / 0.2;
    s += Math.sin(2 * Math.PI * (78 + 90 * (1 - k)) * t) * (1 - k) ** 2 * 0.42;
  }
  const hat = beat % 0.5;
  if (hat < 0.028) {
    s += (noise(Math.floor(t * 22050)) * 2 - 1) * (1 - hat / 0.028) * 0.055;
  }
  const step = Math.floor(beat * 2) % 8;
  const bassMidi = [root - 12, root - 12, root - 5, root - 12, root - 12, root, root - 5, root - 7][step];
  const bt = (beat * 2) % 1;
  s += Math.sin(2 * Math.PI * midi(bassMidi) * t) * env(bt * BEAT * 0.5, 0.008, 0.06, 0.14) * 0.24;
  for (const interval of [0, 3, 7, 10]) {
    const f = midi(root + interval);
    s += Math.sin(2 * Math.PI * f * t) * 0.03;
    s += Math.sin(2 * Math.PI * f * 1.004 * t) * 0.016;
  }
  const lead = [0, 3, 7, 12, 10, 7, 3, 0][step];
  const phrase = bar % 2 === 0 ? lead : [0, 7, 12, 15, 12, 7, 3, -2][step];
  const lt = bt;
  s += Math.sin(2 * Math.PI * midi(root + 12 + phrase) * t) * env(lt * 0.28, 0.015, 0.08, 0.16) * 0.07;
  return Math.max(-1, Math.min(1, s));
}

export function renderDemoBuffer(ac, rate = 22050) {
  const n = Math.floor(DEMO_SECONDS * rate);
  const buf = ac.createBuffer(1, n, rate);
  const data = buf.getChannelData(0);
  const edge = Math.floor(rate * 0.02);
  for (let i = 0; i < n; i++) {
    let g = 1;
    if (i < edge) g = i / edge;
    else if (i > n - edge) g = (n - i) / edge;
    data[i] = demoSample(i / rate) * g;
  }
  return buf;
}

export function createDemoMusic() {
  let ac = null;
  let gain = null;
  let src = null;
  let buf = null;
  let job = null;
  let playing = false;

  function ensure(context) {
    ac = context;
    if (!buf && !job) job = Promise.resolve(renderDemoBuffer(ac));
    return job.then((ready) => { buf = ready; return buf; });
  }

  async function start(context, dest) {
    if (!context) return false;
    await ensure(context);
    if (playing) return true;
    playing = true;
    gain = ac.createGain();
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.8, now + 1.35);
    gain.connect(dest || ac.destination);
    src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(gain);
    src.start();
    return true;
  }

  function stop() {
    if (!playing || !ac || !gain) {
      playing = false;
      return;
    }
    playing = false;
    const now = ac.currentTime;
    const oldGain = gain;
    const oldSrc = src;
    try {
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(Math.max(0.0001, oldGain.gain.value), now);
      oldGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    } catch { /* context closed */ }
    setTimeout(() => {
      try { oldSrc.stop(); } catch { /* already stopped */ }
      try { oldSrc.disconnect(); oldGain.disconnect(); } catch { /* already gone */ }
    }, 1700);
  }

  return {
    start,
    stop,
    get playing() { return playing; },
  };
}

function tonKurz(ac, freq, dauer, laut, typ) {
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = typ || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(laut, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dauer);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + dauer + 0.02);
}

// A short original chirp for a recognised tap. Not a state tone.
export function playAck(ac) {
  if (!ac) return;
  const now = ac.currentTime;
  [523, 659].forEach((freq, i) => {
    const t0 = now + i * 0.07;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 0.1);
  });
}

// Rising beeps of our own. A door greeting, not a copied melody.
export function playChirps(ac) {
  if (!ac) return;
  const now = ac.currentTime;
  [698, 880, 784, 1046, 1318].forEach((freq, i) => {
    const t0 = now + i * 0.075;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  });
}

export function playNudge(ac) {
  tonKurz(ac, 196, 0.09, 0.04, 'triangle');
}

export function playSigh(ac) {
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(494, now);
  osc.frequency.exponentialRampToValueAtTime(311, now + 0.42);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

export function playBrrr(ac) {
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(186, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.28);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.36);
}

export function playSettingsChime(ac) {
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(494, now);
  osc.frequency.exponentialRampToValueAtTime(330, now + 0.32);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.45);
}
