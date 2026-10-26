// SPDX-License-Identifier: MIT
// Left-half detail stack. A view is listed only when its entities exist.
import { entityDa, istLeer, wasteVonSensor } from './dashboard.js';

const REIHEN = ['day', 'home', 'energy', 'climate', 'music', 'status', 'timer'];
const ENERGIE_MERK = 'eye_energy_today';

let timerBis = 0;

export function timerAdd(minuten) {
  const now = Date.now();
  const basis = timerBis > now ? timerBis : now;
  timerBis = basis + Math.max(1, minuten) * 60000;
}

export function timerStop() {
  timerBis = 0;
}

export function timerStand(now = Date.now()) {
  if (!timerBis || timerBis <= now) return { rest: 0, ziel: null, an: false };
  return { rest: timerBis - now, ziel: new Date(timerBis), an: true };
}

function leerZustand(entityState) {
  return !entityState || istLeer(entityState.state);
}

function zahl(value) {
  if (value == null || String(value).trim() === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(String(value).replace(',', '.').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function textZahl(n, locale) {
  if (n == null || !Number.isFinite(Number(n))) return '–';
  const r = Math.round(Number(n) * 10) / 10;
  const s = String(r);
  return locale === 'de' ? s.replace('.', ',') : s;
}

function freundlich(entityState, id) {
  const name = entityState && entityState.attributes && entityState.attributes.friendly_name;
  if (name) return String(name);
  const tail = String(id || '').split('.')[1] || String(id || '');
  return tail.replace(/_/g, ' ');
}

function offen(entityState) {
  if (leerZustand(entityState)) return false;
  const s = String(entityState.state).toLowerCase();
  return s === 'on' || s === 'open' || s === 'true';
}

function merkEnergie(kwh) {
  try {
    localStorage.setItem(ENERGIE_MERK, JSON.stringify({ kwh, at: Date.now() }));
  } catch { /* private mode */ }
}

function letzteEnergie() {
  try {
    const raw = JSON.parse(localStorage.getItem(ENERGIE_MERK) || 'null');
    if (raw && Number.isFinite(Number(raw.kwh))) return raw;
  } catch { /* ignore */ }
  return null;
}

export function bereit(name, ctx) {
  const d = (ctx && ctx.dash) || {};
  const s = (ctx && ctx.states) || {};
  if (name === 'day' || name === 'status' || name === 'timer') return true;
  if (name === 'home') {
    if (entityDa(s, d.weather) || entityDa(s, d.contacts)) return true;
    for (const id of d.contactGroups || []) if (entityDa(s, id)) return true;
    for (const id of d.windows || []) if (entityDa(s, id)) return true;
    return false;
  }
  if (name === 'energy') return !!(d.energyPv && entityDa(s, d.energyPv));
  if (name === 'climate') {
    if (entityDa(s, d.outdoorTemp) || entityDa(s, d.wind) || entityDa(s, d.rain)) return true;
    for (const id of d.indoor || []) if (entityDa(s, id)) return true;
    return false;
  }
  if (name === 'music') return !!(ctx && (ctx.mediaEntity || ctx.scriptMusikAn || ctx.scriptMusikAus));
  return false;
}

export function sichtbareAnsichten(ctx) {
  return REIHEN.filter((name) => bereit(name, ctx));
}

function el(doc, tag, klasse, text) {
  const node = doc.createElement(tag);
  if (klasse) node.className = klasse;
  if (text != null) node.textContent = text;
  return node;
}

function knopf(doc, text, onPress, primaer) {
  const b = el(doc, 'button', primaer ? 'knopf is-primaer' : 'knopf', text);
  b.type = 'button';
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    onPress();
  });
  return b;
}

function rahmen(doc, label, kontext) {
  const root = el(doc, 'div', 'ansicht');
  const kopf = el(doc, 'div', 'kopf');
  kopf.append(el(doc, 'div', 't-label', label), el(doc, 'div', 't-meta', kontext || ''));
  const stage = el(doc, 'div', 'buehne');
  const actions = el(doc, 'div', 'aktionen');
  const fuss = el(doc, 'div', 'fuss t-meta');
  root.append(kopf, stage, actions, fuss);
  return { root, stage, actions, fuss };
}

function fakt(doc, label, wert) {
  const cell = el(doc, 'div', 'fakt');
  cell.append(el(doc, 'div', 't-label', label), el(doc, 'div', 't-body', wert || '–'));
  return cell;
}

function zeile(doc, links, rechts) {
  const row = el(doc, 'div', 'liste-zeile');
  row.append(el(doc, 'span', '', links), el(doc, 'span', 't-body', rechts));
  return row;
}

function uhrKurz(date, locale) {
  const loc = locale === 'de' ? 'de-DE' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  } catch {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}

function datumLang(date, locale) {
  const loc = locale === 'de' ? 'de-DE' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  } catch {
    return date.toDateString();
  }
}

