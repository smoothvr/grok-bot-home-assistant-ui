// SPDX-License-Identifier: MIT
// Doorbell view. A ring shrinks the eyes into the corner and shows the courtyard camera.
// The decisions stay free of the page so tests can run them. Safari 10 draws the result.

export const KLINGEL_ENTITY = 'binary_sensor.klingel_haustuer';
export const KLINGEL_KAMERA = 'camera.hofkamera';
export const KLINGEL_HOLD_S = 90;
export const DEMO_KLINGEL_S = 8;
export const STREAM_WARTE_MS = 4000;
export const SNAPSHOT_MS = 1000;
// Porch gold. Red stays the alarm.
export const KLINGEL_FARBE = [255, 196, 72];
export const TESTBILD = 'assets/klingel-test.png';

export function klingelAn(state) {
  const s = String(state == null ? '' : state).trim().toLowerCase();
  return s === 'on' || s === 'open' || s === 'true';
}

// The first sample is whatever the socket already has. Only a later off-to-on is a ring.
// unknown and unavailable are not a press and do not count as off.
export function klingelKante(gesehen, state) {
  const g = gesehen && typeof gesehen === 'object' ? gesehen : {};
  const roh = String(state == null ? '' : state).trim().toLowerCase();
  if (!g.bereit) {
    g.bereit = true;
    g.an = klingelAn(roh);
    return false;
  }
  if (!roh || roh === 'unknown' || roh === 'unavailable') return false;
  const an = klingelAn(roh);
  const kante = an && !g.an;
  g.an = an;
  return kante;
}

// A new ring pushes the end out. An earlier end is kept when the new one would be sooner.
export function halteBis(jetzt, bisher, sekunden) {
  const sek = Number(sekunden);
  const dauer = (sek >= 5 ? sek : KLINGEL_HOLD_S) * 1000;
  const neu = (Number(jetzt) || 0) + dauer;
  const alt = Number(bisher) || 0;
  return neu > alt ? neu : alt;
}

export function demoKlingelFaellig(zaehler) {
  const n = Number(zaehler) || 0;
  return n > 0 && n % 10 === 0;
}

export function haBasis(url) {
  let x = String(url || '').trim();
  if (!x) return '';
  if (x.indexOf('ws://') === 0) x = 'http://' + x.slice(5);
  else if (x.indexOf('wss://') === 0) x = 'https://' + x.slice(6);
  const api = x.indexOf('/api/');
  if (api > 0) x = x.slice(0, api);
  return x.replace(/\/+$/, '');
}

export function zugangToken(attr) {
  if (!attr || typeof attr !== 'object') return '';
  return String(attr.access_token || '').trim();
}

// The picture uses the camera's own access_token, not the long-lived Home Assistant token.
export function kameraSrc(basis, entity, token, art) {
  const id = String(entity || '').trim().toLowerCase();
  const tok = String(token || '').trim();
  const wurzel = String(basis || '').replace(/\/+$/, '');
  if (!id || !tok || !wurzel) return '';
  const weg = art === 'snapshot' ? 'camera_proxy' : 'camera_proxy_stream';
  return wurzel + '/api/' + weg + '/' + id + '?token=' + encodeURIComponent(tok);
}

function kopie(stand, extra) {
  const s = stand || {};
  return {
    art: extra && extra.art != null ? extra.art : (s.art || 'aus'),
    seit: extra && extra.seit != null ? extra.seit : (s.seit || 0),
    bildDa: extra && extra.bildDa != null ? extra.bildDa : !!s.bildDa,
    gescheitert: extra && extra.gescheitert != null ? extra.gescheitert : !!s.gescheitert,
    token: extra && extra.token != null ? extra.token : (s.token || ''),
    zeigen: !!(extra && extra.zeigen),
    src: extra && extra.src != null ? extra.src : '',
    neu: !!(extra && extra.neu),
  };
}

