// SPDX-License-Identifier: MIT
// Plain settings. Same localStorage key as the face.
import './polyfills.js';
import {
  demoSperre, geraeteKlasse, istDemoHost, ladeKonfig, setzeKlasse, speichereKonfig, vergissToken,
} from './konfig.js';
import { ladeSiteConfig } from './siteconfig.js';
import { neuLaden } from './laden.js';
import { dienstAus, gueltigeEntity, normalisiereHaUrl } from './ha.js';
import { resolveLocale, translate } from './strings.js';
import { VERSION } from './version.js';
import { REAKTION_IDS } from './reaktionen.js';

const q = new URLSearchParams(location.search);
setzeKlasse(geraeteKlasse({
  width: window.innerWidth,
  height: window.innerHeight,
  touch: (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches,
}));
let konfig = null;
let locale = 'en';
let gesperrt = false;

const ZENTRAL_FELDER = [
  ['ha-url', 'haUrl'],
  ['ha-token', 'haToken'],
  ['ha-entity', 'haEntity'],
  ['tuer-entity', 'tuer'],
  ['presence-entity', 'presenceEntity'],
  ['reminder-entity', 'reminderEntity'],
  ['reminder-ack', 'reminderAckScript'],
  ['schlaf-min', 'schlafSekunden'],
  ['dim-nach', 'dimNachSekunden'],
  ['dim-stufe', 'dimStufe'],
  ['sprache', 'lang'],
  ['alarm-staerke', 'alarmStaerke'],
  ['ton', 'ton'],
  ['lautstaerke', 'lautstaerke'],
  ['lebendigkeit', 'lebendigkeit'],
  ['uhr-an', 'uhr'],
];

function el(id) { return document.getElementById(id); }
function t(key) { return translate(locale, key); }

function applyI18n() {
  const nodes = document.querySelectorAll('[data-i18n]');
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const text = t(node.getAttribute('data-i18n'));
    if (text) node.textContent = text;
  }
  const version = el('version');
  if (version) version.textContent = 'v' + VERSION;
  document.documentElement.lang = locale;
  document.title = t('settings.title');
}

function setWert(id, wert) {
  const node = el(id);
  if (node) node.value = wert == null ? '' : String(wert);
}

function lies(id) {
  const node = el(id);
  return node ? String(node.value || '').trim() : '';
}

function fuellen() {
  setWert('ha-url', konfig.haUrl || '');
  setWert('ha-token', '');
  setWert('ha-entity', konfig.haEntity || '');
  setWert('tuer-entity', konfig.tuer || '');
  setWert('presence-entity', konfig.presenceEntity || '');
  setWert('reminder-entity', konfig.reminderEntity || '');
  setWert('reminder-ack', konfig.reminderAckScript || '');
  setWert('schlaf-min', String(Math.round((konfig.schlafSekunden || 0) / 60)));
  setWert('dim-nach', String(konfig.dimNachSekunden ?? 60));
  setWert('dim-stufe', String(Math.round((konfig.dimStufe ?? 0.3) * 100)));
  const ton = el('ton');
  if (ton) ton.checked = !!konfig.ton;
  setWert('lautstaerke', String(Math.round((konfig.lautstaerke == null ? 1.6 : konfig.lautstaerke) * 100)));
  setWert('lebendigkeit', String(Math.round((konfig.lebendigkeit == null ? 0.42 : konfig.lebendigkeit) * 100)));
  const uhr = el('uhr-an');
  if (uhr) uhr.checked = !!konfig.uhr;
  const alarm = el('alarm-staerke');
  if (alarm) alarm.value = konfig.alarmStaerke === 'normal' ? 'normal' : 'stark';
  const sprache = el('sprache');
  if (sprache) sprache.value = konfig.lang || 'auto';
  const token = el('ha-token');
  if (token) token.placeholder = konfig.haToken ? t('ph.tokenReplace') : t('ph.tokenEmpty');
  const fehler = el('form-fehler');
  if (fehler) fehler.textContent = '';
  const ids = ['ha-url', 'ha-token', 'ha-entity', 'tuer-entity', 'presence-entity', 'reminder-entity', 'reminder-ack'];
  for (let i = 0; i < ids.length; i++) {
    const node = el(ids[i]);
    if (node) node.readOnly = gesperrt;
  }
  const note = el('demo-sperre');
  if (note) {
    note.hidden = !gesperrt;
    note.textContent = gesperrt ? t('demo.locked') : '';
  }
  markiereZentral();
}

function zentralIst(key) {
  return !!(konfig && konfig.zentral && konfig.zentral.indexOf(key) >= 0);
}