function dWaste(ctx) {
  const id = ctx.dash && ctx.dash.wasteTomorrow;
  const e = id && ctx.states && ctx.states[id];
  const item = e ? wasteVonSensor(e, ctx.jetzt || new Date()) : null;
  return item ? [item] : [];
}

function wetterSatz(w, locale) {
  if (!w) return '';
  const bits = [];
  if (w.condition) bits.push(w.condition);
  if (w.temp != null) bits.push(`${textZahl(w.temp, locale)}°`);
  const extra = [];
  if (w.high != null) extra.push(`${textZahl(w.high, locale)}°`);
  if (w.low != null) extra.push(`${textZahl(w.low, locale)}°`);
  return extra.length ? `${bits.join(' ')} · ${extra.join(' / ')}` : bits.join(' ');
}

function zeichneTag(host, ctx) {
  const doc = host.ownerDocument;
  const jetzt = ctx.jetzt || new Date();
  const view = rahmen(doc, ctx.t('view.day'), datumLang(jetzt, ctx.locale));
  const uhr = el(doc, 'div', 't-display', ctx.uhr || uhrKurz(jetzt, ctx.locale));
  view.stage.append(uhr);
  const raster = el(doc, 'div', 'fakten');
  const modell = ctx.model || {};
  const heute = wetterSatz(modell.weather, ctx.locale);
  if (heute) raster.append(fakt(doc, ctx.t('dash.today'), heute));
  const morgen = ctx.forecast && ctx.forecast[1];
  if (morgen) {
    const bits = [];
    if (morgen.condition) bits.push(morgen.condition);
    if (morgen.temperature != null) bits.push(`${textZahl(morgen.temperature, ctx.locale)}°`);
    if (morgen.templow != null) bits.push(`${textZahl(morgen.templow, ctx.locale)}°`);
    raster.append(fakt(doc, ctx.t('dash.tomorrow'), bits.join(' ') || '–'));
  }
  const extra = dWaste(ctx);
  const waste = extra.concat((modell.waste || []).filter((bin) => bin.when === 'tomorrow' || bin.when === 'today'));
  const morgenWaste = waste.filter((bin) => bin.when === 'tomorrow');
  const zeig = morgenWaste.length ? morgenWaste : waste.filter((bin) => bin.when === 'today');
  raster.append(fakt(doc, ctx.t('dash.waste'), zeig.length ? zeig.map((b) => b.name).join(', ') : ctx.t('view.noWaste')));
  view.stage.append(raster);
  const wetter = ctx.dash && ctx.states && ctx.states[ctx.dash.weather];
  const quelle = wetter && wetter.attributes && wetter.attributes.friendly_name;
  view.fuss.textContent = quelle ? `${quelle} · ${uhrKurz(jetzt, ctx.locale)}` : '';
  host.replaceChildren(view.root);
}

function offeneNamen(ctx) {
  const d = ctx.dash || {};
  const s = ctx.states || {};
  const namen = [];
  const ids = [...(d.contactGroups || []), ...(d.windows || [])];
  for (const id of ids) {
    const e = s[id];
    if (offen(e)) namen.push(freundlich(e, id));
  }
  return namen;
}

