// SPDX-License-Identifier: MIT
// Tablet UI. Eye motion stays in engine/augen/zustaende. This file only wires it up.
import './polyfills.js';
import { AKTIONEN, ECKEN_DEMO, ECK_KEYS, GESTEN_KEYS, istStandardEcken, normEcken, normEigene, normGesten } from './aktionen.js';
import { P, blinkMul } from './augen.js';
import { makeClips, setAlarmStaerke } from './zustaende.js';
import { clipPoses, Augen } from './engine.js';
import { KURZ, KURZ_VON_CLIP } from './namen.js';
import { aktiveKlasse, demoBesuch, demoSperre, geraeteKlasse, istDemoHost, ladeKonfig, normModus, normStates, setzeKlasse, speichereKonfig, vergissToken, waehleModus } from './konfig.js';
import { ladeSiteConfig } from './siteconfig.js';
import {
  baueDashboard, ereignisseAus, kalenderNachricht, mockEreignisse, mockZustaende, normDash, wetterNachricht, zeichneDashboard,
} from './dashboard.js';
import { sichtbareAnsichten, timerAdd, timerStop, zeichneAnsicht } from './ansichten.js';
import { createAudio } from './audio.js';
import { createWaechter } from './schlaf.js';
import { BEFEHLE } from './befehle.js';
import { Buehne } from './renderer.js';
import { HALTEN_MS, createAdminTaps, eckName, wischAktion, zoneFuer } from './gesten.js';
import { onZeiger } from './zeiger.js';
import { istAltgeraet } from './power.js';
import { dienstAus, gueltigeEntity, mapHaState, mockHa, normalisiereHaUrl, sichereMeldung, verbindeHa } from './ha.js';
import { lichtBefehl } from './licht.js';
import { demoSchritt } from './demo.js';
import { MUSIK_RUHE_MS, jetztLaeuft, naechsteEintraege, sollMusikOeffnen, wiedergabeLaeuft } from './nowplaying.js';
import { DEMO_LINE, createDemoMusic, playAck, playChirps, playNudge, playSettingsChime, playSigh } from './demotrack.js';
import { helligkeit, tuerKante } from './dimmen.js';
import { LINKS, hilfeUrl, repoLinks } from './hilfe.js';
import { hashLock, newSalt, pruefeLock } from './lock.js';
import { VERSION } from './version.js';
import {
  CAPTION_TIMING, captionLine, detailLine, resolveLocale, stateLabel, textOrServer, translate,
} from './strings.js';

const TICKLE = '13_kitzel';
const q = new URLSearchParams(location.search);
const ON = await (await fetch('onsets.json')).json();
const siteDatei = await ladeSiteConfig();
const CLIPS = makeClips(ON);
const BY = Object.fromEntries(CLIPS.map((c) => [c.name, c]));
const MODI = ['2d', 'led', 'vollbild'];
const ABL_FPS = 60;

function geraetJetzt() {
  const touch = (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
  return geraeteKlasse({ width: window.innerWidth, height: window.innerHeight, touch });
}
setzeKlasse(geraetJetzt());
const konfig = ladeKonfig(q, undefined, siteDatei, location);
setAlarmStaerke(konfig.alarmStaerke);
if (istDemoHost(location.hostname)) {
  konfig.haToken = '';
  vergissToken();
}
if (demoBesuch(konfig, location, q)) {
  konfig.demo = true;
  if (istStandardEcken(konfig.ecken)) konfig.ecken = normEcken(ECKEN_DEMO, konfig.eigene);
}
let locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
const SOUND_IDS = ['01_hallo', '02_zuhoeren', '03_verstanden', '04_erledigt_danke', '05_lachen', '06_nicht_verstanden', '07_nachdenken', '08_schlafen', '09_fehler', '10_musik_an', '11_licht_an', '12_licht_aus', '13_kitzel', '14_angry'];
const audio = createAudio(CLIPS, [TICKLE]);
audio.setTon(konfig.ton);
const demoMusik = createDemoMusic();
const augen = new Augen(CLIPS);
const waechter = createWaechter(konfig.schlafSekunden);
const renderer = new Buehne(document.getElementById('c'));
renderer.scale = +q.get('r') || 1;
renderer.sparsam = q.get('power') === 'full' ? false : (q.get('power') === 'low' || istAltgeraet());
document.documentElement.classList.toggle('is-low', renderer.sparsam);
const adminTaps = createAdminTaps();

const ui = { label: konfig.label };
let ablauf = null;
let ha = null;
let haStatus = 'aus';
let haMeldung = '';
let letzterKurz = 'idle';
let letzterWechsel = performance.now();
let seit = Date.now();
let letzterBefehl = null;
let einstellungenOffen = false;
let blattOffen = false;
let boredTimer = 0;
let seitTimer = 0;
let captionState = '';
let jetztText = '';
let medienZustand = null;
let musikAn = false;
let lichtAn = false;
let gestenGebaut = false;
let eckenGebaut = false;
let bildKurz = 'idle';
let vorschau = false;
let entsperrt = false;
let lookX = 0;
let lookY = 0;
let lookTX = 0;
let lookTY = 0;
let dashOffen = false;
let dashStates = {};
let dashEvents = {};
let dashForecast = null;
let ansicht = 'normal';
let detailArt = '';
let tuerStand = null;
let schauTimer = 0;
let schauFest = false;
let schauLaeuft = false;
let schauIndex = 0;
let schauSeit = 0;
let stoerungAn = false;
let aktionFeld = null;
let dimIst = 1;
let medienAttr = null;
let medienState = '';
let musikRuheTimer = 0;
let npEintraege = [];
let zonenTimer = 0;
let blinkAt = -10;
const stageQuery = window.matchMedia('(orientation: landscape) and (min-width: 840px)');

function el(id) { return document.getElementById(id); }
function param(...names) {
  for (const name of names) if (q.has(name)) return q.get(name);
  return null;
}
function t(key, vars) { return translate(locale, key, vars); }

function startModus() {
  return waehleModus(param('mode', 'modus') || param('theme'), konfig.modus);
}

function feldWert(node) {
  if (!node) return '';
  if (node.classList && node.classList.contains('wahl')) return node.dataset.value || '';
  return node.value;
}

function aktionBeschriftung(art, ziel) {
  const name = aktionsName(art || 'none');
  const extra = art === 'service' ? String(ziel || '').trim() : '';
  if (!extra) return name;
  const kurz = extra.length > 22 ? `${extra.slice(0, 20)}…` : extra;
  return `${name} · ${kurz}`;
}

function feldSetze(node, value) {
  if (!node) return;
  if (node.classList && node.classList.contains('wahl')) {
    node.dataset.value = value;
    const aktuell = node.querySelector('.aktion-aktuell');
    if (aktuell) {
      const ziel = node.id ? (el(`${node.id}-ziel`)?.value || '') : '';
      aktuell.textContent = aktionBeschriftung(value, ziel);
      return;
    }
    const buttons = node.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].dataset.value === value ? 'true' : 'false');
    }
    return;
  }
  node.value = value;
}

function setModus(mode) {
  if (!MODI.includes(mode)) return;
  renderer.setMode(mode);
  document.body.dataset.theme = mode === '2d' ? 'cube' : (mode === 'led' ? 'fortune' : 'bold');
  document.body.classList.toggle('is-bold', mode === 'vollbild');
  document.body.classList.toggle('is-cube', mode === '2d');
  document.body.classList.toggle('is-fortune', mode === 'led');
  const ledopt = el('ledopt');
  if (ledopt) ledopt.hidden = mode !== 'led';
  const sel = el('modus');
  if (sel && feldWert(sel) !== mode) feldSetze(sel, mode);
}

function statusText() {
  const basis = t(`status.${haStatus}`) || haStatus;
  if (!haMeldung) return basis;
  let extra = haMeldung;
  if (haMeldung.startsWith('called:')) extra = textOrServer(locale, 'called', { name: haMeldung.slice(7) });
  else extra = textOrServer(locale, haMeldung);
  return extra ? `${basis} — ${extra}` : basis;
}

const STOERUNG_KEYS = {
  tokenRejected: 1,
  statesUnreadable: 1,
  entityMissing: 1,
  callFailed: 1,
  connectFailed: 1,
  tokenMissing: 1,
  connectionTrouble: 1,
};

function istStoerung() {
  if (haStatus === 'fehler' || haStatus === 'auth_ungueltig' || haStatus === 'getrennt') return true;
  return !!STOERUNG_KEYS[haMeldung];
}

function syncStoerung() {
  if (schauLaeuft) return;
  if (istStoerung()) {
    const leise = el('caption')?.classList.contains('is-quiet');
    if (stoerungAn && leise) return;
    stoerungAn = true;
    wendeZustand('nicht_verstanden', { ton: false, erzwingen: true, zeile: false });
    zeigeZeile('stoerung', { halten: true, leise: true });
    return;
  }
  if (!stoerungAn) return;
  stoerungAn = false;
  const node = el('caption');
  const leise = node && node.classList.contains('is-quiet');
  if (leise) hideCaption();
  if (konfig.caption && letzterKurz && letzterKurz !== 'idle') showCaption(letzterKurz);
  else scheduleBored();
}

function setStatus(s) {
  if (s.status) haStatus = s.status;
  if (s.meldung) haMeldung = sichereMeldung(s.meldung);
  else if (s.letzterAufruf) haMeldung = s.aufrufOk ? `called:${s.letzterAufruf}` : 'notSet';
  else if (s.status === 'verbinde' || s.status === 'offen' || s.status === 'verbunden' || s.status === 'aus' || s.status === 'getrennt' || s.status === 'mock') haMeldung = '';
  if (haMeldung) haMeldung = sichereMeldung(haMeldung);
  const wrap = el('ha-status');
  if (wrap) wrap.dataset.state = haStatus;
  const ziel = el('ha-status-text');
  if (ziel) ziel.textContent = statusText();
  if (blattOffen) aktualisiereDetails();
  syncStoerung();
}

function aktionsWerte() {
  return [...AKTIONEN, ...(konfig.eigene || []).map((item) => `own:${item.id}`)];
}

function aktionsName(art) {
  if (art.startsWith('own:')) {
    const item = (konfig.eigene || []).find((eintrag) => eintrag.id === art.slice(4));
    return item?.label || art;
  }
  return t(`gesture.act.${art}`);
}

function fuelleAktionSelect(select) {
  if (!select) return;
  const werte = aktionsWerte();
  const bisher = feldWert(select);
  const wert = werte.includes(bisher) ? bisher : 'none';
  if (!select.querySelector('.aktion-aktuell')) {
    select.replaceChildren();
    select.classList.add('picker', 'wahl', 'aktion-wahl');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'aktion-aktuell';
    btn.addEventListener('click', () => oeffneAktionPop(select));
    select.append(btn);
  }
  select.dataset.value = wert;
  feldSetze(select, wert);
}

function sichereAktionPop() {
  let pop = el('aktion-pop');
  if (pop) return pop;
  pop = document.createElement('div');
  pop.id = 'aktion-pop';
  pop.hidden = true;
  const karte = document.createElement('div');
  karte.className = 'aktion-pop-karte';
  karte.setAttribute('role', 'dialog');
  const titel = document.createElement('p');
  titel.id = 'aktion-pop-titel';
  titel.className = 'aktion-pop-titel';
  const liste = document.createElement('div');
  liste.id = 'aktion-pop-liste';
  liste.className = 'aktion-pop-liste';
  const zeile = document.createElement('label');
  zeile.id = 'aktion-pop-ziel-zeile';
  zeile.className = 'aktion-pop-ziel';
  zeile.hidden = true;
  const span = document.createElement('span');
  span.textContent = t('custom.service');
  const input = document.createElement('input');
  input.id = 'aktion-pop-ziel';
  input.type = 'text';
  input.autocapitalize = 'off';
  input.autocorrect = 'off';
  input.spellcheck = false;
  input.placeholder = t('ph.service');
  input.addEventListener('input', () => {
    if (!aktionFeld) return;
    const ziel = el(`${aktionFeld.id}-ziel`);
    if (ziel) ziel.value = input.value;
    feldSetze(aktionFeld, feldWert(aktionFeld));
    gesteGeaendert();
  });
  zeile.append(span, input);
  karte.append(titel, liste, zeile);
  pop.append(karte);
  pop.addEventListener('click', (e) => {
    if (e.target === pop) schliesseAktionPop();
  });
  document.body.append(pop);
  return pop;
}

function oeffneAktionPop(select) {
  const pop = sichereAktionPop();
  aktionFeld = select;
  const titel = el('aktion-pop-titel');
  const label = document.querySelector(`label[for="${select.id}"]`);
  if (titel) titel.textContent = label ? label.textContent : '';
  const liste = el('aktion-pop-liste');
  liste.replaceChildren();
  const wert = feldWert(select);
  for (const art of aktionsWerte()) {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.textContent = aktionsName(art);
    opt.setAttribute('aria-pressed', art === wert ? 'true' : 'false');
    opt.addEventListener('click', () => {
      feldSetze(select, art);
      const zielZeile = el('aktion-pop-ziel-zeile');
      if (zielZeile) zielZeile.hidden = art !== 'service';
      const knoepfe = liste.querySelectorAll('button');
      for (let i = 0; i < knoepfe.length; i++) {
        knoepfe[i].setAttribute('aria-pressed', knoepfe[i] === opt ? 'true' : 'false');
      }
      gesteGeaendert();
      if (art !== 'service') schliesseAktionPop();
    });
    liste.append(opt);
  }
  const ziel = el(`${select.id}-ziel`);
  const zielInput = el('aktion-pop-ziel');
  const zielZeile = el('aktion-pop-ziel-zeile');
  if (zielInput) {
    zielInput.value = ziel ? ziel.value : '';
    zielInput.readOnly = demoSperre(location.hostname);
  }
  if (zielZeile) zielZeile.hidden = wert !== 'service';
  pop.hidden = false;
}

function schliesseAktionPop() {
  const pop = el('aktion-pop');
  if (pop) pop.hidden = true;
  aktionFeld = null;
}

function baueGestenFelder() {
  const wrap = el('gesten-felder');
  if (!wrap) return;
  if (!gestenGebaut) {
    for (const key of GESTEN_KEYS) {
      const row = document.createElement('div');
      row.className = 'geste';
      const label = document.createElement('label');
      label.htmlFor = `g-${key}`;
      label.dataset.i18n = `gesture.${key}`;
      const select = document.createElement('div');
      select.id = `g-${key}`;
      select.className = 'picker wahl';
      const input = document.createElement('input');
      input.id = `g-${key}-ziel`;
      input.type = 'text';
      input.hidden = true;
      input.autocapitalize = 'off';
      input.autocorrect = 'off';
      input.spellcheck = false;
      input.placeholder = t('ph.service');
      input.addEventListener('change', gesteGeaendert);
      row.append(label, select, input);
      wrap.append(row);
    }
    gestenGebaut = true;
  }
  for (const key of GESTEN_KEYS) {
    fuelleAktionSelect(el(`g-${key}`));
    const input = el(`g-${key}-ziel`);
    if (input) input.placeholder = t('ph.service');
  }
}

