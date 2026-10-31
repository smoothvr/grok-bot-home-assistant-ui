// SPDX-License-Identifier: MIT
// The face. Eyes, light, and sound. Settings live on settings.html.
import './polyfills.js';
import { makeClips, setAlarmStaerke } from './zustaende.js';
import { Augen } from './engine.js';
import { KURZ } from './namen.js';
import {
  demoBesuch, geraeteKlasse, istDemoHost, ladeKonfig, setzeKlasse, vergissToken,
} from './konfig.js';
import { ladeSiteConfig } from './siteconfig.js';
import { createAudio } from './audio.js';
import { createWaechter } from './schlaf.js';
import { Buehne } from './renderer.js';
import { onZeiger } from './zeiger.js';
import { istAltgeraet } from './power.js';
import { mapHaState, mockHa, sichereMeldung, verbindeHa } from './ha.js';
import { lichtBefehl } from './licht.js';
import { demoSchritt } from './demo.js';
import { createDemoMusic } from './demotrack.js';
import { helligkeit, tuerOffen } from './dimmen.js';
import { captionLine, resolveLocale, translate } from './strings.js';
import { anwesend, createWecker } from './wache.js';
import { ackAnHa, createHinweis } from './hinweis.js';

const q = new URLSearchParams(location.search);
const ON = await (await fetch('onsets.json')).json();
const siteDatei = await ladeSiteConfig();
const CLIPS = makeClips(ON);
const BY = Object.fromEntries(CLIPS.map((c) => [c.name, c]));
const HINWEIS_TON = '19_hinweis';
const ECK_MS = 2000;

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
if (demoBesuch(konfig, location, q)) konfig.demo = true;
let locale = resolveLocale({ query: q.get('lang'), stored: konfig.lang, nav: navigator.language });
const audio = createAudio(CLIPS, ['15_hmmm_a', '16_hmmm_b', '17_hmmm_c', '18_hmmm_d', HINWEIS_TON]);
audio.setTon(konfig.ton);
const demoMusik = createDemoMusic();
const augen = new Augen(CLIPS);
const waechter = createWaechter(konfig.schlafSekunden);
const wecker = createWecker();
const hinweis = createHinweis();
const renderer = new Buehne(document.getElementById('c'));
renderer.sparsam = q.get('power') === 'full' ? false : (q.get('power') === 'low' || istAltgeraet());
document.documentElement.classList.toggle('is-low', renderer.sparsam);
renderer.setMode('2d');

let ha = null;
let haStatus = 'aus';
let haMeldung = '';
let letzterKurz = 'idle';
let letzterWechsel = 0;
let bildKurz = 'idle';
let audioFrei = false;
let tuerAuf = false;
let hinweisQuelle = '';
let schauLaeuft = false;
let schauIndex = 0;
let schauSeit = 0;
let wachBis = 0;
let dimIst = 1;
let pauseAn = false;
let eckTimer = 0;
let eckStart = null;
let last = performance.now();
let lastDraw = 0;

function el(id) { return document.getElementById(id); }
function t(key) { return translate(locale, key); }
function param(name, alt) {
  if (q.has(name)) return q.get(name);
  if (alt && q.has(alt)) return q.get(alt);
  return null;
}
function zielId(node) {
  let n = node;
  while (n && n !== document) {
    if (n.id === 'ecke' || n.id === 'hinweis') return n.id;
    n = n.parentNode;
  }
  return '';
}

function liesZugang() {
  const neu = ladeKonfig(q, undefined, siteDatei, location);
  if (istDemoHost(location.hostname)) return { url: '', token: '' };
  return { url: neu.haUrl || '', token: neu.haToken || '' };
}

function gehoert() {
  return !!(audioFrei && audio.status().freigegeben);
}

function ersterKontakt() {
  if (audioFrei) return;
  audioFrei = true;
  syncHearHint();
  audio.unlock().catch(() => {});
}

function spieleDatei(name, gain) {
  if (!audioFrei || !konfig.ton || !name) return;
  audio.unlock().then(() => {
    if (audio.status().freigegeben) audio.ton({ sound: name, gain: gain == null ? 1 : gain });
  }).catch(() => {});
}

function istStoerung() {
  if (schauLaeuft || haStatus === 'mock') return false;
  if (haStatus === 'fehler' || haStatus === 'auth_ungueltig' || haStatus === 'getrennt') return true;
  if (haMeldung === 'tokenMissing' && konfig.haUrl) return true;
  if (haMeldung === 'tokenRejected' || haMeldung === 'connectFailed' || haMeldung === 'connectionTrouble') return true;
  return false;
}

