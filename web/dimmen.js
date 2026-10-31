// SPDX-License-Identifier: MIT
// Idle brightness, and the rising edge of a door contact.

export function helligkeit(idleSek, schlafSek, opt = {}) {
  const idle = Math.max(0, Number(idleSek) || 0);
  const nach = Math.max(0, Number(opt.dimNachSekunden ?? 60) || 0);
  let stufe = Number(opt.dimStufe);
  if (!Number.isFinite(stufe)) stufe = 0.3;
  if (stufe > 1) stufe /= 100;
  stufe = Math.max(0.05, Math.min(1, stufe));
  // schlafSek is the inactivity timeout. It does not start the dimLead ramp.
  void schlafSek;
  let level = 1;
  if (nach > 0 && idle >= nach) level = stufe;
  if (opt.planSekunden == null || opt.planSekunden === '') return level;
  const left = Math.max(0, Number(opt.planSekunden) || 0);
  const vor = Math.max(0, Number(opt.dimVorMinuten ?? 15) || 0) * 60;
  if (!(vor > 0)) return Math.min(level, left <= 0 ? stufe : 1);
  if (left >= vor) return level;
  const ramp = stufe + (1 - stufe) * (left / vor);
  return Math.min(level, ramp);
}

function offen(state) {
  const s = String(state ?? '').trim().toLowerCase();
  return s === 'on' || s === 'open';
}

// The door holds angry while the contact reads open. The first reading counts.
export function tuerOffen(state) {
  return offen(state);
}

// A greeting only when a known closed contact becomes open. The first reading does not count.
export function tuerKante(vorher, state) {
  if (vorher == null || vorher === '') return false;
  return offen(state) && !offen(vorher);
}
