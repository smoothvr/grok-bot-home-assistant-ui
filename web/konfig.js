// SPDX-License-Identifier: MIT
// Values stay on this device (localStorage). The token is never written to a file.
import { ECKEN_VORGABE, GESTEN_VORGABE, istAltesLayout, normEcken, normEigene, normGesten } from './aktionen.js';
import { normDash } from './dashboard.js';
import { ECK } from './gesten.js';
import { dienstAus, gueltigeEntity, normalisiereHaUrl } from './ha.js';
import { KURZ } from './namen.js';
import { localeCode } from './strings.js';

// Static public demo. It must not keep a Home Assistant token.
export const DEMO_HOST = 'grok-bot-ui.herrvonundzu.eu';

export function istDemoHost(host) {
  return String(host || '').replace(/\.+$/, '').toLowerCase() === DEMO_HOST;
}

// Free-text fields lock only on the public demo host, even with ?demo=0.
// A saved demo checkbox, or https with no Home Assistant yet, stays editable.
export function demoSperre(host) {
  return istDemoHost(host);
}

// The public host, ?demo=1, or https with no Home Assistant address yet.
// ?demo=0 leaves the eyes idle so a private page can be set up.
export function demoBesuch(konfig, ort, params) {
  const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
  if (p.get('demo') === '0') return false;
  if (p.get('demo') === '1') return true;
  const host = ort && (ort.hostname || ort.host) || '';
  if (istDemoHost(host)) return true;
  const protocol = (ort && ort.protocol) || '';
  const url = konfig && String(konfig.haUrl || '').trim();
  const token = konfig && String(konfig.haToken || '').trim();
  return protocol === 'https:' && !url && !token;
}

export function vergissToken(storage) {
  const s = speicher(storage);
  if (!s) return;
  try { s.removeItem(ALT_TOKEN); } catch { /* private mode */ }
  const raw = lesen(s, KEY);
  if (!raw) return;
  try {
    const daten = JSON.parse(raw) || {};
    if ((daten.v === 3 || daten.v === 4) && daten.profiles) {
      let geaendert = false;
      for (const name of ['phone', 'tablet']) {
        if (daten.profiles[name] && daten.profiles[name].haToken) {
          daten.profiles[name].haToken = '';
          geaendert = true;
        }
      }
      if (geaendert) s.setItem(KEY, JSON.stringify(daten));
      return;
    }
    if (!daten.haToken) return;
    daten.haToken = '';
    s.setItem(KEY, JSON.stringify(daten));
  } catch { /* leave the saved file alone */ }
}

export const VORGABE = {
  haUrl: '',
  haToken: '',
  haEntity: 'input_select.eye_ui_state',
  mediaEntity: '',
  scriptMusikAn: 'script.eye_music_on',
  scriptMusikAus: 'script.eye_music_off',
  scriptLichtAn: 'script.eye_light_on',
  scriptLichtAus: 'script.eye_light_off',
  schlafSekunden: 15 * 60,
  dimNachSekunden: 60,
  dimStufe: 0.3,
  dimVorMinuten: 15,
  tuer: '',
  presenceEntity: '',
  reminderEntity: 'input_text.eye_hinweis',
  reminderAckScript: 'script.eye_hinweis_quittieren',
  kamera: '',
  ton: true,
  lebendigkeit: 0.7,
  lautstaerke: 0.8,
  label: false,
  caption: true,
  uhr: false,
  nowPlaying: true,
  demo: true,
  lang: '',
  modus: '',
  gesten: GESTEN_VORGABE,
  ecken: normEcken(ECKEN_VORGABE),
  gestenStand: 2,
  eckGroesse: ECK,
  lichtProfil: 'lebhaft',
  alarmStaerke: 'stark',
  dash: normDash(null),
  eigene: [],
  states: {},
  lockOn: false,
  lockSalt: '',
  lockHash: '',
};

const STATE_KEYS = Object.keys(KURZ);
const SOUND_OK = /^[0-9]{2}_[a-z0-9_]+$/;

export function normStates(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const key of STATE_KEYS) {
    const item = raw[key];
    if (!item || typeof item !== 'object') continue;
    const en = String(item.en || '').trim().slice(0, 80);
    const de = String(item.de || '').trim().slice(0, 80);
    const color = /^#[0-9a-f]{6}$/i.test(item.color || '') ? String(item.color).toLowerCase() : '';
    const sound = SOUND_OK.test(item.sound || '') ? item.sound : '';
    if (en || de || color || sound) out[key] = { en, de, color, sound };
  }
  return out;
}

