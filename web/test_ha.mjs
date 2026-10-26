// SPDX-License-Identifier: MIT
// Home Assistant state mapping, protocol, sleep, and gestures.
import fs from 'fs';
import { makeClips } from './zustaende.js';
import { Augen } from './engine.js';
import { KURZ } from './namen.js';
import { VORGABE, aktiveKlasse, geraeteKlasse, ladeKonfig, mitUrl, setzeKlasse, speichereKonfig } from './konfig.js';
import { ALARM_NORMAL, ALARM_STARK, level, levelRuhig, lichtBefehl, wave } from './licht.js';
import { DEMO_MUSIK_MS, DEMO_REIHE, demoSchritt } from './demo.js';
import { VERSION } from './version.js';
import {
  deuteHa, dienstAufruf, dienstAus, gueltigeEntity, mapHaState, normalisiereHaUrl, sichereMeldung, skriptAufruf, verbindeHa,
} from './ha.js';
import { MUSIK_RUHE_MS, naechsteEintraege, sollMusikOeffnen, wiedergabeLaeuft } from './nowplaying.js';
import { createWaechter } from './schlaf.js';
import { BEFEHLE } from './befehle.js';
import {
  ADMIN_FENSTER_MS, ADMIN_TAPS, HALTEN_MS, TAP_WARTE_MS,
  createAdminTaps, eckName, wisch, wischAktion, zeigerArt, zoneFuer,
} from './gesten.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

const faelle = [
  ['idle', 'idle'],
  ['  Idle (wach) ', 'idle'],
  ['wach', 'idle'],
  ['Zuhören', 'zuhoeren'],
  ['zuhören (listening)', 'zuhoeren'],
  ['listening', 'zuhoeren'],
  ['nachdenken', 'nachdenken'],
  ['processing', 'nachdenken'],
  ['verstanden', 'verstanden'],
  ['erledigt / danke', 'erledigt'],
  ['danke', 'erledigt'],
  ['nicht verstanden', 'nicht_verstanden'],
  ['Nicht-verstanden', 'nicht_verstanden'],
  ['fehler', 'fehler'],
  ['error', 'fehler'],
  ['schlafen', 'schlafen'],
  ['sleep', 'schlafen'],
  ['wake / hallo', 'hallo'],
  ['hallo', 'hallo'],
  ['lachen', 'lachen'],
  ['MUSIK AN', 'musik_an'],
  ['musik_aus', 'idle'],
  ['licht an', 'licht_an'],
  ['licht_aus', 'licht_aus'],
  ['light_off', 'licht_aus'],
  ['thinking', 'nachdenken'],
  ['understood', 'verstanden'],
  ['done', 'erledigt'],
  ['thanks', 'erledigt'],
  ['hello', 'hallo'],
  ['hi', 'hallo'],
  ['not_understood', 'nicht_verstanden'],
  ['gaze', 'blicke'],
  ['look', 'blicke'],
  ['lights_on', 'licht_an'],
  ['lights_off', 'licht_aus'],
  ['05_zuhoeren', 'zuhoeren'],
  ['08_erledigt', 'erledigt'],
  ['14_licht_aus', 'licht_aus'],
  ['angry', 'angry'],
  ['15_angry', 'angry'],
  ['unavailable', null],
  ['unknown', null],
  ['', null],
  [null, null],
  ['quatsch', null],
  ['input_select.eye_ui_state', null],
];
for (const [roh, erwartet] of faelle) {
  assert(mapHaState(roh) === erwartet, `mapHaState(${JSON.stringify(roh)}) = ${mapHaState(roh)}, erwartet ${erwartet}`);
}
for (const kurz of Object.keys(KURZ)) {
  assert(mapHaState(kurz) === kurz || (kurz === 'musik_aus'), `${kurz} does not map to itself`);
  assert(mapHaState(KURZ[kurz]) === kurz, `clip ${KURZ[kurz]} does not map to ${kurz}`);
}
assert(mapHaState('sprechen') === 'sprechen' && mapHaState('speaking') === 'sprechen', 'speaking is a light state, not a new clip');
assert(!Object.prototype.hasOwnProperty.call(KURZ, 'sprechen'), 'speaking does not add a clip');

