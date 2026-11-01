// SPDX-License-Identifier: MIT
// Liveliness: gaze, reaction renditions, and the procedural voice.
import fs from 'fs';
import { VORGABE, mitUrl } from './konfig.js';
import { DEMO_REIHE } from './demo.js';
import { makeClips } from './zustaende.js';
import { Augen } from './engine.js';
import {
  blickIntervall, blickZumPunkt, blinkPause, createBlick, drift, waehleBlinzel, waehleBlick,
} from './blick.js';
import {
  REAKTION_IDS, REAKTIONEN, createReaktionLauf, createStupser, poseBei,
} from './reaktionen.js';
import {
  PHRASEN, bauePhrase, createStimme, pulsHuelle, scheinFarbe,
} from './stimme.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

assert(blickIntervall(0, () => 0) > blickIntervall(1, () => 0), 'a calmer face waits longer between glances');
assert(blinkPause(0, 'einfach', () => 0) > blinkPause(1, 'einfach', () => 0), 'a calmer face blinks less often');

{
  let letzte = null;
  for (let i = 0; i < 8; i++) {
    const art = waehleBlick(letzte, () => 0.8, 1, false);
    if (letzte && letzte !== 'ruhe') assert(art !== letzte, 'glance does not repeat immediately');
    letzte = art;
  }
}

{
  let letzte = null;
  const gesehen = {};
  for (let i = 0; i < 8; i++) {
    const art = waehleBlinzel(letzte, () => 0.95);
    if (letzte) assert(art !== letzte, 'blink kind does not repeat immediately');
    gesehen[art] = true;
    letzte = art;
  }
  assert(gesehen.schlaf && gesehen.halb, 'sleepy and half blinks are in the set');
}

{
  const rechts = blickZumPunkt(920, 400, 1000, 800);
  const oben = blickZumPunkt(500, 30, 1000, 800);
  assert(rechts.gx > 0.4 && oben.gy > 0.3, 'a touch pulls the gaze toward that point');
  const a = drift(10, 1);
  const b = drift(10.05, 1);
  assert(Math.abs(a.gx - b.gx) < 0.02 && Math.abs(a.gy - b.gy) < 0.02, 'drift has no jitter');
}

{
  const blick = createBlick(() => 0.42);
  blick.setLebendigkeit(0.8);
  let tilt = 0;
  for (let t = 0; t < 12; t += 0.05) {
    const z = blick.tick(t, 0.05);
    assert(z.gx <= 0.9 && z.gx >= -0.9 && z.gy <= 0.82 && z.gy >= -0.62, 'gaze stays in range');
    assert(Math.abs(z.tilt - tilt) < 2.2, 'tilt eases instead of snapping');
    tilt = z.tilt;
  }
}

for (const id of REAKTION_IDS) {
  const liste = REAKTIONEN[id];
  assert(liste && liste.length >= 2 && liste.length <= 4, `${id} has 2 to 4 renditions`);
  assert(PHRASEN.indexOf(liste[0].phrase) >= 0, `${id} has a known phrase`);
}

{
  const links = poseBei(REAKTIONEN.curious[0], REAKTIONEN.curious[0].dur / 3);
  const rechts = poseBei(REAKTIONEN.curious[1], REAKTIONEN.curious[1].dur / 3);
  assert(links.gx < -0.2 && rechts.gx > 0.2, 'curious renditions look to different sides');
  const grimm = poseBei(REAKTIONEN.grumpy[0], REAKTIONEN.grumpy[0].dur * 0.55);
  assert(grimm.lidA < -5 && grimm.sy < 0.95, 'grumpy narrows and frowns without a new colour');
}

{
  const lauf = createReaktionLauf(() => 0.2);
  const erste = lauf.start('curious', 0, {});
  assert(erste && erste.phrase === 'curious', 'a tap reaction starts');
  assert(lauf.start('shy', 0.2, {}) === null, 'reactions have a short cooldown');
  assert(lauf.start('shy', 0.6, {}), 'the cooldown ends');
  let vorher = null;
  for (let i = 0; i < 6; i++) {
    const rend = lauf.start('happy', 10 + i, { erzwingen: true });
    assert(rend && rend.index !== vorher, 'rendition does not repeat immediately');
    vorher = rend.index;
  }
}

{
  const stupser = createStupser(() => 0.1, 2000);
  const a = stupser.tipp(0);
  const b = stupser.tipp(120);
  assert(a !== 'grumpy' && b !== 'grumpy' && a !== b, 'pokes vary');
  assert(stupser.tipp(240) === 'grumpy', 'three quick pokes get grumpy');
  assert(stupser.tipp(360) !== 'grumpy', 'grumpy does not stick');
}

{
  let vorher = null;
  const frequenzen = [];
  for (let i = 0; i < 6; i++) {
    const phrase = bauePhrase('happy', () => 0.15 + i * 0.1, vorher);
    assert(phrase.index !== vorher, 'phrase variant does not repeat immediately');
    assert(phrase.dur > 0 && phrase.dur <= 1.45, 'phrases stay short');
    assert(phrase.notes.length >= 1 && phrase.notes.length <= 5, 'syllable count stays small');
    for (let n = 0; n < phrase.notes.length; n++) {
      const note = phrase.notes[n];
      assert(note.freq >= 180 && note.freq <= 980, 'pitch stays gentle');
      assert(note.gain > 0 && note.gain <= 0.7, 'note gain stays moderate');
    }
    frequenzen.push(phrase.notes[0].freq);
    vorher = phrase.index;
  }
  const verschieden = new Set(frequenzen.map((f) => Math.round(f)));
  assert(verschieden.size > 1, 'pitch varies between plays');
}