const KEY = 'eye_ui_config';
const ALT_CONFIG = 'gk_konfig';
const ALT_TOKEN = 'gk_ha_token';

// A touch screen whose shorter side is under 600 CSS pixels is a phone. Everything else is a tablet.
export function geraeteKlasse(info = {}) {
  const w = Number(info.width) || 0;
  const h = Number(info.height) || 0;
  if (!info.touch) return 'tablet';
  return Math.min(w, h) >= 600 ? 'tablet' : 'phone';
}

let klasse = 'tablet';
export function setzeKlasse(name) { klasse = name === 'phone' ? 'phone' : 'tablet'; }
export function aktiveKlasse() { return klasse; }
const MODI = new Set(['2d', 'vollbild', 'led']);
const MODUS_ALIAS = {
  cute: '2d', cube: '2d', fortune: 'led', bold: 'vollbild', '2d': '2d', vollbild: 'vollbild', led: 'led',
};

export function normModus(value) {
  const v = String(value || '').trim().toLowerCase();
  return MODUS_ALIAS[v] || '';
}

// Bold unless the visit or a saved profile names another theme.
export function waehleModus(urlModus, gespeichert) {
  const url = normModus(urlModus);
  if (url) return url;
  const saved = normModus(gespeichert);
  if (saved) return saved;
  return 'vollbild';
}

// A site file may set the address, and it may fill a missing token. A saved token stays.
// The public demo host ignores the address and the token from the file.
// Theme names map onto the stable keys. Other saved settings still win.
export function siteNachKonfig(datei) {
  if (!datei || typeof datei !== 'object' || Array.isArray(datei)) return {};
  const src = { ...datei };
  const dateiToken = typeof src.haToken === 'string' && src.haToken.trim()
    ? src.haToken.trim()
    : (typeof src.token === 'string' && src.token.trim() ? src.token.trim() : '');
  delete src.haToken;
  delete src.token;
  delete src.access_token;
  if (dateiToken) src.haToken = dateiToken;
  if (src.theme || src.modus) src.modus = normModus(src.theme || src.modus);
  delete src.theme;
  if (src.door && !src.tuer) src.tuer = src.door;
  if (src.doorEntity && !src.tuer) src.tuer = src.doorEntity;
  delete src.door;
  delete src.doorEntity;
  if (src.presence && !src.presenceEntity) src.presenceEntity = src.presence;
  if (src.presence_entity && !src.presenceEntity) src.presenceEntity = src.presence_entity;
  delete src.presence;
  delete src.presence_entity;
  if (src.reminder && !src.reminderEntity) src.reminderEntity = src.reminder;
  if (src.reminder_entity && !src.reminderEntity) src.reminderEntity = src.reminder_entity;
  delete src.reminder;
  delete src.reminder_entity;
  if (src.reminderAck && !src.reminderAckScript) src.reminderAckScript = src.reminderAck;
  if (src.reminder_ack && !src.reminderAckScript) src.reminderAckScript = src.reminder_ack;
  delete src.reminderAck;
  delete src.reminder_ack;
  if (src.camera && !src.kamera) src.kamera = src.camera;
  delete src.camera;
  if (src.dimAfter != null && src.dimNachSekunden == null) src.dimNachSekunden = src.dimAfter;
  delete src.dimAfter;
  if (src.dimLevel != null && src.dimStufe == null) src.dimStufe = src.dimLevel;
  delete src.dimLevel;
  if (src.dimLead != null && src.dimVorMinuten == null) src.dimVorMinuten = src.dimLead;
  delete src.dimLead;
  if (src.language && !src.lang) src.lang = src.language;
  delete src.language;
  if (src.cornerSize != null && src.eckGroesse == null) src.eckGroesse = src.cornerSize;
  delete src.cornerSize;
  if (src.dashboard && !src.dash) src.dash = src.dashboard;
  delete src.dashboard;
  if (src.licht_profil && !src.lichtProfil) src.lichtProfil = src.licht_profil;
  delete src.licht_profil;
  if (src.alarm && !src.alarmStaerke) src.alarmStaerke = src.alarm;
  delete src.alarm;
  if (src.haUrl) {
    const url = normalisiereHaUrl(src.haUrl);
    if (url) src.haUrl = url;
    else delete src.haUrl;
  }
  return src;
}

function speicher(vorgegeben) {
  if (vorgegeben) return vorgegeben;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* private mode */ }
  return null;
}