const onsets = JSON.parse(fs.readFileSync(new URL('./onsets.json', import.meta.url)));
const clipListe = makeClips(onsets);
const clips = new Set(clipListe.map((c) => c.name));
assert(clips.size === 15, 'expected 15 clips');
for (const clip of Object.values(KURZ)) assert(clips.has(clip), `missing clip: ${clip}`);
{
  const augen = new Augen(clipListe, () => 0.5);
  augen.set('05_zuhoeren');
  for (let i = 0; i < 200; i++) augen.tick(0.1);
  assert(augen.c.name === '05_zuhoeren', 'listening stays until the next state');
  augen.set('02_hallo');
  for (let i = 0; i < 40; i++) augen.tick(0.1);
  assert(augen.c.name === '03_idle', 'hello returns to idle after its clip');
  const hoeren = clipListe.find((c) => c.name === '05_zuhoeren');
  assert(hoeren && hoeren.loop === true, 'the listening clip loops');
  const zorn = clipListe.find((c) => c.name === '15_angry');
  assert(zorn && zorn.loop === true, 'the angry clip loops');
  assert(clipListe[clipListe.findIndex((c) => c.name === '10_fehler') + 1] === zorn, 'angry follows fehler in the demo');
  augen.set('15_angry');
  for (let i = 0; i < 400; i++) augen.tick(0.1);
  assert(augen.c.name === '15_angry', 'angry holds until the next state');
  assert(augen.ring && augen.ring[3] === 'angry' && augen.ring[0][0] > augen.ring[0][1], 'angry keeps a red ring');
  assert(augen.pose.lidA < -15 && augen.pose.sy < 0.85, 'angry keeps the frown while it holds');
  let weit = Math.abs(augen.pose.gx);
  for (let i = 0; i < 24; i++) {
    augen.tick(0.05);
    weit = Math.max(weit, Math.abs(augen.pose.gx));
  }
  assert(weit > 0.35, 'angry keeps scanning');
  augen.set('03_idle');
  augen.tick(0.05);
  assert(augen.c.name === '03_idle' && augen.pose.lidA < -8, 'leaving angry eases out of the frown');
  for (let i = 0; i < 12; i++) augen.tick(0.1);
  assert(Math.abs(augen.pose.lidA) < 8 && augen.pose.lidT < 0.2, 'the calm-down returns to idle');
  const erleichtert = new Augen(clipListe, () => 0.5);
  erleichtert.set('15_angry');
  erleichtert.tick(0.2);
  erleichtert.set('03_idle');
  erleichtert.tick(0.31);
  assert(erleichtert.pose.happy > 0.9, 'leaving angry smiles in the middle of the calm-down');
  erleichtert.tick(0.4);
  assert((erleichtert.pose.happy || 0) < 0.05, 'the smile is gone when the calm-down ends');
}

assert(normalisiereHaUrl('http://homeassistant.local:8123') === 'ws://homeassistant.local:8123/api/websocket', 'http does not become ws');
assert(normalisiereHaUrl('https://ha.local/api/websocket/') === 'wss://ha.local/api/websocket', 'https/wss');
assert(normalisiereHaUrl('ws://ha.local:8123/api/websocket?token=geheim') === 'ws://ha.local:8123/api/websocket', 'token stays in the URL');
assert(normalisiereHaUrl('javascript:alert(1)') === '', 'javascript-URL');
assert(normalisiereHaUrl('file:///tmp/x') === '', 'file-URL');
assert(normalisiereHaUrl('ws://user:pass@ha.local/api/websocket') === '', 'credentials in the URL');
assert(gueltigeEntity('input_select.eye_ui_state'), 'entity is valid');
assert(!gueltigeEntity('eyes'), 'entity has no domain');
assert(!gueltigeEntity(''), 'empty entity');

const skript = skriptAufruf(7, 'script.eye_music_on');
assert(skript.domain === 'script' && skript.service === 'turn_on' && skript.target.entity_id === 'script.eye_music_on', 'script call');
assert(!JSON.stringify(skript).includes('token'), 'call contains the token');
const licht = dienstAus('light.turn_on/light.living_room');
assert(licht.domain === 'light' && licht.service === 'turn_on' && licht.target.entity_id === 'light.living_room', 'service with a target');
assert(dienstAus('') === null && dienstAus('light.turn_on/') === null, 'broken service');
assert(dienstAus('javascript:alert(1)/light.x') === null && dienstAus('../evil.turn_on/light.x') === null, 'a service has to be domain.service');
assert(dienstAus('light.turn_on/light.living_room/extra') === null, 'a service has one target');
assert(sichereMeldung("extra keys not allowed @ data['entity_id']") === 'connectionTrouble', 'a raw error becomes a known key');
assert(sichereMeldung('Invalid access token') === 'tokenRejected', 'a token error stays a token error');
assert(sichereMeldung('called:script.eye_music_on') === 'called:script.eye_music_on', 'a known call name passes');
assert(sichereMeldung('called:<script>') === 'callFailed', 'a strange call name does not pass');
assert(sichereMeldung('tokenMissing') === 'tokenMissing', 'a known key passes');
const quelle = dienstAufruf(3, 'media_player.select_source/media_player.living_room', { source: 'Kitchen' });
assert(quelle && quelle.domain === 'media_player' && quelle.service === 'select_source' && quelle.service_data.source === 'Kitchen', 'select_source payload');
const titel = dienstAufruf(4, 'media_player.play_media/media_player.living_room', { media_content_id: 'spotify:track:1', media_content_type: 'music' });
assert(titel && titel.service === 'play_media' && titel.target.entity_id === 'media_player.living_room' && titel.service_data.media_content_id === 'spotify:track:1', 'play_media payload');
assert(dienstAufruf(5, 'script.eye_music_on').service_data === undefined, 'a script call has no service data');