{
  const stimme = createStimme({ rnd: () => 0.35, cooldownMs: 1000 });
  const erste = stimme.plan('startle', 0);
  assert(erste && erste.id === 'startle', 'startle plans');
  assert(stimme.plan('sad', 400) === null, 'voice cooldown blocks a second phrase');
  const danach = stimme.plan('no', 1000);
  assert(danach && danach.id === 'no', 'voice cooldown lifts');
  assert(pulsHuelle(150, [{ at: 100, ms: 100, amp: 1 }]) > 0.9, 'a beep lights the middle of its pulse');
  assert(pulsHuelle(0, [{ at: 100, ms: 100, amp: 1 }]) === 0, 'a pulse is silent before it starts');
}

{
  function fakeCtx() {
    return {
      state: 'running',
      currentTime: 2,
      destination: {},
      createOscillator() {
        return {
          frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} },
          connect() {},
          start() {},
          stop() {},
        };
      },
      createGain() {
        return {
          gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
        };
      },
    };
  }
  const stimme = createStimme({ rnd: () => 0.4, cooldownMs: 500 });
  const phrase = stimme.plan('yes', 0);
  const mitTon = stimme.spiel(fakeCtx(), phrase, 0.8, 2000);
  const ohneTon = stimme.spiel(null, phrase, 0, 2000);
  assert(mitTon.length === phrase.notes.length && ohneTon.length === phrase.notes.length, 'pulses follow the notes');
}

assert(scheinFarbe(true).indexOf('255, 18, 8') >= 0, 'angry pulse is red');
assert(scheinFarbe(false, [255, 12, 8]).indexOf('255, 106, 0') >= 0, 'red is refused unless angry');
assert(scheinFarbe(false, [0, 200, 255]).indexOf('0, 200, 255') >= 0, 'other colours stay');

{
  const live = mitUrl(VORGABE, new URLSearchParams('live=40&vol=0.5'));
  assert(Math.abs(live.lebendigkeit - 0.4) < 1e-9 && Math.abs(live.lautstaerke - 0.5) < 1e-9, 'live and volume from the URL');
  assert(Math.abs(mitUrl(VORGABE, new URLSearchParams('vol=160')).lautstaerke - 1.6) < 1e-9, '160 percent is a gain of 1.6');
  assert(Math.abs(mitUrl(VORGABE, new URLSearchParams('vol=200')).lautstaerke - 2) < 1e-9, '200 percent is the top gain');
  assert(Math.abs(mitUrl(VORGABE, new URLSearchParams('vol=80')).lautstaerke - 0.8) < 1e-9, 'a percent above 2 still scales');
  assert(VORGABE.lebendigkeit === 0.42 && VORGABE.lautstaerke === 1.6, 'liveliness and volume defaults');
  const spitzen = [];
  for (const id of ['happy', 'sad', 'think', 'startle', 'sleepy']) {
    let max = 0;
    const phrase = bauePhrase(id, () => 0.4, null);
    for (let i = 0; i < phrase.notes.length; i++) if (phrase.notes[i].gain > max) max = phrase.notes[i].gain;
    spitzen.push(max);
  }
  const leise = Math.min.apply(null, spitzen);
  const laut = Math.max.apply(null, spitzen);
  assert(laut - leise < 0.02, 'droid phrases peak at a similar loudness');
}

assert(DEMO_REIHE[0] === 'hallo' && DEMO_REIHE[DEMO_REIHE.length - 1] === 'musik_an', 'demo still starts on hello and ends on music');
assert(DEMO_REIHE.indexOf('startled') > 0 && DEMO_REIHE.indexOf('relieved') > DEMO_REIHE.indexOf('angry'), 'demo shows the new reactions');

{
  const onset = JSON.parse(fs.readFileSync(new URL('./onsets.json', import.meta.url)));
  const augen = new Augen(makeClips(onset), () => 0.63);
  augen.setLebendigkeit(0.85);
  let tief = 1;
  let hoch = -1;
  for (let i = 0; i < 200; i++) {
    const p = augen.tick(1 / 30);
    assert(Number.isFinite(p.gx) && Number.isFinite(p.sy) && Number.isFinite(p.scale), 'idle pose stays finite');
    if (p.gx < tief) tief = p.gx;
    if (p.gx > hoch) hoch = p.gx;
  }
  assert(hoch - tief > 0.08, 'idle gaze moves');
  augen.schau(0.7, 0.2);
  for (let i = 0; i < 12; i++) augen.tick(1 / 30);
  assert(augen.pose.gx > 0.15, 'the eyes turn toward a touch');
  augen.set('15_angry');
  const vor = augen.tick(1 / 30).gx;
  augen.schau(0.8, 0.4);
  const nach = augen.tick(1 / 30).gx;
  assert(Math.abs(nach - vor) < 0.35, 'angry does not chase a touch');
}

const legacy = fs.readFileSync(new URL('./legacy.js', import.meta.url), 'utf8');
assert(legacy.includes('function waehleIndex'), 'legacy bundle keeps the no-repeat picker');
assert(legacy.includes('function bauePhrase'), 'legacy bundle keeps the phrase builder');
assert(legacy.includes('function createStimme'), 'legacy bundle keeps the voice');
assert(legacy.includes('function createReaktionLauf'), 'legacy bundle keeps reaction selection');
const settingsLegacy = fs.readFileSync(new URL('./settings-legacy.js', import.meta.url), 'utf8');
assert(settingsLegacy.includes('lebendigkeit') && settingsLegacy.includes('lautstaerke'), 'settings bundle keeps liveliness and volume');
assert(settingsLegacy.includes('function schliessen') && settingsLegacy.includes('hauptSichtbar'), 'settings bundle hides central fields and can close');

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Liveliness, reactions, and voice ok');