function zeichneZuhause(host, ctx) {
  const doc = host.ownerDocument;
  const d = ctx.dash || {};
  const s = ctx.states || {};
  const namen = offeneNamen(ctx);
  const kontakt = d.contacts && s[d.contacts];
  const kopfAttr = kontakt && kontakt.attributes && kontakt.attributes[d.contactsHeaderAttr || 'header'];
  let zahlOffen = namen.length;
  if (kontakt && !leerZustand(kontakt) && zahl(kontakt.state) != null) zahlOffen = zahl(kontakt.state);
  const kontext = kopfAttr ? String(kopfAttr) : (zahlOffen > 0 ? ctx.t('view.openCount', { n: zahlOffen }) : ctx.t('view.allShut'));
  const view = rahmen(doc, ctx.t('view.home'), kontext);
  const hatKontakte = !!(kontakt || (d.contactGroups || []).some((id) => entityDa(s, id)) || (d.windows || []).some((id) => entityDa(s, id)));
  if (!hatKontakte) {
    const w = wetterSatz(ctx.model && ctx.model.weather, ctx.locale);
    view.stage.append(el(doc, 'div', 't-hero', w || ctx.t('view.empty')));
  } else if (zahlOffen <= 0) {
    view.stage.append(el(doc, 'div', 't-hero', ctx.t('view.allShutSentence')));
  } else {
    const gross = el(doc, 'div', 'wert');
    gross.append(el(doc, 'span', 't-display', String(zahlOffen)), el(doc, 'span', 't-body', ` ${ctx.t('view.openUnit')}`));
    view.stage.append(gross);
    const liste = el(doc, 'div', 'liste');
    const gezeigt = namen.slice(0, 4);
    for (const name of gezeigt) liste.append(zeile(doc, name, ctx.t('view.openWord')));
    if (namen.length > 4) liste.append(zeile(doc, `+${namen.length - 4}`, ''));
    view.stage.append(liste);
  }
  const fakten = el(doc, 'div', 'fakten');
  const aussen = d.outdoorTemp && s[d.outdoorTemp];
  if (aussen && !leerZustand(aussen)) fakten.append(fakt(doc, ctx.t('dash.outdoor'), `${textZahl(zahl(aussen.state), ctx.locale)}°`));
  const waste = (ctx.model && ctx.model.waste || []).filter((bin) => bin.when === 'tomorrow');
  if (waste.length) fakten.append(fakt(doc, ctx.t('view.wasteTomorrow'), waste.map((b) => b.name).join(', ')));
  if (fakten.childNodes.length) view.stage.append(fakten);
  const guard = d.guard && s[d.guard];
  if (guard) {
    const an = guard.state === 'on';
    view.actions.append(knopf(doc, ctx.t(an ? 'dash.guardOn' : 'dash.guardOff'), () => ctx.onAction({ type: 'guard' }), an));
  }
  host.replaceChildren(view.root);
}

function zeichneEnergie(host, ctx) {
  const doc = host.ownerDocument;
  const d = ctx.dash || {};
  const s = ctx.states || {};
  const pv = s[d.energyPv];
  const nacht = leerZustand(pv);
  const jetztW = pv && zahl(pv.state);
  const tag = d.energyDay && s[d.energyDay];
  const tagZahl = tag && !leerZustand(tag) ? zahl(tag.state) : null;
  if (tagZahl != null) merkEnergie(tagZahl);
  const netz = d.energyGrid && s[d.energyGrid];
  const speisung = d.energyFeed && s[d.energyFeed];
  const auto = d.energyAutonomy && s[d.energyAutonomy];
  const autoZahl = auto && !leerZustand(auto) ? zahl(auto.state) : null;
  const kontext = autoZahl != null ? ctx.t('view.sunShare', { n: textZahl(autoZahl, ctx.locale) }) : '';
  const view = rahmen(doc, ctx.t('view.energy'), kontext);
  if (nacht) {
    view.stage.append(el(doc, 'div', 't-hero', ctx.t('view.night')));
    const merk = letzteEnergie();
    const line = merk ? ctx.t('view.nightMeta', { n: textZahl(merk.kwh, ctx.locale) }) : ctx.t('view.nightQuiet');
    view.stage.append(el(doc, 'div', 't-meta', line));
  } else {
    const gross = el(doc, 'div', 'wert');
    gross.append(el(doc, 'span', 't-display', textZahl(jetztW, ctx.locale)), el(doc, 'span', 't-body', ' kW'));
    view.stage.append(gross);
  }
  const fakten = el(doc, 'div', 'fakten');
  if (tagZahl != null) fakten.append(fakt(doc, ctx.t('dash.today'), `${textZahl(tagZahl, ctx.locale)} kWh`));
  const bezug = netz && !leerZustand(netz) ? zahl(netz.state) : null;
  const ein = speisung && !leerZustand(speisung) ? zahl(speisung.state) : null;
  if (bezug != null && (ein == null || bezug >= ein)) fakten.append(fakt(doc, ctx.t('view.grid'), `${textZahl(bezug, ctx.locale)} kW`));
  else if (ein != null) fakten.append(fakt(doc, ctx.t('view.feed'), `${textZahl(ein, ctx.locale)} kW`));
  if (autoZahl != null) {
    fakten.append(fakt(doc, ctx.t('view.autonomy'), `${textZahl(autoZahl, ctx.locale)} %`));
    const bar = el(doc, 'div', 'balken');
    const fill = el(doc, 'i');
    const pct = Math.max(0, Math.min(100, autoZahl));
    fill.style.width = `${pct}%`;
    bar.append(fill);
    view.stage.append(fakten, bar);
  } else if (fakten.childNodes.length) view.stage.append(fakten);
  host.replaceChildren(view.root);
}