function baueEckenFelder() {
  const wrap = el('ecken-felder');
  if (!wrap) return;
  if (!eckenGebaut) {
    for (const key of ECK_KEYS) {
      const block = document.createElement('div');
      block.className = 'ecke';
      const name = document.createElement('p');
      name.className = 'ecke-name';
      name.dataset.i18n = `corner.${key}`;
      block.append(name);
      for (const art of ['tap', 'hold']) {
        const row = document.createElement('div');
        row.className = 'geste';
        const label = document.createElement('label');
        label.htmlFor = `c-${key}-${art}`;
        label.dataset.eckLabel = art;
        const select = document.createElement('div');
        select.id = `c-${key}-${art}`;
        select.className = 'picker wahl';
        const input = document.createElement('input');
        input.id = `c-${key}-${art}-ziel`;
        input.type = 'text';
        input.hidden = true;
        input.autocapitalize = 'off';
        input.autocorrect = 'off';
        input.spellcheck = false;
        input.addEventListener('change', gesteGeaendert);
        row.append(label, select, input);
        block.append(row);
      }
      wrap.append(block);
    }
    eckenGebaut = true;
  }
  for (const key of ECK_KEYS) {
    for (const art of ['tap', 'hold']) {
      fuelleAktionSelect(el(`c-${key}-${art}`));
      const input = el(`c-${key}-${art}-ziel`);
      if (input) input.placeholder = t('ph.service');
      const label = wrap.querySelector(`label[for="c-${key}-${art}"]`);
      if (label) label.textContent = t(art === 'tap' ? 'corner.tap' : 'corner.hold');
    }
  }
}

function applyI18n() {
  document.documentElement.lang = locale;
  document.title = t('app.title');
  const apple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (apple) apple.content = t('app.shortTitle');
  const canvas = el('c');
  if (canvas) canvas.setAttribute('aria-label', t('app.canvas'));
  baueGestenFelder();
  baueEckenFelder();
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  }
  const token = el('ha-token');
  if (token) token.placeholder = konfig.haToken ? t('ph.tokenReplace') : t('ph.tokenEmpty');
  for (const button of el('zust')?.querySelectorAll('button') || []) {
    button.textContent = stateLabel(locale, button.dataset.state);
  }
  const sprache = el('sprache');
  if (sprache) feldSetze(sprache, konfig.lang || 'auto');
  const ruhe = el('caption-ruhe');
  if (ruhe) ruhe.setAttribute('aria-label', t('caption.restore'));
  for (const a of document.querySelectorAll('a.ext-help')) {
    a.href = hilfeUrl(a.dataset.help);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', t('help.external'));
  }
  const version = el('version');
  if (version) {
    version.textContent = `v${VERSION}`;
    version.href = LINKS.changelog;
  }
  const projekt = el('link-projekt');
  if (projekt) projekt.href = LINKS.credits;
  const profil = el('profil-name');
  if (profil) profil.textContent = t(aktiveKlasse() === 'phone' ? 'settings.profilePhone' : 'settings.profileTablet');
  const idea = el('link-idea');
  if (idea) idea.href = LINKS.idea;
  syncRepoLinks();
  const hvuz = el('link-hvuz');
  if (hvuz) hvuz.href = LINKS.hvuz;
  syncDemoHinweis();
  syncDemoSperre();
  zeichneEigene();
  zeichneStates();
  syncLang();
  syncUhr();
  setStatus({ status: haStatus, meldung: haMeldung });
  if (blattOffen) aktualisiereDetails();
  if (captionState === 'track' && jetztText) zeigeZeile('track', { halten: true });
  else if (captionState && captionState !== 'track' && (el('caption').classList.contains('is-on') || el('caption').classList.contains('is-hold'))) {
    zeigeZeile(captionState, { halten: captionState === 'stoerung' || captionState === 'zuhoeren', leise: captionState === 'stoerung' });
  }
}

const SPERRE_FELDER = ['ha-url', 'ha-token', 'ha-entity', 'media-entity', 'tuer-entity', 'kamera-entity', 'sk-musik-an', 'sk-musik-aus', 'sk-licht-an', 'sk-licht-aus', 'eigene-label', 'eigene-ziel', 'dash-weather', 'dash-temp', 'dash-cal', 'dash-waste', 'dash-windows', 'dash-indoor', 'dash-rain', 'dash-wind', 'dash-bright', 'dash-alloff', 'dash-guard-toggle', 'dash-guard', 'dash-contacts', 'dash-groups', 'dash-energy', 'dash-energy-day', 'dash-energy-grid', 'dash-energy-feed', 'dash-energy-auto', 'dash-buttons'];

function syncDemoSperre() {
  const an = demoSperre(location.hostname);
  for (const id of SPERRE_FELDER) {
    const node = el(id);
    if (node) node.readOnly = an;
  }
  const note = el('demo-sperre');
  if (note) {
    note.hidden = !an;
    note.textContent = t('demo.locked');
  }
  const popZiel = el('aktion-pop-ziel');
  if (popZiel) popZiel.readOnly = an;
}

function clearBored() {
  clearTimeout(boredTimer);
  boredTimer = 0;
}

function syncRuhe() {
  const ruhe = el('caption-ruhe');
  const node = el('caption');
  if (!ruhe || !node) return;
  const sichtbar = node.classList.contains('is-on') || node.classList.contains('is-hold');
  ruhe.hidden = einstellungenOffen || blattOffen || sichtbar;
}

function syncCaptionPlatz() {
  const node = el('caption');
  const an = !!(node && (node.classList.contains('is-on') || node.classList.contains('is-hold')));
  document.body.classList.toggle('caption-live', an);
}

function hideCaption() {
  const node = el('caption');
  if (!node) return;
  node.classList.remove('is-on', 'is-hold', 'is-alarm', 'is-quiet');
  el('caption-hit')?.replaceChildren();
  node.removeAttribute('aria-label');
  captionState = '';
  syncRuhe();
  syncCaptionPlatz();
}

function zeigeZeile(state, { halten = false, leise = false } = {}) {
  const line = state === 'track' ? { text: jetztText } : captionLine(locale, state, konfig.states);
  const node = el('caption');
  const hit = el('caption-hit');
  if (!line?.text || !node || !hit) return;
  hit.replaceChildren(document.createTextNode(line.text));
  if (line.dots) {
    const dots = document.createElement('span');
    dots.className = 'punkte';
    dots.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) dots.appendChild(document.createElement('i'));
    hit.append(dots);
  }
  node.setAttribute('aria-label', line.dots ? `${line.text}…` : line.text);
  node.classList.remove('is-on', 'is-hold');
  node.classList.toggle('is-alarm', state === 'angry');
  node.classList.toggle('is-quiet', !!leise);
  void node.offsetWidth;
  node.classList.add(halten ? 'is-hold' : 'is-on');
  captionState = state;
  syncRuhe();
  syncCaptionPlatz();
}

function ersetzeKnoten(node, neu) {
  if (node !== neu && node.parentNode) node.parentNode.replaceChild(neu, node);
  return neu;
}

function syncRepoLinks() {
  const links = repoLinks();
  const maintainer = el('link-maintainer');
  if (maintainer) {
    if (links.maintainer) {
      const a = maintainer.tagName === 'A' ? maintainer : document.createElement('a');
      a.id = 'link-maintainer';
      a.href = links.maintainer;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'stefanvr82';
      ersetzeKnoten(maintainer, a);
    } else {
      const span = maintainer.tagName === 'SPAN' ? maintainer : document.createElement('span');
      span.id = 'link-maintainer';
      span.textContent = 'stefanvr82';
      ersetzeKnoten(maintainer, span);
    }
  }
  const paare = [
    ['link-repo', links.repo, links.repoLabel],
    ['link-sponsors', links.sponsors, links.supportLabel],
  ];
  for (const [id, href, label] of paare) {
    const node = el(id);
    if (!node) continue;
    if (href) {
      const a = node.tagName === 'A' ? node : document.createElement('a');
      a.id = id;
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.removeAttribute('data-i18n');
      a.textContent = label;
      ersetzeKnoten(node, a);
    } else {
      const span = node.tagName === 'SPAN' ? node : document.createElement('span');
      span.id = id;
      span.dataset.i18n = 'credits.soon';
      span.textContent = t('credits.soon');
      ersetzeKnoten(node, span);
    }
  }
}

function showCaption(state) {
  if (einstellungenOffen || blattOffen) return;
  if (state === 'idle') {
    if (jetztText) zeigeZeile('track', { halten: true });
    else if (konfig.caption) zeigeZeile('idle');
    return;
  }
  if (state === 'hallo') {
    zeigeZeile('hallo');
    return;
  }
  if (!konfig.caption) {
    if (captionState === 'hallo') hideCaption();
    return;
  }
  zeigeZeile(state, { halten: state === 'zuhoeren' });
}

function scheduleBored() {
  clearBored();
  if (jetztText || !konfig.caption) return;
  boredTimer = setTimeout(() => {
    if (letzterKurz === 'idle' && !ablauf && konfig.caption && !jetztText) showCaption('idle');
  }, CAPTION_TIMING.boredAfterMs);
}

function captionFuer(kurz) {
  if (kurz === 'idle') scheduleBored();
  else {
    clearBored();
    showCaption(kurz);
  }
}

function setTrack(text) {
  const vorher = jetztText;
  jetztText = text || '';
  if (einstellungenOffen || blattOffen) {
    syncRuhe();
    return;
  }
  if (jetztText) {
    const zeile = el('caption');
    const sichtbar = zeile && (zeile.classList.contains('is-on') || zeile.classList.contains('is-hold'));
    const aktiv = captionState && captionState !== 'idle' && captionState !== 'track' && captionState !== 'tickle' && sichtbar;
    if (!aktiv) zeigeZeile('track', { halten: true });
    else syncRuhe();
  } else if (vorher && captionState === 'track') {
    hideCaption();
    if (konfig.caption && letzterKurz !== 'idle') showCaption(letzterKurz);
    else scheduleBored();
  } else syncRuhe();
}

function onMedien(aktion) {
  try {
    medienZustand = aktion || null;
    medienAttr = aktion?.attr || null;
    medienState = aktion?.state || '';
    if (sollMusikOeffnen(letzterKurz, aktion?.state, aktion?.quelle)) oeffneMusikAnsicht();
    planeMusikRuhe(aktion?.state, aktion?.quelle);
    const urlVorschau = aktion?.quelle === 'url' || aktion?.quelle === 'api';
    if (!konfig.nowPlaying || (!urlVorschau && !konfig.mediaEntity)) {
      if (jetztText && jetztText !== DEMO_LINE) setTrack('');
      if (detailArt === 'music') syncMusikPanel();
      return;
    }
    setTrack(jetztLaeuft(aktion?.state, aktion?.attr) || '');
    if (detailArt === 'music') syncMusikPanel();
  } catch {
    setTrack('');
  }
}

function syncLang() {
  const de = el('sheet-de');
  const en = el('sheet-en');
  if (de) de.setAttribute('aria-pressed', locale === 'de' ? 'true' : 'false');
  if (en) en.setAttribute('aria-pressed', locale === 'en' ? 'true' : 'false');
}

function syncUhr() {
  const node = el('uhr');
  if (!node) return;
  node.hidden = !konfig.uhr;
  if (konfig.uhr) node.textContent = uhrText();
  const gross = el('day-clock');
  if (gross && detailArt === 'day') gross.textContent = uhrText();
}

function syncSoundHint() {
  // Sound unlocks on the first touch. There is no hint on screen.
}

function seitText() {
  const sec = Math.max(0, Math.round((Date.now() - seit) / 1000));
  if (sec < 60) return sec === 1 ? t('sheet.forSecond') : t('sheet.forSeconds', { n: sec });
  const min = Math.max(1, Math.round(sec / 60));
  return min === 1 ? t('sheet.forMinute') : t('sheet.forMinutes', { n: min });
}

function befehlText() {
  if (!letzterBefehl) return t('sheet.noCommand');
  let name = letzterBefehl.spec || '';
  if (letzterBefehl.id === 'musik_an') name = t('cmd.musicOn');
  else if (letzterBefehl.id === 'musik_aus') name = t('cmd.musicOff');
  else if (letzterBefehl.id === 'licht_an') name = t('cmd.lightsOn');
  else if (letzterBefehl.id === 'licht_aus') name = t('cmd.lightsOff');
  if (!letzterBefehl.ok) name = `${name} — ${t('sheet.notSent')}`;
  return name;
}

function aktualisiereDetails() {
  const state = el('sheet-state');
  if (!state) return;
  state.textContent = stateLabel(locale, letzterKurz);
  el('sheet-since').textContent = seitText();
  el('sheet-doing').textContent = detailLine(locale, letzterKurz);
  el('sheet-ha').textContent = stoerungAn ? (captionLine(locale, 'stoerung')?.text || '') : statusText();
  el('sheet-cmd').textContent = befehlText();
}

function schreibeSchalter() {
  const paar = [
    ['caption-an', konfig.caption],
    ['sheet-caption', konfig.caption],
    ['ton', konfig.ton],
    ['sheet-ton', konfig.ton],
    ['uhr-an', konfig.uhr],
    ['sheet-uhr', konfig.uhr],
    ['np-an', konfig.nowPlaying],
    ['sheet-np', konfig.nowPlaying],
  ];
  for (const [id, an] of paar) {
    const node = el(id);
    if (node) node.checked = !!an;
  }
}

function setCaption(an) {
  konfig.caption = !!an;
  speichereKonfig(konfig);
  schreibeSchalter();
  if (!konfig.caption) {
    clearBored();
    if (captionState !== 'track') hideCaption();
    if (jetztText) zeigeZeile('track', { halten: true });
  } else if (jetztText) zeigeZeile('track', { halten: true });
  else if (letzterKurz === 'idle') scheduleBored();
  else showCaption(letzterKurz);
  syncRuhe();
}

function setTonAn(an) {
  konfig.ton = !!an;
  audio.setTon(konfig.ton);
  speichereKonfig(konfig);
  schreibeSchalter();
  syncSoundHint();
}

function setUhr(an) {
  konfig.uhr = !!an;
  speichereKonfig(konfig);
  schreibeSchalter();
  syncUhr();
}

function setNowPlaying(an) {
  konfig.nowPlaying = !!an;
  speichereKonfig(konfig);
  schreibeSchalter();
  if (!konfig.nowPlaying) setTrack('');
  else if (medienZustand) onMedien(medienZustand);
  else syncRuhe();
}