const warteschlange = naechsteEintraege({
  media_content_id: 'spotify:track:now',
  queue: [
    { media_title: 'Now', media_artist: 'A', media_content_id: 'spotify:track:now' },
    { media_title: 'Next', media_artist: 'B', media_content_id: 'spotify:track:next' },
    'spotify:track:plain',
  ],
});
assert(warteschlange.length === 2 && warteschlange[0].label === 'Next — B' && warteschlange[0].art === 'media', 'the current track is left out of the queue');
assert(warteschlange[1].contentId === 'spotify:track:plain' && warteschlange[1].contentType === 'music', 'a spotify uri is playable');
assert(naechsteEintraege({
  media_content_id: 'a',
  queue: [{ media_content_id: 'a', title: 'A' }],
  source_list: ['Kitchen'],
}).length === 0, 'a queue with only the current track stays empty');
const listen = naechsteEintraege({
  source_list: ['Ignored'],
  playlists: [{ name: 'Focus', uri: 'spotify:playlist:1' }, { title: 'Night' }],
});
assert(listen.length === 2 && listen[0].contentId === 'spotify:playlist:1' && listen[1].art === 'media' && listen[1].contentId === 'Night', 'playlists win over sources');
const quellen = naechsteEintraege({ source_list: ['Kitchen', '', 'Living room', 'Office', 'Bath', 'Hall', 'Garden'] });
assert(quellen.length === 5 && quellen.every((e) => e.art === 'source') && quellen[0].source === 'Kitchen', 'source_list is capped at five');
const alsText = naechsteEintraege({ media_queue: '[{"title":"One","uri":"spotify:track:1"}]' });
assert(alsText.length === 1 && alsText[0].contentId === 'spotify:track:1', 'a json queue string');
assert(naechsteEintraege(null).length === 0 && naechsteEintraege({ queue: [] }).length === 0, 'nothing to show');
assert(sollMusikOeffnen('musik_an', 'idle', 'event') === true, 'music_on opens the view');
assert(sollMusikOeffnen('musik_an', 'playing', 'snapshot') === false, 'a snapshot does not open the view');
assert(sollMusikOeffnen('nachdenken', 'playing', 'event') === true, 'playback after thinking opens the view');
assert(sollMusikOeffnen('verstanden', 'playing', 'event') === true, 'playback after understood opens the view');
assert(sollMusikOeffnen('idle', 'playing', 'event') === false, 'playback while idle stays put');
assert(sollMusikOeffnen('nachdenken', 'paused', 'event') === false, 'a pause after thinking stays put');
assert(sollMusikOeffnen('nachdenken', 'playing', '') === false, 'a missing source stays put');
assert(wiedergabeLaeuft('playing') && wiedergabeLaeuft('Buffering') && !wiedergabeLaeuft('paused') && !wiedergabeLaeuft(''), 'playback states');
assert(MUSIK_RUHE_MS === 20000, 'playback may stay stopped for 20 seconds');

const urlKonfig = mitUrl(
  { ...VORGABE, haToken: 'bleibt' },
  new URLSearchParams('ha=ws://ha.local:8123/api/websocket&entity=sensor.hall&token=LEAK&schlaf=12&music_on=script.eye_music_on'),
);
assert(urlKonfig.haToken === 'bleibt', 'token from the URL was kept');
assert(!JSON.stringify(urlKonfig).includes('LEAK'), 'token from the URL is in the config');
assert(urlKonfig.haEntity === 'sensor.hall', 'entity from the URL');
assert(urlKonfig.scriptMusikAn === 'script.eye_music_on', 'music script from the URL');
assert(urlKonfig.haUrl === 'ws://ha.local:8123/api/websocket', 'URL from the parameter');
assert(urlKonfig.schlafSekunden === 12, 'sleep seconds from the URL');
const mockUrl = mitUrl(VORGABE, new URLSearchParams('ha=mock&entity=input_select.demo'));
assert(mockUrl.haUrl === '', 'ha=mock must not become a websocket URL');
assert(mockUrl.haEntity === 'input_select.demo', 'entity next to mock');

function mem() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
const storage = mem();
storage.setItem('gk_ha_token', 'alter-token');
const geladen = ladeKonfig(new URLSearchParams('token=LEAK'), storage);
assert(geladen.haToken === 'alter-token', 'old token key is migrated');
assert(storage.getItem('gk_ha_token') === null, 'old token key is removed');
assert(storage.getItem('gk_konfig') === null, 'old config key is removed');
assert(!storage.getItem('eye_ui_config').includes('LEAK'), 'token from the URL is not stored');
speichereKonfig({ ...geladen, haToken: 'neu' }, storage);
assert(JSON.parse(storage.getItem('eye_ui_config')).profiles.tablet.haToken === 'neu', 'token is stored locally');
const altSpeicher = mem();
altSpeicher.setItem('gk_konfig', JSON.stringify({ haToken: 'behalten', haEntity: 'input_select.custom' }));
const ausAlt = ladeKonfig(new URLSearchParams(''), altSpeicher);
assert(ausAlt.haToken === 'behalten' && ausAlt.haEntity === 'input_select.custom', 'old config keeps the token');
assert(altSpeicher.getItem('gk_konfig') === null, 'old config key is copied away');
assert(JSON.parse(altSpeicher.getItem('eye_ui_config')).profiles.tablet.haToken === 'behalten', 'migrated config uses the new key');
assert(JSON.parse(altSpeicher.getItem('eye_ui_config')).v === 4, 'a migrated save is version 4');

