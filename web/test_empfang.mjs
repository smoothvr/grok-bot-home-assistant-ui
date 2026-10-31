// SPDX-License-Identifier: MIT
// First-load sleep, the one-pass showcase, and the looping demo.
import { DEMO_HOST } from './konfig.js';
import { REAKTION_IDS } from './reaktionen.js';
import {
  SHOW_PAUSE, LOOP_PAUSE, createSchleife, ersteRunde, ohneHaus, sollWillkommen, tippFenster,
} from './empfang.js';
import { glaettePegel, pegelAusHuelle } from './licht.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

const leer = { haUrl: '', haToken: '' };
const haus = { haUrl: 'ws://ha.local/api/websocket', haToken: 'x' };
const oeffentlich = { hostname: DEMO_HOST, protocol: 'https:' };
const lan = { hostname: 'tablet.local', protocol: 'http:' };

assert(sollWillkommen(leer, oeffentlich, '') === true, 'the public demo starts asleep');
assert(sollWillkommen(haus, oeffentlich, '') === true, 'the public demo stays asleep even with a leftover address');
assert(sollWillkommen(leer, lan, '') === true, 'a fresh page with no Home Assistant starts asleep');
assert(sollWillkommen(haus, lan, '') === false, 'a configured install starts normally');
assert(sollWillkommen({ haUrl: 'ws://ha.local/api/websocket', haToken: '' }, lan, '') === false, 'an address alone is enough');
assert(sollWillkommen({ haUrl: '', haToken: 'x' }, lan, '') === false, 'a token alone is enough');
assert(sollWillkommen(leer, lan, 'lauf=1') === false, 'the showcase link skips the sleep screen');
assert(sollWillkommen(leer, lan, 'demo=1') === false, 'the music tour skips the sleep screen');
assert(sollWillkommen(leer, lan, 'ha=mock') === false, 'a mock connection is not the welcome');
assert(sollWillkommen(leer, lan, 'state=angry') === false, 'a state link is not the welcome');
assert(ohneHaus(leer, lan) === true && ohneHaus(haus, lan) === false, 'home is configured when an address or token is saved');

{
  const runde = ersteRunde(() => 0.2);
  assert(runde.length === 14 && runde.length === REAKTION_IDS.length, 'the first pass plays every reaction');
  const ids = runde.map((item) => item.id);
  assert(ids.join('|') === REAKTION_IDS.join('|'), 'the first pass keeps the reaction order');
  const einzig = {};
  for (let i = 0; i < ids.length; i++) einzig[ids[i]] = true;
  assert(Object.keys(einzig).length === 14, 'each reaction appears once');
  for (let i = 0; i < runde.length; i++) {
    assert(runde[i].index >= 0, 'each step has a variant');
  }
}

{
  const schleife = createSchleife(() => 0.3);
  let vorher = '';
  const gesehen = {};
  for (let i = 0; i < 20; i++) {
    const schritt = schleife.naechste();
    assert(schritt.id !== vorher, 'the loop does not repeat a reaction immediately');
    assert(schritt.index >= 0, 'the loop picks a variant');
    gesehen[schritt.id] = true;
    vorher = schritt.id;
  }
  assert(Object.keys(gesehen).length > 1, 'the loop varies');
}

assert(SHOW_PAUSE >= 0.6 && SHOW_PAUSE <= 1.4, 'the first pass leaves a short pause');
assert(LOOP_PAUSE > SHOW_PAUSE && LOOP_PAUSE < 3, 'the loop is calmer than the first pass');

{
  let zeiten = [];
  for (let n = 0; n < 4; n++) {
    const z = tippFenster(zeiten, n * 200, 2200);
    zeiten = z.zeiten;
    assert(!z.settings, 'four taps stay on the face');
  }
  const fuenft = tippFenster(zeiten, 900, 2200);
  assert(fuenft.settings === true && fuenft.zeiten.length === 0, 'the fifth tap opens settings');
  const spaet = tippFenster([0], 3000, 2200);
  assert(!spaet.settings && spaet.zeiten.length === 1, 'an old tap falls out of the window');
}

assert(Math.abs(pegelAusHuelle('idle', 0, 'ruhig') - 0.32) < 1e-9, 'a quiet idle envelope sits at the low end');
assert(Math.abs(pegelAusHuelle('idle', 1, 'ruhig') - 0.42) < 1e-9, 'a full idle envelope stays inside the high end');
assert(pegelAusHuelle('idle', 0.25, 'ruhig') < pegelAusHuelle('idle', 1, 'ruhig'), 'a louder phrase lifts the level');
assert(pegelAusHuelle('idle', 4, 'ruhig') === pegelAusHuelle('idle', 1, 'ruhig'), 'the envelope does not leave the state');
assert(Math.abs(pegelAusHuelle('schlafen', 0, 'ruhig') - 0.26) < 1e-9, 'sleep uses the approved low level');
assert(Math.abs(pegelAusHuelle('fehler', 1, 'ruhig') - 0.85) < 1e-9, 'an error can reach its own red high level');
{
  const halb = glaettePegel(0.32, 0.42, 0.12);
  assert(halb > 0.32 && halb < 0.42, 'the level eases toward the phrase');
  assert(glaettePegel(0.32, 0.42, 0) === 0.32, 'no time means no jump');
}

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Welcome sleep and the reaction showcase ok');