function setLang(code) {
  konfig.lang = code === 'de' || code === 'en' ? code : '';
  locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
  speichereKonfig(konfig);
  applyI18n();
}

function oeffneBlatt() {
  if (aktiveKlasse() !== 'phone' && el('stapel')) {
    oeffneDetail('status');
    return;
  }
  if (einstellungenOffen) schliesseEinstellungen();
  blattOffen = true;
  hideCaption();
  const sheet = el('sheet');
  schreibeSchalter();
  const schlaf = el('sheet-schlaf');
  if (schlaf) schlaf.value = String(Math.round(konfig.schlafSekunden / 60));
  syncLang();
  aktualisiereDetails();
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('is-open'));
  clearInterval(seitTimer);
  seitTimer = setInterval(() => { if (blattOffen) aktualisiereDetails(); }, 1000);
  syncRuhe();
}

function schliesseBlatt() {
  if (!blattOffen) return;
  blattOffen = false;
  clearInterval(seitTimer);
  const sheet = el('sheet');
  const card = el('sheet-card');
  if (card) card.style.transform = '';
  sheet.classList.remove('is-open');
  const fertig = () => {
    if (sheet.classList.contains('is-open')) return;
    sheet.hidden = true;
  };
  const ende = (ev) => {
    if (ev && ev.target !== sheet) return;
    sheet.removeEventListener('transitionend', ende);
    fertig();
  };
  sheet.addEventListener('transitionend', ende);
  setTimeout(fertig, 420);
  if (jetztText) zeigeZeile('track', { halten: true });
  else if (konfig.caption && letzterKurz !== 'idle') showCaption(letzterKurz);
  else scheduleBored();
  syncRuhe();
}

function kitzeln() {
  const canvas = el('c');
  if (!document.body.classList.contains('stage-split')) {
    canvas.classList.remove('kitzel');
    void canvas.offsetWidth;
    canvas.classList.add('kitzel');
  }
  audio.unlock().then(() => {
    audio.ton({ sound: TICKLE, s_off: 0 });
    syncSoundHint();
  }).catch(() => {});
}

function blitz(name) {
  const node = el('eck-blitz');
  if (!node) return;
  node.classList.remove('is-on');
  node.dataset.eck = name;
  void node.offsetWidth;
  node.classList.add('is-on');
}

function stopAblauf() {
  if (!ablauf) return;
  ablauf = null;
  waechter.setPause(false);
}

function merkeSchalter(kurz) {
  if (kurz === 'musik_an') musikAn = true;
  if (kurz === 'licht_an') lichtAn = true;
  if (kurz === 'licht_aus') lichtAn = false;
}

function wendeZustand(roh, { ton = true, erzwingen = false, zeile = true } = {}) {
  const kurz = mapHaState(roh);
  if (kurz === 'sprechen') {
    const alter = performance.now() - letzterWechsel;
    if (!erzwingen && letzterKurz === 'sprechen' && (ton === false || alter < 4000)) {
      waechter.beruehrt();
      return false;
    }
    stopAblauf();
    stopAlarmTon();
    waechter.beruehrt();
    augen.set(KURZ.idle);
    bildKurz = 'sprechen';
    if (!einstellungenOffen) letzterKurz = 'sprechen';
    else vorschau = true;
    letzterWechsel = performance.now();
    seit = Date.now();
    const farbe = (augen.ring && augen.ring[0]) || [255, 236, 214];
    renderer.acknowledge(farbe);
    if (zeile) captionFuer('sprechen');
    if (blattOffen) aktualisiereDetails();
    syncDemoTrack();
    syncTip();
    return true;
  }
  if (!kurz || !KURZ[kurz]) return false;
  const alter = performance.now() - letzterWechsel;
  if (!erzwingen && kurz === letzterKurz && (ton === false || alter < 4000)) {
    if (kurz === 'schlafen') waechter.einschlafen();
    else waechter.beruehrt();
    return false;
  }
  stopAblauf();
  if (kurz === 'schlafen') waechter.einschlafen();
  else waechter.beruehrt();
  augen.set(KURZ[kurz]);
  bildKurz = kurz;
  if (!einstellungenOffen) letzterKurz = kurz;
  else vorschau = true;
  letzterWechsel = performance.now();
  seit = Date.now();
  merkeSchalter(kurz);
  if (ton) tonFuer(kurz);
  const farbe = (augen.ring && augen.ring[0]) || [255, 236, 214];
  renderer.acknowledge(farbe);
  if (zeile) captionFuer(kurz);
  if (blattOffen) aktualisiereDetails();
  syncDemoTrack();
  syncTip();
  return true;
}

let alarmPuls = 0;
let alarmLeise = 0;
function stopAlarmTon() {
  clearInterval(alarmPuls);
  clearTimeout(alarmLeise);
  alarmPuls = 0;
  alarmLeise = 0;
}
function starteAlarmTon(clip) {
  stopAlarmTon();
  const stark = konfig.alarmStaerke !== 'normal';
  const n = stark ? 3 : 2;
  const gap = 0.48;
  const laut = stark ? 1 : 0.62;
  const leise = stark ? 0.22 : 0.14;
  for (let i = 0; i < n; i++) audio.ton({ sound: clip.sound, s_off: (clip.s_off || 0) + i * gap, gain: laut });
  alarmLeise = setTimeout(() => {
    if (bildKurz !== 'angry') return;
    audio.ton({ sound: clip.sound, s_off: 0, gain: leise });
    alarmPuls = setInterval(() => {
      if (bildKurz !== 'angry') { stopAlarmTon(); return; }
      audio.ton({ sound: clip.sound, s_off: 0, gain: leise });
    }, 3400);
  }, (n * gap + 1.8) * 1000);
}
function tonFuer(kurz) {
  const clip = BY[KURZ[kurz]];
  if (kurz !== 'angry') stopAlarmTon();
  if (!clip) return;
  if (kurz === 'angry' && clip.sound) { starteAlarmTon(clip); return; }
  const sound = konfig.states?.[kurz]?.sound;
  audio.ton(sound ? { ...clip, sound } : clip);
}

function hexZuRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function ringGefaerbt(ring, kurz) {
  const rgb = hexZuRgb(konfig.states?.[kurz]?.color);
  if (!rgb || !ring) return ring;
  const next = [rgb, ring[1], ring[2]];
  if (ring.length > 3) next.push(ring[3]);
  return next;
}

function settingsRing(now) {
  const breath = 0.14 + 0.045 * (0.5 + 0.5 * Math.sin((now / 1000) * (Math.PI * 2 / 9)));
  return [[176, 198, 206], breath, null];
}

function syncDemoTrack() {
  const gezeigt = ablauf ? KURZ_VON_CLIP[ablauf.c?.name] : (bildKurz === 'settings' ? letzterKurz : bildKurz);
  const kurz = gezeigt;
  const spielen = kurz === 'musik_an' && !konfig.mediaEntity && konfig.ton;
  if (spielen) {
    audio.unlock().then(() => demoMusik.start(audio.context())).catch(() => {});
    if (jetztText !== DEMO_LINE) setTrack(DEMO_LINE);
  } else if (demoMusik.playing) {
    demoMusik.stop();
    if (jetztText === DEMO_LINE) setTrack('');
  }
}

augen.onEnde = () => {
  if (ablauf || schauLaeuft) return;
  letzterKurz = 'idle';
  letzterWechsel = performance.now();
  seit = Date.now();
  scheduleBored();
  if (blattOffen) aktualisiereDetails();
};

function eingang(aktion) {
  if (schauLaeuft) return;
  const stimmeHallo = aktion.zustand === 'hallo';
  const ok = wendeZustand(aktion.zustand, { ton: aktion.ton !== false && !stimmeHallo });
  if (ok && stimmeHallo && aktion.ton !== false && konfig.ton) {
    audio.unlock().then(() => playChirps(audio.context())).catch(() => {});
  }
  if (sollMusikOeffnen(aktion.zustand, medienState, aktion.quelle)) oeffneMusikAnsicht();
}

function feuereBefehl(id) {
  const befehl = BEFEHLE[id];
  if (!befehl) return false;
  const gezeigt = wendeZustand(befehl.zustand, { ton: true, erzwingen: true });
  const spec = konfig[befehl.scriptKey];
  const ok = ha?.callScript(spec) ?? false;
  if (!ha?.mock) {
    setStatus({
      status: haStatus,
      meldung: ok ? `called:${spec}` : (ha ? 'eyesOnly' : 'eyesOnlyOffline'),
    });
  }
  letzterBefehl = { id, spec, ok, gezeigt };
  if (blattOffen) aktualisiereDetails();
  return ok;
}

function rufeDienst(spec) {
  const ok = ha?.callScript(spec) ?? false;
  letzterBefehl = { id: 'service', spec, ok, gezeigt: false };
  if (!ha?.mock) {
    setStatus({
      status: haStatus,
      meldung: ok ? `called:${spec}` : (ha ? 'eyesOnly' : 'eyesOnlyOffline'),
    });
  } else if (blattOffen) aktualisiereDetails();
  if (waechter.schlaeft) aufwachen();
  else waechter.beruehrt();
  return ok;
}

function aufwachen() {
  if (!waechter.schlaeft) {
    waechter.beruehrt();
    return;
  }
  wendeZustand('hallo', { ton: true, erzwingen: true });
}

function musikUmschalten() {
  musikAn = !musikAn;
  feuereBefehl(musikAn ? 'musik_an' : 'musik_aus');
}

function lichtUmschalten() {
  lichtAn = !lichtAn;
  feuereBefehl(lichtAn ? 'licht_an' : 'licht_aus');
}

function fuehreAktion(aktion) {
  if (!aktion || aktion.art === 'none') {
    if (waechter.schlaeft) aufwachen();
    else waechter.beruehrt();
    return false;
  }
  if (aktion.art === 'music_toggle') { toggleMusik(); return true; }
  if (aktion.art === 'light_toggle') { lichtUmschalten(); return true; }
  if (aktion.art === 'service') { rufeDienst(aktion.ziel); bestaetige(); return true; }
  if (aktion.art === 'clock') { setUhr(!konfig.uhr); waechter.beruehrt(); bestaetige(); return true; }
  if (aktion.art === 'caption') { setCaption(!konfig.caption); waechter.beruehrt(); bestaetige(); return true; }
  if (aktion.art === 'sheet') { oeffneBlatt(); waechter.beruehrt(); bestaetige(); return true; }
  if (aktion.art === 'settings') { oeffneEinstellungen(); return true; }
  if (aktion.art === 'demo') { toggleDemo(); bestaetige(); return true; }
  if (aktion.art === 'view') {
    const i = MODI.indexOf(renderer.mode);
    const next = MODI[(i + 1) % MODI.length];
    konfig.modus = next;
    setModus(next);
    speichereKonfig(konfig);
    waechter.beruehrt();
    bestaetige();
    return true;
  }
  if (aktion.art === 'dashboard') { toggleHome(); return true; }
  if (aktion.art.startsWith('own:')) {
    const item = (konfig.eigene || []).find((eintrag) => eintrag.id === aktion.art.slice(4));
    if (item) rufeDienst(item.ziel);
    bestaetige();
    return true;
  }
  return false;
}

function toggleDemo() {
  if (schauLaeuft || schauFest) {
    konfig.demo = false;
    stoppeSchau();
  } else {
    konfig.demo = true;
    starteSchau();
  }
  const box = el('demo-an');
  if (box) box.checked = !!(schauLaeuft || konfig.demo);
  speichereKonfig(konfig);
}

function nextClip() {
  ablauf.idx++;
  if (ablauf.idx >= CLIPS.length) {
    ablauf = null;
    waechter.setPause(false);
    wendeZustand('idle', { ton: false, erzwingen: true });
    return;
  }
  const c = CLIPS[ablauf.idx];
  ablauf.c = c;
  ablauf.gen = clipPoses(c, ABL_FPS);
  ablauf.acc = 0;
  ablauf.cur = ablauf.gen.next().value;
  const kurz = KURZ_VON_CLIP[c.name];
  bildKurz = kurz || bildKurz;
  if (kurz) tonFuer(kurz);
  else audio.ton(c);
  syncDemoTrack();
  syncTip();
  if (kurz && kurz !== 'idle') {
    clearBored();
    showCaption(kurz);
  }
}

function startAblauf() {
  stopAblauf();
  ablauf = { idx: -1 };
  waechter.setPause(true);
  nextClip();
}

const GLYPH = {
  idle: ['', ''], schlafen: ['', ''], musik_an: ['♪', 'is-note'],
  nachdenken: ['...', 'is-dots'], zuhoeren: ['~', 'is-wave'], hallo: ['Hi', ''],
  blicke: ['..', ''], verstanden: ['OK', ''], erledigt: ['OK', ''],
  nicht_verstanden: ['?', ''], fehler: ['!', ''], lachen: ['Ha', ''],
  licht_an: ['On', ''], licht_aus: ['Off', ''], angry: ['!!', ''],
};

function syncGlyph() {
  const node = el('state-glyph');
  if (!node) return;
  const paar = GLYPH[bildKurz] || ['', ''];
  const an = !!(ui.label && paar[0] && !einstellungenOffen && !blattOffen && !dashOffen);
  node.hidden = !an;
  if (!an) return;
  if (node.textContent !== paar[0]) node.textContent = paar[0];
  node.className = paar[1] || '';
}

function syncSchlafZeile() {
  const node = el('caption');
  const hit = el('caption-hit');
  if (!node || !hit) return;
  const zeigen = bildKurz === 'schlafen' && !einstellungenOffen && !blattOffen && !dashOffen;
  if (!zeigen) {
    if (node.classList.contains('is-sleep')) {
      node.classList.remove('is-sleep', 'is-hold');
      hit.textContent = '';
      syncCaptionPlatz();
      syncRuhe();
    }
    return;
  }
  if (node.classList.contains('is-sleep') && hit.childNodes.length) return;
  hit.textContent = '';
  const wort = 'Zzzzzz...';
  for (let i = 0; i < wort.length; i++) {
    const letter = document.createElement('i');
    letter.textContent = wort.charAt(i);
    letter.style.animationDelay = `${i * 0.12}s`;
    hit.appendChild(letter);
  }
  node.classList.remove('is-on');
  node.classList.add('is-hold', 'is-sleep');
  syncCaptionPlatz();
  syncRuhe();
}

function syncDemoHinweis() {
  document.body.classList.toggle('is-demo', demoBesuch(konfig, location, q));
}

function syncEck() {
  const n = konfig.eckGroesse || 128;
  document.documentElement.style.setProperty('--eck', `${n}px`);
}

function safeInset() {
  const s = getComputedStyle(document.documentElement);
  const n = (name) => {
    const v = parseFloat(s.getPropertyValue(name));
    return Number.isFinite(v) ? v : 0;
  };
  return { t: n('--sat'), r: n('--sar'), b: n('--sab'), l: n('--sal') };
}