{
  setzeKlasse('tablet');
  const alt = mem();
  alt.setItem('eye_ui_config', JSON.stringify({
    v: 3,
    profiles: {
      tablet: {
        haUrl: 'ws://homeassistant.local:8123/api/websocket',
        haToken: 'token-aus-1-4-3',
        caption: false,
        lichtProfil: 'ruhig',
        nowPlaying: false,
        demo: false,
        gestenStand: 2,
        gesten: {
          left: { art: 'view', ziel: '' },
          right: { art: 'dashboard', ziel: '' },
          up: { art: 'light_toggle', ziel: '' },
          down: { art: 'light_toggle', ziel: '' },
          long: { art: 'none', ziel: '' },
        },
        ecken: {
          tl: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
          tr: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
          bl: { tap: { art: 'music_toggle', ziel: '' }, hold: { art: 'none', ziel: '' } },
          br: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
        },
      },
    },
  }));
  const neu = ladeKonfig('', alt);
  assert(neu.haToken === 'token-aus-1-4-3' && neu.haUrl.includes('homeassistant.local'), 'a 1.4.3 token and address survive');
  assert(neu.caption === false && neu.lichtProfil === 'ruhig' && neu.nowPlaying === false && neu.demo === false, 'a 1.4.3 display stays as saved');
  assert(neu.gesten.left.art === 'view' && neu.gesten.up.art === 'light_toggle' && neu.gesten.long.art === 'none', 'a 1.4.3 gesture map stays');
  assert(neu.ecken.bl.tap.art === 'music_toggle' && neu.alarmStaerke === 'stark', 'a missing alarm intensity becomes strong');
  const paket = JSON.parse(alt.getItem('eye_ui_config'));
  assert(paket.v === 4 && paket.profiles.tablet.haToken === 'token-aus-1-4-3', 'the migration writes the token back');
  assert(ladeKonfig('', alt).haToken === 'token-aus-1-4-3', 'a second load keeps the token');
  const nurTelefon = mem();
  nurTelefon.setItem('eye_ui_config', JSON.stringify({
    v: 3,
    profiles: {
      phone: { haToken: 'vom-telefon', haUrl: 'ws://phone.local/api/websocket' },
      tablet: { haUrl: 'ws://tablet.local/api/websocket', haToken: '' },
    },
  }));
  const geborgt = ladeKonfig('', nurTelefon, { haToken: 'aus-datei', haUrl: 'http://file.local:8123' });
  assert(geborgt.haToken === 'vom-telefon' && geborgt.haUrl.includes('file.local'), 'a stored token wins over the file');
  assert(JSON.parse(nurTelefon.getItem('eye_ui_config')).profiles.phone.haToken === 'vom-telefon', 'the other profile keeps its token');
  speichereKonfig({ ...geborgt, haToken: '' }, nurTelefon);
  assert(JSON.parse(nurTelefon.getItem('eye_ui_config')).profiles.tablet.haToken === 'vom-telefon', 'an empty save does not wipe a token');
  speichereKonfig({ ...geborgt, haToken: '' }, nurTelefon, { tokenLoeschen: true });
  assert(JSON.parse(nurTelefon.getItem('eye_ui_config')).profiles.tablet.haToken === '', 'forgetting the token clears it');
  const flach = mem();
  flach.setItem('eye_ui_config', JSON.stringify({ haUrl: 'ws://flat.local/api/websocket', haToken: 'flach', caption: false }));
  const ausFlach = ladeKonfig('', flach);
  assert(ausFlach.haToken === 'flach' && ausFlach.caption === false, 'a flat save keeps the token and the caption');
  assert(JSON.parse(flach.getItem('eye_ui_config')).v === 4, 'a flat save becomes version 4');
  setzeKlasse('tablet');
}

function spannweite(fn) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= 12; i++) {
    const wert = fn(i * 0.5);
    if (wert < min) min = wert;
    if (wert > max) max = wert;
  }
  return max - min;
}
const lichtKeys = ['idle', 'zuhoeren', 'sprechen', 'bestaetigt', 'fehler', 'schlafen', 'nachdenken', 'musik'];
for (const name of lichtKeys) {
  const ruhig = spannweite((t) => levelRuhig(name, t));
  const lebhaft = name === 'nachdenken' || name === 'musik'
    ? spannweite((t) => wave(name, 0.2, t)[0])
    : spannweite((t) => level(name, t));
  assert(ruhig > 0.02, `${name} quiet light moves`);
  assert(lebhaft > 0.02, `${name} lively light moves`);
}
for (const kurz of Object.keys(KURZ)) {
  const befehl = lichtBefehl(kurz, { alarmStark: true });
  if (kurz === 'angry') {
    assert(befehl.alarm && befehl.name === 'alarm' && befehl.rgb[0] === ALARM_STARK[0] && befehl.rgb[1] === ALARM_STARK[1], 'angry is the red alarm');
  } else {
    assert(!befehl.alarm && befehl.rgb == null && befehl.name !== 'alarm', `${kurz} keeps the living light`);
  }
}
assert(lichtBefehl('angry', { alarmStark: false }).rgb.join(',') === ALARM_NORMAL.join(','), 'normal alarm is milder');
assert(!lichtBefehl('angry', { fest: 'idle' }).alarm && lichtBefehl('sprechen').name === 'sprechen', 'speaking and a fixed preview are not the alarm');
assert(lichtBefehl('lachen').name === 'idle' && lichtBefehl('hallo').name === 'idle', 'a laugh and hello breathe as idle');
assert(demoSchritt(0).kurz === 'hallo' && demoSchritt(DEMO_REIHE.length - 1).kurz === 'musik_an', 'the demo ends on music');
assert(demoSchritt(DEMO_REIHE.length - 1).ms === DEMO_MUSIK_MS && demoSchritt(DEMO_REIHE.length).kurz === 'hallo', 'music holds, then the demo starts again');
assert(!DEMO_REIHE.includes('licht_an') && !DEMO_REIHE.includes('licht_aus'), 'the demo does not tour the themes or the lights');

