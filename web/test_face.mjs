// SPDX-License-Identifier: MIT
// Face release: storage, presence wake, reminder, heartbeat, application cache.
import fs from 'fs';
import { VORGABE, ladeKonfig, setzeKlasse } from './konfig.js';
import { HA_AUTH_RETRY_MS, HA_PING_MS, HA_PONG_MS, mapHaState, verbindeHa } from './ha.js';
import { tuerOffen } from './dimmen.js';
import { ackAnHa, createHinweis } from './hinweis.js';
import { WAKE_VARIANTS, createWecker, waehleVariante } from './wache.js';
import { VERSION } from './version.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

function mem() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

setzeKlasse('tablet');
const alt = mem();
alt.setItem('eye_ui_config', JSON.stringify({
  v: 4,
  profiles: {
    tablet: {
      haToken: 'token-from-1-0',
      haUrl: 'ws://homeassistant.local:8123/api/websocket',
      schlafSekunden: 900,
    },
  },
}));
const migriert = ladeKonfig('', alt);
assert(migriert.haToken === 'token-from-1-0', 'storage migration keeps token');
assert(migriert.haUrl.includes('homeassistant.local'), 'storage migration keeps the address');
assert(migriert.reminderEntity === 'input_text.eye_hinweis', 'reminder entity default');
assert(migriert.reminderAckScript === 'script.eye_hinweis_quittieren', 'reminder script default');
assert(VORGABE.presenceEntity === '', 'presence starts empty');
const flach = mem();
flach.setItem('gk_ha_token', 'token-aus-gk');
const ausAlt = ladeKonfig('', flach);
assert(ausAlt.haToken === 'token-aus-gk', 'a 1.0 token key is kept');

assert(mapHaState('wake') === 'wake', 'wake is its own signal');
assert(mapHaState('wake / hallo') === 'hallo', 'the hello phrase stays hello');
assert(tuerOffen('open') && tuerOffen('on') && !tuerOffen('off') && !tuerOffen('closed'), 'door open values');

{
  const wach = createWecker(() => 0);
  assert(wach.impuls({ schlaeft: false, an: true }) === null, 'presence wake only from sleep');
  wach.eingeschlafen();
  assert(wach.impuls({ schlaeft: true, an: true }) === null, 'a sensor that was already on does not wake');
  assert(wach.impuls({ schlaeft: true, an: false }) === null, 'presence off');
  const erste = wach.impuls({ schlaeft: true, an: true });
  assert(erste && erste.sound, 'presence wakes from sleep');
  assert(wach.impuls({ schlaeft: true, an: true }) === null, 'no second edge while the sensor stays on');
  assert(wach.impuls({ schlaeft: false, an: false }) === null, 'clearing presence while awake does nothing');
  assert(wach.impuls({ schlaeft: false, an: true }) === null, 'no wake repeat while awake');
  wach.eingeschlafen();
  assert(wach.impuls({ schlaeft: true, an: true }) === null, 'staying present through sleep does not wake again');
  assert(wach.impuls({ schlaeft: true, an: false }) === null, 'presence off after sleep');
  const nochmal = wach.impuls({ schlaeft: true, an: true });
  assert(nochmal && nochmal.index !== erste.index, 'the next sleep can wake again');
}

{
  let letzte = waehleVariante(null, () => 0);
  for (let i = 0; i < 8; i++) {
    const naechste = waehleVariante(letzte, () => 0);
    assert(naechste !== letzte, 'variant randomizer no immediate repeat');
    letzte = naechste;
  }
  assert(WAKE_VARIANTS.length === 4, 'four wake variants');
  const toene = new Set(WAKE_VARIANTS.map((v) => v.sound));
  assert(toene.size === 4, 'four different hums');
}

{
  const hinweis = createHinweis();
  assert(hinweis.setzen('Paper bin') === 'zeigen' && hinweis.offen && hinweis.text === 'Paper bin', 'reminder show');
  assert(hinweis.setzen('Paper bin') === 'gleich', 'the same note stays');
  assert(hinweis.quittieren() === true && !hinweis.offen, 'reminder ack');
  assert(hinweis.quittieren() === false, 'a second ack does nothing');
  assert(ackAnHa('ha') === true && ackAnHa('demo') === false, 'only a Home Assistant note calls the script');
  assert(hinweis.setzen('unknown') === 'still', 'unknown is not a note');
}

assert(HA_PING_MS === 30000 && HA_PONG_MS === 10000 && HA_AUTH_RETRY_MS === 60000, 'heartbeat timings');

