// SPDX-License-Identifier: MIT
import fs from 'fs';
import { VORGABE, ladeKonfig } from './konfig.js';
import { sollWillkommen } from './empfang.js';
import {
  DEMO_KLINGEL_S, KLINGEL_ENTITY, KLINGEL_FARBE, KLINGEL_HOLD_S, KLINGEL_KAMERA,
  SNAPSHOT_MS, STREAM_WARTE_MS, TESTBILD,
  augenPlatz, bildPlatz, bildSchritt, demoKlingelFaellig, haBasis, halteBis,
  kameraSrc, klingelKante, layoutSchritt, tippSchliesst, zugangToken,
} from './klingel.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

function mem() {
  return {
    store: {},
    getItem(k) { return this.store[k] ?? null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
  };
}

assert(KLINGEL_ENTITY === 'binary_sensor.klingel_haustuer', 'default doorbell entity');
assert(KLINGEL_KAMERA === 'camera.hofkamera', 'default doorbell camera');
assert(KLINGEL_HOLD_S === 90 && DEMO_KLINGEL_S === 8, 'hold defaults');
assert(KLINGEL_FARBE[0] > 200 && KLINGEL_FARBE[1] > 140 && KLINGEL_FARBE[2] < 120, 'doorbell gold is not red');
assert(VORGABE.doorbellEntity === KLINGEL_ENTITY, 'config default entity');
assert(VORGABE.doorbellCamera === KLINGEL_KAMERA, 'config default camera');
assert(VORGABE.doorbellHoldSeconds === 90, 'config default hold');

{
  const g = {};
  assert(klingelKante(g, 'off') === false, 'the first off is ignored');
  assert(klingelKante(g, 'on') === true, 'off to on is one ring');
  assert(klingelKante(g, 'on') === false, 'a held on is not another ring');
  assert(klingelKante(g, 'unknown') === false, 'unknown is not a ring');
  assert(g.an === true, 'unknown does not look like the bell went off');
  assert(klingelKante(g, 'off') === false, 'on to off is quiet');
  assert(klingelKante(g, 'on') === true, 'the next rising edge rings again');
  const laufend = {};
  assert(klingelKante(laufend, 'on') === false, 'a ring already in progress at connect is ignored');
  assert(klingelKante(laufend, 'off') === false, 'the following off is quiet');
  assert(klingelKante(laufend, 'on') === true, 'the next ring counts');
  assert(klingelKante({}, 'unavailable') === false, 'a missing first state does nothing');
}

{
  assert(halteBis(0, 0, 90) === 90000, 'a ring holds for 90 seconds');
  assert(halteBis(20000, 90000, 90) === 110000, 'a new ring extends the hold');
  assert(halteBis(1000, 200000, 90) === 200000, 'an older end does not shorten the hold');
  assert(halteBis(0, 0, 30) === 30000, 'a configured hold is used');
}

{
  const leer = bildSchritt({ token: '' }, 'start', 0);
  assert(leer.art === 'keins' && leer.zeigen === false, 'no token means no picture');
  let stand = bildSchritt({ token: 'abc' }, 'start', 1000);
  assert(stand.art === 'stream' && stand.zeigen === true && stand.bildDa === false, 'a ring starts the stream');
  stand = bildSchritt(stand, 'tick', 1000 + STREAM_WARTE_MS - 1);
  assert(stand.art === 'stream', 'the stream is still waiting inside the window');
  stand = bildSchritt(stand, 'tick', 1000 + STREAM_WARTE_MS);
  assert(stand.art === 'snapshot' && stand.src === 'snapshot', 'no first frame falls back to a snapshot');
  stand = bildSchritt(stand, 'load', 6000);
  assert(stand.bildDa === true, 'a snapshot frame counts as a picture');
  const neu = bildSchritt(stand, 'tick', 6000 + SNAPSHOT_MS);
  assert(neu.neu === true && neu.art === 'snapshot', 'a snapshot refreshes once a second');
  const weg = bildSchritt(stand, 'error', 7000);
  assert(weg.gescheitert === true && weg.zeigen === false && weg.art === 'keins', 'a failed snapshot hides the picture');
  const strom = bildSchritt({ art: 'stream', seit: 0, token: 'abc', bildDa: false }, 'error', 50);
  assert(strom.art === 'snapshot' && strom.zeigen === true, 'a stream error falls back at once');
  const test = bildSchritt({ art: 'test', seit: 0, bildDa: false }, 'load', 10);
  assert(test.bildDa === true && test.src === 'test', 'the demo picture can load');
  const testWeg = bildSchritt({ art: 'test', seit: 0 }, 'error', 10);
  assert(testWeg.zeigen === false && testWeg.gescheitert === true, 'a failed demo picture stays hidden');
}

{
  assert(haBasis('ws://homeassistant.local:8123/api/websocket') === 'http://homeassistant.local:8123', 'ws becomes http');
  assert(haBasis('wss://ha.local/api/websocket') === 'https://ha.local', 'wss becomes https');
  const src = kameraSrc('http://ha.local:8123', 'camera.hofkamera', 'tok en', 'stream');
  assert(src === 'http://ha.local:8123/api/camera_proxy_stream/camera.hofkamera?token=tok%20en', 'stream url uses the access token');
  const shot = kameraSrc('http://ha.local:8123', 'camera.hofkamera', 'tok', 'snapshot');
  assert(shot.indexOf('/api/camera_proxy/camera.hofkamera?token=tok') > 0, 'snapshot url');
  assert(kameraSrc('http://ha.local:8123', 'camera.hofkamera', '', 'stream') === '', 'a missing access token builds no url');
  assert(zugangToken({ access_token: 'rotierend' }) === 'rotierend', 'the camera attribute is the token');
  assert(zugangToken({}) === '' && zugangToken(null) === '', 'no attribute is no token');
}

{
  assert(augenPlatz(1024, 768, 0) === null, 'at rest the eyes stay full size');
  const halb = augenPlatz(1024, 768, 0.5);
  const ecke = augenPlatz(1024, 768, 1);
  assert(halb && ecke && ecke.size < halb.size, 'the eyes shrink as the layout opens');
  const mitteX = ecke.x + ecke.size / 2;
  const mitteY = ecke.y + ecke.size / 2;
  assert(mitteX > 1024 * 0.7 && mitteY > 768 * 0.7, 'the small eyes sit in the bottom right');
  const bild = bildPlatz(1024, 768, 1);
  assert(bild.x < 80 && bild.y < 80 && bild.w > 500 && bild.h > 300, 'the picture sits large in the upper left');
  assert(bild.x + bild.w < ecke.x + 8, 'the picture stays clear of the small eyes');
  assert(tippSchliesst(bild.x + 10, bild.y + 10, bild, true) === false, 'a tap on the picture stays');
  assert(tippSchliesst(mitteX, mitteY, bild, true) === true, 'a tap on the small eyes closes');
  assert(tippSchliesst(10, 700, bild, false) === true, 'without a picture any tap closes');
  let u = 0;
  for (let i = 0; i < 200; i++) u = layoutSchritt(u, 1, 0.05);
  assert(u === 1, 'the layout eases all the way open');
  for (let i = 0; i < 200; i++) u = layoutSchritt(u, 0, 0.05);
  assert(u === 0, 'the layout eases back');
}

assert(demoKlingelFaellig(0) === false && demoKlingelFaellig(10) === true && demoKlingelFaellig(9) === false, 'the demo loop includes a doorbell beat');
assert(sollWillkommen({ haUrl: '', haToken: '' }, { hostname: 'tablet.local' }, 'klingel=1') === false, 'the doorbell test skips the sleep screen');

{
  const s = mem();
  const k = ladeKonfig('', s, {
    doorbellEntity: 'binary_sensor.andere_klingel',
    doorbellCamera: 'camera.gartenkamera',
    doorbellHoldSeconds: 45,
  });
  assert(k.doorbellEntity === 'binary_sensor.andere_klingel', 'a file can name the bell');
  assert(k.doorbellCamera === 'camera.gartenkamera', 'a file can name another camera for later');
  assert(k.doorbellHoldSeconds === 45, 'a file can set the hold');
  assert(k.zentral.indexOf('doorbellCamera') >= 0 && k.zentral.indexOf('doorbellEntity') >= 0, 'file doorbell keys are central');
  const leer = ladeKonfig('', mem(), { doorbellCamera: '' });
  assert(leer.doorbellCamera === '', 'an empty camera key hides the picture');
  const alias = ladeKonfig('', mem(), { doorbell_entity: 'binary_sensor.klingel_haustuer', doorbell_hold: 20 });
  assert(alias.doorbellEntity === KLINGEL_ENTITY && alias.doorbellHoldSeconds === 20, 'doorbell aliases');
}

const beispiel = fs.readFileSync(new URL('./config.example.json', import.meta.url), 'utf8');
assert(beispiel.includes('camera.hofkamera') && beispiel.includes('binary_sensor.klingel_haustuer'), 'the example names the courtyard camera');
assert(!beispiel.includes('haToken'), 'the example still has no token');
const bild = fs.readFileSync(new URL('./' + TESTBILD, import.meta.url));
assert(bild[0] === 0x89 && bild.toString('ascii', 1, 4) === 'PNG', 'the demo picture is a png');
const legacy = fs.readFileSync(new URL('./legacy.js', import.meta.url), 'utf8');
assert(legacy.includes('klingelKante') && legacy.includes('camera.hofkamera'), 'the legacy bundle keeps the doorbell');
const settings = fs.readFileSync(new URL('./settings-legacy.js', import.meta.url), 'utf8');
assert(settings.includes('Klingel testen'), 'settings keeps the hidden doorbell test');

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Doorbell ok');