function lesen(storage, key) {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

function einheit(v, fallback) {
  let n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (n > 1) n /= 100;
  return Math.max(0, Math.min(1, n));
}

function nurBekannte(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const key of Object.keys(VORGABE)) if (key in obj) out[key] = obj[key];
  if ('schlafSekunden' in out) out.schlafSekunden = Math.max(0, Number(out.schlafSekunden) || 0);
  if ('dimNachSekunden' in out) out.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(Number(out.dimNachSekunden) || 0)));
  if ('dimStufe' in out) {
    let n = Number(out.dimStufe);
    if (n > 1) n /= 100;
    out.dimStufe = Math.max(0.05, Math.min(1, Number.isFinite(n) ? n : 0.3));
  }
  if ('dimVorMinuten' in out) out.dimVorMinuten = Math.max(0, Math.min(180, Math.round(Number(out.dimVorMinuten) || 0)));
  if ('tuer' in out) {
    const id = String(out.tuer || '').trim().toLowerCase();
    out.tuer = id && gueltigeEntity(id) ? id : '';
  }
  if ('presenceEntity' in out) {
    const id = String(out.presenceEntity || '').trim().toLowerCase();
    out.presenceEntity = id && gueltigeEntity(id) ? id : '';
  }
  if ('reminderEntity' in out) {
    const id = String(out.reminderEntity || '').trim().toLowerCase();
    out.reminderEntity = id && gueltigeEntity(id) ? id : '';
  }
  if ('reminderAckScript' in out) {
    const id = String(out.reminderAckScript || '').trim().toLowerCase();
    out.reminderAckScript = id && dienstAus(id) ? id : '';
  }
  if ('kamera' in out) {
    const id = String(out.kamera || '').trim().toLowerCase();
    out.kamera = id && gueltigeEntity(id) ? id : '';
  }
  if ('ton' in out) out.ton = !!out.ton;
  if ('lebendigkeit' in out) out.lebendigkeit = einheit(out.lebendigkeit, 0.7);
  if ('lautstaerke' in out) out.lautstaerke = einheit(out.lautstaerke, 0.8);
  if ('label' in out) out.label = !!out.label;
  if ('caption' in out) out.caption = !!out.caption;
  if ('uhr' in out) out.uhr = !!out.uhr;
  if ('nowPlaying' in out) out.nowPlaying = !!out.nowPlaying;
  if ('mediaEntity' in out) {
    const media = String(out.mediaEntity || '').trim().toLowerCase();
    out.mediaEntity = media && gueltigeEntity(media) ? media : '';
  }
  if ('demo' in out) out.demo = !!out.demo;
  if ('lockOn' in out) out.lockOn = !!out.lockOn;
  if (typeof out.lockSalt !== 'string') delete out.lockSalt;
  if (typeof out.lockHash !== 'string') delete out.lockHash;
  if ('eigene' in obj) out.eigene = normEigene(obj.eigene);
  if ('states' in obj) out.states = normStates(obj.states);
  const eigene = out.eigene || normEigene(obj.eigene);
  if ('gesten' in obj) out.gesten = normGesten(obj.gesten, eigene);
  if ('ecken' in obj) out.ecken = normEcken(obj.ecken, eigene);
  if ('dash' in obj) out.dash = normDash(obj.dash);
  if ('eckGroesse' in out) {
    const n = Math.round(Number(out.eckGroesse));
    out.eckGroesse = n >= 96 && n <= 160 ? n : ECK;
  }
  if ('gestenStand' in out) out.gestenStand = Math.max(0, Math.round(Number(out.gestenStand) || 0));
  if (out.lang !== 'en' && out.lang !== 'de') delete out.lang;
  if ('modus' in out) {
    const modus = normModus(out.modus);
    if (modus) out.modus = modus;
    else delete out.modus;
  }
  if ('lichtProfil' in out) {
    const profil = String(out.lichtProfil || '').trim().toLowerCase();
    if (profil === 'ruhig' || profil === 'lebhaft') out.lichtProfil = profil;
    else delete out.lichtProfil;
  }
  if ('alarmStaerke' in out) {
    const stufe = String(out.alarmStaerke || '').trim().toLowerCase();
    out.alarmStaerke = (stufe === 'normal' || stufe === 'norm') ? 'normal' : 'stark';
  }
  if (typeof out.haToken !== 'string') delete out.haToken;
  return out;
}

function tokenVon(obj) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of ['haToken', 'token', 'access_token']) {
    if (typeof obj[key] === 'string' && obj[key].trim()) return obj[key].trim();
  }
  return '';
}