// Stream first. No first frame, or an error, falls back to a snapshot once a second.
// A failed snapshot hides the picture. There is no empty frame.
export function bildSchritt(stand, ereignis, jetzt) {
  const s = stand || {};
  const t = Number(jetzt) || 0;
  const art = s.art || 'aus';
  if (ereignis === 'start') {
    if (!s.token) return kopie(s, { art: 'keins', seit: t, bildDa: false, gescheitert: false, zeigen: false, src: '' });
    return kopie(s, { art: 'stream', seit: t, bildDa: false, gescheitert: false, token: s.token, zeigen: true, src: 'stream' });
  }
  if (ereignis === 'load' && (art === 'stream' || art === 'snapshot' || art === 'test')) {
    return kopie(s, { bildDa: true, gescheitert: false, zeigen: true, src: art });
  }
  if (ereignis === 'error' && art === 'stream') {
    return kopie(s, { art: 'snapshot', seit: t, bildDa: false, gescheitert: false, zeigen: true, src: 'snapshot' });
  }
  if (ereignis === 'error' && (art === 'snapshot' || art === 'test')) {
    return kopie(s, { art: 'keins', seit: t, bildDa: false, gescheitert: true, zeigen: false, src: '' });
  }
  if (ereignis === 'tick' && art === 'stream' && !s.bildDa && t - (s.seit || 0) >= STREAM_WARTE_MS) {
    return kopie(s, { art: 'snapshot', seit: t, bildDa: false, gescheitert: false, zeigen: true, src: 'snapshot' });
  }
  if (ereignis === 'tick' && art === 'snapshot' && t - (s.seit || 0) >= SNAPSHOT_MS) {
    return kopie(s, { seit: t, zeigen: true, src: 'snapshot', neu: true });
  }
  const leben = art === 'stream' || art === 'snapshot' || art === 'test';
  return kopie(s, { zeigen: leben, src: leben ? art : '' });
}

export function layoutSchritt(ist, ziel, dt) {
  const von = Number(ist) || 0;
  const nach = Math.max(0, Math.min(1, Number(ziel) || 0));
  const d = Number(dt);
  const a = 1 - Math.exp(-(d > 0 ? d : 0) / 0.72);
  let n = von + (nach - von) * a;
  if (Math.abs(n - nach) < 0.004) n = nach;
  if (n < 0) n = 0;
  if (n > 1) n = 1;
  return n;
}

function easeKl(u) {
  const t = Math.max(0, Math.min(1, Number(u) || 0));
  return t * t * (3 - 2 * t);
}

// Null keeps the eyes full size. A rising value eases them into the bottom-right corner.
export function augenPlatz(w, h, u) {
  const t = easeKl(u);
  if (!(t > 0.001)) return null;
  const W = w > 1 ? w : 1;
  const H = h > 1 ? h : 1;
  const sizeFull = H;
  const sizeKlein = Math.max(88, Math.min(W, H) * 0.26);
  const size = sizeFull + (sizeKlein - sizeFull) * t;
  const randX = Math.max(16, W * 0.04);
  const randY = Math.max(16, H * 0.05);
  const cx = (W / 2) + ((W - randX - sizeKlein / 2) - W / 2) * t;
  const cy = (H / 2) + ((H - randY - sizeKlein / 2) - H / 2) * t;
  return { x: cx - size / 2, y: cy - size / 2, size: size };
}

// The picture sits large in the upper left. Opacity follows the same ease as the eyes.
export function bildPlatz(w, h, u) {
  const t = easeKl(u);
  const W = w > 1 ? w : 1;
  const H = h > 1 ? h : 1;
  const rand = Math.max(12, Math.min(W, H) * 0.035);
  const breite = Math.min(W * 0.72, W - rand * 2);
  const hoehe = Math.min(H * 0.62, H - rand * 2);
  return { x: rand, y: rand, w: breite, h: hoehe, opacity: t };
}

// A tap on the picture stays. A tap on the small eyes, or anywhere else, closes.
export function tippSchliesst(x, y, platz, bildSichtbar) {
  if (!bildSichtbar || !platz) return true;
  const px = Number(x) || 0;
  const py = Number(y) || 0;
  const innen = px >= platz.x && px <= platz.x + platz.w && py >= platz.y && py <= platz.y + platz.h;
  return !innen;
}
