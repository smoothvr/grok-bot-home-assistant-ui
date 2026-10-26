// SPDX-License-Identifier: MIT
// Actions a swipe, a long press, or a corner can run.

export const AKTIONEN = ['none', 'music_toggle', 'light_toggle', 'settings', 'sheet', 'clock', 'caption', 'demo', 'view', 'dashboard', 'service'];
export const GESTEN_KEYS = ['left', 'right', 'up', 'down', 'long'];
export const ECK_KEYS = ['tl', 'tr', 'bl', 'br'];

// Left opens the quick sheet. Right enters Home mode. Up toggles the status line.
// Down opens settings. A long press starts the demo. The bottom-edge swipe still opens settings.
export const GESTEN_VORGABE = {
  left: { art: 'sheet', ziel: '' },
  right: { art: 'dashboard', ziel: '' },
  up: { art: 'caption', ziel: '' },
  down: { art: 'settings', ziel: '' },
  long: { art: 'demo', ziel: '' },
};

export const ECKEN_VORGABE = {
  tl: { tap: { art: 'service', ziel: 'light.toggle/light.living_room' }, hold: { art: 'clock', ziel: '' } },
  tr: { tap: { art: 'music_toggle', ziel: '' }, hold: { art: 'view', ziel: '' } },
  bl: { tap: { art: 'view', ziel: '' }, hold: { art: 'none', ziel: '' } },
  br: { tap: { art: 'view', ziel: '' }, hold: { art: 'none', ziel: '' } },
};

// Public demo: every corner does something a visitor can find.
export const ECKEN_DEMO = {
  tl: { tap: { art: 'settings', ziel: '' }, hold: { art: 'none', ziel: '' } },
  tr: { tap: { art: 'view', ziel: '' }, hold: { art: 'light_toggle', ziel: '' } },
  bl: { tap: { art: 'music_toggle', ziel: '' }, hold: { art: 'none', ziel: '' } },
  br: { tap: { art: 'dashboard', ziel: '' }, hold: { art: 'none', ziel: '' } },
};

export function istStandardEcken(ecken) {
  if (!ecken) return true;
  for (const key of ECK_KEYS) {
    const vor = ECKEN_VORGABE[key];
    const c = ecken[key] || {};
    if ((c.tap && c.tap.art) !== vor.tap.art) return false;
    if ((c.hold && c.hold.art) !== vor.hold.art) return false;
  }
  return true;
}

export function istAltesLayout(gesten, ecken) {
  if (!gesten) return false;
  const art = (slot, name) => slot && slot.art === name && !String(slot.ziel || '').trim();
  if (!art(gesten.left, 'music_toggle') || !art(gesten.right, 'none')) return false;
  if (!art(gesten.up, 'light_toggle') || !art(gesten.down, 'light_toggle') || !art(gesten.long, 'none')) return false;
  const corners = ecken || {};
  for (const key of ECK_KEYS) {
    const c = corners[key] || {};
    if ((c.tap && c.tap.art && c.tap.art !== 'none') || (c.hold && c.hold.art && c.hold.art !== 'none')) return false;
  }
  return true;
}

const ZIEL_ARTEN = new Set(['service']);

export function normEigene(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    if (!item || out.length >= 16) continue;
    const label = String(item.label || '').trim().slice(0, 40);
    const ziel = String(item.ziel || '').trim().slice(0, 240);
    let id = String(item.id || '').replace(/[^\w-]/g, '').slice(0, 24);
    if (!label || !ziel) continue;
    if (!id || seen.has(id)) id = `a${out.length}${seen.size}`;
    seen.add(id);
    out.push({ id, label, ziel });
  }
  return out;
}

export function normAktion(raw, fallback = { art: 'none', ziel: '' }, eigeneIds = null) {
  const art = String(raw?.art || '');
  if (art.startsWith('own:')) {
    const id = art.slice(4);
    if (!eigeneIds || eigeneIds.has(id)) return { art, ziel: '' };
    return { art: 'none', ziel: '' };
  }
  const known = AKTIONEN.includes(art) ? art : (fallback.art || 'none');
  const ziel = ZIEL_ARTEN.has(known) ? String(raw?.ziel ?? '').trim().slice(0, 240) : '';
  return { art: known, ziel };
}

function idsOf(eigene) {
  return new Set((eigene || []).map((item) => item.id));
}

export function normGesten(raw, eigene) {
  const ids = idsOf(eigene);
  const out = {};
  for (const key of GESTEN_KEYS) out[key] = normAktion(raw?.[key], GESTEN_VORGABE[key], ids);
  return out;
}

export function normEcken(raw, eigene) {
  const ids = idsOf(eigene);
  const out = {};
  for (const key of ECK_KEYS) {
    const vor = ECKEN_VORGABE[key];
    out[key] = {
      tap: normAktion(raw?.[key]?.tap, vor.tap, ids),
      hold: normAktion(raw?.[key]?.hold, vor.hold, ids),
    };
  }
  return out;
}
