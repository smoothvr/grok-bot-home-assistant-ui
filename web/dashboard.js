// SPDX-License-Identifier: MIT
// Dashboard tiles. Missing or unavailable entities are omitted. No errors are shown for them.
import { dienstAus } from './ha.js';

export const DASH_VORGABE = {
  weather: 'weather.home',
  outdoorTemp: 'sensor.outdoor_temperature',
  calendars: ['calendar.family'],
  waste: ['calendar.waste'],
  windows: ['binary_sensor.kitchen_window'],
  indoor: ['sensor.living_room_temperature'],
  rain: 'binary_sensor.rain',
  wind: 'sensor.wind_speed',
  brightness: 'sensor.outdoor_brightness',
  allOff: 'script.eye_all_off',
  guardToggle: 'script.eye_guard_toggle',
  guard: 'input_boolean.eye_guard',
  coldC: 5,
  buttons: [],
  contacts: '',
  contactsHeaderAttr: 'header',
  contactGroups: [],
  wasteTomorrow: '',
  energyPv: '',
  energyDay: '',
  energyGrid: '',
  energyFeed: '',
  energyAutonomy: '',
};

const ENTITY = /^[a-z0-9_]+\.[a-z0-9_]+$/;

function entity(id) {
  const v = String(id || '').trim().toLowerCase();
  return ENTITY.test(v) ? v : '';
}