function zeichneKlima(host, ctx) {
  const doc = host.ownerDocument;
  const d = ctx.dash || {};
  const s = ctx.states || {};
  const bits = [];
  const aussen = d.outdoorTemp && s[d.outdoorTemp];
  if (aussen && !leerZustand(aussen)) bits.push(`${textZahl(zahl(aussen.state), ctx.locale)}°`);
  const wind = d.wind && s[d.wind];
  if (wind && !leerZustand(wind)) bits.push(freundlich(wind, d.wind) ? `${textZahl(zahl(wind.state) ?? wind.state, ctx.locale)}` : '');
  const regen = d.rain && s[d.rain];
  if (regen && !leerZustand(regen)) {
    const an = offen(regen);
    bits.push(an ? ctx.t('dash.rainOn') : (zahl(regen.state) != null ? textZahl(zahl(regen.state), ctx.locale) : ctx.t('dash.rainOff')));
  }
  const view = rahmen(doc, ctx.t('view.climate'), bits.filter(Boolean).join(' · '));
  const raeume = (d.indoor || []).filter((id) => entityDa(s, id));
  const werte = raeume.map((id) => ({ id, e: s[id], n: leerZustand(s[id]) ? null : zahl(s[id].state) }));
  const erster = werte.find((r) => r.n != null) || werte[0];
  if (!erster || erster.n == null) {
    view.stage.append(el(doc, 'div', 't-hero leer', '–'));
    view.stage.append(el(doc, 'div', 't-meta', ctx.t('view.roomsPaused')));
  } else {
    const gross = el(doc, 'div', 'wert');
    gross.append(el(doc, 'span', 't-hero', `${textZahl(erster.n, ctx.locale)}°`), el(doc, 'span', 't-body', ` ${freundlich(erster.e, erster.id)}`));
    view.stage.append(gross);
    const liste = el(doc, 'div', 'liste zwei');
    for (const raum of werte) {
      if (raum === erster) continue;
      const wert = raum.n == null ? '–' : `${textZahl(raum.n, ctx.locale)}°`;
      liste.append(zeile(doc, freundlich(raum.e, raum.id), wert));
    }
    if (liste.childNodes.length) view.stage.append(liste);
  }
  host.replaceChildren(view.root);
}

function zeichneMusik(host, ctx) {
  const doc = host.ownerDocument;
  const still = !ctx.titel && !ctx.spielt;
  const view = rahmen(doc, ctx.t('view.music'), still ? '' : (ctx.quelle || ''));
  const cover = el(doc, 'div', 'cover', '♪');
  if (ctx.cover) {
    cover.style.backgroundImage = `url("${ctx.cover}")`;
    cover.textContent = '';
  }
  view.stage.append(cover);
  view.stage.append(el(doc, 'div', 't-title', still ? ctx.t('view.quiet') : (ctx.titel || ctx.t('view.quiet'))));
  view.stage.append(el(doc, 'div', 't-meta', still ? ctx.t('view.noPlayer') : (ctx.interpret || '')));
  if (ctx.mediaEntity) {
    view.actions.append(knopf(doc, ctx.t('np.prev'), () => ctx.onAction({ type: 'music', which: 'prev' })));
    view.actions.append(knopf(doc, ctx.t(ctx.spielt ? 'np.pause' : 'np.play'), () => ctx.onAction({ type: 'music', which: 'play' }), true));
    view.actions.append(knopf(doc, ctx.t('np.next'), () => ctx.onAction({ type: 'music', which: 'next' })));
  } else if (ctx.scriptMusikAn || ctx.scriptMusikAus) {
    const laeuft = !!(ctx.spielt || ctx.musikAn);
    view.actions.append(knopf(doc, ctx.t(laeuft ? 'zone.musicOff' : 'zone.musicOn'), () => ctx.onAction({ type: 'music', which: 'toggle' }), true));
  }
  const eintraege = ctx.naechste || [];
  if (eintraege.length) {
    const block = el(doc, 'div', 'liste');
    block.append(el(doc, 'div', 't-label', ctx.t('np.upNext')));
    for (let i = 0; i < eintraege.length; i++) {
      const row = knopf(doc, eintraege[i].label, () => ctx.onAction({ type: 'music', which: 'queue', index: i }));
      row.classList.add('liste-zeile');
      block.append(row);
    }
    view.stage.append(block);
  }
  host.replaceChildren(view.root);
}