class FakeSocket {
  constructor() {
    this.readyState = 0;
    this.sent = [];
  }
  send(raw) { this.sent.push(JSON.parse(raw)); }
  close() { this.readyState = 3; this.onclose?.(); }
  open() { this.readyState = 1; this.onopen?.(); }
  recv(obj) { this.onmessage?.({ data: JSON.stringify(obj) }); }
}

const zustaende = [];
const stati = [];
const sockets = [];
const ha = verbindeHa({
  url: 'ws://ha.local/api/websocket',
  token: 'geheim',
  entityId: 'input_select.eye_ui_state',
  reconnect: false,
  socketFactory() {
    const sock = new FakeSocket();
    sockets.push(sock);
    return sock;
  },
  onZustand: (a) => zustaende.push(a),
  onStatus: (s) => stati.push(s),
});
const sock = sockets[0];
assert(ha.callScript('script.eye_music_on') === false, 'call before connect');
sock.open();
sock.recv({ type: 'auth_required' });
assert(sock.sent[0]?.type === 'auth' && sock.sent[0].access_token === 'geheim', 'auth message');
assert(Object.keys(sock.sent[0]).length === 2, 'auth has extra fields');
sock.recv({ type: 'auth_ok' });
assert(sock.sent[1].type === 'get_states', 'missing get_states');
assert(sock.sent[2].type === 'subscribe_events' && sock.sent[2].event_type === 'state_changed', 'missing subscription');
sock.recv({
  id: sock.sent[1].id,
  type: 'result',
  success: true,
  result: [
    { entity_id: 'light.flur', state: 'on' },
    { entity_id: 'input_select.eye_ui_state', state: 'Zuhören' },
  ],
});
assert(zustaende.at(-1)?.zustand === 'zuhoeren' && zustaende.at(-1).ton === false, 'snapshot listening is silent');
const davor = zustaende.length;
sock.recv({
  id: sock.sent[2].id,
  type: 'event',
  event: { event_type: 'state_changed', data: { entity_id: 'light.flur', new_state: { state: 'on' } } },
});
assert(zustaende.length === davor, 'unrelated entity was applied');
sock.recv({
  type: 'event',
  event: { data: { entity_id: 'input_select.eye_ui_state', new_state: { state: 'nicht verstanden' } } },
});
assert(zustaende.at(-1).zustand === 'nicht_verstanden' && zustaende.at(-1).ton === true, 'not-understood event');
sock.recv({
  type: 'event',
  event: { variables: { trigger: { to_state: { entity_id: 'input_select.eye_ui_state', state: 'fehler' } } } },
});
assert(zustaende.at(-1).zustand === 'fehler' && zustaende.at(-1).quelle === 'trigger', 'legacy subscribe_trigger');
sock.onmessage({ data: 'kein json' });
const vorQuatsch = zustaende.length;
sock.recv({
  type: 'event',
  event: { data: { entity_id: 'input_select.eye_ui_state', new_state: { state: 'quatsch' } } },
});
assert(zustaende.length === vorQuatsch, 'unknown state was shown');
assert(ha.callScript('script.eye_light_on') === true, 'script after auth');
const aufruf = sock.sent.at(-1);
assert(aufruf.type === 'call_service' && aufruf.target.entity_id === 'script.eye_light_on', 'call_service');
assert(ha.callScript('light.turn_off/light.living_room') === true, 'light service');
assert(sock.sent.at(-1).domain === 'light' && sock.sent.at(-1).service === 'turn_off', 'light service fields');
for (const msg of sock.sent.slice(1)) assert(!JSON.stringify(msg).includes('geheim'), 'token in a later message');
ha.stop();

const deutung = deuteHa(
  { id: 3, type: 'result', success: false, error: { message: 'nicht erlaubt' } },
  'input_select.eye_ui_state',
  'call',
);
assert(deutung[0]?.typ === 'fehler', 'failed call');

let sockets2 = 0;
const ha2 = verbindeHa({
  url: 'ws://ha.local/api/websocket',
  token: 'x',
  entityId: 'input_select.eye_ui_state',
  reconnect: false,
  socketFactory() { sockets2++; return new FakeSocket(); },
  onZustand() {},
  onStatus() {},
});
ha2.stop();
assert(sockets2 === 1, 'stop connects again');