function zeichneCaption() {
  const node = el('caption');
  if (!node) return;
  if (istStoerung() && !tuerAuf && bildKurz !== 'angry') {
    node.hidden = false;
    node.className = 'is-on';
    const zeile = captionLine(locale, 'stoerung');
    node.textContent = zeile && zeile.text ? zeile.text : 'One moment.';
    return;
  }
  if (bildKurz === 'schlafen') {
    node.hidden = false;
    node.className = 'is-on is-sleep';
    node.textContent = 'Zzzzzz...';
    return;
  }
  if (!konfig.caption || bildKurz === 'idle') {
    node.hidden = true;
    node.className = '';
    node.textContent = '';
    return;
  }
  const zeile = captionLine(locale, bildKurz, konfig.states);
  if (!zeile || !zeile.text) {
    node.hidden = true;
    node.textContent = '';
    return;
  }
  node.hidden = false;
  node.className = bildKurz === 'angry' ? 'is-on is-alarm' : 'is-on';
  node.textContent = zeile.text;
}

let alarmPuls = 0;
function stopAlarmTon() {
  clearInterval(alarmPuls);
  alarmPuls = 0;
}
function tonFuer(kurz) {
  if (!audioFrei || !konfig.ton) return;
  const clip = BY[KURZ[kurz]];
  if (!clip) return;
  audio.unlock().then(() => {
    if (!audio.status().freigegeben) return;
    if (kurz !== 'angry') stopAlarmTon();
    if (kurz === 'angry' && clip.sound) {
      audio.ton({ sound: clip.sound, gain: konfig.alarmStaerke === 'normal' ? 0.6 : 1 });
      return;
    }
    if (clip.sound) audio.ton(clip);
  }).catch(() => {});
}

function syncDemoTrack() {
  const an = schauLaeuft && bildKurz === 'musik_an';
  if (an && !demoMusik.playing && gehoert()) {
    audio.unlock().then(() => demoMusik.start(audio.context())).catch(() => {});
  } else if (!an && demoMusik.playing) demoMusik.stop();
}

function wendeZustand(roh, opt) {
  const ton = !opt || opt.ton !== false;
  const erzwingen = !!(opt && opt.erzwingen);
  const kurz = mapHaState(roh);
  if (kurz === 'wake') {
    if (tuerAuf) return false;
    const variante = wecker.impuls({ schlaeft: waechter.schlaeft, an: true, puls: true });
    if (variante) starteWecken(variante);
    return !!variante;
  }
  if (kurz === 'sprechen') {
    if (tuerAuf) return false;
    waechter.beruehrt();
    augen.set(KURZ.idle);
    bildKurz = 'sprechen';
    letzterKurz = 'sprechen';
    letzterWechsel = performance.now();
    zeichneCaption();
    return true;
  }
  if (!kurz || !KURZ[kurz]) return false;
  if (tuerAuf && kurz !== 'angry') return false;
  const alter = performance.now() - letzterWechsel;
  if (!erzwingen && kurz === letzterKurz && (!ton || alter < 4000)) {
    if (kurz === 'schlafen') waechter.einschlafen();
    else waechter.beruehrt();
    return false;
  }
  if (kurz === 'schlafen') waechter.einschlafen();
  else waechter.beruehrt();
  augen.set(KURZ[kurz]);
  bildKurz = kurz;
  letzterKurz = kurz;
  letzterWechsel = performance.now();
  if (ton) tonFuer(kurz);
  zeichneCaption();
  syncDemoTrack();
  return true;
}

function starteWecken(variante) {
  if (!variante || tuerAuf) return;
  waechter.beruehrt();
  augen.set(KURZ.idle);
  bildKurz = 'idle';
  letzterKurz = 'idle';
  letzterWechsel = performance.now();
  augen.glance = [variante.gx, variante.gy];
  augen.nextGlance = augen.now + variante.hold;
  augen.nextBlink = augen.now + variante.hold + 2;
  const warte = Math.max(0, Math.round(variante.blink * 1000));
  setTimeout(() => { augen.blinkAt = augen.now; }, warte);
  wachBis = performance.now() + variante.hold * 1000;
  spieleDatei(variante.sound, 0.75);
  zeichneCaption();
}

function zeigeHinweis(text, quelle) {
  const aktion = hinweis.setzen(text);
  const node = el('hinweis');
  const body = el('hinweis-text');
  if (aktion === 'leer') {
    if (node) node.hidden = true;
    if (body) body.textContent = '';
    return aktion;
  }
  if (aktion !== 'zeigen') return aktion;
  hinweisQuelle = quelle || 'ha';
  if (!tuerAuf) {
    waechter.beruehrt();
    if (bildKurz === 'schlafen') {
      augen.set(KURZ.idle);
      bildKurz = 'idle';
      letzterKurz = 'idle';
    }
  }
  wachBis = Math.max(wachBis, performance.now() + 1800);
  if (node) node.hidden = false;
  const label = el('hinweis-label');
  if (label) label.textContent = t('hint.forget');
  if (body) body.textContent = hinweis.text;
  spieleDatei(HINWEIS_TON, 0.45);
  zeichneCaption();
  return aktion;
}