class FakeSocket {
  constructor() {
    this.readyState = 0;
    this.sent = [];
  }
  send(raw) { this.sent.push(JSON.parse(raw)); }
  close() { this.readyState = 3; if (this.onclose) this.onclose(); }
  open() { this.readyState = 1; if (this.onopen) this.onopen(); }
  recv(obj) { if (this.onmessage) this.onmessage({ data: JSON.stringify(obj) }); }
}

function uhr() {
  let now = 0;
  let seq = 1;
  const jobs = [];
  return {
    setTimeout(fn, ms) {
      const id = seq++;
      jobs.push({ id, fn, at: now + ms });
      return id;
    },
    clearTimeout(id) {
      const i = jobs.findIndex((job) => job.id === id);
      if (i >= 0) jobs.splice(i, 1);
    },
    advance(ms) {
      const ziel = now + ms;
      let guard = 0;
      while (guard++ < 40) {
        let next = null;
        for (const job of jobs) {
          if (job.at <= ziel && (!next || job.at < next.at)) next = job;
        }
        if (!next) break;
        now = next.at;
        jobs.splice(jobs.indexOf(next), 1);
        next.fn();
      }
      now = ziel;
    },
  };
}

function verbinden(clock, extra) {
  const sockets = [];
  const stati = [];
  const ha = verbindeHa({
    url: 'ws://ha.local/api/websocket',
    token: 'alt',
    entityId: 'input_select.eye_ui_state',
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    ...extra,
    socketFactory() {
      const sock = new FakeSocket();
      sockets.push(sock);
      return sock;
    },
    onZustand() {},
    onStatus(s) { stati.push(s.status); },
  });
  return { ha, sockets, stati };
}

{
  const clock = uhr();
  const { ha, sockets } = verbinden(clock);
  const sock = sockets[0];
  sock.open();
  sock.recv({ type: 'auth_required' });
  sock.recv({ type: 'auth_ok' });
  clock.advance(HA_PING_MS);
  assert(sock.sent.some((msg) => msg.type === 'ping'), 'heartbeat sends ping');
  clock.advance(HA_PONG_MS);
  assert(sock.readyState === 3, 'missing pong closes the socket');
  clock.advance(5000);
  assert(sockets.length === 2, 'heartbeat reconnect');
  ha.stop();
}

{
  const clock = uhr();
  let token = 'bad';
  const { ha, sockets, stati } = verbinden(clock, {
    liesZugang() { return { url: 'ws://ha.local/api/websocket', token }; },
  });
  const sock = sockets[0];
  sock.open();
  sock.recv({ type: 'auth_required' });
  sock.recv({ type: 'auth_invalid', message: 'Invalid access token' });
  assert(stati.includes('auth_ungueltig'), 'auth_invalid is reported');
  clock.advance(HA_AUTH_RETRY_MS - 1);
  assert(sockets.length === 1, 'auth_invalid waits');
  token = 'good';
  clock.advance(1);
  assert(sockets.length === 2, 'auth_invalid retry');
  sockets[1].open();
  sockets[1].recv({ type: 'auth_required' });
  assert(sockets[1].sent[0] && sockets[1].sent[0].access_token === 'good', 'retry reads the new token');
  ha.stop();
}

const cache = fs.readFileSync(new URL('./eye-ui.appcache', import.meta.url), 'utf8');
const zeile = cache.split('\n').find((line) => line.startsWith('# version '));
assert(zeile === `# version ${VERSION}`, 'appcache version matches VERSION');
assert(cache.startsWith('CACHE MANIFEST'), 'appcache header');
assert(cache.includes('NETWORK:\n*'), 'appcache lets the socket through');
const index = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('./settings.html', import.meta.url), 'utf8');
assert(index.includes('manifest="eye-ui.appcache"') && settings.includes('manifest="eye-ui.appcache"'), 'both pages reference the manifest');
assert(!/href="\/|src="\//.test(index + settings), 'asset URLs are relative');
for (const line of cache.split('\n')) {
  if (!line || line.startsWith('#') || line === 'CACHE MANIFEST' || line === 'CACHE:' || line === 'NETWORK:' || line === '*') continue;
  assert(!line.startsWith('/') && !line.includes('://'), `appcache path stays relative: ${line}`);
  assert(fs.existsSync(new URL(`./${line}`, import.meta.url)), `appcache file missing: ${line}`);
}
for (const name of ['15_hmmm_a', '16_hmmm_b', '17_hmmm_c', '18_hmmm_d', '19_hinweis']) {
  const wav = fs.readFileSync(new URL(`./sounds/${name}.wav`, import.meta.url));
  assert(wav.toString('ascii', 0, 4) === 'RIFF' && wav.toString('ascii', 8, 12) === 'WAVE', `${name} is a wav`);
}

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Face release checks ok');
