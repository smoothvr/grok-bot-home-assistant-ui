// SPDX-License-Identifier: MIT
// Local Home Assistant over the WebSocket API. No cloud service. The token is sent only to that Home Assistant.
import { KURZ, KURZ_VON_CLIP } from './namen.js';

const ALIAS = {
  idle: 'idle',
  idle_wach: 'idle',
  wach: 'idle',
  neutral: 'idle',
  blicke: 'blicke',
  blicke_oben_unten_links_rechts: 'blicke',
  zuhoeren: 'zuhoeren',
  zuhoren: 'zuhoeren',
  listening: 'zuhoeren',
  zuhoeren_listening: 'zuhoeren',
  nachdenken: 'nachdenken',
  nachdenken_processing: 'nachdenken',
  processing: 'nachdenken',
  denken: 'nachdenken',
  verstanden: 'verstanden',
  erledigt: 'erledigt',
  erledigt_danke: 'erledigt',
  danke: 'erledigt',
  nicht_verstanden: 'nicht_verstanden',
  nichtverstanden: 'nicht_verstanden',
  confused: 'nicht_verstanden',
  fehler: 'fehler',
  error: 'fehler',
  schlafen: 'schlafen',
  sleep: 'schlafen',
  sleeping: 'schlafen',
  hallo: 'hallo',
  wake: 'wake',
  wake_hallo: 'hallo',
  lachen: 'lachen',
  laugh: 'lachen',
  musik_an: 'musik_an',
  musik_ein: 'musik_an',
  music_on: 'musik_an',
  musik_aus: 'idle',
  musik_off: 'idle',
  music_off: 'idle',
  licht_an: 'licht_an',
  licht_ein: 'licht_an',
  light_on: 'licht_an',
  lights_on: 'licht_an',
  licht_aus: 'licht_aus',
  light_off: 'licht_aus',
  lights_off: 'licht_aus',
  thinking: 'nachdenken',
  understood: 'verstanden',
  got_it: 'verstanden',
  done: 'erledigt',
  thanks: 'erledigt',
  hello: 'hallo',
  hi: 'hallo',
  sprechen: 'sprechen',
  speaking: 'sprechen',
  not_understood: 'nicht_verstanden',
  didnt_understand: 'nicht_verstanden',
  gaze: 'blicke',
  look: 'blicke',
  looking: 'blicke',
  unavailable: null,
  unknown: null,
  none: null,
  null: null,
};