const w = 1000, h = 800;
assert(zoneFuer(20, 20, w, h) === null, 'top-left corner is not an edge command');
assert(zoneFuer(20, 780, w, h) === null, 'bottom-left corner is not an edge command');
assert(zoneFuer(980, 20, w, h) === null, 'top-right corner is not an edge command');
assert(zoneFuer(980, 780, w, h) === null, 'bottom-right corner is not an edge command');
assert(eckName(20, 20, w, h) === 'tl' && eckName(980, 780, w, h) === 'br', 'corner names');
assert(zoneFuer(150, 100, w, h) === 'musik_an', 'top left');
assert(zoneFuer(150, 500, w, h) === 'musik_aus', 'bottom left');
assert(zoneFuer(850, 100, w, h) === 'licht_an', 'top right');
assert(zoneFuer(850, 500, w, h) === 'licht_aus', 'bottom right');
assert(zoneFuer(500, 400, w, h) === null, 'center');
assert(wisch(80, 10) === 'right' && wisch(-80, 5) === 'left', 'horizontal swipe');
assert(wisch(0, -90) === 'up' && wisch(10, 90) === 'down', 'vertical swipe');
assert(wisch(10, 10) === null, 'short swipe');
assert(wischAktion(120, 8, 400, 844) === 'right', 'swipe right is right on a phone-sized screen');
assert(wischAktion(-120, 8, 400, 844) === 'left', 'swipe left stays left');
assert(wischAktion(8, -100, 790, 844) === 'settings', 'swipe up from the bottom edge opens settings');
assert(wischAktion(8, -100, 400, 844) === 'up', 'a swipe up elsewhere keeps its direction');
assert(geraeteKlasse({ width: 390, height: 844, touch: true }) === 'phone', 'a touch phone is a phone');
assert(geraeteKlasse({ width: 844, height: 390, touch: true }) === 'phone', 'a phone in landscape stays a phone');
assert(geraeteKlasse({ width: 768, height: 1024, touch: true }) === 'tablet', 'an iPad is a tablet');
assert(geraeteKlasse({ width: 390, height: 844, touch: false }) === 'tablet', 'without touch a narrow window stays a tablet');
assert(aktiveKlasse() === 'tablet', 'the default profile is tablet');
assert(HALTEN_MS === 800 && TAP_WARTE_MS === 350 && ADMIN_TAPS === 5 && ADMIN_FENSTER_MS === 2000, 'tap and hold timing');
assert(zeigerArt({ ecke: 'tl', gehalten: true, bewegt: false }) === 'hold', 'corner hold');
assert(zeigerArt({ ecke: null, gehalten: true, bewegt: false }) === 'long', 'eye long-press');
assert(zeigerArt({ ecke: 'tl', gehalten: false, bewegt: false }) === 'tap', 'corner tap');
assert(zeigerArt({ ecke: 'tl', gehalten: true, bewegt: true }) === null, 'movement cancels the corner');

function tippFolge(zeiten) {
  let now = 0;
  let seq = 1;
  const pending = new Map();
  const log = [];
  const taps = createAdminTaps({
    setzen(fn, ms) {
      const id = seq++;
      pending.set(id, { fn, at: now + ms });
      return id;
    },
    loeschen(id) { pending.delete(id); },
  });
  const faellig = (bis) => {
    now = bis;
    for (const [id, job] of [...pending]) {
      if (job && job.at <= now) {
        pending.delete(id);
        job.fn();
      }
    }
  };
  for (const zeit of zeiten) {
    faellig(zeit);
    taps.tipp(zeit, () => log.push(`admin@${zeit}`), (n) => log.push(`primary@${zeit}:${n}`));
  }
  faellig(zeiten.at(-1) + 5000);
  return { log, pending: pending.size, abbruch: () => taps.abbruch() };
}
{
  const eins = tippFolge([0]);
  assert(eins.log.length === 1 && eins.log[0] === 'primary@0:1', 'one tap runs the corner once');
  const zwei = tippFolge([0, 200, 400]);
  assert(zwei.log.length === 1 && zwei.log[0] === 'primary@400:3', 'two to four taps run the action once');
  const fuenf = tippFolge([0, 100, 200, 300, 400]);
  assert(fuenf.log.length === 1 && fuenf.log[0] === 'admin@400', 'five quick taps open settings and suppress the corner');
  const langsam = tippFolge([0, 400, 800, 1200, 1600]);
  assert(langsam.log.filter((x) => x.startsWith('admin')).length === 0, 'slow taps do not open settings');
  assert(langsam.log.filter((x) => x.startsWith('primary')).length === 5, 'slow taps each run once');
  let now = 0;
  const pending = new Map();
  let seq = 1;
  const log = [];
  const taps = createAdminTaps({
    setzen(fn, ms) {
      const id = seq++;
      pending.set(id, { fn, at: now + ms });
      return id;
    },
    loeschen(id) { pending.delete(id); },
  });
  taps.tipp(0, () => log.push('admin'), (n) => log.push(`primary:${n}`));
  taps.abbruch();
  now = 400;
  for (const [id, job] of [...pending]) if (job.at <= now) job.fn();
  assert(log.length === 0 && pending.size === 0, 'a hold cancels the pending corner tap');
}

