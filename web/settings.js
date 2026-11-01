// SPDX-License-Identifier: MIT
// The few controls that belong on the tablet. Anything the file sets is left off the page.
import './polyfills.js';
import {
  demoSperre, geraeteKlasse, istDemoHost, ladeKonfig, setzeKlasse, speichereKonfig, vergissToken,
} from './konfig.js';
import { ladeSiteConfig } from './siteconfig.js';
import { normalisiereHaUrl } from './ha.js';
import { resolveLocale, translate } from './strings.js';
import { VERSION } from './version.js';
import { REAKTION_IDS } from './reaktionen.js';
import {
  DIM_PROZENT, DIM_SEK, GESICHT, LEBEN_STUFEN, SCHLAF_MIN, VOL_STUFEN,
  hauptSichtbar, schnapp,
} from './einstell.js';

const q = new URLSearchParams(location.search);
setzeKlasse(geraeteKlasse({
  width: window.innerWidth,
  height: window.innerHeight,
  touch: (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches,
}));
let konfig = null;
let locale = 'en';
let gesperrt = false;
let sicht = null;
let steuer = {};
let tokenLoeschen = false;

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

function zeige(id, an) {
  const node = el(id);
  if (!node) return;
  if (an) node.removeAttribute('hidden');
  else node.setAttribute('hidden', '');
}

function minutenText(min) {
  if (!min) return t('settings.never');
  return min + ' min';
}

function dimText(sek) {
  if (!sek) return t('settings.never');
  if (sek < 60) return sek + ' s';
  return Math.round(sek / 60) + ' min';
}

function baueWahl(id, punkte, aktuell) {
  const box = el(id);
  if (!box) return { wert: function () { return aktuell; } };
  const werte = [];
  for (let i = 0; i < punkte.length; i++) werte.push(punkte[i].wert);
  let gewaehlt = schnapp(aktuell, werte);
  box.innerHTML = '';
  function malen() {
    const knoepfe = box.getElementsByTagName('button');
    const marke = String(gewaehlt);
    for (let i = 0; i < knoepfe.length; i++) {
      knoepfe[i].className = 'wahl-knopf' + (knoepfe[i].getAttribute('data-wert') === marke ? ' an' : '');
    }
  }
  for (let i = 0; i < punkte.length; i++) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'wahl-knopf';
    knopf.setAttribute('data-wert', String(punkte[i].wert));
    knopf.textContent = punkte[i].text;
    knopf.addEventListener('click', function () {
      gewaehlt = Number(this.getAttribute('data-wert'));
      malen();
    });
    box.appendChild(knopf);
  }
  malen();
  return { wert: function () { return gewaehlt; } };
}

function baueSchieber(id, stufen, aktuell, ziel) {
  const wurzel = el(id);
  if (!wurzel) return { wert: function () { return aktuell; } };
  const leiste = wurzel.getElementsByClassName('schieber-leiste')[0];
  const fuellung = wurzel.getElementsByClassName('schieber-fuellung')[0];
  const knopf = wurzel.getElementsByClassName('schieber-knopf')[0];
  const anzeige = el(ziel);
  let index = 0;
  const start = schnapp(aktuell, stufen);
  for (let i = 0; i < stufen.length; i++) if (stufen[i] === start) index = i;
  function male() {
    const u = stufen.length < 2 ? 0 : index / (stufen.length - 1);
    if (fuellung) fuellung.style.width = (u * 100) + '%';
    if (knopf) knopf.style.left = (u * 100) + '%';
    if (anzeige) anzeige.textContent = stufen[index] + ' %';
  }
  function vonX(clientX) {
    const rect = leiste.getBoundingClientRect();
    const breite = rect.width || 1;
    let u = (clientX - rect.left) / breite;
    if (u < 0) u = 0;
    if (u > 1) u = 1;
    index = Math.round(u * (stufen.length - 1));
    male();
  }
  function xVon(e) {
    if (e.touches && e.touches[0]) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
    return e.clientX;
  }
  let zieh = false;
  leiste.addEventListener('touchstart', function (e) {
    zieh = true;
    vonX(xVon(e));
    if (e.preventDefault) e.preventDefault();
  });
  leiste.addEventListener('touchmove', function (e) {
    if (!zieh) return;
    vonX(xVon(e));
    if (e.preventDefault) e.preventDefault();
  });
  leiste.addEventListener('touchend', function () { zieh = false; });
  leiste.addEventListener('mousedown', function (e) {
    zieh = true;
    vonX(e.clientX);
  });
  window.addEventListener('mousemove', function (e) {
    if (!zieh) return;
    vonX(e.clientX);
  });
  window.addEventListener('mouseup', function () { zieh = false; });
  male();
  return { wert: function () { return stufen[index]; } };
}

function baueSchalter(id, an) {
  const knopf = el(id);
  if (!knopf) return { wert: function () { return !!an; } };
  let ein = !!an;
  function male() {
    knopf.className = ein ? 'schalter an' : 'schalter';
    knopf.setAttribute('aria-pressed', ein ? 'true' : 'false');
  }
  knopf.addEventListener('click', function () {
    ein = !ein;
    male();
  });
  male();
  return { wert: function () { return ein; } };
}