function quittiereHinweis() {
  if (!hinweis.offen) return;
  const quelle = hinweisQuelle;
  hinweis.quittieren();
  const node = el('hinweis');
  if (node) node.hidden = true;
  const body = el('hinweis-text');
  if (body) body.textContent = '';
  if (ackAnHa(quelle) && ha && konfig.reminderAckScript) ha.callScript(konfig.reminderAckScript);
}

function zeigeDemoHinweis() {
  if (hinweis.offen && hinweisQuelle === 'ha') return;
  zeigeHinweis(t('hint.demo'), 'demo');
}

function pruefeTuer(state) {
  const offen = tuerOffen(state);
  if (offen === tuerAuf) return;
  tuerAuf = offen;
  if (offen) wendeZustand('angry', { ton: true, erzwingen: true });
  else wendeZustand('idle', { ton: false, erzwingen: true });
}

function onStates(liste) {
  if (!liste) return;
  for (let i = 0; i < liste.length; i++) {
    const e = liste[i];
    if (!e || !e.entity_id) continue;
    if (konfig.tuer && e.entity_id === konfig.tuer) pruefeTuer(e.state);
    if (!schauLaeuft && konfig.presenceEntity && e.entity_id === konfig.presenceEntity) {
      const variante = wecker.impuls({ schlaeft: waechter.schlaeft, an: anwesend(e.state) });
      if (variante) starteWecken(variante);
    }
    if (konfig.reminderEntity && e.entity_id === konfig.reminderEntity) zeigeHinweis(e.state, 'ha');
  }
}

function eingang(aktion) {
  if (!aktion || schauLaeuft) return;
  wendeZustand(aktion.zustand, { ton: aktion.ton !== false });
}

function setStatus(s) {
  if (!s) return;
  if (s.status) haStatus = s.status;
  if ('meldung' in s) haMeldung = sichereMeldung(s.meldung || '');
  zeichneCaption();
}

function syncHearHint() {
  const node = el('hear-hint');
  if (!node) return;
  node.hidden = !!audioFrei;
  if (!audioFrei) node.textContent = t('hint.hear');
}