function eckHier(x, y) {
  return eckName(x, y, window.innerWidth, window.innerHeight, konfig.eckGroesse || 128, safeInset());
}

let last = performance.now();
let lastDraw = 0;
function frame(now) {
  tickSchau(now);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let pose;
  let ring;
  let text = '';
  if (ablauf) {
    ablauf.acc += dt;
    while (ablauf && ablauf.acc >= 1 / ABL_FPS) {
      ablauf.acc -= 1 / ABL_FPS;
      const n = ablauf.gen.next();
      if (n.done) nextClip();
      else ablauf.cur = n.value;
    }
    if (ablauf) {
      [pose, ring] = ablauf.cur;
      text = stateLabel(locale, KURZ_VON_CLIP[ablauf.c.name] || '');
      ring = ringGefaerbt(ring, KURZ_VON_CLIP[ablauf.c.name]);
    }
  }
  if (!pose) {
    pose = augen.tick(dt);
    ring = augen.ring;
    text = stateLabel(locale, KURZ_VON_CLIP[augen.c?.name] || letzterKurz);
    if (!einstellungenOffen && waechter.tick() === 'einschlafen') wendeZustand('schlafen', { ton: true });
    if (einstellungenOffen && !ablauf && bildKurz === 'settings') ring = settingsRing(now);
    else ring = ringGefaerbt(ring, bildKurz);
  } else augen.tick(dt);
  const folgt = document.body.classList.contains('stage-split') || document.body.classList.contains('dash');
  if (folgt) {
    lookX += (lookTX - lookX) * Math.min(1, dt * 7);
    lookY += (lookTY - lookY) * Math.min(1, dt * 7);
    const m = blinkMul(now / 1000, [blinkAt]);
    pose = { ...pose, gx: lookX, gy: lookY, sy: pose.sy * m, sx: pose.sx * (1 + 0.15 * (1 - m) / (1 - P.BLINK_MIN)) };
  }
  syncGlyph();
  syncSchlafZeile();
  syncDim(dt);
  if (pose && ring && renderer.sparsam && now - lastDraw < 50) {
    requestAnimationFrame(frame);
    return;
  }
  lastDraw = now;
  const lichtKurz = ablauf ? (KURZ_VON_CLIP[ablauf.c?.name] || bildKurz) : bildKurz;
  const lichtWahl = param('licht_zustand', 'light_state');
  const lichtFest = /^(idle|zuhoeren|sprechen|bestaetigt|fehler|schlafen|nachdenken|musik)$/.test(lichtWahl || '') ? lichtWahl : '';
  const alarmStark = konfig.alarmStaerke !== 'normal';
  const befehl = lichtBefehl(lichtKurz, { fest: lichtFest, alarmStark });
  const lichtName = befehl.name;
  const lichtRgb = befehl.alarm
    ? befehl.rgb
    : ((lichtFest || lichtName === 'schlafen' || lichtName === 'sprechen') ? null : (ring && ring[0]));
  if (lichtRgb) {
    document.documentElement.style.setProperty('--accent', `rgb(${lichtRgb[0]}, ${lichtRgb[1]}, ${lichtRgb[2]})`);
  }
  const lichtFix = param('licht_t');
  const lichtProfil = param('licht_profil') || param('light') || konfig.lichtProfil || 'ruhig';
  renderer.setLicht({
    profil: lichtProfil === 'lebhaft' ? 'lebhaft' : 'ruhig',
    zustand: lichtName,
    rgb: lichtRgb,
    alarmStark,
    t: lichtFix == null || lichtFix === '' ? null : Number(lichtFix),
  });
  renderer.render(pose, ring);
  requestAnimationFrame(frame);
}

function ledAusForm() {
  renderer.ledOpt = {
    pitch: +el('pitch').value,
    h: +el('abst').value,
    T: +el('glas').value / 100,
    grid: el('raster').checked,
  };
  for (const id of ['pitch', 'abst', 'glas']) {
    const anzeige = el(id + 'v');
    if (anzeige) anzeige.textContent = el(id).value;
  }
  if (renderer.mode === 'led') renderer.resize();
}

function leseGesten() {
  const raw = {};
  for (const key of GESTEN_KEYS) {
    raw[key] = { art: feldWert(el(`g-${key}`)), ziel: el(`g-${key}-ziel`)?.value || '' };
  }
  return normGesten(raw);
}

function leseEcken() {
  const raw = {};
  for (const key of ECK_KEYS) {
    raw[key] = {
      tap: { art: feldWert(el(`c-${key}-tap`)), ziel: el(`c-${key}-tap-ziel`)?.value || '' },
      hold: { art: feldWert(el(`c-${key}-hold`)), ziel: el(`c-${key}-hold-ziel`)?.value || '' },
    };
  }
  return normEcken(raw);
}

function gesteGeaendert() {
  if (!gestenGebaut || !eckenGebaut) return;
  konfig.gesten = leseGesten();
  konfig.ecken = leseEcken();
  speichereKonfig(konfig);
}

function schreibeGesten() {
  for (const key of GESTEN_KEYS) {
    const select = el(`g-${key}`);
    const input = el(`g-${key}-ziel`);
    if (!select || !input) continue;
    input.value = konfig.gesten[key].ziel;
    input.hidden = true;
    feldSetze(select, konfig.gesten[key].art);
  }
  for (const key of ECK_KEYS) {
    for (const art of ['tap', 'hold']) {
      const select = el(`c-${key}-${art}`);
      const input = el(`c-${key}-${art}-ziel`);
      if (!select || !input) continue;
      input.value = konfig.ecken[key][art].ziel;
      input.hidden = true;
      feldSetze(select, konfig.ecken[key][art].art);
    }
  }
}

function fuelleFormular() {
  el('ha-url').value = konfig.haUrl || '';
  el('ha-token').value = '';
  el('token-loeschen').checked = false;
  el('ha-entity').value = konfig.haEntity || '';
  el('media-entity').value = konfig.mediaEntity || '';
  el('sk-musik-an').value = konfig.scriptMusikAn || '';
  el('sk-musik-aus').value = konfig.scriptMusikAus || '';
  el('sk-licht-an').value = konfig.scriptLichtAn || '';
  el('sk-licht-aus').value = konfig.scriptLichtAus || '';
  feldSetze(el('modus'), renderer.mode);
  feldSetze(el('licht-profil'), konfig.lichtProfil === 'lebhaft' ? 'lebhaft' : 'ruhig');
  feldSetze(el('alarm-staerke'), konfig.alarmStaerke === 'normal' ? 'normal' : 'stark');
  const dimNach = el('dim-nach');
  if (dimNach) dimNach.value = String(konfig.dimNachSekunden ?? 60);
  const dimStufe = el('dim-stufe');
  if (dimStufe) dimStufe.value = String(Math.round((konfig.dimStufe ?? 0.3) * 100));
  const dimVor = el('dim-vor');
  if (dimVor) dimVor.value = String(konfig.dimVorMinuten ?? 15);
  const tuer = el('tuer-entity');
  if (tuer) tuer.value = konfig.tuer || '';
  const kamera = el('kamera-entity');
  if (kamera) kamera.value = konfig.kamera || '';
  el('schlaf-min').value = String(Math.round(konfig.schlafSekunden / 60));
  el('label').checked = ui.label;
  schreibeSchalter();
  schreibeGesten();
  el('form-fehler').textContent = '';
  el('ha-token').placeholder = konfig.haToken ? t('ph.tokenReplace') : t('ph.tokenEmpty');
  const demoBox = el('demo-an');
  if (demoBox) demoBox.checked = !!konfig.demo;
  const lockBox = el('lock-an');
  if (lockBox) lockBox.checked = !!konfig.lockOn;
  const lockNeu = el('lock-neu');
  if (lockNeu) lockNeu.hidden = !lockBox?.checked;
  zeichneEigene();
  zeichneStates();
  schreibeDash();
  feldSetze(el('sprache'), konfig.lang || 'auto');
}