function schalterKachel(doc, label, an, onPress) {
  const b = el(doc, 'button', an ? 'schalter-kachel is-an' : 'schalter-kachel');
  b.type = 'button';
  b.append(el(doc, 'span', 't-body', label), el(doc, 'span', 't-meta', an ? 'on' : 'off'));
  b.addEventListener('click', (e) => { e.stopPropagation(); onPress(); });
  return b;
}

function segment(doc, wert, optionen, onPick) {
  const wrap = el(doc, 'div', 'segment');
  for (const opt of optionen) {
    const b = el(doc, 'button', opt.value === wert ? 'is-an' : '', opt.label);
    b.type = 'button';
    b.addEventListener('click', (e) => { e.stopPropagation(); onPick(opt.value); });
    wrap.append(b);
  }
  return wrap;
}

function zeichneStatus(host, ctx) {
  const doc = host.ownerDocument;
  const view = rahmen(doc, ctx.t('view.status'), ctx.version ? `v${ctx.version}` : '');
  view.stage.append(el(doc, 'div', 't-hero', ctx.stateName || ''));
  view.stage.append(el(doc, 'div', 't-meta', ctx.seit || ''));
  const conn = el(doc, 'div', 'verbindung');
  const punkt = el(doc, 'i', ctx.verbunden ? 'is-an' : '');
  conn.append(punkt, el(doc, 'span', 't-meta', ctx.verbindung || ''));
  view.stage.append(conn);
  if (ctx.befehl) view.stage.append(el(doc, 'div', 't-meta', ctx.befehl));
  const raster = el(doc, 'div', 'kacheln');
  raster.append(schalterKachel(doc, ctx.t('display.caption'), !!ctx.caption, () => ctx.onAction({ type: 'toggle', key: 'caption' })));
  raster.append(schalterKachel(doc, ctx.t('display.sound'), !!ctx.ton, () => ctx.onAction({ type: 'toggle', key: 'ton' })));
  raster.append(schalterKachel(doc, ctx.t('display.clock'), !!ctx.clockOn, () => ctx.onAction({ type: 'toggle', key: 'uhr' })));
  raster.append(schalterKachel(doc, ctx.t('display.nowPlaying'), !!ctx.nowPlaying, () => ctx.onAction({ type: 'toggle', key: 'np' })));
  view.stage.append(raster);
  view.stage.append(segment(doc, ctx.modus, [
    { value: 'vollbild', label: ctx.t('mode.bold') },
    { value: '2d', label: ctx.t('mode.cube') },
    { value: 'led', label: ctx.t('mode.fortune') },
  ], (value) => ctx.onAction({ type: 'mode', value })));
  view.stage.append(segment(doc, ctx.lang || 'auto', [
    { value: 'de', label: 'DE' },
    { value: 'en', label: 'EN' },
  ], (value) => ctx.onAction({ type: 'lang', value })));
  view.actions.append(knopf(doc, ctx.t('sheet.full'), () => ctx.onAction({ type: 'settings' })));
  view.actions.append(knopf(doc, ctx.t('demo.link'), () => ctx.onAction({ type: 'demo' })));
  host.replaceChildren(view.root);
}

function restText(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function zeichneTimer(host, ctx) {
  const doc = host.ownerDocument;
  const stand = timerStand(ctx.jetztMs || Date.now());
  const ziel = stand.ziel ? uhrKurz(stand.ziel, ctx.locale) : '–';
  const view = rahmen(doc, ctx.t('view.timer'), stand.an ? ziel : ctx.t('view.timerIdle'));
  view.stage.append(el(doc, 'div', 't-display', stand.an ? restText(stand.rest) : '0:00'));
  if (stand.an) view.stage.append(el(doc, 'div', 't-meta', ziel));
  view.actions.append(knopf(doc, ctx.t('view.plus1'), () => ctx.onAction({ type: 'timer', delta: 1 })));
  view.actions.append(knopf(doc, ctx.t('view.plus5'), () => ctx.onAction({ type: 'timer', delta: 5 })));
  view.actions.append(knopf(doc, ctx.t('view.stop'), () => ctx.onAction({ type: 'timer', delta: 0 })));
  host.replaceChildren(view.root);
}

const ZEICHNER = {
  day: zeichneTag,
  home: zeichneZuhause,
  energy: zeichneEnergie,
  climate: zeichneKlima,
  music: zeichneMusik,
  status: zeichneStatus,
  timer: zeichneTimer,
};

export function zeichneAnsicht(host, name, ctx) {
  const fn = ZEICHNER[name] || zeichneTag;
  fn(host, ctx || {});
}