function syncUhr() {
  const node = el('uhr');
  if (!node) return;
  node.hidden = !konfig.uhr;
  if (!konfig.uhr) return;
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  node.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function syncDim(dt) {
  const node = el('dim');
  if (!node) return;
  let ziel = helligkeit(waechter.ruhe(), konfig.schlafSekunden, konfig);
  if (waechter.schlaeft) ziel = Math.min(ziel, konfig.dimStufe || 0.3);
  if (schauLaeuft || hinweis.offen || tuerAuf) ziel = 1;
  dimIst += (ziel - dimIst) * Math.min(1, (dt || 0.016) * 2);
  node.style.opacity = String(Math.max(0, Math.min(0.92, 1 - dimIst)));
}

function syncPause() {
  const pausieren = !!(hinweis.offen || schauLaeuft || tuerAuf);
  if (pausieren === pauseAn) return;
  pauseAn = pausieren;
  waechter.setPause(pausieren);
}

function sprungSchau(schritt) {
  wendeZustand(schritt.kurz, { ton: true, erzwingen: true });
  syncDemoTrack();
}

function starteSchau() {
  schauLaeuft = true;
  schauIndex = 0;
  schauSeit = performance.now();
  waechter.setPause(true);
  pauseAn = true;
  zeigeDemoHinweis();
  sprungSchau(demoSchritt(0));
}

function tickSchau(now) {
  if (!schauLaeuft) return;
  const schritt = demoSchritt(schauIndex);
  if (now - schauSeit < schritt.ms) return;
  if (schritt.musik && demoMusik.playing) demoMusik.stop();
  schauIndex = schritt.naechster;
  schauSeit = now;
  sprungSchau(demoSchritt(schauIndex));
}

function stoppeSchau() {
  if (!schauLaeuft) return;
  schauLaeuft = false;
  if (demoMusik.playing) demoMusik.stop();
  waechter.setPause(false);
  pauseAn = !!(hinweis.offen || tuerAuf);
  if (hinweisQuelle === 'demo') {
    hinweis.quittieren();
    const node = el('hinweis');
    if (node) node.hidden = true;
  }
  wendeZustand('idle', { ton: false, erzwingen: true });
}

function eckLos() {
  if (eckTimer) clearTimeout(eckTimer);
  eckTimer = 0;
  eckStart = null;
}

function starteHa() {
  if (ha && ha.stop) ha.stop();
  ha = null;
  if (q.get('ha') === 'mock' || demoBesuch(konfig, location, q)) {
    ha = mockHa(eingang, setStatus, null, { onStates });
    return;
  }
  ha = verbindeHa({
    url: konfig.haUrl,
    token: konfig.haToken,
    entityId: konfig.haEntity,
    onZustand: eingang,
    onStatus: setStatus,
    onStates,
    liesZugang,
  });
}

function beiSicht() {
  if (document.visibilityState && document.visibilityState !== 'visible') return;
  if (ha && ha.nudge) ha.nudge();
}

function frame(now) {
  tickSchau(now);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  syncPause();
  const pose = augen.tick(dt);
  if (!pauseAn && waechter.tick() === 'einschlafen') {
    wecker.eingeschlafen();
    wendeZustand('schlafen', { ton: true });
  }
  syncDim(dt);
  if (pose && renderer.sparsam && now - lastDraw < 50) {
    requestAnimationFrame(frame);
    return;
  }
  lastDraw = now;
  let lichtKurz = bildKurz;
  if (tuerAuf || bildKurz === 'angry') lichtKurz = 'angry';
  else if (hinweis.offen || now < wachBis) lichtKurz = 'verstanden';
  const befehl = lichtBefehl(lichtKurz, { alarmStark: konfig.alarmStaerke !== 'normal' });
  renderer.setLicht({
    profil: 'lebhaft',
    zustand: befehl.name,
    rgb: befehl.rgb,
    alarmStark: konfig.alarmStaerke !== 'normal',
  });
  const ring = befehl.alarm
    ? [befehl.rgb, 1, null, 'angry']
    : (augen.ring || [[255, 106, 0], 0.2, null]);
  renderer.render(pose, ring);
  requestAnimationFrame(frame);
}

syncHearHint();
syncUhr();
setInterval(syncUhr, 1000);
starteHa();

const startState = param('state', 'zustand');
const sequence = param('sequence', 'sequenz');
if (startState) wendeZustand(startState, { ton: false, erzwingen: true });
if (param('tour', 'ablauf') || (konfig.demo && !startState && !sequence)) starteSchau();
else if (sequence) {
  const namen = sequence.split(',').map((s) => s.trim()).filter(Boolean);
  const jede = Math.max(400, (+param('sequence_s', 'sequenz_s') || 3) * 1000);
  let i = 0;
  const schritt = () => {
    if (!namen.length) return;
    const roh = namen[i % namen.length];
    i += 1;
    if (ha && ha.einspeisen) ha.einspeisen(roh);
    else wendeZustand(roh, { ton: true, erzwingen: true });
  };
  setTimeout(() => { schritt(); setInterval(schritt, jede); }, 400);
}

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('online', () => { if (ha && ha.nudge) ha.nudge(); });
window.addEventListener('pageshow', beiSicht);
document.addEventListener('visibilitychange', beiSicht);
window.addEventListener('storage', () => { if (ha && ha.nudge) ha.nudge(); });
window.addEventListener('touchstart', ersterKontakt, true);
window.addEventListener('mousedown', ersterKontakt, true);

onZeiger(el('hinweis'), 'up', () => {
  ersterKontakt();
  quittiereHinweis();
});
onZeiger(el('ecke'), 'down', (e) => {
  ersterKontakt();
  eckLos();
  eckStart = { x: e.clientX, y: e.clientY };
  eckTimer = setTimeout(() => {
    eckTimer = 0;
    location.href = 'settings.html';
  }, ECK_MS);
});
onZeiger(el('ecke'), 'up', eckLos);
onZeiger(el('ecke'), 'cancel', eckLos);
onZeiger(el('ecke'), 'move', (e) => {
  if (!eckStart) return;
  if (Math.abs(e.clientX - eckStart.x) > 28 || Math.abs(e.clientY - eckStart.y) > 28) eckLos();
});
const ecke = el('ecke');
if (ecke) {
  ecke.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    location.href = 'settings.html';
  });
}

onZeiger(document.body, 'down', (e) => {
  ersterKontakt();
  if (zielId(e.target)) return;
  if (schauLaeuft) {
    stoppeSchau();
    return;
  }
  if (waechter.schlaeft) wendeZustand('hallo', { ton: true, erzwingen: true });
  else waechter.beruehrt();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

requestAnimationFrame(frame);
