// SPDX-License-Identifier: MIT
// First-load sleep, the quiet demo loop, and the intro.
import { translate } from './strings.js';
import { DEMO_HOST } from './konfig.js';
import {
  EMPFANG_REIHE, INTRO_KEYS, eckeHinweisFaellig, empfangSchritt, ohneHaus, sollWillkommen, tippFenster,
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
assert(sollWillkommen(leer, lan, 'intro=1') === false, 'an intro link skips the sleep screen');
assert(sollWillkommen(leer, lan, 'lauf=1') === false, 'a demo link skips the sleep screen');
assert(sollWillkommen(leer, lan, 'demo=1') === false, 'the music tour skips the sleep screen');
assert(sollWillkommen(leer, lan, 'ha=mock') === false, 'a mock connection is not the welcome');
assert(sollWillkommen(leer, lan, 'state=angry') === false, 'a state link is not the welcome');
assert(ohneHaus(leer, lan) === true && ohneHaus(haus, lan) === false, 'home is configured when an address or token is saved');

{
  const schritte = new Set();
  let i = 0;
  for (let n = 0; n < EMPFANG_REIHE.length; n++) {
    const s = empfangSchritt(i);
    schritte.add(s.kurz);
    assert(s.ms > 0 && s.ms < 8000, 'each welcome step is short');
    i = s.naechster;
  }
  assert(i === 0, 'the welcome demo loops');
  for (const name of ['wake', 'reminder', 'angry', 'relieved', 'curious', 'sleepy']) {
    assert(schritte.has(name), `welcome demo includes ${name}`);
  }
  assert(!EMPFANG_REIHE.includes('musik_an'), 'the welcome demo does not sit on music');
}

for (const lang of ['en', 'de']) {
  for (const key of INTRO_KEYS) {
    const text = translate(lang, key);
    assert(text && text.length > 8 && text.length < 180, `${lang} ${key} is a short line`);
  }
  const alle = INTRO_KEYS.map((key) => translate(lang, key)).join('\n');
  assert(!/hey grok|ask grok|script\.grok/i.test(alle), `${lang} intro does not claim that asking Grok works`);
  assert(/not in this version|noch nicht hier|does not listen|hört noch nicht/i.test(alle), `${lang} intro keeps voice as a direction`);
}
assert(translate('de', 'welcome.demo') === 'Demo starten' && translate('de', 'welcome.intro') === 'Einführung', 'German choices');
assert(translate('en', 'welcome.demo') === 'Start the demo' && translate('en', 'hint.corner').includes('five'), 'English choices and the corner hint');

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

assert(eckeHinweisFaellig(false, 1) === false && eckeHinweisFaellig(false, 2) === true, 'the corner hint waits for a second touch');
assert(eckeHinweisFaellig(true, 5) === false, 'the corner hint is once');

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
console.log('Welcome sleep, intro, and demo loop ok');