function lesePaket(s) {
  let raw = lesen(s, KEY);
  if (!raw) raw = lesen(s, ALT_CONFIG);
  let obj = {};
  try { obj = JSON.parse(raw || '{}') || {}; } catch { obj = {}; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = {};
  const v = Number(obj.v) || 0;
  if ((v === 3 || v === 4) && obj.profiles && typeof obj.profiles === 'object') {
    return {
      neu: true,
      v,
      top: obj,
      phone: obj.profiles.phone && typeof obj.profiles.phone === 'object' ? obj.profiles.phone : {},
      tablet: obj.profiles.tablet && typeof obj.profiles.tablet === 'object' ? obj.profiles.tablet : {},
    };
  }
  return { neu: false, v: 0, flat: obj, top: obj, phone: {}, tablet: {} };
}

function schreibePaket(s, profiles, opt) {
  s.setItem(KEY, JSON.stringify({ v: 4, profiles }));
  s.removeItem(ALT_CONFIG);
  const hatToken = tokenVon(profiles.phone) || tokenVon(profiles.tablet);
  if (hatToken || (opt && opt.tokenLoeschen)) s.removeItem(ALT_TOKEN);
}

export function speichereKonfig(konfig, storage, opt) {
  const s = speicher(storage);
  if (!s) return;
  const tokenLoeschen = !!(opt && opt.tokenLoeschen);
  const paket = lesePaket(s);
  const profiles = {
    phone: paket.neu ? { ...paket.phone } : {},
    tablet: paket.neu ? { ...paket.tablet } : {},
  };
  const bekannt = nurBekannte(konfig);
  const gespeichertToken = tokenVon(profiles[klasse]);
  if (tokenLoeschen) bekannt.haToken = '';
  else if (!String(bekannt.haToken || '').trim() && gespeichertToken) bekannt.haToken = gespeichertToken;
  profiles[klasse] = bekannt;
  try { schreibePaket(s, profiles, { tokenLoeschen }); } catch { /* storage full or blocked */ }
}

export function ladeKonfig(params, storage, datei, ort) {
  const s = speicher(storage);
  const paket = lesePaket(s);
  const host = ort && (ort.hostname || ort.host) || '';
  const demoHost = istDemoHost(host);
  let gespeichert = {};
  let migrated = false;
  if (paket.neu) gespeichert = paket[klasse] || {};
  else gespeichert = paket.flat || {};
  if (!paket.neu && (lesen(s, KEY) || lesen(s, ALT_CONFIG))) migrated = true;
  if (paket.neu && paket.v < 4) migrated = true;
  if (lesen(s, ALT_CONFIG) || lesen(s, ALT_TOKEN)) migrated = true;
  const ausDatei = nurBekannte(siteNachKonfig(datei));
  const dateiToken = demoHost ? '' : String(ausDatei.haToken || '').trim();
  delete ausDatei.haToken;
  if (demoHost) delete ausDatei.haUrl;
  const stand = Number(gespeichert.gestenStand) || 0;
  const migriereGesten = stand < 2 && istAltesLayout(gespeichert.gesten, gespeichert.ecken);
  const k = { ...VORGABE, ...ausDatei, ...nurBekannte(gespeichert) };
  if (!demoHost && ausDatei.haUrl) k.haUrl = ausDatei.haUrl;
  if (migriereGesten) {
    k.gesten = normGesten(GESTEN_VORGABE, k.eigene);
    k.ecken = normEcken(ECKEN_VORGABE, k.eigene);
    k.gestenStand = 2;
    migrated = true;
  }
  k.eigene = normEigene(k.eigene);
  k.states = normStates(k.states);
  k.gesten = normGesten(k.gesten, k.eigene);
  k.ecken = normEcken(k.ecken, k.eigene);
  k.uhr = !!k.uhr;
  k.nowPlaying = !!k.nowPlaying;
  k.demo = !!k.demo;
  k.lockOn = !!(k.lockOn && k.lockSalt && k.lockHash);
  k.lockSalt = k.lockOn ? String(k.lockSalt) : '';
  k.lockHash = k.lockOn ? String(k.lockHash) : '';
  k.mediaEntity = gueltigeEntity(k.mediaEntity) ? String(k.mediaEntity).trim().toLowerCase() : '';
  if (!String(k.haToken || '').trim()) {
    const geliehen = tokenVon(paket.phone) || tokenVon(paket.tablet) || tokenVon(paket.flat) || tokenVon(paket.top) || String(lesen(s, ALT_TOKEN) || '').trim();
    if (geliehen) {
      k.haToken = geliehen;
      migrated = true;
    } else if (dateiToken) {
      k.haToken = dateiToken;
      migrated = true;
    }
  }
  if (!demoHost && ausDatei.haUrl && ausDatei.haUrl !== String(gespeichert.haUrl || '')) migrated = true;
  if (migrated) speichereKonfig(k, s);
  const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
  if (p.get('lock') === 'reset') speichereKonfig({ ...k, lockOn: false, lockSalt: '', lockHash: '' }, s);
  return mitUrl(k, params);
}

// URL parameters override stored values for this visit, until settings are saved.
// A token in the URL is ignored. English names are accepted alongside the original ones.
export function mitUrl(konfig, params) {
  const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
  const n = { ...konfig };
  const ha = p.get('ha');
  if (ha && ha !== 'mock') {
    const url = normalisiereHaUrl(ha);
    if (url) n.haUrl = url;
  }
  if (p.get('entity')) n.haEntity = p.get('entity').trim().toLowerCase();
  const schlaf = p.has('sleep') ? p.get('sleep') : p.get('schlaf');
  if (schlaf != null && schlaf !== '' && !Number.isNaN(+schlaf)) {
    n.schlafSekunden = Math.max(0, +schlaf);
  }
  const skripte = [
    ['music_on', 'musik_an', 'scriptMusikAn'],
    ['music_off', 'musik_aus', 'scriptMusikAus'],
    ['light_on', 'licht_an', 'scriptLichtAn'],
    ['light_off', 'licht_aus', 'scriptLichtAus'],
  ];
  for (const [en, de, key] of skripte) {
    const wert = p.get(en) || p.get(de);
    if (wert) n[key] = wert.trim().toLowerCase();
  }
  if (p.get('label') === '0') n.label = false;
  if (p.get('label') === '1') n.label = true;
  if (p.get('ton') === '0') n.ton = false;
  if (p.get('ton') === '1') n.ton = true;
  const live = p.get('live') || p.get('liveliness') || p.get('lebendigkeit');
  if (live != null && live !== '' && !Number.isNaN(+live)) n.lebendigkeit = einheit(live, n.lebendigkeit);
  const vol = p.get('vol') || p.get('volume');
  if (vol != null && vol !== '' && !Number.isNaN(+vol)) n.lautstaerke = einheit(vol, n.lautstaerke);
  const modus = normModus(p.get('mode') || p.get('modus') || p.get('theme'));
  if (modus) n.modus = modus;
  const licht = String(p.get('licht_profil') || p.get('light') || '').trim().toLowerCase();
  if (licht === 'ruhig' || licht === 'lebhaft') n.lichtProfil = licht;
  const alarm = String(p.get('alarm') || p.get('alarm_intensity') || '').trim().toLowerCase();
  if (alarm === 'normal' || alarm === 'norm') n.alarmStaerke = 'normal';
  if (alarm === 'strong' || alarm === 'stark') n.alarmStaerke = 'stark';
  const lang = localeCode(p.get('lang'));
  if (lang) n.lang = lang;
  if (p.get('caption') === '0') n.caption = false;
  if (p.get('caption') === '1') n.caption = true;
  if (p.get('clock') === '0') n.uhr = false;
  if (p.get('clock') === '1') n.uhr = true;
  if (p.get('np') === '0') n.nowPlaying = false;
  if (p.get('np') === '1') n.nowPlaying = true;
  const tuer = p.get('door');
  if (tuer && gueltigeEntity(tuer.trim().toLowerCase())) n.tuer = tuer.trim().toLowerCase();
  const presence = p.get('presence');
  if (presence && gueltigeEntity(presence.trim().toLowerCase())) n.presenceEntity = presence.trim().toLowerCase();
  const reminder = p.get('reminder');
  if (reminder && gueltigeEntity(reminder.trim().toLowerCase())) n.reminderEntity = reminder.trim().toLowerCase();
  const ack = p.get('reminder_ack') || p.get('reminderAck');
  if (ack && dienstAus(ack.trim().toLowerCase())) n.reminderAckScript = ack.trim().toLowerCase();
  const kamera = p.get('camera');
  if (kamera && gueltigeEntity(kamera.trim().toLowerCase())) n.kamera = kamera.trim().toLowerCase();
  if (p.get('dim') != null && p.get('dim') !== '' && !Number.isNaN(+p.get('dim'))) {
    n.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(+p.get('dim'))));
  }
  if (p.get('media')) {
    const media = p.get('media').trim().toLowerCase();
    if (gueltigeEntity(media)) n.mediaEntity = media;
  }
  if (p.get('demo') === '1') n.demo = true;
  if (p.get('demo') === '0') n.demo = false;
  if (p.get('lock') === 'reset') {
    n.lockOn = false;
    n.lockSalt = '';
    n.lockHash = '';
  }
  return n;
}
