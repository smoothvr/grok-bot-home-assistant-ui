// SPDX-License-Identifier: MIT
// Parity of the eye formulas (sphere and 2D, 2388×1668).
// node test_paritaet.mjs            checks the hash and the shape
// node test_paritaet.mjs --dump     writes the same JSON to stdout
import crypto from 'crypto';
import fs from 'fs';
import { P, Spring, blinkMul, poseToPrims, poseToPrims2d } from './augen.js';
import { makeClips } from './zustaende.js';
import { clipPoses } from './engine.js';
import { ledPositions, L } from './led.js';
import { LED_VORGABE, alarmAlpha, ledFrame, leitungenVon } from './renderer.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'check failed');
}

const ON = JSON.parse(fs.readFileSync(new URL('./onsets.json', import.meta.url)));
const BESTAND = ['01_schlafen', '02_hallo', '03_idle', '04_blicke', '05_zuhoeren', '06_nachdenken', '07_verstanden', '08_erledigt', '09_nicht_verstanden', '10_fehler', '11_lachen', '12_musik_an', '13_licht_an', '14_licht_aus'];
const flat = (pr) => pr.map((e) => [...e.p1, ...e.p2, e.r, e.bright, ...(e.lid ? e.lid.flat() : []), ...(e.cut ? [...e.cut[0], e.cut[1]] : [])]);
const out = {};
let frames = 0;
const alle = makeClips(ON);
for (const c of alle) {
  if (!BESTAND.includes(c.name)) continue;
  out[c.name] = [];
  for (const [p, ring] of clipPoses(c)) {
    out[c.name].push({ e: flat(poseToPrims(p)), e2: flat(poseToPrims2d(p, 2388 / 1668)), ring: [...ring[0], ring[1], ring[2] ?? 0] });
    frames++;
  }
}

assert(P.GAZE_W === 16 && P.GAZE_Z === 0.72, 'gaze spring is not omega 16 / zeta 0.72');
assert(P.BLINK_T === 0.22, 'blink is not 0.22 s');
const zu = blinkMul(P.BLINK_T * P.BLINK_CLOSE, [0]);
assert(Math.abs(zu - P.BLINK_MIN) < 1e-9, 'blink does not close to BLINK_MIN');
const feder = new Spring(0, P.GAZE_W, P.GAZE_Z);
const schritt = feder.step(1, 1 / 60);
assert(schritt > 0 && schritt < 1, 'spring does not move toward the target');

assert(Object.keys(out).length === 14, 'expected 14 states');
assert(frames === 1704, `frames ${frames}, expected 1704`);
for (const [name, liste] of Object.entries(out)) {
  assert(liste.length > 0, name);
  for (const frame of liste) {
    assert(frame.e.length === 2 && frame.e2.length === 2, `${name} does not have two eyes`);
    for (const auge of [...frame.e, ...frame.e2]) {
      for (const wert of auge) assert(Number.isFinite(wert), `${name} has non-finite geometry`);
    }
  }
}

const idle = out['03_idle'][0];
for (const auge of idle.e2) {
  const [x1, y1, x2, y2] = auge;
  assert(Math.abs(y2 - y1) > Math.abs(x2 - x1), 'idle eyes are not vertical pills');
}
assert(Math.abs(idle.ring[0] - 255) < 1e-6 && Math.abs(idle.ring[1] - 106) < 1e-6 && Math.abs(idle.ring[3] - 0.2) < 1e-9, 'idle ring is not the approved orange');
assert(out['08_erledigt'].some((frame) => frame.e2.some((auge) => auge.length > 6)), 'done never shows ^^');
assert(out['09_nicht_verstanden'].some((frame) => frame.e.some((auge) => auge.length > 6)), 'not understood has no lid');

const json = JSON.stringify(out);
const hash = crypto.createHash('sha256').update(json).digest('hex');
const erwartet = fs.readFileSync(new URL('./paritaet.sha256', import.meta.url), 'utf8').trim();
assert(hash === erwartet, `parity differs: ${hash}`);