function fuellen() {
  sicht = hauptSichtbar(konfig.zentral, gesperrt);
  zeige('feld-schlaf', sicht.schlaf);
  zeige('feld-dim', sicht.dim);
  zeige('feld-dim-nach', sicht.dimNach);
  zeige('feld-dim-stufe', sicht.dimStufe);
  zeige('feld-sprache', sicht.sprache);
  zeige('feld-laut', sicht.laut);
  zeige('feld-leben', sicht.leben);
  zeige('feld-uhr', sicht.uhr);
  zeige('feld-demo', sicht.demo);
  zeige('feld-verbindung', sicht.verbindung);
  zeige('feld-url', sicht.haUrl);
  zeige('feld-token', sicht.haToken);
  const fehler = el('form-fehler');
  if (fehler) fehler.textContent = '';
  const url = el('ha-url');
  if (url) url.value = konfig.haUrl || '';
  const token = el('ha-token');
  if (token) {
    token.value = '';
    token.placeholder = konfig.haToken ? t('ph.tokenReplace') : t('ph.tokenEmpty');
  }
  const schlafPunkte = [];
  for (let i = 0; i < SCHLAF_MIN.length; i++) schlafPunkte.push({ wert: SCHLAF_MIN[i], text: minutenText(SCHLAF_MIN[i]) });
  const dimSek = [];
  for (let i = 0; i < DIM_SEK.length; i++) dimSek.push({ wert: DIM_SEK[i], text: dimText(DIM_SEK[i]) });
  const dimProzent = [];
  for (let i = 0; i < DIM_PROZENT.length; i++) dimProzent.push({ wert: DIM_PROZENT[i], text: DIM_PROZENT[i] + ' %' });
  const sprachen = [
    { wert: 0, text: 'Auto', lang: '' },
    { wert: 1, text: 'Deutsch', lang: 'de' },
    { wert: 2, text: 'English', lang: 'en' },
  ];
  const spracheJetzt = konfig.lang === 'de' ? 1 : (konfig.lang === 'en' ? 2 : 0);
  const lebenPunkte = [];
  for (let i = 0; i < LEBEN_STUFEN.length; i++) {
    lebenPunkte.push({ wert: LEBEN_STUFEN[i].v, text: t('live.' + LEBEN_STUFEN[i].id) });
  }
  steuer = {
    schlaf: baueWahl('schlaf-min', schlafPunkte, Math.round((konfig.schlafSekunden || 0) / 60)),
    dimNach: baueWahl('dim-nach', dimSek, konfig.dimNachSekunden == null ? 60 : konfig.dimNachSekunden),
    dimStufe: baueWahl('dim-stufe', dimProzent, Math.round((konfig.dimStufe == null ? 0.3 : konfig.dimStufe) * 100)),
    sprache: baueWahl('sprache', sprachen, spracheJetzt),
    laut: baueSchieber('lautstaerke', VOL_STUFEN, Math.round((konfig.lautstaerke == null ? 1.6 : konfig.lautstaerke) * 100), 'laut-wert'),
    leben: baueWahl('lebendigkeit', lebenPunkte, konfig.lebendigkeit == null ? 0.42 : konfig.lebendigkeit),
    uhr: baueSchalter('uhr-an', !!konfig.uhr),
  };
  steuer.sprachen = sprachen;
}

function melden(key) {
  const node = el('form-fehler');
  if (node) node.textContent = t(key);
}

function schliessen() {
  location.href = 'index.html';
}

function speichern(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  const k = { ...konfig };
  if (sicht.schlaf) k.schlafSekunden = Math.max(0, Math.round(steuer.schlaf.wert() * 60) || 0);
  if (sicht.dimNach) k.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(steuer.dimNach.wert()) || 0));
  if (sicht.dimStufe) k.dimStufe = Math.max(0.05, Math.min(1, steuer.dimStufe.wert() / 100));
  if (sicht.laut) k.lautstaerke = Math.max(0, Math.min(2, steuer.laut.wert() / 100));
  if (sicht.leben) k.lebendigkeit = Math.max(0, Math.min(1, steuer.leben.wert()));
  if (sicht.uhr) k.uhr = !!steuer.uhr.wert();
  if (sicht.sprache) {
    const gewaehlt = steuer.sprache.wert();
    let lang = '';
    for (let i = 0; i < steuer.sprachen.length; i++) if (steuer.sprachen[i].wert === gewaehlt) lang = steuer.sprachen[i].lang;
    k.lang = lang;
  }
  if (sicht.haUrl) {
    const urlRoh = el('ha-url') ? String(el('ha-url').value || '').trim() : '';
    if (urlRoh) {
      const url = normalisiereHaUrl(urlRoh);
      if (!url) { melden('err.url'); return; }
      k.haUrl = url;
    } else k.haUrl = '';
  }
  if (sicht.haToken) {
    const token = el('ha-token') ? String(el('ha-token').value || '').trim() : '';
    if (tokenLoeschen) k.haToken = '';
    else if (token) k.haToken = token;
  }
  speichereKonfig(k, undefined, { tokenLoeschen: sicht.haToken && tokenLoeschen });
  if (gesperrt) vergissToken();
  location.href = 'index.html';
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
  const zu = el('schliessen');
  if (zu) zu.addEventListener('click', schliessen);
  const demo = el('demo-start');
  if (demo) demo.addEventListener('click', function () { location.href = 'index.html?lauf=1'; });
  const verbinden = el('verbindung');
  if (verbinden) verbinden.addEventListener('click', function () {
    const kasten = el('verbindung-kasten');
    if (!kasten) return;
    if (kasten.hasAttribute('hidden')) kasten.removeAttribute('hidden');
    else kasten.setAttribute('hidden', '');
  });
  const vergiss = el('token-loeschen');
  if (vergiss) vergiss.addEventListener('click', function () {
    tokenLoeschen = true;
    const token = el('ha-token');
    if (token) token.value = '';
    vergiss.disabled = true;
  });
  const klingelTest = el('klingel-test');
  if (klingelTest) klingelTest.addEventListener('click', function () { location.href = 'index.html?klingel=1'; });
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
    button.addEventListener('click', function () {
      location.href = 'index.html?demo=0&reaction=' + encodeURIComponent(id);
    });
    box.appendChild(button);
  }
}