export function normZustand(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const MELDUNG_BEKANNT = {
  tokenRejected: 1,
  statesUnreadable: 1,
  entityMissing: 1,
  entityMissingConfig: 1,
  callFailed: 1,
  connectFailed: 1,
  notSet: 1,
  eyesOnly: 1,
  eyesOnlyOffline: 1,
  tokenMissing: 1,
  connectionTrouble: 1,
};

// A known key passes through. Anything else becomes a short key, never a raw Home Assistant string.
export function sichereMeldung(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  if (text.startsWith('called:')) {
    const name = text.slice(7);
    return /^[a-z0-9_./-]{1,80}$/i.test(name) ? text : 'callFailed';
  }
  if (MELDUNG_BEKANNT[text]) return text;
  if (/token|unauthorized|invalid access/i.test(text)) return 'tokenRejected';
  if (/not found|\bentity\b/i.test(text)) return 'entityMissing';
  return 'connectionTrouble';
}

// Returns the short id (idle, zuhoeren, …), or null when the value is not an eye state.
export function mapHaState(raw) {
  const n = normZustand(raw);
  if (!n) return null;
  if (Object.prototype.hasOwnProperty.call(ALIAS, n)) return ALIAS[n];
  if (KURZ_VON_CLIP[n]) return KURZ_VON_CLIP[n];
  if (KURZ[n]) return n;
  return null;
}

export function normalisiereHaUrl(url) {
  const roh = String(url ?? '').trim();
  if (!roh || roh.length > 500) return '';
  let x = roh;
  if (/^https:\/\//i.test(x)) x = 'wss://' + x.slice('https://'.length);
  else if (/^http:\/\//i.test(x)) x = 'ws://' + x.slice('http://'.length);
  if (!/^wss?:\/\//i.test(x)) return '';
  let parsed;
  try { parsed = new URL(x); } catch { return ''; }
  if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') return '';
  if (parsed.username || parsed.password) return '';
  parsed.hash = '';
  parsed.searchParams.delete('token');
  parsed.searchParams.delete('access_token');
  if (!parsed.pathname.includes('/api/websocket')) parsed.pathname = '/api/websocket';
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/api/websocket';
  return parsed.toString();
}

export function gueltigeEntity(id) {
  return /^[a-z0-9_]+\.[a-z0-9_]+$/.test(String(id ?? '').trim());
}

// "script.name" calls script.turn_on.
// "domain.service/entity_id" calls that service, for example "light.turn_on/light.living_room".
const DIENST_TEIL = /^[a-z0-9_]+$/;

export function dienstAus(spec) {
  const s = String(spec ?? '').trim().toLowerCase();
  if (!s || s.length > 180) return null;
  if (s.includes('/')) {
    const teile = s.split('/');
    if (teile.length !== 2) return null;
    const parts = teile[0].trim().split('.');
    const ziel = teile[1].trim();
    if (parts.length !== 2 || !DIENST_TEIL.test(parts[0]) || !DIENST_TEIL.test(parts[1])) return null;
    if (!gueltigeEntity(ziel)) return null;
    return { domain: parts[0], service: parts[1], target: { entity_id: ziel } };
  }
  const entity_id = s.includes('.') ? s : `script.${s}`;
  if (!gueltigeEntity(entity_id)) return null;
  return { domain: 'script', service: 'turn_on', target: { entity_id } };
}

export function skriptAufruf(id, spec) {
  const dienst = dienstAus(spec);
  if (!dienst) return null;
  return { id, type: 'call_service', domain: dienst.domain, service: dienst.service, target: dienst.target };
}

// Same call as skriptAufruf, plus service_data for select_source and play_media.
export function dienstAufruf(id, spec, data) {
  const msg = skriptAufruf(id, spec);
  if (!msg) return null;
  if (data && typeof data === 'object') msg.service_data = data;
  return msg;
}

export function startNachrichten(entityId, id0 = 1) {
  return [
    { id: id0, type: 'get_states' },
    { id: id0 + 1, type: 'subscribe_events', event_type: 'state_changed' },
  ];
}

// art is 'get_states' for the matching result id, otherwise null.
// State values stay raw here. verbindeHa maps them.
export function deuteHa(data, entityId, art = null, mediaId = '') {
  if (!data || typeof data !== 'object') return [];
  if (data.type === 'auth_required') return [{ typ: 'auth_required' }];
  if (data.type === 'auth_ok') return [{ typ: 'auth_ok' }];
  if (data.type === 'auth_invalid') return [{ typ: 'auth_invalid', meldung: sichereMeldung(data.message || 'tokenRejected') }];
  if (data.type === 'result' && art === 'get_states') {
    if (!data.success || !Array.isArray(data.result)) {
      return [{ typ: 'fehler', meldung: sichereMeldung(data.error?.message || 'statesUnreadable') }];
    }
    const out = [];
    const hit = data.result.find((e) => e && e.entity_id === entityId);
    if (!hit) out.push({ typ: 'hinweis', meldung: 'entityMissing' });
    else out.push({ typ: 'zustand', zustand: hit.state, quelle: 'snapshot', ton: false });
    if (mediaId && mediaId !== entityId) {
      const media = data.result.find((e) => e && e.entity_id === mediaId);
      if (media && media.state && media.state !== 'unavailable' && media.state !== 'unknown') {
        out.push({ typ: 'medien', state: media.state, attr: media.attributes || {}, quelle: 'snapshot' });
      } else out.push({ typ: 'medien', state: 'unavailable', attr: {}, quelle: 'snapshot' });
    }
    return out;
  }
  if (data.type === 'result' && data.success === false) {
    return [{ typ: 'fehler', meldung: sichereMeldung(data.error?.message || 'callFailed') }];
  }
  if (data.type === 'event') {
    const ev = data.event || {};
    const neu = ev.data;
    if (mediaId && mediaId !== entityId && neu && neu.entity_id === mediaId) {
      const lebend = neu.new_state && neu.new_state.state && neu.new_state.state !== 'unavailable' && neu.new_state.state !== 'unknown';
      if (!lebend) return [{ typ: 'medien', state: 'unavailable', attr: {}, quelle: 'event' }];
      return [{ typ: 'medien', state: neu.new_state.state, attr: neu.new_state.attributes || {}, quelle: 'event' }];
    }
    if (neu && neu.entity_id === entityId && neu.new_state && typeof neu.new_state.state === 'string') {
      return [{ typ: 'zustand', zustand: neu.new_state.state, quelle: 'event', ton: true }];
    }
    const trig = ev.variables?.trigger?.to_state;
    if (trig && typeof trig.state === 'string' && (!trig.entity_id || trig.entity_id === entityId)) {
      return [{ typ: 'zustand', zustand: trig.state, quelle: 'trigger', ton: true }];
    }
  }
  return [];
}

function mappe(aktion) {
  if (aktion.typ !== 'zustand') return aktion;
  const kurz = mapHaState(aktion.zustand);
  if (!kurz) return null;
  return { ...aktion, zustand: kurz, roh: aktion.zustand };
}

export function zustandsliste(data, art) {
  if (!data || typeof data !== 'object') return null;
  if (data.type === 'result' && art === 'get_states' && data.success && Array.isArray(data.result)) {
    return data.result.filter((e) => e && e.entity_id).map((e) => ({
      entity_id: e.entity_id,
      state: e.state,
      attributes: e.attributes || {},
    }));
  }
  if (data.type === 'event') {
    const neu = data.event && data.event.data;
    if (neu && neu.entity_id && neu.new_state) {
      return [{ entity_id: neu.entity_id, state: neu.new_state.state, attributes: neu.new_state.attributes || {} }];
    }
  }
  return null;
}

export const HA_PING_MS = 30000;
export const HA_PONG_MS = 10000;
export const HA_AUTH_RETRY_MS = 60000;
export const HA_RETRY_MS = 5000;

export function verbindeHa(opts) {
  const {
    url: url0, token: token0, entityId, mediaEntity = '', onZustand, onMedien, onStatus, onStates,
    socketFactory = (u) => new WebSocket(u),
    reconnect = true,
    liesZugang,
  } = opts;
  const later = opts.setTimeout || setTimeout;
  const cancel = opts.clearTimeout || clearTimeout;
  const pingEvery = opts.pingEvery == null ? HA_PING_MS : opts.pingEvery;
  const pongWait = opts.pongWait == null ? HA_PONG_MS : opts.pongWait;
  const authRetryMs = opts.authRetryMs == null ? HA_AUTH_RETRY_MS : opts.authRetryMs;
  const retryMs = opts.retryMs == null ? HA_RETRY_MS : opts.retryMs;
  let url = url0;
  let token = token0;
  let stopped = false;
  let authPause = false;
  let ersetzt = false;
  let ws = null;
  let naechsteId = 1;
  let timer = null;
  let pingTimer = null;
  let pongTimer = null;
  const wartet = new Map();
  const antworten = new Map();
  const status = (name, extra) => onStatus?.({ status: name, ...extra });

  const frisch = () => {
    if (typeof liesZugang !== 'function') return;
    const zugang = liesZugang();
    if (!zugang || typeof zugang !== 'object') return;
    if (typeof zugang.url === 'string') url = zugang.url;
    if (typeof zugang.token === 'string') token = zugang.token;
  };

  const clearPing = () => {
    if (pingTimer) { cancel(pingTimer); pingTimer = null; }
    if (pongTimer) { cancel(pongTimer); pongTimer = null; }
  };

  const armPing = () => {
    clearPing();
    pingTimer = later(() => {
      pingTimer = null;
      if (stopped || !ws || ws.readyState !== 1) return;
      const id = naechsteId++;
      wartet.set(id, 'ping');
      try { ws.send(JSON.stringify({ id, type: 'ping' })); }
      catch { return; }
      pongTimer = later(() => {
        pongTimer = null;
        try { ws.close(); } catch { /* already closed */ }
      }, pongWait);
    }, pingEvery);
  };

  const send = (msg, art) => {
    if (msg.id == null) msg.id = naechsteId++;
    else naechsteId = Math.max(naechsteId, msg.id + 1);
    if (art) wartet.set(msg.id, art);
    ws.send(JSON.stringify(msg));
  };

  const behandle = (data) => {
    const art = data && data.id != null ? wartet.get(data.id) : null;
    if (data && (data.type === 'pong' || art === 'ping')) {
      if (pongTimer) { cancel(pongTimer); pongTimer = null; }
      if (data.id != null) wartet.delete(data.id);
      armPing();
      return;
    }
    let angefragt = false;
    if (data && data.id != null && antworten.has(data.id)) {
      angefragt = true;
      const loesen = antworten.get(data.id);
      antworten.delete(data.id);
      loesen(data.success === false ? null : (data.result || data));
    }
    if (data && data.id != null) wartet.delete(data.id);
    const liste = zustandsliste(data, art);
    if (liste && onStates) onStates(liste);
    for (const roh of deuteHa(data, entityId, art, mediaEntity)) {
      if (angefragt && (roh.typ === 'fehler' || roh.typ === 'hinweis')) continue;
      const aktion = mappe(roh);
      if (!aktion) continue;
      if (aktion.typ === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: token }));
      } else if (aktion.typ === 'auth_ok') {
        authPause = false;
        status('verbunden');
        const [stati, abo] = startNachrichten(entityId, naechsteId);
        send(stati, 'get_states');
        send(abo, 'subscribe');
        armPing();
      } else if (aktion.typ === 'auth_invalid') {
        authPause = true;
        status('auth_ungueltig', { meldung: aktion.meldung });
        try { ws.close(); } catch { /* already closed */ }
      } else if (aktion.typ === 'zustand') {
        onZustand?.(aktion);
      } else if (aktion.typ === 'medien') {
        onMedien?.(aktion);
      } else if (aktion.typ === 'fehler') {
        status('fehler', { meldung: aktion.meldung });
      } else if (aktion.typ === 'hinweis') {
        status('verbunden', { meldung: aktion.meldung });
      }
    }
  };

  const connect = () => {
    if (stopped) return;
    clearPing();
    frisch();
    if (!url || !token) {
      status('aus', { meldung: token ? '' : 'tokenMissing' });
      schedule(authRetryMs);
      return;
    }
    status('verbinde');
    if (ws && ws.readyState < 2) {
      const alt = ws;
      alt.onclose = null;
      try { alt.close(); } catch { /* already closed */ }
    }
    try {
      ws = socketFactory(url);
    } catch (e) {
      status('fehler', { meldung: e?.message || 'connectFailed' });
      schedule();
      return;
    }
    ws.onopen = () => status('offen');
    ws.onmessage = (m) => {
      let data;
      try { data = JSON.parse(typeof m.data === 'string' ? m.data : ''); } catch { return; }
      behandle(data);
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      wartet.clear();
      clearPing();
      if (stopped) return;
      if (!authPause) status('getrennt');
      schedule();
    };
  };

  const schedule = (ms) => {
    if (stopped || !reconnect) return;
    if (timer) cancel(timer);
    const wait = ms != null ? ms : (authPause ? authRetryMs : retryMs);
    timer = later(connect, wait);
  };

  connect();
  return {
    stop() {
      stopped = true;
      if (timer) cancel(timer);
      timer = null;
      clearPing();
      try { if (ws) ws.close(); } catch { /* already closed */ }
    },
    nudge() {
      if (stopped) return;
      authPause = false;
      if (ws && ws.readyState === 1) return;
      if (timer) { cancel(timer); timer = null; }
      connect();
    },
    callScript(spec) {
      return this.callService(spec);
    },
    callService(spec, data) {
      const msg = dienstAufruf(naechsteId, spec, data);
      if (!msg || !ws || ws.readyState !== 1) return false;
      send(msg, 'call');
      return true;
    },
    anfragen(msg) {
      return new Promise((resolve) => {
        if (!msg || !ws || ws.readyState !== 1) { resolve(null); return; }
        const id = naechsteId++;
        antworten.set(id, resolve);
        try { ws.send(JSON.stringify({ ...msg, id })); }
        catch { antworten.delete(id); resolve(null); return; }
        setTimeout(() => {
          if (!antworten.has(id)) return;
          antworten.delete(id);
          resolve(null);
        }, 8000);
      });
    },
  };
}

export function mockHa(onZustand, onStatus, onMedien, opt) {
  const extra = typeof opt === 'function' ? { onStates: opt } : (opt || {});
  onStatus?.({ status: 'mock' });
  if (extra.onStates && extra.states) extra.onStates(Object.values(extra.states));
  return {
    mock: true,
    stop() {},
    einspeisenMedien(state, attr) {
      onMedien?.({ typ: 'medien', state, attr: attr || {}, quelle: 'mock' });
    },
    callScript(spec) {
      return this.callService(spec);
    },
    callService(spec, data) {
      const msg = dienstAufruf(1, spec, data);
      onStatus?.({
        status: 'mock',
        letzterAufruf: msg?.target?.entity_id || '',
        aufrufOk: !!msg,
        serviceData: msg?.service_data || null,
      });
      return !!msg;
    },
    anfragen(msg) {
      const id = msg && (msg.target && msg.target.entity_id);
      if (msg && msg.domain === 'calendar' && msg.service === 'get_events') {
        const events = (extra.events && extra.events[id]) || [];
        return Promise.resolve({ service_response: { [id]: { events } } });
      }
      if (msg && msg.domain === 'weather' && msg.service === 'get_forecasts') {
        const forecast = [{ temperature: 6, templow: 1 }];
        return Promise.resolve({ service_response: { [id]: { forecast } } });
      }
      return Promise.resolve(null);
    },
    einspeisen(roh) {
      const zustand = mapHaState(roh);
      if (!zustand) return false;
      onZustand?.({ typ: 'zustand', zustand, roh: String(roh), quelle: 'mock', ton: true });
      return true;
    },
  };
}
