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
import { CACHE_UPDATE_MS, cacheAktualisieren, cacheUebernehmen, neuLaden, reloadImpuls } from './laden.js';
import { createWaechter } from './schlaf.js';
import { Buehne } from './renderer.js';
import { onZeiger } from './zeiger.js';
import { istAltgeraet } from './power.js';
import { mapHaState, mockHa, sichereMeldung, verbindeHa } from './ha.js';
import { lichtBefehl, stimmungSchritt } from './licht.js';
import { demoSchritt } from './demo.js';
import { createDemoMusic } from './demotrack.js';
import { helligkeit, tuerOffen } from './dimmen.js';
import { captionLine, resolveLocale, translate } from './strings.js';
import { anwesend, createWecker } from './wache.js';
import { ackAnHa, createHinweis } from './hinweis.js';
import { blickZumPunkt } from './blick.js';
import {
  ACK_POOL, FEHLER_POOL, HINWEIS_POOL, REAKTIONEN, STIMMUNG, createReaktionLauf, createStupser, istReaktion, mische, poseBei, staerke,
} from './reaktionen.js';
import { createStimme, pulsHuelle, bauePhrase } from './stimme.js';
import {
  createSchleife, ersteRunde, ohneHaus, schrittPause, sollWillkommen, tippFenster,
} from './empfang.js';
import {
  DEMO_KLINGEL_S, KLINGEL_FARBE, TESTBILD,
  augenPlatz, bildPlatz, bildSchritt, demoKlingelFaellig, haBasis, halteBis,
  kameraSrc, klingelKante, layoutSchritt, tippSchliesst, zugangToken,
} from './klingel.js';

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
audio.setLaut(konfig.lautstaerke == null ? 1.6 : konfig.lautstaerke);
const stimme = createStimme({ getDest: () => audio.ausgang() });
const reaktionen = createReaktionLauf();
const stupser = createStupser();
const demoMusik = createDemoMusic();
const augen = new Augen(CLIPS);
augen.setLebendigkeit(konfig.lebendigkeit);
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
let reaktion = null;
let scheinPulse = [];
let stoerungAktiv = false;
let druck = null;
let langTimer = 0;
let modus = 'normal';
let tippZeiten = [];
let tippGesamt = 0;
let einmal = [];
let einmalPos = 0;
let schleife = createSchleife();
let schleifeN = 0;
let schrittBis = 0;
let stimmung = null;
const LANG_MS = 720;
const reloadGesehen = { bereit: false, wert: '' };
const klingelGesehen = { bereit: false, an: false };
let klingelToken = '';
let klingelImgFertig = false;
let klingelFrisst = false;
const klingel = {
  aktiv: false,
  test: false,
  bis: 0,
  u: 0,
  ziel: 0,
  schliessen: false,
  halten: false,
  demoWeiter: false,
  stand: { art: 'aus', seit: 0, bildDa: false, gescheitert: false, token: '' },
};

function cacheObjekt() {
  try { return window.applicationCache || null; } catch (err) { return null; }
}

function cachePruefen() {
  cacheAktualisieren(cacheObjekt());
}

function seiteNeuLaden() {
  neuLaden(cacheObjekt(), () => { location.reload(); });
}

function cacheLauschen() {
  const cache = cacheObjekt();
  if (!cache) return;
  const fertig = () => {
    if (!cacheUebernehmen(cache)) return;
    location.reload();
  };
  cache.onupdateready = fertig;
  if (typeof cache.addEventListener === 'function') cache.addEventListener('updateready', fertig, false);
}

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

let reaktionHoren = '';
function ersterKontakt() {
  const neu = !audioFrei;
  if (audioFrei) return;
  audioFrei = true;
  syncHearHint();
  audio.unlock().catch(() => {});
  if (neu && reaktionHoren) {
    const id = reaktionHoren;
    reaktionHoren = '';
    spieleReaktion(id, { ton: true, erzwingen: true });
  }
}

function pegel(gain) {
  return Math.max(0, Math.min(1, gain == null ? 1 : gain));
}

function spieleDatei(name, gain) {
  if (!audioFrei || !konfig.ton || !name) return;
  audio.unlock().then(() => {
    if (audio.status().freigegeben) audio.ton({ sound: name, gain: pegel(gain) });
  }).catch(() => {});
}

