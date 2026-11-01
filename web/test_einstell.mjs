// SPDX-License-Identifier: MIT
import fs from 'fs';
import { VORGABE } from './konfig.js';
import {
  DIM_PROZENT, DIM_SEK, GESICHT, LEBEN_STUFEN, SCHLAF_MIN, VOL_STUFEN,
  hauptSichtbar, lebenStufe, schnapp,
} from './einstell.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

assert(VORGABE.uhr === false, 'the clock defaults to off');
assert(VORGABE.lautstaerke === 1.6, 'volume still defaults to 160 percent');
assert(GESICHT === 'index.html', 'save and close return to the face');

assert(schnapp(163, VOL_STUFEN) === 160, 'volume snaps to the nearest 20 percent');
assert(schnapp(0, VOL_STUFEN) === 0 && schnapp(200, VOL_STUFEN) === 200, 'volume keeps the ends');
assert(schnapp(170, VOL_STUFEN) === 160, 'a halfway volume stays on the lower step');
assert(lebenStufe(0.42).id === 'normal', 'the default liveliness is the normal step');
assert(lebenStufe(0.9).id === 'wach' && lebenStufe(0.05).id === 'still', 'liveliness snaps to a named step');
assert(LEBEN_STUFEN.length >= 4 && LEBEN_STUFEN.length <= 6, 'liveliness has a few steps');
assert(schnapp(7, SCHLAF_MIN) === 5 && schnapp(50, DIM_SEK) === 60 && schnapp(33, DIM_PROZENT) === 30, 'sleep and dim snap');

{
  const alle = hauptSichtbar([], false);
  assert(alle.schlaf && alle.dim && alle.sprache && alle.laut && alle.leben && alle.uhr && alle.demo, 'without a file every main field is shown');
  assert(alle.verbindung && alle.haUrl && alle.haToken, 'a first setup can still open the connection');
  const datei = hauptSichtbar(['uhr', 'lautstaerke', 'lang', 'schlafSekunden', 'dimNachSekunden', 'dimStufe', 'lebendigkeit', 'haUrl', 'haToken'], false);
  assert(!datei.uhr && !datei.laut && !datei.sprache && !datei.schlaf && !datei.dim && !datei.leben, 'central fields are not shown');
  assert(!datei.verbindung && !datei.haUrl && !datei.haToken, 'a full file hides the connection');
  assert(datei.demo === true, 'the demo link stays');
  const teil = hauptSichtbar(['dimStufe'], false);
  assert(teil.dim && teil.dimNach && !teil.dimStufe, 'only the central dim row is hidden');
  const demo = hauptSichtbar([], true);
  assert(!demo.verbindung, 'the public demo does not offer a connection');
}

const html = fs.readFileSync(new URL('./settings.html', import.meta.url), 'utf8');
assert(!html.includes('zentral gesetzt') && !html.includes('neu-laden'), 'the page has no central labels and no reload button');
assert(!html.includes('Zurück') && !html.includes('set.back'), 'back to the face is gone');
assert(html.includes('id="schliessen"') && html.includes('action.save') && html.includes('action.close'), 'save and close are the actions');
assert(!/<select[\s>]/.test(html) && !html.includes('type="range"') && !html.includes('type="checkbox"'), 'no native dropdown, slider, or checkbox');
assert(html.includes('min-height: 64px') && html.includes('-webkit-appearance: none'), 'the touch targets are large and not system controls');
assert(!/\bgap\s*:/.test(html) && !/\bvar\s*\(/.test(html) && !/\binset\s*:/.test(html), 'the page css stays on Safari 10');
assert(html.includes('id="feld-schlaf"') && html.includes('id="feld-laut"') && html.includes('id="feld-uhr"') && html.includes('id="demo-start"'), 'sleep, volume, clock, and demo are on the page');
assert(html.includes('id="preview-reactions"'), 'reactions stay collapsible');

const js = fs.readFileSync(new URL('./settings.js', import.meta.url), 'utf8');
const schliessenBei = js.indexOf('function schliessen');
const speichernBei = js.indexOf('function speichern');
const startenBei = js.indexOf('async function starten');
assert(schliessenBei >= 0 && speichernBei > schliessenBei && startenBei > speichernBei, 'close and save are separate');
const schliessen = js.slice(schliessenBei, speichernBei);
const speichern = js.slice(speichernBei, startenBei);
assert(!schliessen.includes('speichereKonfig') && schliessen.includes("'" + GESICHT + "'"), 'close leaves without saving');
assert(speichern.includes('speichereKonfig') && speichern.includes("'" + GESICHT + "'"), 'save writes and returns to the face');
assert(!js.includes('neu-laden') && !js.includes('settings.central'), 'settings no longer reloads or marks central fields');

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Settings page ok');
