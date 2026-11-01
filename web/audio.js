// SPDX-License-Identifier: MIT
// Short tones. iOS unlocks audio only after the first touch.
export function createAudio(clips, extra = []) {
  let ac = null;
  const buf = {};
  const roh = {};
  let tonAn = true;
  let lauf = null;
  let master = null;
  let laut = 1.6;

  function bus() {
    if (master || !ac) return master;
    master = ac.createGain();
    master.gain.value = laut;
    let ziel = ac.destination;
    if (typeof ac.createDynamicsCompressor === 'function') {
      try {
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 12;
        comp.ratio.value = 4;
        comp.attack.value = 0.003;
        comp.release.value = 0.18;
        comp.connect(ac.destination);
        ziel = comp;
      } catch (err) { /* the master still reaches the speakers */ }
    }
    master.connect(ziel);
    return master;
  }

  function prefetch() {
    const namen = new Set(extra.filter(Boolean));
    for (const c of clips) if (c.sound) namen.add(c.sound);
    for (const name of namen) {
      if (roh[name]) continue;
      roh[name] = fetch(`sounds/${name}.wav`).then((r) => {
        if (!r.ok) throw new Error(name);
        return r.arrayBuffer();
      }).catch(() => null);
    }
  }

  async function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (navigator.audioSession) {
      try { navigator.audioSession.type = 'playback'; } catch { /* older iOS */ }
    }
    if (!ac) ac = new AC();
    if (ac.state === 'suspended' && typeof ac.resume === 'function') await ac.resume();
    const still = ac.createBuffer(1, 1, 22050);
    const s = ac.createBufferSource();
    s.buffer = still;
    s.connect(ac.destination);
    try { s.start(0); } catch { /* already started */ }
    if (!lauf) lauf = dekodiere();
    await lauf;
    bus();
    return ac.state === 'running';
  }

  function decode(context, data) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const ok = (audio) => { if (!settled) { settled = true; resolve(audio); } };
      const bad = (err) => { if (!settled) { settled = true; reject(err); } };
      const pending = context.decodeAudioData(data, ok, bad);
      if (pending && typeof pending.then === 'function') pending.then(ok, bad);
    });
  }

  async function dekodiere() {
    await Promise.all(Object.keys(roh).map(async (name) => {
      if (buf[name]) return;
      const data = await roh[name];
      if (!data || !ac) return;
      try { buf[name] = await decode(ac, data.slice(0)); } catch { /* skip this file */ }
    }));
  }

  function ton(clip) {
    if (!tonAn || !ac || ac.state !== 'running' || !clip?.sound || !buf[clip.sound]) return;
    const s = ac.createBufferSource();
    s.buffer = buf[clip.sound];
    const gain = typeof clip.gain === 'number' ? Math.max(0, Math.min(1, clip.gain)) : 1;
    const ziel = bus() || ac.destination;
    if (gain < 0.99 && ac.createGain) {
      const g = ac.createGain();
      g.gain.value = gain;
      s.connect(g);
      g.connect(ziel);
    } else s.connect(ziel);
    s.start(ac.currentTime + (clip.s_off > 0 ? clip.s_off : 0));
  }

  function status() {
    return { freigegeben: !!ac && ac.state === 'running', geladen: Object.keys(buf).length };
  }

  prefetch();
  function setLaut(wert) {
    const n = Number(wert);
    laut = Number.isFinite(n) ? Math.max(0, Math.min(2, n)) : 1.6;
    if (master) master.gain.value = laut;
  }

  return {
    unlock,
    ton,
    context() { return ac; },
    ausgang() { return bus(); },
    setLaut,
    setTon(an) { tonAn = !!an; },
    status,
  };
}