function merkePulse(pulses) {
  if (!pulses || !pulses.length) return;
  const jetzt = performance.now();
  const bleiben = [];
  for (let i = 0; i < scheinPulse.length; i++) if (scheinPulse[i].at + scheinPulse[i].ms > jetzt - 40) bleiben.push(scheinPulse[i]);
  for (let i = 0; i < pulses.length; i++) bleiben.push(pulses[i]);
  scheinPulse = bleiben.length > 16 ? bleiben.slice(bleiben.length - 16) : bleiben;
}

function sag(phraseId, gain) {
  if (!phraseId || !konfig.ton) return;
  const phrase = stimme.plan(phraseId, performance.now());
  if (!phrase) return;
  const laut = Math.max(0, Math.min(1, gain == null ? 1 : gain));
  if (!audioFrei) {
    merkePulse(stimme.spiel(null, phrase, 0, performance.now()));
    return;
  }
  audio.unlock().then(() => {
    const ctx = audio.context();
    const frei = audio.status().freigegeben;
    merkePulse(stimme.spiel(frei ? ctx : null, phrase, frei ? laut : 0, performance.now()));
  }).catch(() => {});
}

function merkeStimmung(id) {
  const s = STIMMUNG[id];
  if (!s) return;
  stimmung = { rgb: s.rgb, licht: s.licht, heard: performance.now(), peak: 0 };
}

function spieleReaktion(id, opt) {
  const o = opt || {};
  const rend = reaktionen.start(id, augen.now, o);
  if (!rend) return null;
  const live = konfig.lebendigkeit == null ? 0.7 : konfig.lebendigkeit;
  const basis = o.staerke == null ? 1 : o.staerke;
  reaktion = {
    rend,
    t0: augen.now,
    staerke: basis * (0.4 + 0.6 * Math.max(0, Math.min(1, live))),
    blick: o.blick !== false,
  };
  merkeStimmung(id);
  if (o.ton !== false) sag(rend.phrase, o.gain == null ? 0.85 : o.gain);
  if (modus === 'loop') schrittBis = Math.max(schrittBis, performance.now() + (rend.dur + 0.6) * 1000);
  return rend;
}

function legeReaktion(pose) {
  if (!reaktion) return pose;
  const t = augen.now - reaktion.t0;
  if (t >= reaktion.rend.dur) {
    reaktion = null;
    return pose;
  }
  const extra = poseBei(reaktion.rend, t);
  const s = staerke(t, reaktion.rend.dur) * reaktion.staerke;
  return mische(pose, extra, s, reaktion.blick);
}

function istStoerung() {
  if (modus === 'schlaf' || modus === 'einmal' || modus === 'loop' || schauLaeuft || haStatus === 'mock') return false;
  if (haStatus === 'fehler' || haStatus === 'auth_ungueltig' || haStatus === 'getrennt') return true;
  if (haMeldung === 'tokenMissing' && konfig.haUrl) return true;
  if (haMeldung === 'tokenRejected' || haMeldung === 'connectFailed' || haMeldung === 'connectionTrouble') return true;
  return false;
}