function liste(value) {
  const roh = Array.isArray(value) ? value : String(value || '').split(/[\n,]+/);
  const out = [];
  for (const teil of roh) {
    const id = entity(teil);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

function knoepfe(raw) {
  const rows = Array.isArray(raw) ? raw : String(raw || '').split(/\n+/);
  const out = [];
  for (const row of rows) {
    if (out.length >= 12) break;
    if (row && typeof row === 'object') {
      const label = String(row.label || '').trim().slice(0, 40);
      const ziel = String(row.ziel || row.service || '').trim().slice(0, 240);
      if (label && ziel) out.push({ label, ziel });
      continue;
    }
    const line = String(row || '').trim();
    const cut = line.indexOf('|');
    if (cut < 1) continue;
    const label = line.slice(0, cut).trim().slice(0, 40);
    const ziel = line.slice(cut + 1).trim().slice(0, 240);
    if (label && ziel) out.push({ label, ziel });
  }
  return out;
}

export function normDash(raw) {
  const d = {
    weather: DASH_VORGABE.weather,
    outdoorTemp: DASH_VORGABE.outdoorTemp,
    calendars: DASH_VORGABE.calendars.slice(),
    waste: DASH_VORGABE.waste.slice(),
    windows: DASH_VORGABE.windows.slice(),
    indoor: DASH_VORGABE.indoor.slice(),
    rain: DASH_VORGABE.rain,
    wind: DASH_VORGABE.wind,
    brightness: DASH_VORGABE.brightness,
    allOff: DASH_VORGABE.allOff,
    guardToggle: DASH_VORGABE.guardToggle,
    guard: DASH_VORGABE.guard,
    coldC: DASH_VORGABE.coldC,
    buttons: [],
    contacts: '',
    contactsHeaderAttr: 'header',
    contactGroups: [],
    wasteTomorrow: '',
    energyPv: '',
    energyDay: '',
    energyGrid: '',
    energyFeed: '',
    energyAutonomy: '',
  };
  if (!raw || typeof raw !== 'object') return d;
  if ('weather' in raw) d.weather = entity(raw.weather);
  if ('outdoorTemp' in raw) d.outdoorTemp = entity(raw.outdoorTemp);
  if ('calendars' in raw) d.calendars = liste(raw.calendars);
  if ('waste' in raw) d.waste = liste(raw.waste);
  if ('windows' in raw) d.windows = liste(raw.windows);
  if ('indoor' in raw) d.indoor = liste(raw.indoor);
  if ('rain' in raw) d.rain = entity(raw.rain);
  if ('wind' in raw) d.wind = entity(raw.wind);
  if ('brightness' in raw) d.brightness = entity(raw.brightness);
  if ('allOff' in raw) d.allOff = entity(raw.allOff);
  if ('guardToggle' in raw) d.guardToggle = entity(raw.guardToggle);
  if ('guard' in raw) d.guard = entity(raw.guard);
  if ('coldC' in raw) {
    const n = Number(raw.coldC);
    d.coldC = Number.isFinite(n) ? Math.max(-40, Math.min(40, n)) : DASH_VORGABE.coldC;
  }
  if ('buttons' in raw) d.buttons = knoepfe(raw.buttons);
  if ('contacts' in raw) d.contacts = entity(raw.contacts);
  if ('contactsHeaderAttr' in raw) {
    const attr = String(raw.contactsHeaderAttr || '').trim().slice(0, 40);
    d.contactsHeaderAttr = /^[a-zA-Z0-9_]+$/.test(attr) ? attr : 'header';
  }
  if ('contactGroups' in raw) d.contactGroups = liste(raw.contactGroups);
  if ('wasteTomorrow' in raw) d.wasteTomorrow = entity(raw.wasteTomorrow);
  if ('energyPv' in raw) d.energyPv = entity(raw.energyPv);
  if ('energyDay' in raw) d.energyDay = entity(raw.energyDay);
  if ('energyGrid' in raw) d.energyGrid = entity(raw.energyGrid);
  if ('energyFeed' in raw) d.energyFeed = entity(raw.energyFeed);
  if ('energyAutonomy' in raw) d.energyAutonomy = entity(raw.energyAutonomy);
  return d;
}

// A view stays in the stack when the entity exists, even if its state is unavailable.
export function entityDa(states, id) {
  if (!id || !states) return false;
  return Object.prototype.hasOwnProperty.call(states, id);
}

export function istLeer(state) {
  const s = String(state ?? '').trim().toLowerCase();
  return !s || s === 'unavailable' || s === 'unknown' || s === 'none' || s === 'null';
}

export function nameAusId(id) {
  const obj = String(id || '').split('.')[1] || String(id || '');
  const wort = obj.replace(/^waste_/, '').replace(/_/g, ' ');
  return wort.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function freundlich(entityState, id) {
  const name = entityState && entityState.attributes && entityState.attributes.friendly_name;
  return String(name || nameAusId(id)).trim() || nameAusId(id);
}

function zahl(value) {
  if (value == null || String(value).trim() === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(String(value).trim().replace(',', '.').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function kurzZahl(n) {
  const r = Math.round(n * 10) / 10;
  return String(r);
}

export function parseDatum(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || '').trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function tagVonDatum(value, jetzt = new Date()) {
  const tag = parseDatum(value);
  if (!tag) return null;
  const start = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
  const diff = Math.round((tag - start) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return null;
}

function wortTag(value) {
  const s = String(value || '').trim().toLowerCase();
  if (s === 'today' || s === 'heute') return 'today';
  if (s === 'tomorrow' || s === 'morgen') return 'tomorrow';
  return null;
}

export function binAusTitel(summary) {
  let s = String(summary || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^\d{4}-\d{2}-\d{2}\s*/, '');
  s = s.replace(/^(waste|bin|müll|muell|abfall|tonne)\s*[:\-]\s*/i, '');
  s = s.replace(/\b(abholung|collection|pickup|leerung|abfuhr)\b/ig, '');
  s = s.replace(/\s+/g, ' ').replace(/^[,.:\-]+|[,.:\-]+$/g, '').trim();
  return s || String(summary || '').trim();
}

export function wasteVonSensor(entityState, jetzt = new Date()) {
  if (!entityState || istLeer(entityState.state)) return null;
  const attr = entityState.attributes || {};
  const name = freundlich(entityState, entityState.entity_id);
  const werte = [entityState.state, attr.next_date, attr.next, attr.date];
  for (const wert of werte) {
    const when = tagVonDatum(wert, jetzt) || wortTag(wert);
    if (when) return { name, when };
  }
  if (attr.days != null || attr.days_to != null || attr.daysTo != null) {
    const n = Number(attr.days ?? attr.days_to ?? attr.daysTo);
    if (n === 0) return { name, when: 'today' };
    if (n === 1) return { name, when: 'tomorrow' };
  }
  return null;
}

function zielEntity(spec) {
  const dienst = dienstAus(spec);
  return dienst && dienst.target && dienst.target.entity_id || '';
}

function vorhanden(states, id) {
  if (!id || !states[id]) return false;
  return !istLeer(states[id].state);
}

export function istKalt(temp, condition, schwelle = 5) {
  const c = String(condition || '').toLowerCase();
  if (/snow|sleet|hail|ice|frost|schnee|hagel|eis/.test(c)) return true;
  const n = typeof temp === 'number' ? temp : zahl(temp);
  const grenze = Number(schwelle);
  return Number.isFinite(n) && Number.isFinite(grenze) && n < grenze;
}

export function ereignisseAus(result, entityId) {
  if (!result || typeof result !== 'object') return [];
  const layer = result.service_response || result.response || result;
  if (!layer || typeof layer !== 'object') return [];
  const block = entityId && layer[entityId] ? layer[entityId] : layer;
  const events = block && (block.events || (Array.isArray(block) ? block : null));
  return Array.isArray(events) ? events : [];
}

export function kalenderNachricht(entityId, start, end) {
  return {
    type: 'call_service',
    domain: 'calendar',
    service: 'get_events',
    target: { entity_id: entityId },
    service_data: { start_date_time: start, end_date_time: end },
    return_response: true,
  };
}

export function wetterNachricht(entityId) {
  return {
    type: 'call_service',
    domain: 'weather',
    service: 'get_forecasts',
    target: { entity_id: entityId },
    service_data: { type: 'daily' },
    return_response: true,
  };
}

function uhrzeit(value) {
  const m = /T(\d{2}:\d{2})/.exec(String(value || ''));
  return m ? m[1] : '';
}

function messung(states, id) {
  if (!id || !states[id] || istLeer(states[id].state)) return null;
  const e = states[id];
  const n = zahl(e.state);
  const unit = e.attributes && e.attributes.unit_of_measurement || '';
  const text = n == null ? String(e.state) : `${kurzZahl(n)}${unit ? ` ${unit}` : ''}`;
  return { name: freundlich(e, id), text };
}

export function baueDashboard(states, dash, extras = {}) {
  const map = states || {};
  const cfg = normDash(dash || DASH_VORGABE);
  const jetzt = extras.jetzt || new Date();
  const events = extras.events || {};
  const w = cfg.weather && map[cfg.weather];
  const tempE = cfg.outdoorTemp && map[cfg.outdoorTemp];
  const wOk = !!(w && !istLeer(w.state));
  const tOk = !!(tempE && !istLeer(tempE.state) && zahl(tempE.state) != null);
  let weather = null;
  if (wOk || tOk) {
    const attr = (w && w.attributes) || {};
    const tag = (extras.forecast && extras.forecast[0]) || (attr.forecast && attr.forecast[0]) || {};
    weather = {
      condition: wOk ? String(w.state) : '',
      temp: tOk ? zahl(tempE.state) : (attr.temperature != null ? zahl(attr.temperature) : null),
      high: zahl(tag.temperature ?? tag.high ?? attr.forecast_max),
      low: zahl(tag.templow ?? tag.low ?? attr.forecast_min),
      unit: (tempE && tempE.attributes && tempE.attributes.unit_of_measurement) || attr.temperature_unit || '°C',
    };
  }
  const wasteIds = new Set(cfg.waste.filter((id) => id.startsWith('calendar.')));
  const termine = [];
  for (const id of cfg.calendars) {
    if (wasteIds.has(id)) continue;
    const listeE = events[id] || [];
    const ent = map[id];
    if ((!ent || istLeer(ent.state)) && !listeE.length) continue;
    for (const ev of listeE) {
      const when = tagVonDatum(ev.start || ev.start_time, jetzt);
      if (!when) continue;
      const summary = String(ev.summary || ev.title || '').trim();
      if (!summary) continue;
      termine.push({ summary, when, time: uhrzeit(ev.start || ev.start_time) });
    }
  }
  const waste = new Map();
  const merk = (item) => {
    if (!item || !item.name) return;
    const alt = waste.get(item.name);
    if (!alt || (alt.when === 'tomorrow' && item.when === 'today')) waste.set(item.name, item);
  };
  for (const id of cfg.waste) {
    if (id.startsWith('calendar.')) {
      for (const ev of events[id] || []) {
        const when = tagVonDatum(ev.start || ev.start_time, jetzt);
        if (!when) continue;
        merk({ name: binAusTitel(ev.summary || ev.title || ''), when });
      }
    } else merk(wasteVonSensor(map[id], jetzt));
  }
  const windows = [];
  for (const id of cfg.windows) {
    const e = map[id];
    if (!e || istLeer(e.state)) continue;
    if (e.state === 'on' || e.state === 'open') windows.push(freundlich(e, id));
  }
  const indoor = [];
  for (const id of cfg.indoor) {
    const m = messung(map, id);
    if (m && zahl(map[id].state) != null) indoor.push(m);
  }
  const rainE = cfg.rain && map[cfg.rain];
  const rain = rainE && !istLeer(rainE.state) ? { name: freundlich(rainE, cfg.rain), on: rainE.state === 'on' } : null;
  const buttons = [];
  if (vorhanden(map, cfg.allOff)) buttons.push({ id: 'all_off', ziel: cfg.allOff, kind: 'all_off' });
  let guard = null;
  if (vorhanden(map, cfg.guardToggle) && vorhanden(map, cfg.guard)) {
    guard = map[cfg.guard].state === 'on';
    buttons.push({ id: 'guard', ziel: cfg.guardToggle, kind: 'guard', on: guard });
  }
  for (const knopf of cfg.buttons) {
    const ziel = zielEntity(knopf.ziel);
    if (!ziel || !vorhanden(map, ziel)) continue;
    buttons.push({ id: 'extra', label: knopf.label, ziel: knopf.ziel, kind: 'extra' });
  }
  return {
    weather,
    events: termine,
    waste: [...waste.values()],
    windows,
    indoor,
    rain,
    wind: messung(map, cfg.wind),
    brightness: messung(map, cfg.brightness),
    guard,
    cold: istKalt(weather && weather.temp, weather && weather.condition, cfg.coldC),
    buttons,
  };
}

function isoTag(jetzt, offset) {
  const d = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function mockZustaende() {
  return {
    'weather.home': { entity_id: 'weather.home', state: 'snowy', attributes: { temperature: 3, temperature_unit: '°C', friendly_name: 'Home' } },
    'sensor.outdoor_temperature': { entity_id: 'sensor.outdoor_temperature', state: '3.0', attributes: { unit_of_measurement: '°C', friendly_name: 'Outdoor' } },
    'calendar.family': { entity_id: 'calendar.family', state: 'off', attributes: { friendly_name: 'Family' } },
    'calendar.waste': { entity_id: 'calendar.waste', state: 'off', attributes: { friendly_name: 'Waste' } },
    'binary_sensor.kitchen_window': { entity_id: 'binary_sensor.kitchen_window', state: 'on', attributes: { friendly_name: 'Kitchen window' } },
    'sensor.living_room_temperature': { entity_id: 'sensor.living_room_temperature', state: '21.5', attributes: { unit_of_measurement: '°C', friendly_name: 'Living room' } },
    'binary_sensor.rain': { entity_id: 'binary_sensor.rain', state: 'on', attributes: { friendly_name: 'Rain' } },
    'sensor.wind_speed': { entity_id: 'sensor.wind_speed', state: '18', attributes: { unit_of_measurement: 'km/h', friendly_name: 'Wind' } },
    'sensor.outdoor_brightness': { entity_id: 'sensor.outdoor_brightness', state: '4200', attributes: { unit_of_measurement: 'lx', friendly_name: 'Brightness' } },
    'script.eye_all_off': { entity_id: 'script.eye_all_off', state: 'off', attributes: {} },
    'script.eye_guard_toggle': { entity_id: 'script.eye_guard_toggle', state: 'off', attributes: {} },
    'input_boolean.eye_guard': { entity_id: 'input_boolean.eye_guard', state: 'off', attributes: { friendly_name: 'Guard' } },
    'binary_sensor.front_door': { entity_id: 'binary_sensor.front_door', state: 'off', attributes: { friendly_name: 'Front door' } },
    'camera.courtyard': { entity_id: 'camera.courtyard', state: 'idle', attributes: { friendly_name: 'Courtyard' } },
  };
}

export function mockEreignisse(jetzt = new Date()) {
  return {
    'calendar.family': [{ summary: 'School', start: `${isoTag(jetzt, 0)}T15:00:00` }],
    'calendar.waste': [
      { summary: 'Paper bin collection', start: isoTag(jetzt, 0) },
      { summary: 'Bio', start: isoTag(jetzt, 1) },
      { summary: 'Rest', start: isoTag(jetzt, 3) },
    ],
  };
}

export function zeichneDashboard(root, model, t, onPress) {
  const doc = root.ownerDocument;
  root.replaceChildren();
  const block = (title, node) => {
    if (!node) return;
    const h = doc.createElement('h2');
    h.textContent = title;
    root.append(h, node);
  };
  const zeile = (text) => {
    const p = doc.createElement('p');
    p.textContent = text;
    return p;
  };
  if (model.weather) {
    const w = model.weather;
    const bits = [];
    if (w.condition) bits.push(w.condition);
    if (w.temp != null) bits.push(`${kurzZahl(w.temp)} ${w.unit}`);
    const extra = [];
    if (w.high != null) extra.push(`${t('dash.high')} ${kurzZahl(w.high)}°`);
    if (w.low != null) extra.push(`${t('dash.low')} ${kurzZahl(w.low)}°`);
    const wrap = doc.createElement('div');
    wrap.append(zeile(bits.join(' · ') || t('dash.weather')));
    if (extra.length) wrap.append(zeile(extra.join('  ')));
    block(t('dash.weather'), wrap);
  }
  if (model.events.length) {
    const ul = doc.createElement('ul');
    for (const ev of model.events) {
      const li = doc.createElement('li');
      const wann = t(ev.when === 'tomorrow' ? 'dash.tomorrow' : 'dash.today');
      li.textContent = ev.time ? `${ev.summary} · ${wann} ${ev.time}` : `${ev.summary} · ${wann}`;
      ul.append(li);
    }
    block(t('dash.calendar'), ul);
  }
  if (model.waste.length) {
    const ul = doc.createElement('ul');
    for (const bin of model.waste) {
      const li = doc.createElement('li');
      li.textContent = `${bin.name} · ${t(bin.when === 'tomorrow' ? 'dash.tomorrow' : 'dash.today')}`;
      ul.append(li);
    }
    block(t('dash.waste'), ul);
  }
  if (model.windows.length) block(t('dash.windows'), zeile(model.windows.join(', ')));
  if (model.indoor.length) {
    const grid = doc.createElement('div');
    grid.className = 'dash-grid';
    for (const raum of model.indoor) {
      const cell = doc.createElement('span');
      cell.textContent = `${raum.name} ${raum.text}`;
      grid.append(cell);
    }
    block(t('dash.indoor'), grid);
  }
  const aussen = [];
  if (model.rain) aussen.push(`${model.rain.name} · ${t(model.rain.on ? 'dash.rainOn' : 'dash.rainOff')}`);
  if (model.wind) aussen.push(`${model.wind.name} ${model.wind.text}`);
  if (model.brightness) aussen.push(`${model.brightness.name} ${model.brightness.text}`);
  if (aussen.length) {
    const grid = doc.createElement('div');
    grid.className = 'dash-grid';
    for (const text of aussen) {
      const cell = doc.createElement('span');
      cell.textContent = text;
      grid.append(cell);
    }
    block(t('dash.outdoor'), grid);
  }
  if (model.buttons.length) {
    const row = doc.createElement('div');
    row.className = 'dash-actions';
    for (const knopf of model.buttons) {
      const b = doc.createElement('button');
      b.type = 'button';
      if (knopf.kind === 'all_off') b.textContent = t('dash.allOff');
      else if (knopf.kind === 'guard') b.textContent = t(knopf.on ? 'dash.guardOn' : 'dash.guardOff');
      else b.textContent = knopf.label;
      b.addEventListener('click', () => onPress(knopf));
      row.append(b);
    }
    root.append(row);
  }
}