const namen = alle.map((c) => c.name);
assert(namen.length === 15 && namen.includes('15_angry'), 'expected the angry clip on top of the original 14');
assert(namen.indexOf('15_angry') === namen.indexOf('10_fehler') + 1, 'angry follows the error state in the demo');
assert(!Object.prototype.hasOwnProperty.call(out, '15_angry'), 'angry frames stay out of the parity hash');
const zorn = alle.find((c) => c.name === '15_angry');
assert(zorn.loop === true && zorn.sound === '14_angry', 'angry holds and has a tone');
const [pose, , ring] = zorn.fn(0.8);
assert(pose.lidT > 0.3 && pose.lidA < -15 && pose.sy < 0.85 && pose.sy > 0.4, 'angry lowers and narrows the eyes');
assert(ring[0][0] > 240 && ring[0][1] < 40 && ring[0][2] < 40 && ring[3] === 'angry', 'angry ring is red and marked for every theme');
assert(ring[1] > 0.65, 'the angry glow stays strong');
const eyes = poseToPrims2d(pose, 2388 / 1668);
const idleEyes = poseToPrims2d({}, 2388 / 1668);
const span = (e) => Math.hypot(e.p2[0] - e.p1[0], e.p2[1] - e.p1[1]);
assert(eyes.length === 2 && span(eyes[0]) < span(idleEyes[0]) * 0.9, 'angry eyes are narrower than idle');
for (const eye of eyes) {
  assert(eye.lid, 'angry eye has no lid');
  const [a, b] = eye.lid;
  const inner = Math.abs(a[0]) <= Math.abs(b[0]) ? a : b;
  const outer = inner === a ? b : a;
  assert(inner[1] < outer[1], 'angry lid does not frown');
}
const scan = zorn.fn(1.4);
assert(scan[0].gy === 0 && Math.abs(scan[0].gx) > 0.2, 'the scan stays level');
assert(alarmAlpha(0, 40) === 1 && alarmAlpha(40, 40) === 0 && alarmAlpha(80, 40) === 0, 'the alarm rim fades across one band');
let vorher = 1;
for (let d = 0; d <= 40; d += 4) {
  const alpha = alarmAlpha(d, 40);
  assert(alpha <= vorher + 1e-9, 'the alarm rim does not brighten inward');
  vorher = alpha;
}
assert(alarmAlpha(12, 40) === alarmAlpha(Math.min(12, 12), 40) && alarmAlpha(12, 40) < 1, 'a corner matches the edge at the same distance');

assert(ledPositions(2.5, L.R_LED, L.CAP).length === 1326, '2.5 mm grid is not 1326 points');
assert(LED_VORGABE.anzahl === 1330 && LED_VORGABE.leitungen === 4 && LED_VORGABE.pitch === 2.5, 'default buffer');
const kappe = ledFrame({});
assert(kappe.anzahl === 1330 && kappe.helligkeit.length === 1330 && kappe.pitch === 2.5, `LED-Puffer hat ${kappe.anzahl} Punkte`);
assert(kappe.leitungen === 4, 'not 4 lines');
assert(kappe.linien.map((l) => l.laenge).join(',') === '333,333,332,332', 'split of 1330 across 4');
assert(kappe.linien.reduce((s, l) => s + l.laenge, 0) === 1330, 'lines do not cover every point');
assert(kappe.linien[0].helligkeit[0] === kappe.helligkeit[0], 'line is not a view of the frame');
assert(kappe.linien[3].start === 333 + 333 + 332 && kappe.linien[3].helligkeit.length === 332, 'last line');
let an = 0;
for (const wert of kappe.helligkeit) {
  assert(wert >= 0 && wert <= 1, 'brightness outside 0..1');
  if (wert > 0.2) an++;
}
assert(an > 10, 'frame draws no eyes');
const nochmal = ledFrame({});
assert(nochmal.helligkeit.every((wert, i) => wert === kappe.helligkeit[i]), 'ledFrame is not deterministic');
const dicht = ledFrame({}, { pitch: 2.4, anzahl: 1460, leitungen: [365, 365, 365, 365] });
assert(dicht.anzahl === 1460 && dicht.pitch === 2.4 && dicht.linien.every((l) => l.laenge === 365), '1460 on 4 equal lines');
assert(ledFrame({}, 2.5).anzahl === 1330, 'a numeric second argument is the pitch');
let warf = false;
try { leitungenVon(1330, [400, 400, 400]); } catch { warf = true; }
assert(warf, 'a bad line sum is accepted');

if (process.argv.includes('--dump')) process.stdout.write(json);
else console.log(`Parity ok (${frames} Frames, ${hash.slice(0, 12)}…, ${kappe.anzahl} LEDs)`);