function zeichneCaption() {
  const node = el('caption');
  if (!node) return;
  if (modus === 'schlaf' || klingel.aktiv) {
    node.hidden = true;
    node.textContent = '';
    return;
  }
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
function tonFuer(kurz, gainScale) {
  if (!audioFrei || !konfig.ton) return;
  const clip = BY[KURZ[kurz]];
  if (!clip) return;
  const skala = gainScale == null ? 1 : gainScale;
  audio.unlock().then(() => {
    if (!audio.status().freigegeben) return;
    if (kurz !== 'angry') stopAlarmTon();
    if (kurz === 'angry' && clip.sound) {
      audio.ton({ sound: clip.sound, gain: pegel((konfig.alarmStaerke === 'normal' ? 0.6 : 1) * skala) });
      return;
    }
    if (clip.sound) audio.ton({ sound: clip.sound, s_off: clip.s_off, gain: pegel((clip.gain == null ? 1 : clip.gain) * skala) });
  }).catch(() => {});
}

function syncDemoTrack() {
  const an = schauLaeuft && bildKurz === 'musik_an';
    if (an && !demoMusik.playing && gehoert()) {
    audio.unlock().then(() => demoMusik.start(audio.context(), audio.ausgang())).catch(() => {});
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
  if (kurz === 'angry') reaktion = null;
  augen.set(KURZ[kurz]);
  bildKurz = kurz;
  letzterKurz = kurz;
  letzterWechsel = performance.now();
  if (kurz === 'schlafen' && ton) {
    spieleReaktion('sleepy', { ton: true, erzwingen: true, staerke: 0.62, gain: 0.7 });
    tonFuer(kurz, 0.28);
  } else if (ton) tonFuer(kurz);
  if (kurz === 'zuhoeren' || kurz === 'sprechen' || kurz === 'musik_an') {
    const phraseId = kurz === 'zuhoeren' ? 'curious' : (kurz === 'musik_an' ? 'happy' : 'content');
    const phrase = bauePhrase(phraseId, Math.random, null);
    const start = performance.now();
    const pulses = [];
    for (let i = 0; i < phrase.notes.length; i++) {
      const n = phrase.notes[i];
      pulses.push({ at: start + n.at * 1000, ms: Math.max(80, n.dur * 1000), amp: 0.45 + Math.min(0.4, n.gain) });
    }
    merkePulse(pulses);
  }
  zeichneCaption();
  syncDemoTrack();
  return true;
}

function starteWecken(variante) {
  if (!variante || tuerAuf) return;
  cachePruefen();
  waechter.beruehrt();
  augen.set(KURZ.idle);
  bildKurz = 'idle';
  letzterKurz = 'idle';
  letzterWechsel = performance.now();
  augen.glance = [variante.gx, variante.gy];
  augen.nextGlance = augen.now + variante.hold;
  augen.nextBlink = augen.now + variante.hold + 2;
  augen.schau(variante.gx, variante.gy);
  if (augen.touch) augen.touch.dur = Math.max(0.7, variante.hold);
  augen.blick.bis(augen.now + Math.max(0.7, variante.hold));
  const warte = Math.max(0, Math.round(variante.blink * 1000));
  setTimeout(() => { augen.blinkAt = augen.now; }, warte);
  wachBis = performance.now() + variante.hold * 1000;
  setTimeout(() => spieleDatei(variante.sound, 0.75), 180);
  spieleReaktion('startled', { ton: true, blick: false, erzwingen: true, gain: 0.5 });
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
  if (!tuerAuf && bildKurz !== 'angry') {
    spieleReaktion(reaktionen.aus(HINWEIS_POOL), { ton: true, erzwingen: true, gain: 0.7 });
  }
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
  if (!tuerAuf && bildKurz !== 'angry') {
    spieleReaktion(reaktionen.aus(ACK_POOL), { ton: true, erzwingen: true, gain: 0.65 });
  }
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
  else {
    wendeZustand('idle', { ton: false, erzwingen: true });
    spieleReaktion('relieved', { ton: true, erzwingen: true, gain: 0.7 });
  }
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
    if (konfig.reloadEntity && String(e.entity_id).toLowerCase() === konfig.reloadEntity) {
      if (reloadImpuls(reloadGesehen, e.state)) seiteNeuLaden();
    }
    if (konfig.doorbellEntity && String(e.entity_id).toLowerCase() === konfig.doorbellEntity) {
      if (klingelKante(klingelGesehen, e.state)) starteKlingel();
    }
    if (konfig.doorbellCamera && String(e.entity_id).toLowerCase() === konfig.doorbellCamera) {
      const tok = zugangToken(e.attributes);
      if (tok && tok !== klingelToken) {
        const zuerst = !klingelToken;
        klingelToken = tok;
        if (klingel.aktiv && !klingel.test && (zuerst || klingel.stand.art === 'aus' || klingel.stand.art === 'keins')) {
          starteKamera(tok, performance.now());
        } else if (klingel.aktiv && !klingel.test) {
          klingel.stand = { ...klingel.stand, token: tok };
          wendeBild(performance.now());
        }
      }
    }
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
  const ruhig = modus === 'schlaf' || modus === 'einmal' || modus === 'loop' || klingel.aktiv;
  node.hidden = !!audioFrei || ruhig;
  if (!node.hidden) node.textContent = t('hint.hear');
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
  if (waechter.schlaeft && modus === 'normal') ziel = Math.min(ziel, konfig.dimStufe || 0.3);
  if (schauLaeuft || hinweis.offen || tuerAuf || klingel.aktiv || modus === 'schlaf' || modus === 'einmal' || modus === 'loop') ziel = 1;
  dimIst += (ziel - dimIst) * Math.min(1, (dt || 0.016) * 2);
  node.style.opacity = String(Math.max(0, Math.min(0.92, 1 - dimIst)));
}

function syncPause() {
  const pausieren = !!(hinweis.offen || schauLaeuft || tuerAuf || klingel.aktiv || modus === 'schlaf' || modus === 'einmal' || modus === 'loop');
  if (pausieren === pauseAn) return;
  pauseAn = pausieren;
  waechter.setPause(pausieren);
}

function sprungSchau(schritt) {
  if (istReaktion(schritt.kurz)) {
    if (bildKurz !== 'idle') wendeZustand('idle', { ton: false, erzwingen: true });
    spieleReaktion(schritt.kurz, { ton: true, erzwingen: true });
    syncDemoTrack();
    return;
  }
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
  if (hinweisQuelle === 'demo') {
    hinweis.quittieren();
    const node = el('hinweis');
    if (node) node.hidden = true;
  }
  if (ohneHaus(konfig, location)) zeigeSchlaf();
  else {
    waechter.setPause(false);
    pauseAn = !!(hinweis.offen || tuerAuf);
    wendeZustand('idle', { ton: false, erzwingen: true });
  }
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
  cachePruefen();
}

function pruefeStoerung() {
  if (klingel.aktiv || modus === 'schlaf' || modus === 'einmal' || modus === 'loop') return;
  const an = istStoerung();
  if (!an) {
    stoerungAktiv = false;
    return;
  }
  if (stoerungAktiv || performance.now() < 2500 || tuerAuf || bildKurz === 'angry') return;
  stoerungAktiv = true;
  spieleReaktion(reaktionen.aus(FEHLER_POOL), { ton: true, staerke: 0.55, gain: 0.45 });
}

function zeigeSchlaf() {
  modus = 'schlaf';
  schauLaeuft = false;
  waechter.setPause(true);
  pauseAn = true;
  reaktion = null;
  wendeZustand('schlafen', { ton: false, erzwingen: true });
  syncHearHint();
}

function spieleFest(item, loop) {
  const liste = REAKTIONEN[item.id];
  const rend = liste && liste[item.index];
  if (!rend) return null;
  if (bildKurz === 'schlafen' || bildKurz === 'angry') wendeZustand('idle', { ton: false, erzwingen: true });
  const live = konfig.lebendigkeit == null ? 0.42 : konfig.lebendigkeit;
  reaktion = {
    rend,
    t0: augen.now,
    staerke: 0.4 + 0.6 * Math.max(0, Math.min(1, live)),
    blick: true,
  };
  merkeStimmung(item.id);
  sag(rend.phrase, 0.85);
  schrittBis = performance.now() + (rend.dur + schrittPause(loop)) * 1000;
  return rend;
}

function starteEinmal() {
  modus = 'einmal';
  cachePruefen();
  waechter.beruehrt();
  waechter.setPause(true);
  pauseAn = true;
  wendeZustand('idle', { ton: false, erzwingen: true });
  einmal = ersteRunde();
  einmalPos = 0;
  schleife = createSchleife();
  spieleFest(einmal[0], false);
  syncHearHint();
}

function klingelSekunden(opt) {
  if (opt && opt.sekunden) return opt.sekunden;
  const n = Number(konfig.doorbellHoldSeconds);
  return n >= 5 ? n : 90;
}

function klingelBild() {
  const img = el('klingel');
  if (!img || klingelImgFertig) return img;
  klingelImgFertig = true;
  img.addEventListener('load', () => {
    if (!klingel.aktiv) return;
    klingel.stand = bildSchritt(klingel.stand, 'load', performance.now());
    if (klingel.stand.bildDa && !klingel.schliessen) klingel.ziel = 1;
  });
  img.addEventListener('error', () => {
    if (!img.getAttribute('src') || !klingel.aktiv) return;
    klingel.stand = bildSchritt(klingel.stand, 'error', performance.now());
    wendeBild(performance.now());
    if (klingel.stand.gescheitert) klingel.ziel = 0;
  });
  return img;
}

function bildUrl(stand, jetzt) {
  const art = stand.src || stand.art;
  if (art === 'test') return TESTBILD;
  if (art !== 'stream' && art !== 'snapshot') return '';
  let url = kameraSrc(haBasis(konfig.haUrl), konfig.doorbellCamera, stand.token, art);
  if (art === 'snapshot' && url) url += '&_=' + Math.floor((Number(jetzt) || 0) / 1000);
  return url;
}

function wendeBild(jetzt) {
  const img = klingelBild();
  if (!img) return;
  const url = klingel.stand.zeigen ? bildUrl(klingel.stand, jetzt) : '';
  if (!url) {
    img.style.opacity = '0';
    img.style.pointerEvents = 'none';
    if (img.getAttribute('src')) {
      img.removeAttribute('src');
      img.removeAttribute('data-src');
    }
    return;
  }
  if (img.getAttribute('data-src') !== url) {
    img.setAttribute('data-src', url);
    img.src = url;
  }
}

function zeichneKlingelBild(w, h) {
  const img = el('klingel');
  if (!img) return;
  const pl = bildPlatz(w, h, klingel.u);
  const sichtbar = !!(klingel.stand.bildDa && klingel.u > 0.02);
  const op = sichtbar ? pl.opacity : 0;
  img.style.left = pl.x + 'px';
  img.style.top = pl.y + 'px';
  img.style.width = pl.w + 'px';
  img.style.height = pl.h + 'px';
  img.style.opacity = String(op);
  img.style.pointerEvents = op > 0.35 ? 'auto' : 'none';
}

function versteckeKlingelBild() {
  const img = el('klingel');
  if (!img) return;
  img.style.opacity = '0';
  img.style.pointerEvents = 'none';
  if (img.getAttribute('src')) {
    img.removeAttribute('src');
    img.removeAttribute('data-src');
  }
}

function zeigeTestbild(jetzt) {
  klingel.stand = { art: 'test', seit: jetzt, bildDa: false, gescheitert: false, token: '', zeigen: true, src: 'test' };
  const img = klingelBild();
  if (!img) return;
  if (img.getAttribute('data-src') === TESTBILD && img.complete && img.naturalWidth > 0) {
    klingel.stand.bildDa = true;
    if (!klingel.schliessen) klingel.ziel = 1;
    return;
  }
  wendeBild(jetzt);
}

function starteKamera(tok, jetzt) {
  klingel.stand = bildSchritt({ art: 'aus', seit: 0, bildDa: false, gescheitert: false, token: tok }, 'start', jetzt);
  if (!klingel.stand.bildDa) klingel.ziel = 0;
  wendeBild(jetzt);
}

function klingelSchliessen() {
  if (!klingel.aktiv || klingel.schliessen) return;
  klingel.schliessen = true;
  klingel.ziel = 0;
  klingel.halten = false;
}

function starteKlingel(opt) {
  const o = opt || {};
  if (tuerAuf && !o.test && !o.demoWeiter) return;
  const jetzt = performance.now();
  const test = !!o.test;
  const schon = klingel.aktiv && !klingel.schliessen;
  if (!o.demoWeiter) {
    if (schauLaeuft) {
      schauLaeuft = false;
      if (demoMusik.playing) demoMusik.stop();
    }
    if (modus === 'schlaf' || modus === 'einmal' || modus === 'loop') modus = 'normal';
    if (hinweisQuelle === 'demo') {
      hinweis.quittieren();
      const node = el('hinweis');
      if (node) node.hidden = true;
    }
  }
  waechter.beruehrt();
  waechter.setPause(true);
  pauseAn = true;
  klingel.aktiv = true;
  if (bildKurz === 'schlafen') wendeZustand('idle', { ton: false, erzwingen: true });
  spieleReaktion('curious', { ton: true, erzwingen: true, gain: 0.92 });
  stimmung = { rgb: KLINGEL_FARBE.slice(), licht: 'sprechen', heard: jetzt, peak: 0 };
  klingel.bis = halteBis(jetzt, schon ? klingel.bis : 0, klingelSekunden(o));
  klingel.schliessen = false;
  klingel.halten = true;
  klingel.test = test;
  klingel.demoWeiter = o.demoWeiter ? true : false;
  if (test) zeigeTestbild(jetzt);
  else if (konfig.doorbellCamera && klingelToken && (!schon || klingel.stand.art === 'test' || klingel.stand.art === 'keins' || klingel.stand.art === 'aus')) {
    starteKamera(klingelToken, jetzt);
  } else if (!klingel.stand.bildDa || klingel.stand.art === 'test') {
    klingel.ziel = 0;
    klingel.stand = { art: 'keins', seit: jetzt, bildDa: false, gescheitert: false, token: '', zeigen: false, src: '' };
    versteckeKlingelBild();
  } else klingel.ziel = 1;
  syncHearHint();
}

function tickKlingel(now, dt) {
  if (!klingel.aktiv && klingel.u === 0) {
    renderer.setPreview(null);
    return;
  }
  if (klingel.aktiv && !klingel.schliessen && now >= klingel.bis) klingelSchliessen();
  klingel.u = layoutSchritt(klingel.u, klingel.ziel, dt);
  if (klingel.aktiv && (klingel.stand.art === 'stream' || klingel.stand.art === 'snapshot')) {
    const neu = bildSchritt(klingel.stand, 'tick', now);
    if (neu.art !== klingel.stand.art || neu.neu) {
      klingel.stand = neu;
      wendeBild(now);
      if (neu.gescheitert) klingel.ziel = 0;
    }
  }
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  renderer.setPreview(augenPlatz(w, h, klingel.u));
  zeichneKlingelBild(w, h);
  if (klingel.schliessen && klingel.u === 0) {
    const weiter = klingel.demoWeiter;
    klingel.aktiv = false;
    klingel.schliessen = false;
    klingel.halten = false;
    klingel.demoWeiter = false;
    klingel.ziel = 0;
    klingel.stand = { art: 'aus', seit: now, bildDa: false, gescheitert: false, token: '', zeigen: false, src: '' };
    versteckeKlingelBild();
    renderer.setPreview(null);
    if (weiter) schrittBis = now;
  }
}

function tickVorfuehrung(now) {
  if (klingel.aktiv || klingel.u > 0.02) return;
  if (modus !== 'einmal' && modus !== 'loop') return;
  if (now < schrittBis) return;
  if (modus === 'einmal') {
    einmalPos += 1;
    if (einmalPos >= einmal.length) {
      modus = 'loop';
      schleifeN = 0;
      starteKlingel({ test: true, sekunden: DEMO_KLINGEL_S, demoWeiter: true });
      return;
    }
    spieleFest(einmal[einmalPos], false);
    return;
  }
  schleifeN += 1;
  if (demoKlingelFaellig(schleifeN)) {
    starteKlingel({ test: true, sekunden: DEMO_KLINGEL_S, demoWeiter: true });
    return;
  }
  spieleFest(schleife.naechste(), true);
}

function merkeTipp(now) {
  const z = tippFenster(tippZeiten, now, 2200);
  tippZeiten = z.zeiten;
  tippGesamt += 1;
  if (z.settings) {
    location.href = 'settings.html';
    return true;
  }
  return false;
}

function frame(now) {
  tickSchau(now);
  tickVorfuehrung(now);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tickKlingel(now, dt);
  syncPause();
  pruefeStoerung();
  if (klingel.u > 0.3) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const pl = bildPlatz(w, h, 1);
    const z = blickZumPunkt(pl.x + pl.w * 0.4, pl.y + pl.h * 0.42, w, h);
    augen.schau(z.gx, z.gy);
  }
  const pose = legeReaktion(augen.tick(dt));
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
  const puls = pulsHuelle(now, scheinPulse);
  if (klingel.aktiv && klingel.halten && stimmung) stimmung.heard = now;
  const env = klingel.aktiv && klingel.halten ? Math.max(puls, 0.5) : puls;
  let zustand = befehl.name;
  let rgb = befehl.rgb;
  let override = null;
  if (!befehl.alarm && stimmung) {
    const schritt = stimmungSchritt(stimmung, env, now);
    if (!schritt) stimmung = null;
    else {
      zustand = schritt.licht;
      rgb = schritt.rgb;
      override = schritt.override;
    }
  }
  renderer.setLicht({
    profil: konfig.lichtProfil === 'lebhaft' ? 'lebhaft' : 'ruhig',
    zustand,
    rgb,
    alarmStark: konfig.alarmStaerke !== 'normal',
    huelle: puls,
    override,
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
cacheLauschen();
setInterval(cachePruefen, CACHE_UPDATE_MS);
starteHa();

const startState = param('state', 'zustand');
const sequence = param('sequence', 'sequenz');
const reaktionStart = param('reaction', 'reaktion');
const willkommen = sollWillkommen(konfig, location, q);
if (startState) wendeZustand(startState, { ton: false, erzwingen: true });
if (q.get('klingel') === '1') starteKlingel({ test: true });
else if (param('lauf') === '1' && !startState && !sequence) starteEinmal();
else if (param('tour', 'ablauf') || (param('demo') === '1' && !startState && !sequence && !reaktionStart)) starteSchau();
else if (reaktionStart && istReaktion(reaktionStart)) {
  reaktionHoren = reaktionStart;
  wendeZustand('idle', { ton: false, erzwingen: true });
  spieleReaktion(reaktionStart, { ton: false, erzwingen: true });
}
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
} else if (willkommen) zeigeSchlaf();

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
  if (klingel.aktiv && !klingel.schliessen) {
    const pl = bildPlatz(window.innerWidth || 1, window.innerHeight || 1, 1);
    const sichtbar = !!(klingel.stand.bildDa && klingel.u > 0.35);
    klingelFrisst = true;
    if (tippSchliesst(e.clientX, e.clientY, pl, sichtbar)) klingelSchliessen();
    return;
  }
  if (zielId(e.target)) return;
  if (modus === 'schlaf') {
    starteEinmal();
    merkeTipp(performance.now());
    return;
  }
  if (schauLaeuft) {
    stoppeSchau();
    return;
  }
  if (modus === 'einmal') {
    merkeTipp(performance.now());
    return;
  }
  if (tuerAuf || bildKurz === 'angry') {
    waechter.beruehrt();
    return;
  }
  schauAuf(e);
  if (waechter.schlaeft) {
    wendeZustand('hallo', { ton: true, erzwingen: true });
    return;
  }
  waechter.beruehrt();
  druck = { x: e.clientX, y: e.clientY, lang: false };
  if (langTimer) clearTimeout(langTimer);
  langTimer = setTimeout(() => {
    langTimer = 0;
    if (!druck) return;
    druck.lang = true;
    spieleReaktion('content', { ton: true, erzwingen: true, gain: 0.6 });
  }, LANG_MS);
});
onZeiger(document.body, 'move', (e) => {
  if (!druck || druck.lang) return;
  if (Math.abs(e.clientX - druck.x) > 28 || Math.abs(e.clientY - druck.y) > 28) {
    if (langTimer) clearTimeout(langTimer);
    langTimer = 0;
  }
});
onZeiger(document.body, 'up', (e) => {
  if (klingelFrisst) {
    klingelFrisst = false;
    druck = null;
    return;
  }
  if (!druck) return;
  const lang = druck.lang;
  const moved = Math.abs(e.clientX - druck.x) > 28 || Math.abs(e.clientY - druck.y) > 28;
  if (langTimer) clearTimeout(langTimer);
  langTimer = 0;
  druck = null;
  if (lang || moved || zielId(e.target)) return;
  if (merkeTipp(performance.now())) return;
  const id = stupser.tipp(performance.now());
  const live = konfig.lebendigkeit == null ? 0.7 : konfig.lebendigkeit;
  if (id === 'grumpy' || live >= 0.12) {
    spieleReaktion(id, { ton: live > 0.15 || id === 'grumpy', erzwingen: id === 'grumpy' });
  }
});

function schauAuf(e) {
  const z = blickZumPunkt(e.clientX, e.clientY, window.innerWidth || 1, window.innerHeight || 1);
  augen.schau(z.gx, z.gy);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

requestAnimationFrame(frame);