assert(VORGABE.gesten.left.art === 'sheet' && VORGABE.gesten.right.art === 'dashboard', 'default horizontal swipes');
assert(VORGABE.ecken.tl.tap.art === 'service' && VORGABE.ecken.tl.tap.ziel === 'light.toggle/light.living_room', 'top-left toggles the living room light');
assert(VORGABE.ecken.tl.hold.art === 'clock' && VORGABE.ecken.tr.tap.art === 'music_toggle' && VORGABE.ecken.tr.hold.art === 'view', 'top corners');
assert(VORGABE.ecken.bl.tap.art === 'view' && VORGABE.ecken.br.tap.art === 'view', 'bottom corners cycle the theme');
assert(VORGABE.ecken.bl.hold.art === 'none' && VORGABE.ecken.br.hold.art === 'none', 'bottom holds start empty');
assert(VORGABE.gesten.up.art === 'caption' && VORGABE.gesten.down.art === 'settings', 'default vertical swipes');
assert(VORGABE.gesten.long.art === 'demo', 'long press starts the demo');
{
  const mem = {
    store: {},
    getItem(k) { return this.store[k] ?? null; },
    setItem(k, v) { this.store[k] = v; },
    removeItem(k) { delete this.store[k]; },
  };
  speichereKonfig({
    ...VORGABE,
    uhr: true,
    nowPlaying: true,
    mediaEntity: 'Media_Player.Wohnzimmer',
    gesten: {
      left: { art: 'service', ziel: ' light.toggle/light.living_room ' },
      right: { art: 'bogus', ziel: 'nope' },
    },
    ecken: { tl: { tap: { art: 'sheet', ziel: 'ignored' }, hold: { art: 'clock', ziel: '' } } },
  }, mem);
  const wieder = ladeKonfig(new URLSearchParams(''), mem);
  assert(wieder.gesten.left.art === 'service' && wieder.gesten.left.ziel === 'light.toggle/light.living_room', 'service target is stored');
  assert(wieder.gesten.right.art === 'dashboard' && wieder.gesten.up.art === 'caption', 'unknown actions fall back to that gesture');
  assert(wieder.ecken.tl.tap.art === 'sheet' && wieder.ecken.tl.tap.ziel === '', 'sheet action drops a target');
  assert(wieder.ecken.tl.hold.art === 'clock' && wieder.ecken.br.tap.art === 'view', 'corner hold is stored');
  assert(wieder.uhr === true && wieder.nowPlaying === true, 'clock and now playing are stored');
  assert(wieder.mediaEntity === 'media_player.wohnzimmer', 'media player id is normalized');
}
assert(mitUrl(VORGABE, new URLSearchParams('clock=1&np=1&media=media_player.living_room')).uhr === true, 'clock from the URL');
assert(mitUrl(VORGABE, new URLSearchParams('clock=1&np=1')).nowPlaying === true, 'now playing from the URL');

const medienEvent = deuteHa({
  type: 'event',
  event: {
    data: {
      entity_id: 'media_player.living_room',
      new_state: { state: 'playing', attributes: { media_title: 'Night Drive', media_artist: 'The Twins', media_year: 2019 } },
    },
  },
}, 'input_select.eye_ui_state', null, 'media_player.living_room');
assert(medienEvent[0]?.typ === 'medien' && medienEvent[0].attr.media_title === 'Night Drive', 'media player event');
const snapshot = deuteHa({
  id: 1,
  type: 'result',
  success: true,
  result: [
    { entity_id: 'input_select.eye_ui_state', state: 'idle' },
    { entity_id: 'media_player.living_room', state: 'paused', attributes: { media_title: 'Night Drive' } },
  ],
}, 'input_select.eye_ui_state', 'get_states', 'media_player.living_room');
assert(snapshot.some((e) => e.typ === 'zustand' && e.zustand === 'idle'), 'eye snapshot still arrives');
assert(snapshot.some((e) => e.typ === 'medien' && e.state === 'paused'), 'media snapshot arrives beside the eyes');
const fremd = deuteHa({
  type: 'event',
  event: { data: { entity_id: 'light.living_room', new_state: { state: 'on', attributes: {} } } },
}, 'input_select.eye_ui_state', null, 'media_player.living_room');
assert(fremd.length === 0, 'another entity is not now playing');
const fehlt = deuteHa({
  id: 4,
  type: 'result',
  success: true,
  result: [{ entity_id: 'input_select.eye_ui_state', state: 'idle' }],
}, 'input_select.eye_ui_state', 'get_states', 'media_player.living_room');
assert(fehlt.some((e) => e.typ === 'medien' && e.state === 'unavailable') && !fehlt.some((e) => e.typ === 'fehler'), 'a missing player hides now playing');
const weg = deuteHa({
  type: 'event',
  event: { data: { entity_id: 'media_player.living_room', new_state: { state: 'unavailable', attributes: { media_title: 'Ghost' } } } },
}, 'input_select.eye_ui_state', null, 'media_player.living_room');
assert(weg[0]?.typ === 'medien' && weg[0].state === 'unavailable' && weg[0].attr.media_title == null, 'an unavailable player carries no title');

