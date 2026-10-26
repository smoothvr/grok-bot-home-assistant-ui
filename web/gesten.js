// SPDX-License-Identifier: MIT
// Invisible controls on the tablet. Swipes and corners are configured in settings.
// The side edges keep fixed music and light taps. Five quick taps in the top-left corner open settings.

export const ECK = 128;
export const ADMIN_TAPS = 5;
export const ADMIN_FENSTER_MS = 2000;
export const TAP_WARTE_MS = 350;
export const HALTEN_MS = 800;

export function eckName(x, y, w, h, size = ECK, inset = null) {
  if (!(w > 0) || !(h > 0)) return null;
  if (x < 0 || y < 0 || x > w || y > h) return null;
  const ins = inset || {};
  const links = x < (ins.l || 0) + size;
  const rechts = x > w - (ins.r || 0) - size;
  const oben = y < (ins.t || 0) + size;
  const unten = y > h - (ins.b || 0) - size;
  if (links && oben) return 'tl';
  if (rechts && oben) return 'tr';
  if (links && unten) return 'bl';
  if (rechts && unten) return 'br';
  return null;
}

export function imEinstellungenEck(x, y, w = Number.POSITIVE_INFINITY, h = Number.POSITIVE_INFINITY) {
  return eckName(x, y, w, h) === 'tl';
}

export function zoneFuer(x, y, w, h, size = ECK, inset = null) {
  if (eckName(x, y, w, h, size, inset) || w <= 0 || h <= 0) return null;
  if (x < w * 0.22) return y < h * 0.5 ? 'musik_an' : 'musik_aus';
  if (x > w * 0.78) return y < h * 0.5 ? 'licht_an' : 'licht_aus';
  return null;
}

// Direction only. The assigned action lives in the saved gesture map.
export function wisch(dx, dy, schwelle = 70) {
  if (Math.hypot(dx, dy) < schwelle) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy < 0 ? 'up' : 'down';
}

// How far from the bottom edge a swipe still counts as starting there.
export function randUnten(h, insetBottom = 0) {
  return Math.min(120, Math.max(72, (insetBottom || 0) + 56));
}

// Swipe up from the bottom edge opens settings. Other swipes keep their direction.
export function wischAktion(dx, dy, startY, h, insetBottom = 0) {
  const dir = wisch(dx, dy);
  if (dir === 'up' && h > 0 && startY >= h - randUnten(h, insetBottom)) return 'settings';
  return dir;
}

// A hold wins over a tap. Movement cancels both. The center long-press is "long".
export function zeigerArt({ ecke, gehalten, bewegt }) {
  if (bewegt) return null;
  if (gehalten && ecke) return 'hold';
  if (gehalten) return 'long';
  if (ecke) return 'tap';
  return null;
}

// Top-left taps. Five inside the window open settings and suppress the corner action.
// One quiet gap of `warte` runs the corner tap once, including after two, three, or four taps.
export function createAdminTaps(opt = {}) {
  const fenster = opt.fenster ?? ADMIN_FENSTER_MS;
  const warte = opt.warte ?? TAP_WARTE_MS;
  const ziel = opt.ziel ?? ADMIN_TAPS;
  const setzen = opt.setzen ?? setTimeout;
  const loeschen = opt.loeschen ?? clearTimeout;
  let taps = [];
  let timer = null;
  return {
    tipp(jetzt, onAdmin, onPrimary) {
      taps = taps.filter((t) => jetzt - t <= fenster);
      taps.push(jetzt);
      if (timer != null) loeschen(timer);
      timer = null;
      if (taps.length >= ziel) {
        taps = [];
        onAdmin();
        return 'admin';
      }
      const n = taps.length;
      timer = setzen(() => {
        timer = null;
        taps = [];
        onPrimary(n);
      }, warte);
      return 'wait';
    },
    abbruch() {
      if (timer != null) loeschen(timer);
      timer = null;
      taps = [];
    },
  };
}