function markiereZentral() {
  for (let i = 0; i < ZENTRAL_FELDER.length; i++) {
    const id = ZENTRAL_FELDER[i][0];
    const key = ZENTRAL_FELDER[i][1];
    const node = el(id);
    if (!node || !zentralIst(key)) continue;
    const typ = String(node.type || '').toLowerCase();
    if (node.tagName === 'SELECT' || typ === 'checkbox' || typ === 'range') node.disabled = true;
    else node.readOnly = true;
    const hinweis = document.createElement('span');
    hinweis.className = 'zentral';
    hinweis.textContent = t('settings.central');
    const box = node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('check')
      ? node.parentNode
      : node.parentNode;
    if (box) box.appendChild(hinweis);
  }
  if (zentralIst('haToken')) {
    const forget = el('token-loeschen');
    if (forget) forget.disabled = true;
  }
}

function melden(key) {
  const node = el('form-fehler');
  if (node) node.textContent = t(key);
}

function uebernehmen(k) {
  if (!zentralIst('schlafSekunden')) k.schlafSekunden = Math.max(0, Math.round(Number(lies('schlaf-min')) * 60) || 0);
  if (!zentralIst('dimNachSekunden')) k.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(Number(lies('dim-nach'))) || 0));
  if (!zentralIst('dimStufe')) k.dimStufe = Math.max(0.05, Math.min(1, (Math.round(Number(lies('dim-stufe'))) || 30) / 100));
  if (!zentralIst('ton')) k.ton = !!(el('ton') && el('ton').checked);
  if (!zentralIst('lautstaerke')) k.lautstaerke = Math.max(0, Math.min(2, (Math.round(Number(lies('lautstaerke'))) || 0) / 100));
  if (!zentralIst('lebendigkeit')) k.lebendigkeit = Math.max(0, Math.min(1, (Math.round(Number(lies('lebendigkeit'))) || 0) / 100));
  if (!zentralIst('uhr')) k.uhr = !!(el('uhr-an') && el('uhr-an').checked);
  if (!zentralIst('lang')) {
    const gewaehlt = lies('sprache');
    k.lang = gewaehlt === 'auto' ? '' : gewaehlt;
  }
  if (!zentralIst('alarmStaerke')) k.alarmStaerke = lies('alarm-staerke') === 'normal' ? 'normal' : 'stark';
}

function speichern(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  const k = { ...konfig };
  const loeschen = !!(el('token-loeschen') && el('token-loeschen').checked);
  if (!gesperrt) {
    if (!zentralIst('haUrl')) {
      const urlRoh = lies('ha-url');
      if (urlRoh) {
        const url = normalisiereHaUrl(urlRoh);
        if (!url) { melden('err.url'); return; }
        k.haUrl = url;
      } else k.haUrl = '';
    }
    if (!zentralIst('haToken')) {
      const token = lies('ha-token');
      if (loeschen) k.haToken = '';
      else if (token) k.haToken = token;
    }
    const felder = [
      ['ha-entity', 'haEntity'],
      ['tuer-entity', 'tuer'],
      ['presence-entity', 'presenceEntity'],
      ['reminder-entity', 'reminderEntity'],
    ];
    for (let i = 0; i < felder.length; i++) {
      if (zentralIst(felder[i][1])) continue;
      const wert = lies(felder[i][0]).toLowerCase();
      if (wert && !gueltigeEntity(wert)) { melden('err.entity'); return; }
      k[felder[i][1]] = wert;
    }
    if (!zentralIst('reminderAckScript')) {
      const ack = lies('reminder-ack').toLowerCase();
      if (ack && !dienstAus(ack)) { melden('err.entity'); return; }
      k.reminderAckScript = ack;
    }
  }
  uebernehmen(k);
  speichereKonfig(k, undefined, { tokenLoeschen: !gesperrt && loeschen && !zentralIst('haToken') });
  if (gesperrt) vergissToken();
  location.href = 'index.html';
}

function cacheObjekt() {
  try { return window.applicationCache || null; } catch (err) { return null; }
}

async function starten() {
  const datei = await ladeSiteConfig();
  konfig = ladeKonfig(q, undefined, datei, location);
  if (istDemoHost(location.hostname)) {
    konfig.haToken = '';
    vergissToken();
  }
  locale = resolveLocale({ query: q.get('lang'), stored: konfig.lang, nav: navigator.language });
  gesperrt = demoSperre(location.hostname);
  applyI18n();
  fuellen();
  baueVorschau();
  const form = el('form');
  if (form) form.addEventListener('submit', speichern);
  const neu = el('neu-laden');
  if (neu) neu.addEventListener('click', () => neuLaden(cacheObjekt(), () => { location.reload(); }));
}

starten();

function baueVorschau() {
  const box = el('preview-list');
  const details = el('preview-reactions');
  if (!box) return;
  if (q.get('preview') === '1' && details) details.open = true;
  for (let i = 0; i < REAKTION_IDS.length; i++) {
    const id = REAKTION_IDS[i];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preview-btn';
    button.textContent = id;
    button.addEventListener('click', () => {
      location.href = 'index.html?demo=0&reaction=' + encodeURIComponent(id);
    });
    box.appendChild(button);
  }
}