function zeichneEigene() {
  const wrap = el('eigene-liste');
  if (!wrap) return;
  wrap.replaceChildren();
  for (const item of konfig.eigene || []) {
    const row = document.createElement('div');
    row.className = 'eigene-zeile';
    const name = document.createElement('span');
    name.textContent = `${item.label} · ${item.ziel}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('custom.remove');
    btn.addEventListener('click', () => {
      konfig.eigene = (konfig.eigene || []).filter((eintrag) => eintrag.id !== item.id);
      konfig.gesten = normGesten(konfig.gesten, konfig.eigene);
      konfig.ecken = normEcken(konfig.ecken, konfig.eigene);
      speichereKonfig(konfig);
      zeichneEigene();
      baueGestenFelder();
      baueEckenFelder();
      schreibeGesten();
    });
    row.append(name, btn);
    wrap.append(row);
  }
}

function merkeState(kurz) {
  const color = el(`st-${kurz}-color`);
  const item = {
    en: el(`st-${kurz}-en`)?.value || '',
    de: el(`st-${kurz}-de`)?.value || '',
    color: color?.dataset.custom === '1' ? color.value : '',
    sound: feldWert(el(`st-${kurz}-sound`)) || '',
  };
  konfig.states = normStates({ ...(konfig.states || {}), [kurz]: item });
  syncTip();
}

function zeichneStates() {
  const wrap = el('state-editor');
  if (!wrap) return;
  wrap.replaceChildren();
  for (const kurz of Object.keys(KURZ)) {
    const saved = konfig.states?.[kurz] || {};
    const row = document.createElement('div');
    row.className = 'state-row';
    const title = document.createElement('strong');
    title.textContent = stateLabel(locale, kurz);
    const grid = document.createElement('div');
    grid.className = 'state-grid';
    const en = document.createElement('input');
    en.id = `st-${kurz}-en`;
    en.type = 'text';
    en.value = saved.en || '';
    en.placeholder = captionLine('en', kurz)?.text || '';
    en.addEventListener('input', () => merkeState(kurz));
    const de = document.createElement('input');
    de.id = `st-${kurz}-de`;
    de.type = 'text';
    de.value = saved.de || '';
    de.placeholder = captionLine('de', kurz)?.text || '';
    de.addEventListener('input', () => merkeState(kurz));
    const color = document.createElement('input');
    color.id = `st-${kurz}-color`;
    color.type = 'color';
    color.value = saved.color || '#ff6a00';
    if (saved.color) color.dataset.custom = '1';
    color.addEventListener('input', () => { color.dataset.custom = '1'; merkeState(kurz); });
    const sound = document.createElement('div');
    sound.id = `st-${kurz}-sound`;
    sound.className = 'wahl';
    const original = document.createElement('button');
    original.type = 'button';
    original.dataset.value = '';
    original.textContent = t('advanced.defaultSound');
    sound.append(original);
    for (const id of SOUND_IDS) {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.dataset.value = id;
      opt.textContent = id;
      sound.append(opt);
    }
    ruesteWahl(sound, () => merkeState(kurz));
    feldSetze(sound, saved.sound || '');
    for (const [input, key] of [[en, 'advanced.captionEn'], [de, 'advanced.captionDe'], [color, 'advanced.color'], [sound, 'advanced.sound']]) {
      const label = document.createElement('label');
      label.textContent = t(key);
      label.append(input);
      grid.append(label);
    }
    row.append(title, grid);
    wrap.append(row);
  }
}

function syncStage() {
  document.body.classList.toggle('is-settings', einstellungenOffen);
  document.body.classList.toggle('is-phone', aktiveKlasse() === 'phone');
  document.body.classList.toggle('stage-split', einstellungenOffen && stageQuery.matches && aktiveKlasse() !== 'phone');
  const tip = el('bot-tip');
  if (tip) tip.hidden = !document.body.classList.contains('stage-split');
  augenVorschau();
  syncTip();
}

function hilfeIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '8.25');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  circle.setAttribute('stroke-width', '1.75');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', 'M11 10.2h2V17h-2zM11 7h2v2h-2z');
  svg.append(circle, path);
  return svg;
}

function ruesteHilfe() {
  for (const a of document.querySelectorAll('a.ext-help')) {
    a.replaceChildren(hilfeIcon());
    a.addEventListener('click', (e) => e.stopPropagation());
  }
}

function klappeAbschnitte() {
  const telefon = aktiveKlasse() === 'phone';
  for (const fs of document.querySelectorAll('#form-body > fieldset')) {
    if (fs.closest('details.abschnitt')) continue;
    const details = document.createElement('details');
    details.className = 'abschnitt';
    details.open = !telefon;
    const summary = document.createElement('summary');
    const legend = fs.querySelector('legend');
    if (legend) {
      while (legend.firstChild) summary.appendChild(legend.firstChild);
      legend.remove();
    }
    details.appendChild(summary);
    fs.parentNode.insertBefore(details, fs);
    details.appendChild(fs);
  }
}

function augenVorschau() {
  const split = document.body.classList.contains('stage-split');
  const detail = document.body.classList.contains('detail');
  if (!split && !detail) {
    renderer.setPreview(null);
    return;
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const size = Math.round(detail ? Math.min(w, h) * 0.34 : Math.min(w * 0.32, h * 0.46));
  const margin = 28;
  const x = Math.max(0, w - size - margin);
  const y = Math.max(0, h - size - margin);
  renderer.setPreview({ x, y, size });
  const root = document.documentElement.style;
  root.setProperty('--preview-x', `${x}px`);
  root.setProperty('--preview-y', `${y}px`);
  root.setProperty('--preview-size', `${size}px`);
}

function platziereAugen() { augenVorschau(); }

function syncTip(key) {
  const tip = el('bot-tip');
  if (!tip || !document.body.classList.contains('stage-split')) return;
  if (key) {
    tip.textContent = t(key);
    return;
  }
  if (vorschau || ablauf) {
    const kurz = ablauf ? (KURZ_VON_CLIP[ablauf.c?.name] || bildKurz) : bildKurz;
    const line = captionLine(locale, kurz, konfig.states);
    const detail = detailLine(locale, kurz);
    tip.textContent = [line?.text, detail].filter(Boolean).join(' ');
    return;
  }
  tip.textContent = t('help.tip.ready');
}

function tipKey(node) {
  const help = node?.closest?.('[data-tip]')?.dataset.tip;
  if (help) return help;
  const id = node?.id || '';
  if (id.startsWith('g-') || id.startsWith('eigene')) return 'help.tip.gestures';
  if (id.startsWith('c-')) return 'help.tip.corners';
  if (id.startsWith('sk-')) return 'help.tip.commands';
  if (id.startsWith('ha-') || id === 'media-entity' || id === 'token-loeschen') return id === 'media-entity' ? 'help.tip.media' : 'help.tip.ha';
  if (id === 'ton' || id.startsWith('lock')) return id.startsWith('lock') ? 'help.tip.security' : 'help.tip.sound';
  if (id === 'demo-an') return 'help.tip.demo';
  if (id === 'eck-groesse') return 'help.tip.corners';
  if (id.startsWith('dash-') || node?.closest?.('#dash-group')) return 'help.tip.dashboard';
  if (id.startsWith('st-') || node?.closest?.('#advanced')) return 'help.tip.advanced';
  if (node?.closest?.('#zust, #states-group')) return 'help.tip.states';
  if (node?.closest?.('fieldset')) return 'help.tip.display';
  return 'help.tip.ready';
}

function oeffneEinstellungen() {
  if (blattOffen) schliesseBlatt();
  fuelleFormular();
  const panel = el('einstellungen');
  panel.hidden = false;
  einstellungenOffen = true;
  vorschau = !!ablauf || schauLaeuft;
  if (!schauLaeuft) hideCaption();
  if (!ablauf && !schauLaeuft) {
    augen.set('03_idle');
    bildKurz = 'settings';
  }
  syncStage();
  zeigeEinstSeite('');
  if (document.body.classList.contains('stage-split')) {
    el('c').classList.add('is-nudge');
    if (konfig.ton) audio.unlock().then(() => playNudge(audio.context())).catch(() => {});
  }
  const gesperrt = konfig.lockOn && !entsperrt;
  const gate = el('lock-gate');
  const body = el('form-body');
  if (gate) gate.hidden = !gesperrt;
  if (body) body.hidden = gesperrt;
  audio.unlock().then(() => {
    playSettingsChime(audio.context());
    syncSoundHint();
  }).catch(() => {});
  requestAnimationFrame(() => panel.classList.add('is-open'));
  (gesperrt ? el('lock-pin') : el('schliessen'))?.focus();
  syncRuhe();
}

function schliesseEinstellungen() {
  const back = letzterKurz;
  const geschoben = document.body.classList.contains('stage-split');
  const panel = el('einstellungen');
  panel.classList.remove('is-open');
  einstellungenOffen = false;
  entsperrt = false;
  vorschau = false;
  syncStage();
  if (geschoben) {
    el('c').classList.add('is-sigh');
    if (konfig.ton) audio.unlock().then(() => playSigh(audio.context())).catch(() => {});
  }
  const fertig = () => {
    if (panel.classList.contains('is-open')) return;
    panel.hidden = true;
  };
  const ende = (ev) => {
    if (ev && ev.target !== panel) return;
    panel.removeEventListener('transitionend', ende);
    fertig();
  };
  panel.addEventListener('transitionend', ende);
  setTimeout(fertig, 360);
  if (!konfig.demo) {
    stopAblauf();
    if (schauLaeuft || schauFest) stoppeSchau();
    else wendeZustand(back || 'idle', { ton: false, erzwingen: true });
  }
  if (jetztText) zeigeZeile('track', { halten: true });
  else if (konfig.caption && letzterKurz !== 'idle') showCaption(letzterKurz);
  else scheduleBored();
  syncRuhe();
}

async function speichern(event) {
  event.preventDefault();
  const fehler = el('form-fehler');
  const urlRoh = el('ha-url').value.trim();
  const url = urlRoh ? normalisiereHaUrl(urlRoh) : '';
  if (urlRoh && urlRoh !== 'mock' && !url) {
    fehler.textContent = t('err.url');
    return;
  }
  const entity = el('ha-entity').value.trim().toLowerCase();
  if (entity && !gueltigeEntity(entity)) {
    fehler.textContent = t('err.entity');
    return;
  }
  const media = el('media-entity').value.trim().toLowerCase();
  if (media && !gueltigeEntity(media)) {
    fehler.textContent = t('err.entity');
    return;
  }
  const tuerId = el('tuer-entity') ? el('tuer-entity').value.trim().toLowerCase() : konfig.tuer;
  if (tuerId && !gueltigeEntity(tuerId)) { fehler.textContent = t('err.entity'); return; }
  const kameraIdFeld = el('kamera-entity') ? el('kamera-entity').value.trim().toLowerCase() : konfig.kamera;
  if (kameraIdFeld && !gueltigeEntity(kameraIdFeld)) { fehler.textContent = t('err.entity'); return; }
  const lockWanted = !!el('lock-an')?.checked;
  const pin = el('lock-neu-pin')?.value || '';
  const again = el('lock-neu-wieder')?.value || '';
  if (lockWanted && (pin || again || !konfig.lockHash)) {
    if (pin.length < 4) { fehler.textContent = t('security.short'); return; }
    if (pin !== again) { fehler.textContent = t('security.mismatch'); return; }
  }
  const gesperrt = demoSperre(location.hostname);
  const tokenLoeschen = gesperrt || !!el('token-loeschen')?.checked;
  if (!gesperrt) {
    konfig.haUrl = url;
    konfig.haEntity = entity;
    konfig.mediaEntity = media;
    if (tokenLoeschen) konfig.haToken = '';
    else if (el('ha-token').value.trim()) konfig.haToken = el('ha-token').value.trim();
    konfig.scriptMusikAn = el('sk-musik-an').value.trim().toLowerCase();
    konfig.scriptMusikAus = el('sk-musik-aus').value.trim().toLowerCase();
    konfig.scriptLichtAn = el('sk-licht-an').value.trim().toLowerCase();
    konfig.scriptLichtAus = el('sk-licht-aus').value.trim().toLowerCase();
  }
  konfig.schlafSekunden = Math.max(0, Math.round(+el('schlaf-min').value * 60) || 0);
  konfig.ton = el('ton').checked;
  konfig.label = el('label').checked;
  konfig.caption = el('caption-an').checked;
  konfig.uhr = el('uhr-an').checked;
  konfig.nowPlaying = el('np-an').checked;
  konfig.demo = !!el('demo-an')?.checked;
  if (lockWanted && (pin || again || !konfig.lockHash)) {
    konfig.lockSalt = newSalt();
    konfig.lockHash = await hashLock(pin, konfig.lockSalt);
    konfig.lockOn = true;
  } else if (!lockWanted) {
    konfig.lockOn = false;
    konfig.lockSalt = '';
    konfig.lockHash = '';
  }
  if (el('lock-neu-pin')) el('lock-neu-pin').value = '';
  if (el('lock-neu-wieder')) el('lock-neu-wieder').value = '';
  konfig.modus = feldWert(el('modus')) || renderer.mode;
  const lichtWahl = feldWert(el('licht-profil'));
  if (lichtWahl === 'ruhig' || lichtWahl === 'lebhaft') konfig.lichtProfil = lichtWahl;
  const alarmWahl = feldWert(el('alarm-staerke'));
  konfig.alarmStaerke = alarmWahl === 'normal' ? 'normal' : 'stark';
  setAlarmStaerke(konfig.alarmStaerke);
  konfig.gesten = leseGesten();
  konfig.ecken = leseEcken();
  if (!gesperrt) konfig.dash = leseDash();
  const eckFeld = el('eck-groesse');
  if (eckFeld) {
    const n = Math.round(Number(eckFeld.value));
    konfig.eckGroesse = n >= 96 && n <= 160 ? n : 128;
  }
  if (!gesperrt) {
    konfig.tuer = tuerId && gueltigeEntity(tuerId) ? tuerId : '';
    konfig.kamera = kameraIdFeld && gueltigeEntity(kameraIdFeld) ? kameraIdFeld : '';
  }
  tuerStand = null;
  if (el('dim-nach')) konfig.dimNachSekunden = Math.max(0, Math.min(3600, Math.round(+el('dim-nach').value) || 0));
  if (el('dim-stufe')) konfig.dimStufe = Math.max(0.05, Math.min(1, (Math.round(+el('dim-stufe').value) || 30) / 100));
  if (el('dim-vor')) konfig.dimVorMinuten = Math.max(0, Math.min(180, Math.round(+el('dim-vor').value) || 0));
  const gewaehlt = feldWert(el('sprache'));
  konfig.lang = gewaehlt === 'auto' ? '' : gewaehlt;
  locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
  ui.label = konfig.label;
  audio.setTon(konfig.ton);
  waechter.setNach(konfig.schlafSekunden);
  setModus(konfig.modus);
  speichereKonfig(konfig, undefined, { tokenLoeschen });
  applyI18n();
  schreibeSchalter();
  syncUhr();
  syncSoundHint();
  el('ha-token').value = '';
  starteHa();
  syncEck();
  syncDemoHinweis();
  if (dashOffen) { dashEvents = {}; ladeDashDaten(); syncDash(); }
  if (konfig.demo && !schauLaeuft) starteSchau();
  if (!konfig.demo && (schauLaeuft || schauFest)) stoppeSchau();
  if (!konfig.demo && ablauf) stopAblauf();
  if (!konfig.nowPlaying && jetztText !== DEMO_LINE) setTrack('');
  else if (medienZustand) onMedien(medienZustand);
  schliesseEinstellungen();
  if (konfig.caption && letzterKurz === 'idle' && !jetztText) scheduleBored();
}

function onDashStates(liste) {
  if (!liste) return;
  for (const e of liste) {
    dashStates[e.entity_id] = e;
    if (konfig.tuer && e.entity_id === konfig.tuer) {
      const neu = e.state;
      if (tuerKante(tuerStand, neu)) gruesse();
      tuerStand = neu;
    }
  }
  if (dashOffen) syncDash();
}

function kameraId() {
  if (konfig.kamera) return konfig.kamera;
  if (demoBesuch(konfig, location, q)) return 'camera.courtyard';
  return '';
}

function uhrText() {
  const loc = locale === 'de' ? 'de-DE' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

function titelTeile(text) {
  const raw = String(text || '');
  const cut = raw.indexOf(', ');
  if (cut < 0) return { title: raw, artist: '' };
  return { title: raw.slice(0, cut), artist: raw.slice(cut + 2) };
}

function dashModell() {
  return baueDashboard(dashStates, konfig.dash, { events: dashEvents, forecast: dashForecast, jetzt: new Date() });
}

function syncDash() {
  const body = el('dash-body');
  const when = el('dash-when');
  if (!body || !dashOffen) return;
  const model = dashModell();
  if (when) {
    const jetzt = new Date();
    when.textContent = jetzt.toLocaleString(locale === 'de' ? 'de' : 'en', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  zeichneDashboard(body, model, t, (knopf) => {
    if (knopf && knopf.ziel) ha?.callScript(knopf.ziel);
    if (knopf && knopf.kind === 'guard' && konfig.dash.guard && dashStates[konfig.dash.guard]) {
      dashStates[konfig.dash.guard] = { ...dashStates[konfig.dash.guard], state: knopf.on ? 'off' : 'on' };
      syncDash();
    }
  });
  syncKamera();
  if (detailArt === 'day') syncTag(model);
  if (detailArt === 'music') syncMusikPanel();
  if (document.body.classList.contains('use-stapel')) zeichneStapel();
}

function syncKamera() {
  const cam = el('cam');
  if (!cam) return;
  const id = kameraId();
  const zeigen = detailArt === 'home' && !!id;
  cam.hidden = !zeigen;
  if (!zeigen) return;
  const stand = dashStates[id];
  const name = el('cam-name');
  const freund = stand && stand.attributes && stand.attributes.friendly_name;
  if (name) name.textContent = freund || (id.endsWith('courtyard') ? t('cam.courtyard') : id);
  const bild = stand && stand.attributes && stand.attributes.entity_picture;
  const img = el('cam-img');
  const view = el('cam-view');
  if (img && typeof bild === 'string' && /^https?:/i.test(bild)) {
    img.hidden = false;
    img.src = bild;
    if (view) view.hidden = true;
    const gross = el('cam-zoom-img');
    const grossView = el('cam-zoom-view');
    if (gross) { gross.hidden = false; gross.src = bild; }
    if (grossView) grossView.hidden = true;
  }
}

function syncTag(model) {
  const clock = el('day-clock');
  if (clock) clock.textContent = uhrText();
  const liste = el('day-events');
  if (!liste) return;
  const quelle = model || dashModell();
  const heute = (quelle.events || []).filter((ev) => ev.when === 'today');
  liste.replaceChildren();
  if (!heute.length) {
    const li = document.createElement('li');
    li.textContent = t('day.empty');
    liste.appendChild(li);
    return;
  }
  for (const ev of heute) {
    const li = document.createElement('li');
    li.textContent = ev.time ? `${ev.time}  ${ev.summary}` : ev.summary;
    liste.appendChild(li);
  }
}

function syncMusikPanel() {
  const teile = titelTeile(jetztText || (!konfig.mediaEntity && musikAn ? DEMO_LINE : ''));
  const title = el('np-title');
  const artist = el('np-artist');
  if (title) title.textContent = teile.title || t('display.nowPlaying');
  if (artist) artist.textContent = teile.artist;
  const play = el('np-play');
  if (play) play.textContent = (medienState === 'playing' || demoMusik.playing) ? t('np.pause') : t('np.play');
  const cover = el('np-cover');
  const bild = medienAttr && medienAttr.entity_picture;
  if (cover && typeof bild === 'string' && /^https?:/i.test(bild)) cover.style.backgroundImage = `url("${bild}")`;
  const wrap = el('np-up');
  const liste = el('np-queue');
  if (!wrap || !liste) return;
  npEintraege = naechsteEintraege(medienAttr);
  liste.replaceChildren();
  wrap.hidden = npEintraege.length === 0;
  for (let i = 0; i < npEintraege.length; i++) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.i = String(i);
    btn.textContent = npEintraege[i].label;
    li.appendChild(btn);
    liste.appendChild(li);
  }
}

function spieleNaechstes(eintrag) {
  if (!eintrag || !konfig.mediaEntity || !ha || !ha.callService) return;
  const ziel = konfig.mediaEntity;
  if (eintrag.art === 'source') ha.callService(`media_player.select_source/${ziel}`, { source: eintrag.source });
  else ha.callService(`media_player.play_media/${ziel}`, { media_content_id: eintrag.contentId, media_content_type: eintrag.contentType || 'music' });
  bestaetige();
}

async function ladeDashDaten() {
  if (!ha || !ha.anfragen) return;
  const ids = [];
  const dash = konfig.dash || {};
  for (const id of dash.calendars || []) ids.push(id);
  for (const id of dash.waste || []) if (String(id).startsWith('calendar.')) ids.push(id);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 86400000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  for (const id of ids) {
    const res = await ha.anfragen(kalenderNachricht(id, startIso, endIso));
    dashEvents[id] = ereignisseAus(res, id);
  }
  if (dash.weather) {
    const res = await ha.anfragen(wetterNachricht(dash.weather));
    const block = res && ((res.service_response && res.service_response[dash.weather]) || res[dash.weather]);
    dashForecast = block && block.forecast ? block.forecast : null;
  }
  if (dashOffen) syncDash();
}

function zeigeDetail(art) {
  detailArt = art;
  const home = el('home-panel');
  const music = el('music-panel');
  const day = el('day-panel');
  if (home) home.hidden = art !== 'home';
  if (music) music.hidden = art !== 'music';
  if (day) day.hidden = art !== 'day';
  const back = el('day-back');
  if (back) back.hidden = art !== 'day';
  if (art === 'music') syncMusikPanel();
  if (art === 'day' || art === 'home') syncDash();
}

function oeffneDetail(art) {
  if (einstellungenOffen) schliesseEinstellungen();
  if (blattOffen) schliesseBlatt();
  dashOffen = true;
  detailArt = art;
  stapelWunsch = art;
  lookTX = -0.35;
  lookTY = 0.08;
  document.body.classList.add('dash', 'detail', 'use-stapel');
  const panel = el('dash');
  const bot = el('dash-bot');
  const stapel = el('stapel');
  if (panel) panel.hidden = false;
  if (bot) bot.hidden = false;
  if (stapel) stapel.hidden = false;
  zeigeDetail(art);
  zeichneStapel();
  ladeDashDaten();
  platziereAugen();
  syncEckTreffer();
  waechter.beruehrt();
}

function oeffneDash() {
  ansicht = 'home';
  oeffneDetail('home');
}

function schliesseDash() {
  if (!dashOffen && !detailArt) return;
  dashOffen = false;
  detailArt = '';
  clearTimeout(timerZeichnen);
  document.body.classList.remove('dash', 'detail', 'use-stapel');
  kameraZoom(false);
  for (const id of ['dash', 'dash-close', 'dash-bot', 'day-back', 'home-panel', 'music-panel', 'day-panel', 'stapel']) {
    const node = el(id);
    if (node) node.hidden = true;
  }
  syncEckTreffer();
  platziereAugen();
}

let timerZeichnen = 0;
let stapelWunsch = '';

function stapelKontext() {
  const teile = titelTeile(jetztText || (!konfig.mediaEntity && musikAn ? DEMO_LINE : ''));
  const bild = medienAttr && medienAttr.entity_picture;
  return {
    dash: konfig.dash,
    states: dashStates,
    model: dashModell(),
    forecast: dashForecast,
    locale,
    t,
    jetzt: new Date(),
    jetztMs: Date.now(),
    uhr: uhrText(),
    version: VERSION,
    mediaEntity: konfig.mediaEntity,
    scriptMusikAn: konfig.scriptMusikAn,
    scriptMusikAus: konfig.scriptMusikAus,
    titel: teile.title,
    interpret: teile.artist,
    quelle: medienAttr && (medienAttr.media_album_name || medienAttr.app_name || medienAttr.source || ''),
    cover: typeof bild === 'string' && /^https?:/i.test(bild) ? bild : '',
    spielt: medienState === 'playing' || demoMusik.playing,
    musikAn,
    naechste: npEintraege || [],
    stateName: stateLabel(locale, letzterKurz),
    seit: seitText(),
    verbindung: statusText(),
    verbunden: haStatus === 'verbunden' || haStatus === 'mock',
    befehl: befehlText(),
    caption: konfig.caption,
    ton: konfig.ton,
    clockOn: konfig.uhr,
    nowPlaying: konfig.nowPlaying,
    modus: renderer.mode,
    lang: konfig.lang || locale,
    onAction: stapelAktion,
  };
}

function zeichneStapel() {
  const host = el('stapel-inhalt');
  if (!host || !dashOffen) return;
  syncMusikPanel();
  const ctx = stapelKontext();
  const liste = sichtbareAnsichten(ctx);
  if (!liste.length) return;
  const name = liste.includes(stapelWunsch) ? stapelWunsch : (liste.includes(detailArt) ? detailArt : liste[0]);
  detailArt = name;
  stapelWunsch = name;
  zeichneAnsicht(host, name, ctx);
  clearTimeout(timerZeichnen);
  if (name === 'timer') timerZeichnen = setTimeout(() => { if (dashOffen && detailArt === 'timer') zeichneStapel(); }, 1000);
}

function schrittStapel(dir) {
  const liste = sichtbareAnsichten(stapelKontext());
  const i = liste.indexOf(detailArt);
  if (i < 0 || liste.length < 2) return;
  stapelWunsch = liste[(i + dir + liste.length) % liste.length];
  detailArt = stapelWunsch;
  zeichneStapel();
}

function stapelAktion(aktion) {
  if (!aktion) return;
  if (aktion.type === 'guard') {
    const ziel = konfig.dash && konfig.dash.guardToggle;
    if (ziel) ha?.callScript(ziel);
    const id = konfig.dash && konfig.dash.guard;
    if (id && dashStates[id]) {
      dashStates[id] = { ...dashStates[id], state: dashStates[id].state === 'on' ? 'off' : 'on' };
    }
    bestaetige();
    zeichneStapel();
    return;
  }
  if (aktion.type === 'timer') {
    if (aktion.delta) timerAdd(aktion.delta);
    else timerStop();
    zeichneStapel();
    return;
  }
  if (aktion.type === 'music') {
    if (aktion.which === 'prev') musikBefehl('media_previous_track');
    else if (aktion.which === 'next') musikBefehl('media_next_track');
    else if (aktion.which === 'play') musikBefehl('media_play_pause');
    else if (aktion.which === 'toggle') musikUmschalten();
    else if (aktion.which === 'queue' && npEintraege[aktion.index]) spieleNaechstes(npEintraege[aktion.index]);
    return;
  }
  if (aktion.type === 'toggle') {
    if (aktion.key === 'caption') konfig.caption = !konfig.caption;
    if (aktion.key === 'ton') { konfig.ton = !konfig.ton; audio.setTon(konfig.ton); }
    if (aktion.key === 'uhr') konfig.uhr = !konfig.uhr;
    if (aktion.key === 'np') konfig.nowPlaying = !konfig.nowPlaying;
    speichereKonfig(konfig);
    schreibeSchalter();
    syncUhr();
    bestaetige();
    zeichneStapel();
    return;
  }
  if (aktion.type === 'mode') {
    konfig.modus = aktion.value;
    setModus(aktion.value);
    speichereKonfig(konfig);
    bestaetige();
    zeichneStapel();
    return;
  }
  if (aktion.type === 'lang') {
    konfig.lang = aktion.value;
    locale = resolveLocale({ stored: konfig.lang, nav: navigator.language });
    speichereKonfig(konfig);
    applyI18n();
    zeichneStapel();
    return;
  }
  if (aktion.type === 'settings') {
    schliesseDash();
    oeffneEinstellungen();
    return;
  }
  if (aktion.type === 'demo') starteSchau();
}

function syncEckTreffer() {
  const box = el('eck-treffer');
  if (!box) return;
  const an = document.body.classList.contains('detail');
  box.hidden = !an;
  const knoepfe = box.querySelectorAll('[data-eck]');
  for (let i = 0; i < knoepfe.length; i++) {
    const btn = knoepfe[i];
    const key = btn.getAttribute('data-eck');
    const aktion = konfig.ecken && konfig.ecken[key] && konfig.ecken[key].tap;
    const leer = !aktion || aktion.art === 'none';
    btn.style.pointerEvents = (!an || (leer && key !== 'tl')) ? 'none' : 'auto';
  }
}

function kameraZoom(an) {
  const z = el('cam-zoom');
  if (z) z.hidden = !an;
}

function normalesBild() {
  clearTimeout(musikRuheTimer);
  musikRuheTimer = 0;
  ansicht = 'normal';
  schliesseDash();
}

function oeffneMusikAnsicht() {
  if (schauLaeuft) return;
  if (letzterKurz !== 'musik_an') wendeZustand('musik_an', { ton: true, erzwingen: true });
  ansicht = 'music';
  if (dashOffen && detailArt === 'music') {
    syncMusikPanel();
    return;
  }
  oeffneDetail('music');
}

function planeMusikRuhe(state, quelle) {
  if (wiedergabeLaeuft(state)) {
    clearTimeout(musikRuheTimer);
    musikRuheTimer = 0;
    return;
  }
  if (ansicht !== 'music' || !konfig.mediaEntity || quelle === 'snapshot' || musikRuheTimer) return;
  musikRuheTimer = setTimeout(() => {
    musikRuheTimer = 0;
    if (ansicht === 'music' && !wiedergabeLaeuft(medienState)) normalesBild();
  }, MUSIK_RUHE_MS);
}

function toggleHome() {
  if (ansicht === 'home') {
    normalesBild();
    bestaetige();
    return;
  }
  ansicht = 'home';
  if (dashOffen) schliesseDash();
  bestaetige();
}

function toggleMusik() {
  if (ansicht === 'music') {
    normalesBild();
    if (musikAn) musikUmschalten();
    else bestaetige();
    return;
  }
  ansicht = 'music';
  if (dashOffen && detailArt !== 'music') schliesseDash();
  if (!musikAn) musikUmschalten();
  else bestaetige();
}

function starteTag() {
  ansicht = 'day';
  oeffneDetail('day');
}

function wischRechts() {
  if (ansicht === 'music' || ansicht === 'home') {
    oeffneDetail(ansicht);
    return true;
  }
  return false;
}

function bestaetige() {
  const farbe = (augen.ring && augen.ring[0]) || [255, 236, 214];
  renderer.acknowledge(farbe);
  if (!konfig.ton) return;
  audio.unlock().then(() => playAck(audio.context())).catch(() => {});
}

function gruesse() {
  wendeZustand('hallo', { ton: true, erzwingen: true });
  if (!konfig.ton) return;
  audio.unlock().then(() => playChirps(audio.context())).catch(() => {});
}

function syncDim(dt) {
  const node = el('dim');
  if (!node) return;
  const normal = ansicht === 'normal' && !einstellungenOffen && !blattOffen && !dashOffen && !schauFest && !schauLaeuft;
  let ziel = 1;
  if (normal) {
    ziel = helligkeit(waechter.ruhe(), konfig.schlafSekunden, konfig);
    if (waechter.schlaeft) ziel = Math.min(ziel, konfig.dimStufe || 0.3);
  }
  dimIst += (ziel - dimIst) * Math.min(1, (dt || 0.016) * 2);
  node.style.opacity = String(Math.max(0, Math.min(0.92, 1 - dimIst)));
}

function sprungSchau(schritt) {
  wendeZustand(schritt.kurz, { ton: true, erzwingen: true });
  if (schritt.musik) {
    musikAn = true;
    syncDemoTrack();
  }
}

function starteSchau() {
  clearTimeout(schauTimer);
  schauTimer = 0;
  schauFest = false;
  stopAblauf();
  konfig.demo = true;
  if (einstellungenOffen) schliesseEinstellungen();
  if (blattOffen) schliesseBlatt();
  if (dashOffen) schliesseDash();
  if (ansicht !== 'normal') normalesBild();
  schauLaeuft = true;
  schauIndex = 0;
  schauSeit = performance.now();
  waechter.setPause(true);
  const box = el('demo-an');
  if (box) box.checked = true;
  sprungSchau(demoSchritt(0));
}

function tickSchau(now) {
  if (!schauLaeuft) return;
  const schritt = demoSchritt(schauIndex);
  if (now - schauSeit < schritt.ms) return;
  if (schritt.musik) {
    musikAn = false;
    if (demoMusik.playing) demoMusik.stop();
    if (jetztText === DEMO_LINE) setTrack('');
  }
  schauIndex = schritt.naechster;
  schauSeit = now;
  sprungSchau(demoSchritt(schauIndex));
}

function stoppeSchau(zurueck) {
  clearTimeout(schauTimer);
  schauTimer = 0;
  const war = schauFest || schauLaeuft;
  schauFest = false;
  schauLaeuft = false;
  if (zurueck === false) return;
  if (!war) return;
  musikAn = false;
  if (demoMusik.playing) demoMusik.stop();
  if (jetztText === DEMO_LINE) setTrack('');
  waechter.setPause(false);
  normalesBild();
  wendeZustand('idle', { ton: false, erzwingen: true });
  syncStoerung();
}

function zeigeZonenKurz() {
  const z = el('zonen');
  if (!z) return;
  z.hidden = false;
  clearTimeout(zonenTimer);
  zonenTimer = setTimeout(() => {
    if (param('zones', 'zonen') !== '1') z.hidden = true;
  }, 2200);
}

function listeFeld(id) {
  const node = el(id);
  return node ? node.value : '';
}

function schreibeDash() {
  const d = konfig.dash || normDash(null);
  const set = (id, wert) => { const node = el(id); if (node) node.value = wert; };
  set('dash-weather', d.weather || '');
  set('dash-temp', d.outdoorTemp || '');
  set('dash-cal', (d.calendars || []).join(', '));
  set('dash-waste', (d.waste || []).join(', '));
  set('dash-windows', (d.windows || []).join(', '));
  set('dash-indoor', (d.indoor || []).join(', '));
  set('dash-rain', d.rain || '');
  set('dash-wind', d.wind || '');
  set('dash-bright', d.brightness || '');
  set('dash-alloff', d.allOff || '');
  set('dash-guard-toggle', d.guardToggle || '');
  set('dash-guard', d.guard || '');
  set('dash-contacts', d.contacts || '');
  set('dash-groups', (d.contactGroups || []).join(', '));
  set('dash-energy', d.energyPv || '');
  set('dash-energy-day', d.energyDay || '');
  set('dash-energy-grid', d.energyGrid || '');
  set('dash-energy-feed', d.energyFeed || '');
  set('dash-energy-auto', d.energyAutonomy || '');
  set('dash-buttons', (d.buttons || []).map((b) => `${b.label}|${b.ziel}`).join('\n'));
  const eck = el('eck-groesse');
  if (eck) eck.value = String(konfig.eckGroesse || 128);
}

function leseDash() {
  if (!el('dash-weather')) return konfig.dash;
  return normDash({
    weather: listeFeld('dash-weather'),
    outdoorTemp: listeFeld('dash-temp'),
    calendars: listeFeld('dash-cal'),
    waste: listeFeld('dash-waste'),
    windows: listeFeld('dash-windows'),
    indoor: listeFeld('dash-indoor'),
    rain: listeFeld('dash-rain'),
    wind: listeFeld('dash-wind'),
    brightness: listeFeld('dash-bright'),
    allOff: listeFeld('dash-alloff'),
    guardToggle: listeFeld('dash-guard-toggle'),
    guard: listeFeld('dash-guard'),
    contacts: listeFeld('dash-contacts'),
    contactsHeaderAttr: konfig.dash ? konfig.dash.contactsHeaderAttr : 'header',
    contactGroups: listeFeld('dash-groups'),
    wasteTomorrow: konfig.dash ? konfig.dash.wasteTomorrow : '',
    energyPv: listeFeld('dash-energy'),
    energyDay: listeFeld('dash-energy-day'),
    energyGrid: listeFeld('dash-energy-grid'),
    energyFeed: listeFeld('dash-energy-feed'),
    energyAutonomy: listeFeld('dash-energy-auto'),
    coldC: konfig.dash ? konfig.dash.coldC : undefined,
    buttons: listeFeld('dash-buttons'),
  });
}

function starteHa() {
  ha?.stop();
  ha = null;
  dashStates = {};
  dashEvents = {};
  dashForecast = null;
  if (q.get('ha') === 'mock' || demoBesuch(konfig, location, q)) {
    ha = mockHa(eingang, setStatus, onMedien, {
      onStates: onDashStates,
      states: mockZustaende(),
      events: mockEreignisse(),
    });
    return;
  }
  if (!konfig.haUrl) { setStatus({ status: 'aus' }); return; }
  if (!konfig.haToken) { setStatus({ status: 'aus', meldung: 'tokenMissing' }); return; }
  if (!gueltigeEntity(konfig.haEntity)) { setStatus({ status: 'aus', meldung: 'entityMissingConfig' }); return; }
  ha = verbindeHa({
    url: konfig.haUrl,
    token: konfig.haToken,
    entityId: konfig.haEntity,
    mediaEntity: konfig.mediaEntity,
    onZustand: eingang,
    onMedien,
    onStatus: setStatus,
    onStates: onDashStates,
  });
}

let wake = null;
async function wachHalte() {
  if (!('wakeLock' in navigator)) return;
  try {
    wake = await navigator.wakeLock.request('screen');
    wake.addEventListener?.('release', () => { wake = null; });
  } catch { /* no gesture yet, or unsupported */ }
}

async function vollbild() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  } catch { /* the home-screen icon is already chromeless */ }
  try { await screen.orientation?.lock?.('landscape'); } catch { /* not allowed everywhere */ }
  await wachHalte();
}

async function gesteFreigeben() {
  try { await audio.unlock(); } catch { /* sound stays off */ }
  await wachHalte();
  try { await screen.orientation?.lock?.('landscape'); } catch { /* optional */ }
  syncSoundHint();
}

const cv = el('c');
let ptr = null;
let longTimer = 0;

onZeiger(cv, 'down', (e) => {
  if (e.preventDefault) e.preventDefault();
  if (einstellungenOffen) {
    if (document.body.classList.contains('stage-split')) {
      blinkAt = performance.now() / 1000;
      kitzeln();
    }
    return;
  }
  if (blattOffen || ptr) return;
  const ecke = eckHier(e.clientX, e.clientY);
  ptr = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), id: e.pointerId, gehalten: false, ecke, schau: schauLaeuft || schauFest };
  try { cv.setPointerCapture(e.pointerId); } catch { /* mouse without capture */ }
  clearTimeout(longTimer);
  longTimer = setTimeout(() => {
    if (!ptr) return;
    ptr.gehalten = true;
    if (ptr.ecke === 'tl') adminTaps.abbruch();
    if (waechter.schlaeft) { aufwachen(); return; }
    if (ptr.ecke) {
      blitz(ptr.ecke);
      fuehreAktion(konfig.ecken[ptr.ecke].hold);
    } else fuehreAktion(konfig.gesten.long);
  }, HALTEN_MS);
});

onZeiger(cv, 'move', (e) => {
  if (e.preventDefault) e.preventDefault();
  if (!ptr || e.pointerId !== ptr.id) return;
  ptr.lx = e.clientX;
  ptr.ly = e.clientY;
  if (Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) > 24) clearTimeout(longTimer);
});

onZeiger(cv, 'up', async (e) => {
  if (!ptr || e.pointerId !== ptr.id) return;
  clearTimeout(longTimer);
  const start = ptr;
  ptr = null;
  await gesteFreigeben();
  if (start.schau) { stoppeSchau(); return; }
  if (start.gehalten || einstellungenOffen || blattOffen) return;
  // A phone sometimes reports 0,0 when the finger lifts. That looked like a swipe to the left, which changed the theme.
  let endX = e.clientX;
  let endY = e.clientY;
  if (endX === 0 && endY === 0) { endX = start.lx; endY = start.ly; }
  const dx = endX - start.x;
  const dy = endY - start.y;
  const richtung = wischAktion(dx, dy, start.y, window.innerHeight, safeInset().b);
  if (richtung === 'settings') {
    if (start.ecke === 'tl') adminTaps.abbruch();
    oeffneEinstellungen();
    return;
  }
  if (richtung) {
    if (start.ecke === 'tl') adminTaps.abbruch();
    if (dashOffen && start.x < window.innerWidth / 2) {
    if (richtung === 'left') { schliesseDash(); return; }
    if (aktiveKlasse() !== 'phone' && richtung === 'up') { schrittStapel(1); return; }
    if (aktiveKlasse() !== 'phone' && richtung === 'down') { schrittStapel(-1); return; }
  }
  if (richtung === 'right' && wischRechts()) return;
    fuehreAktion(konfig.gesten[richtung]);
    return;
  }
  const ecke = eckHier(endX, endY);
  if (start.ecke && start.ecke === ecke && Math.hypot(dx, dy) < 24) {
    if (ecke === 'tl') {
      adminTaps.tipp(performance.now(), () => {
        blitz('tl');
        if (waechter.schlaeft) aufwachen();
        oeffneEinstellungen();
      }, () => {
        if (waechter.schlaeft) aufwachen();
        else {
          blitz('tl');
          fuehreAktion(konfig.ecken.tl.tap);
        }
      });
    } else if (waechter.schlaeft) aufwachen();
    else {
      blitz(ecke);
      fuehreAktion(konfig.ecken[ecke].tap);
    }
    return;
  }
  if (waechter.schlaeft) { aufwachen(); return; }
  const zone = zoneFuer(endX, endY, window.innerWidth, window.innerHeight, konfig.eckGroesse || 128, safeInset());
  if (zone) feuereBefehl(zone);
  else waechter.beruehrt();
});

onZeiger(cv, 'cancel', () => { ptr = null; clearTimeout(longTimer); });

// Stop the browser back and forward swipes. On a phone those start at the screen edge and were leaving the page on the previous theme.
function passivFalsch(target, name, fn) {
  let modern = false;
  try {
    const probe = {};
    Object.defineProperty(probe, 'passive', { get() { modern = true; return false; } });
    window.addEventListener('passive-probe', null, probe);
    window.removeEventListener('passive-probe', null, probe);
  } catch { modern = false; }
  if (modern) target.addEventListener(name, fn, { passive: false });
  else target.addEventListener(name, fn);
}
passivFalsch(document, 'touchstart', (e) => {
  const t = e.touches && e.touches[0];
  if (!t || e.touches.length !== 1) return;
  const node = e.target;
  if (node && node.closest && node.closest('#einstellungen, #sheet, #dash-card, #credits-card, #day-back, #cam-zoom, #info-ecke')) return;
  if (t.clientX > 28 && t.clientX < window.innerWidth - 28) return;
  if (e.cancelable) e.preventDefault();
});
passivFalsch(cv, 'touchmove', (e) => { if (e.cancelable) e.preventDefault(); });
try {
  history.pushState({ eyeUi: 1 }, '', location.href);
  window.addEventListener('popstate', () => {
    try { history.pushState({ eyeUi: 1 }, '', location.href); } catch { /* sandboxed */ }
  });
} catch { /* file URL */ }

cv.addEventListener('animationend', (e) => {
  if (e.animationName === 'kitzel' || e.animationName === 'nudge' || e.animationName === 'sigh') {
    cv.classList.remove('kitzel', 'is-nudge', 'is-sigh');
  }
});

addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') {
    if (!el('cam-zoom')?.hidden) { kameraZoom(false); return; }
    if (ansicht === 'day') { normalesBild(); return; }
    if (dashOffen) schliesseDash();
    else if (blattOffen) schliesseBlatt();
    else schliesseEinstellungen();
    return;
  }
  if (einstellungenOffen || blattOffen || dashOffen) return;
  const ziel = e.target;
  if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'SELECT' || ziel.tagName === 'TEXTAREA')) return;
  if (e.key === 'i') { oeffneEinstellungen(); return; }
  await gesteFreigeben();
  const keys = Object.keys(KURZ);
  const i = '1234567890qwer'.indexOf(e.key);
  if (i >= 0 && i < keys.length) wendeZustand(keys[i], { ton: true, erzwingen: true });
  else if (e.key === ' ') { e.preventDefault(); if (schauLaeuft || schauFest) stoppeSchau(); else starteSchau(); }
  else if (e.key === 'm') setModus(MODI[(MODI.indexOf(renderer.mode) + 1) % MODI.length]);
  else if (e.key === 'ArrowRight') { e.preventDefault(); if (!wischRechts()) fuehreAktion(konfig.gesten.right); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); fuehreAktion(konfig.gesten.left); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); fuehreAktion(konfig.gesten.up); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); fuehreAktion(konfig.gesten.down); }
});

function uebernehmeProfil() {
  const geladen = ladeKonfig(q, undefined, siteDatei, location);
  Object.assign(konfig, geladen);
  if (istDemoHost(location.hostname)) {
    konfig.haToken = '';
    vergissToken();
  }
  if (demoBesuch(konfig, location, q)) {
    konfig.demo = true;
    if (istStandardEcken(konfig.ecken)) konfig.ecken = normEcken(ECKEN_DEMO, konfig.eigene);
  }
}

function syncGeraet() {
  const neu = geraetJetzt();
  if (neu !== aktiveKlasse()) {
    setzeKlasse(neu);
    uebernehmeProfil();
    for (const node of document.querySelectorAll('details.abschnitt')) node.open = neu !== 'phone';
    applyI18n();
    schreibeSchalter();
    setModus(startModus());
  }
  document.body.classList.toggle('is-phone', aktiveKlasse() === 'phone');
  syncStage();
}

addEventListener('resize', () => {
  renderer.resize();
  syncGeraet();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    last = performance.now();
    wachHalte();
    syncUhr();
  }
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
onZeiger(document, 'down', () => { gesteFreigeben(); }, true);

el('caption').addEventListener('animationend', (e) => {
  if (e.animationName !== 'caption-life') return;
  el('caption').classList.remove('is-on');
  const fertig = captionState;
  captionState = '';
  syncCaptionPlatz();
  if (jetztText && !blattOffen && !einstellungenOffen) zeigeZeile('track', { halten: true });
  else if (fertig !== 'idle' && letzterKurz === 'idle' && !blattOffen && !einstellungenOffen) scheduleBored();
  else syncRuhe();
});

el('caption-hit').addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  kitzeln();
  oeffneBlatt();
});
el('caption-ruhe').addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!konfig.caption) {
    setCaption(true);
    kitzeln();
    return;
  }
  kitzeln();
  oeffneBlatt();
});

const sheet = el('sheet');
const card = el('sheet-card');
let zug = null;
onZeiger(sheet, 'down', (e) => {
  if (e.target === sheet) schliesseBlatt();
});
onZeiger(card, 'down', (e) => {
  if (e.target.closest('input, select, textarea, button, a, label')) return;
  zug = { y: e.clientY, id: e.pointerId, sc: card.scrollTop };
});
onZeiger(card, 'move', (e) => {
  if (!zug || zug.id !== e.pointerId) return;
  const dy = e.clientY - zug.y;
  if (zug.sc <= 0 && dy > 0) card.style.transform = `translateY(${dy}px)`;
});
function zugEnde(e) {
  if (!zug || (e && zug.id !== e.pointerId)) return;
  const dy = e ? e.clientY - zug.y : 0;
  zug = null;
  card.style.transform = '';
  if (dy > 72) schliesseBlatt();
}
onZeiger(card, 'up', zugEnde);
onZeiger(card, 'cancel', () => { zug = null; card.style.transform = ''; });

el('form').addEventListener('submit', speichern);
el('schliessen').addEventListener('click', schliesseEinstellungen);
onZeiger(el('einstellungen'), 'down', (e) => {
  if (e.target === el('einstellungen')) schliesseEinstellungen();
});
el('ablauf').addEventListener('click', async () => {
  await gesteFreigeben();
  konfig.demo = true;
  const box = el('demo-an');
  if (box) box.checked = true;
  if (!schauLaeuft) starteSchau();
});
el('demo-an')?.addEventListener('change', () => {
  if (el('demo-an').checked) {
    konfig.demo = true;
    speichereKonfig(konfig);
    if (!schauLaeuft) starteSchau();
  } else if (schauLaeuft || schauFest) toggleDemo();
  else { konfig.demo = false; speichereKonfig(konfig); }
});
el('lock-an')?.addEventListener('change', () => {
  const neu = el('lock-neu');
  if (neu) neu.hidden = !el('lock-an').checked;
  syncTip('help.tip.security');
});
el('eigene-add')?.addEventListener('click', () => {
  if (demoSperre(location.hostname)) return;
  const label = el('eigene-label').value.trim();
  const ziel = el('eigene-ziel').value.trim();
  if (!label || !ziel || !dienstAus(ziel)) return;
  konfig.eigene = normEigene([...(konfig.eigene || []), { id: `a${Date.now().toString(36)}`, label, ziel }]);
  el('eigene-label').value = '';
  el('eigene-ziel').value = '';
  speichereKonfig(konfig);
  zeichneEigene();
  baueGestenFelder();
  baueEckenFelder();
  schreibeGesten();
});
el('state-reset')?.addEventListener('click', () => {
  konfig.states = {};
  speichereKonfig(konfig);
  zeichneStates();
  syncTip();
});
el('lock-ok')?.addEventListener('click', async () => {
  const ok = await pruefeLock(el('lock-pin').value, konfig.lockSalt, konfig.lockHash);
  const fehler = el('lock-fehler');
  if (!ok) {
    if (fehler) fehler.textContent = t('security.wrong');
    return;
  }
  entsperrt = true;
  el('lock-pin').value = '';
  if (fehler) fehler.textContent = '';
  el('lock-gate').hidden = true;
  el('form-body').hidden = false;
});
function oeffneCredits() { const node = el('credits'); if (node) node.hidden = false; }
function schliesseCredits() { const node = el('credits'); if (node) node.hidden = true; }
el('credits-open')?.addEventListener('click', oeffneCredits);
el('sheet-credits')?.addEventListener('click', () => { schliesseBlatt(); oeffneCredits(); });
el('credits-close')?.addEventListener('click', schliesseCredits);
onZeiger(el('credits'), 'down', (e) => { if (e.target === el('credits')) schliesseCredits(); });
el('form')?.addEventListener('focusin', (e) => syncTip(tipKey(e.target)));
onZeiger(el('form'), 'over', (e) => {
  if (e.target.closest('input, select, button, label, summary, a')) syncTip(tipKey(e.target));
});
onZeiger(document, 'move', (e) => {
  if (!document.body.classList.contains('stage-split') && !document.body.classList.contains('dash')) return;
  const r = el('c').getBoundingClientRect();
  if (!r.width) return;
  lookTX = Math.max(-0.9, Math.min(0.9, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.45)));
  lookTY = Math.max(-0.75, Math.min(0.75, ((r.top + r.height / 2) - e.clientY) / (r.height * 0.45)));
});
if (stageQuery.addEventListener) stageQuery.addEventListener('change', syncStage);
else if (stageQuery.addListener) stageQuery.addListener(syncStage);
const touchUi = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(hover: none), (pointer: coarse)').matches;
document.documentElement.classList.toggle('is-touch', touchUi);
el('vollbild').addEventListener('click', vollbild);
function ruesteWahl(node, onPick) {
  if (!node) return;
  const buttons = node.querySelectorAll('button');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', () => {
      feldSetze(node, buttons[i].dataset.value);
      if (onPick) onPick(buttons[i].dataset.value);
    });
  }
}
ruesteWahl(el('modus'), (value) => {
  konfig.modus = value;
  setModus(value);
  speichereKonfig(konfig);
});
ruesteWahl(el('sprache'), (value) => setLang(value === 'auto' ? '' : value));
ruesteWahl(el('licht-profil'), (value) => {
  konfig.lichtProfil = value === 'lebhaft' ? 'lebhaft' : 'ruhig';
  renderer.setLicht({ profil: konfig.lichtProfil });
  speichereKonfig(konfig);
});
ruesteWahl(el('alarm-staerke'), (value) => {
  konfig.alarmStaerke = value === 'normal' ? 'normal' : 'stark';
  setAlarmStaerke(konfig.alarmStaerke);
  speichereKonfig(konfig);
});
function zeigeEinstSeite(name) {
  const home = el('einst-home');
  const back = el('einst-back-row');
  const seiten = document.querySelectorAll('#form-body [data-seite]');
  if (home) home.hidden = !!name;
  if (back) back.hidden = !name;
  for (let i = 0; i < seiten.length; i++) seiten[i].hidden = seiten[i].getAttribute('data-seite') !== name;
  const abschnitte = document.querySelectorAll('#form-body details.abschnitt');
  for (let i = 0; i < abschnitte.length; i++) {
    const fs = abschnitte[i].querySelector('[data-seite]');
    const match = !!(name && fs && fs.getAttribute('data-seite') === name);
    abschnitte[i].hidden = !match;
    if (match) abschnitte[i].open = true;
    const summary = abschnitte[i].querySelector('summary');
    if (summary && !summary.textContent.trim()) summary.hidden = true;
  }
  const namen = {
    anzeige: 'set.display', ton: 'set.sleep', gesten: 'set.gestures', ansichten: 'set.views',
    ha: 'set.ha', erweitert: 'set.advanced', sicherheit: 'set.security',
  };
  const titel = el('einst-seite-titel');
  if (titel) titel.textContent = name && namen[name] ? t(namen[name]) : '';
  if (name) return;
  const set = (id, text) => { const n = el(id); if (n) n.textContent = text || ''; };
  const mode = renderer.mode === '2d' ? t('mode.cube') : renderer.mode === 'led' ? t('mode.fortune') : t('mode.bold');
  const licht = konfig.lichtProfil === 'lebhaft' ? t('light.lebhaft') : t('light.ruhig');
  set('einst-wert-anzeige', `${mode} · ${licht}`);
  set('einst-wert-ton', konfig.schlafSekunden ? `${Math.round(konfig.schlafSekunden / 60)} min` : t('set.never'));
  set('einst-wert-ha', t(`status.${haStatus}`) || '');
  set('einst-wert-sicherheit', konfig.lockOn ? t('security.lock') : '');
}
el('einst-home')?.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('button');
  if (btn && btn.dataset.ziel) zeigeEinstSeite(btn.dataset.ziel);
});
el('einst-back')?.addEventListener('click', () => zeigeEinstSeite(''));
el('ton').addEventListener('change', () => setTonAn(el('ton').checked));
el('sheet-ton').addEventListener('change', () => setTonAn(el('sheet-ton').checked));
el('label').addEventListener('change', () => {
  ui.label = el('label').checked;
  konfig.label = ui.label;
  speichereKonfig(konfig);
});
el('caption-an').addEventListener('change', () => setCaption(el('caption-an').checked));
el('sheet-caption').addEventListener('change', () => setCaption(el('sheet-caption').checked));
el('uhr-an').addEventListener('change', () => setUhr(el('uhr-an').checked));
el('sheet-uhr').addEventListener('change', () => setUhr(el('sheet-uhr').checked));
el('np-an').addEventListener('change', () => setNowPlaying(el('np-an').checked));
el('sheet-np').addEventListener('change', () => setNowPlaying(el('sheet-np').checked));
el('sheet-de').addEventListener('click', () => setLang('de'));
el('sheet-en').addEventListener('click', () => setLang('en'));
el('sheet-schlaf').addEventListener('change', () => {
  konfig.schlafSekunden = Math.max(0, Math.round(+el('sheet-schlaf').value * 60) || 0);
  waechter.setNach(konfig.schlafSekunden);
  speichereKonfig(konfig);
  el('schlaf-min').value = String(Math.round(konfig.schlafSekunden / 60));
});
el('sheet-mehr').addEventListener('click', () => {
  schliesseBlatt();
  oeffneEinstellungen();
});
el('sheet-demo')?.addEventListener('click', () => {
  schliesseBlatt();
  if (schauTimer || schauFest || schauLaeuft) stoppeSchau();
  else starteSchau();
});
el('uhr')?.addEventListener('click', () => {
  if (ansicht === 'day') normalesBild();
  else starteTag();
});
el('day-back')?.addEventListener('click', () => normalesBild());
el('cam')?.addEventListener('click', () => kameraZoom(true));
el('cam-zoom-hit')?.addEventListener('click', () => kameraZoom(false));
function musikBefehl(dienst) {
  if (konfig.mediaEntity) {
    ha?.callScript(`media_player.${dienst}/${konfig.mediaEntity}`);
    bestaetige();
    return;
  }
  if (dienst === 'media_play_pause') {
    if (demoMusik.playing) demoMusik.stop();
    else audio.unlock().then(() => demoMusik.start(audio.context())).catch(() => {});
    syncMusikPanel();
  }
  bestaetige();
}
el('np-prev')?.addEventListener('click', () => musikBefehl('media_previous_track'));
el('np-play')?.addEventListener('click', () => musikBefehl('media_play_pause'));
el('np-next')?.addEventListener('click', () => musikBefehl('media_next_track'));
el('np-queue')?.addEventListener('click', (e) => {
  let node = e.target;
  while (node && node !== e.currentTarget) {
    if (node.tagName === 'BUTTON' && node.dataset && node.dataset.i != null) break;
    node = node.parentNode;
  }
  if (!node || node === e.currentTarget) return;
  const idx = parseInt(node.dataset.i, 10);
  if (npEintraege && npEintraege[idx]) spieleNaechstes(npEintraege[idx]);
});
for (const id of ['pitch', 'abst', 'glas', 'raster']) el(id).addEventListener('input', ledAusForm);

for (const kurz of Object.keys(KURZ)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.state = kurz;
  button.textContent = stateLabel(locale, kurz);
  button.addEventListener('click', async () => {
    await gesteFreigeben();
    wendeZustand(kurz, { ton: true, erzwingen: true });
  });
  el('zust').appendChild(button);
}

if (param('zones', 'zonen') === '1') el('zonen').hidden = false;
ruesteHilfe();
klappeAbschnitte();
document.body.classList.toggle('is-phone', aktiveKlasse() === 'phone');
setModus(startModus());
applyI18n();
schreibeSchalter();
syncSoundHint();
syncRuhe();
starteHa();
syncEck();
syncDemoHinweis();
el('eck-treffer')?.addEventListener('click', (e) => {
  const btn = e.target && e.target.getAttribute ? e.target : null;
  const key = btn && btn.getAttribute('data-eck');
  if (!key || !konfig.ecken[key]) return;
  if (key === 'tl') {
    adminTaps.tipp(performance.now(), () => {
      blitz('tl');
      if (waechter.schlaeft) aufwachen();
      oeffneEinstellungen();
    }, () => {
      if (waechter.schlaeft) aufwachen();
      else {
        blitz('tl');
        fuehreAktion(konfig.ecken.tl.tap);
      }
    });
    return;
  }
  if (waechter.schlaeft) { aufwachen(); return; }
  blitz(key);
  fuehreAktion(konfig.ecken[key].tap);
});
onZeiger(el('dash-close'), 'down', () => schliesseDash());
onZeiger(el('dash-bot'), 'down', () => {
  blinkAt = performance.now() / 1000;
  if (dashOffen) schliesseDash();
});
hoereStapel();
function hoereStapel() {
  const node = el('stapel');
  if (!node) return;
  let start = null;
  onZeiger(node, 'down', (e) => {
    const ziel = e.target && e.target.closest && e.target.closest('button, a, input, textarea');
    if (ziel) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  onZeiger(node, 'up', (e) => {
    if (!start || (e.pointerId != null && e.pointerId !== start.id)) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.hypot(dx, dy) < 36) return;
    if (Math.abs(dx) > Math.abs(dy) && dx < -40) { schliesseDash(); return; }
    if (aktiveKlasse() === 'phone') return;
    if (dy < -40) schrittStapel(1);
    else if (dy > 40) schrittStapel(-1);
  });
}
el('corners-group')?.addEventListener('focusin', zeigeZonenKurz);
if (q.get('dash') === '1') oeffneDash();
const startState = param('state', 'zustand');
if (startState) wendeZustand(startState, { ton: false, erzwingen: true });
else scheduleBored();
const trackVorschau = param('track');
if (trackVorschau && konfig.nowPlaying) {
  const [title, artist, year] = trackVorschau.split('|');
  const attr = { media_title: title || '', media_artist: artist || '' };
  if (year) attr.media_year = year;
  onMedien({ typ: 'medien', state: 'playing', attr, quelle: 'url' });
}
const sequence = param('sequence', 'sequenz');
if (param('tour', 'ablauf') || (konfig.demo && !startState && !sequence)) starteSchau();
else if (sequence) {
  const namen = sequence.split(',').map((s) => s.trim()).filter(Boolean);
  const jede = Math.max(0.4, +param('sequence_s', 'sequenz_s') || 3) * 1000;
  const pause = Math.max(0, +param('sequence_pause', 'sequenz_pause') || 0.4) * 1000;
  let i = 0;
  const schritt = () => {
    if (!namen.length) return;
    const roh = namen[i % namen.length];
    i += 1;
    if (ha?.einspeisen) ha.einspeisen(roh);
    else wendeZustand(roh, { ton: true, erzwingen: true });
  };
  setTimeout(() => { schritt(); setInterval(schritt, jede); }, pause);
}

if (param('shot') === '1') {
  const probe = {
    'sensor.open_contacts': { entity_id: 'sensor.open_contacts', state: '2', attributes: { header: '2 open', friendly_name: 'Open contacts' } },
    'binary_sensor.front_door': { entity_id: 'binary_sensor.front_door', state: 'on', attributes: { friendly_name: 'Front door' } },
    'binary_sensor.kitchen_window': { entity_id: 'binary_sensor.kitchen_window', state: 'on', attributes: { friendly_name: 'Kitchen window' } },
    'sensor.outdoor_temperature': { entity_id: 'sensor.outdoor_temperature', state: '11', attributes: { unit_of_measurement: '°C', friendly_name: 'Outside' } },
    'sensor.living_room_temperature': { entity_id: 'sensor.living_room_temperature', state: '21.4', attributes: { unit_of_measurement: '°C', friendly_name: 'Living room' } },
    'sensor.wind_speed': { entity_id: 'sensor.wind_speed', state: '12', attributes: { unit_of_measurement: 'km/h', friendly_name: 'Wind' } },
    'binary_sensor.rain': { entity_id: 'binary_sensor.rain', state: 'off', attributes: { friendly_name: 'Rain' } },
    'sensor.pv_power': { entity_id: 'sensor.pv_power', state: '3.2', attributes: { unit_of_measurement: 'kW', friendly_name: 'PV' } },
    'sensor.energy_today': { entity_id: 'sensor.energy_today', state: '12.4', attributes: { unit_of_measurement: 'kWh', friendly_name: 'Today' } },
    'sensor.self_use': { entity_id: 'sensor.self_use', state: '78', attributes: { unit_of_measurement: '%', friendly_name: 'Self-use' } },
    'input_boolean.eye_guard': { entity_id: 'input_boolean.eye_guard', state: 'off', attributes: { friendly_name: 'Guard' } },
    'weather.home': { entity_id: 'weather.home', state: 'snowy', attributes: { temperature: 11, friendly_name: 'Home' } },
  };
  Object.assign(dashStates, probe);
  konfig.dash = normDash({
    ...konfig.dash,
    weather: 'weather.home',
    contacts: 'sensor.open_contacts',
    windows: [],
    contactGroups: ['binary_sensor.front_door', 'binary_sensor.kitchen_window'],
    outdoorTemp: 'sensor.outdoor_temperature',
    indoor: ['sensor.living_room_temperature'],
    wind: 'sensor.wind_speed',
    rain: 'binary_sensor.rain',
    energyPv: 'sensor.pv_power',
    energyDay: 'sensor.energy_today',
    energyAutonomy: 'sensor.self_use',
  });
  if (konfig.caption) zeigeZeile(bildKurz || 'idle', { halten: true });
  window.__shot = {
    open(name) { oeffneDetail(name); },
    settings() { oeffneEinstellungen(); },
    page(name) { zeigeEinstSeite(name); },
    sheet() { oeffneBlatt(); },
    credits() { oeffneCredits(); },
  };
}

setInterval(syncUhr, 1000);

const api = {
  zeige: (name) => wendeZustand(name, { ton: false, erzwingen: true }),
  haZustand: (roh) => (ha?.einspeisen ? ha.einspeisen(roh) : wendeZustand(roh, { ton: false, erzwingen: true })),
  haState: (roh) => api.haZustand(roh),
  befehl: feuereBefehl,
  modus: setModus,
  einstellungen: oeffneEinstellungen,
  blatt: () => oeffneBlatt(),
  medien: (state, attr) => onMedien({ typ: 'medien', state, attr: attr || {}, quelle: 'api' }),
  uhr: (an) => setUhr(an !== false),
  status: () => ({
    ha: haStatus,
    meldung: haMeldung,
    text: statusText(),
    zustand: letzterKurz,
    schlaeft: waechter.schlaeft,
    modus: renderer.mode,
    lang: locale,
    caption: konfig.caption,
    uhr: konfig.uhr,
    nowPlaying: konfig.nowPlaying,
    track: jetztText,
    blatt: blattOffen,
  }),
  audioStatus: () => audio.status(),
  get letzterBefehl() { return letzterBefehl; },
};
window.grokBot = api;

if ('serviceWorker' in navigator) {
  const hatte = !!navigator.serviceWorker.controller;
  let neu = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hatte || neu) return;
    neu = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

requestAnimationFrame(frame);