let t = 0;
const waechter = createWaechter(10, () => t);
assert(waechter.tick() === 'wach', 'fresh');
t = 9.9;
assert(waechter.tick() === 'wach', 'just before the deadline');
t = 10;
assert(waechter.tick() === 'einschlafen' && waechter.schlaeft, 'does not fall asleep');
assert(waechter.tick() === 'schlafen', 'does not stay asleep');
assert(waechter.beruehrt() === true && waechter.schlaeft === false, 'wake');
waechter.setPause(true);
t = 1000;
assert(waechter.tick() === 'wach', 'pause still sleeps');
waechter.setPause(false);
t = 1009;
assert(waechter.tick() === 'wach', 'deadline after pause');
t = 1010;
assert(waechter.tick() === 'einschlafen', 'does not sleep after the new deadline');
assert(createWaechter(0, () => 50).tick() === 'wach', '0 does not disable sleep');

for (const befehl of Object.values(BEFEHLE)) {
  assert(befehl.scriptKey in VORGABE, `script key ${befehl.scriptKey}`);
  assert(mapHaState(befehl.zustand) === befehl.zustand, `Befehlzustand ${befehl.zustand}`);
}

const sw = fs.readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
const appSrc = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const legacySrc = fs.readFileSync(new URL('./legacy.js', import.meta.url), 'utf8');
function cacheName(version) { return `grok-bot-home-ui-${version}`; }
const stamped = sw.match(/const VERSION = '([^']+)';/);
assert(stamped && stamped[1] === VERSION, 'sw.js version matches version.js');
assert(!/^\s*import\s/m.test(sw) && !/^\s*export\s/m.test(sw), 'sw.js has no ES module syntax');
assert(sw.includes('`grok-bot-home-ui-${VERSION}`'), 'the cache name is derived from VERSION');
assert(cacheName('1.2.1') !== cacheName(VERSION) && cacheName(VERSION) === `grok-bot-home-ui-${VERSION}`, 'the cache name changes with the version');
assert(cacheName(VERSION) !== 'grok-bot-home-ui-v7', 'the current cache is not the old v7 name');
assert(['grok-bot-home-ui-v7', cacheName(VERSION)].filter((key) => key !== cacheName(VERSION)).includes('grok-bot-home-ui-v7'), 'activation drops the v7 cache');
assert(sw.includes('grok-bot-home-ui-v7') && sw.includes('key !== CACHE') && sw.includes('caches.delete'), 'the worker deletes older caches, including v7');
assert(sw.includes('skipWaiting') && sw.includes('clients.claim'), 'a new worker takes over');
assert(sw.includes('function netzZuerst'), 'the page and scripts are network-first');
assert(sw.includes("cache: 'reload'") && sw.includes("cache: 'no-cache'"), 'install reloads and the network check skips the HTTP cache');
assert(appSrc.includes("register('sw.js')") && !appSrc.includes("type: 'module'"), 'the page registers a classic worker');
assert(!appSrc.includes('innerHTML'), 'the page does not assign innerHTML');
assert(legacySrc.includes('register("sw.js")') && !legacySrc.includes('type: "module"') && !legacySrc.includes("type: 'module'"), 'the legacy bundle registers a classic worker');
const dateien = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]);
assert(dateien.length > 20, 'Service Worker listet zu wenig Dateien');
for (const datei of dateien) {
  assert(fs.existsSync(new URL(`./${datei}`, import.meta.url)), `missing from the cache manifest: ${datei}`);
}
const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.webmanifest', import.meta.url)));
assert(manifest.display === 'standalone' && manifest.orientation === 'landscape', 'manifest is not standalone landscape');
assert(manifest.start_url === './index.html' && !manifest.start_url.includes('mode='), 'the home-screen icon does not override the default theme');
for (const icon of manifest.icons) assert(fs.existsSync(new URL(icon.src, import.meta.url)), `missing icon: ${icon.src}`);

{
  const s = mem();
  setzeKlasse('phone');
  speichereKonfig({ ...VORGABE, haUrl: 'ws://phone.local/api/websocket', lang: 'de' }, s);
  setzeKlasse('tablet');
  speichereKonfig({ ...VORGABE, haUrl: 'ws://tablet.local/api/websocket', lang: 'en' }, s);
  setzeKlasse('phone');
  const phone = ladeKonfig('', s);
  assert(phone.haUrl === 'ws://phone.local/api/websocket' && phone.lang === 'de', 'the phone profile keeps its own settings');
  setzeKlasse('tablet');
  const tablet = ladeKonfig('', s);
  assert(tablet.haUrl === 'ws://tablet.local/api/websocket' && tablet.lang === 'en', 'the tablet profile keeps its own settings');
  const paket = JSON.parse(s.getItem('eye_ui_config'));
  assert(paket.v === 4 && paket.profiles.phone.lang === 'de' && paket.profiles.tablet.lang === 'en', 'both profiles are stored together');
  setzeKlasse('tablet');
}

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Home Assistant mapping, protocol, sleep, and gestures ok');
