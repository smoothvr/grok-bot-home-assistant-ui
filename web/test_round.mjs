// SPDX-License-Identifier: MIT
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ECKEN_DEMO, ECKEN_VORGABE, ECK_KEYS, istAltesLayout, istStandardEcken } from './aktionen.js';
import {
  baueDashboard, binAusTitel, ereignisseAus, istKalt, kalenderNachricht, mockEreignisse, mockZustaende, normDash,
} from './dashboard.js';
import { DEMO_HOST, VORGABE, aktiveKlasse, demoBesuch, demoSperre, ladeKonfig, normModus, setzeKlasse, siteNachKonfig, speichereKonfig, vergissToken, waehleModus } from './konfig.js';
import { helligkeit, tuerKante } from './dimmen.js';
import { HILFE_BASIS, hilfeUrl } from './hilfe.js';
import { portraitEyeScale } from './zwei_d.js';
import { LED_VORGABE, ledFrame } from './renderer.js';
import { translate } from './strings.js';
import { bereit } from './ansichten.js';

let fehler = 0;
function assert(cond, msg) {
  if (!cond) {
    fehler++;
    console.error('FAIL:', msg);
  }
}

const mem = () => ({
  store: {},
  getItem(k) { return this.store[k] ?? null; },
  setItem(k, v) { this.store[k] = v; },
  removeItem(k) { delete this.store[k]; },
});

assert(DEMO_HOST === 'grok-bot-ui.herrvonundzu.eu', 'demo host');
assert(demoBesuch({}, { hostname: 'grok-bot-ui.herrvonundzu.eu', protocol: 'https:' }, '') === true, 'public host is a demo');
assert(demoBesuch({ haUrl: 'ws://ha.local/api/websocket', haToken: 'x' }, { hostname: DEMO_HOST, protocol: 'https:' }, '') === true, 'public host stays a demo');
assert(demoBesuch({}, { hostname: DEMO_HOST, protocol: 'https:' }, 'demo=0') === false, 'demo=0 opts out');
assert(demoBesuch({ haUrl: 'ws://ha.local/api/websocket', haToken: 'x' }, { hostname: 'tablet.local', protocol: 'https:' }, 'demo=1') === true, 'demo=1 forces it');
assert(demoBesuch({}, { hostname: 'tablet.local', protocol: 'https:' }, '') === true, 'https without Home Assistant starts a demo');
assert(demoBesuch({ haUrl: 'ws://ha.local/api/websocket' }, { hostname: 'tablet.local', protocol: 'https:' }, '') === false, 'a saved address is not a demo');
assert(demoBesuch({ haToken: 'x' }, { hostname: 'tablet.local', protocol: 'https:' }, '') === false, 'a saved token is not a demo');
assert(demoBesuch({}, { hostname: 'tablet.local', protocol: 'http:' }, '') === false, 'http on the LAN stays idle');
assert(demoSperre(DEMO_HOST) === true && demoSperre('GROK-BOT-UI.herrvonundzu.eu.') === true, 'the public host locks free text');
assert(demoSperre('tablet.local') === false && demoSperre('') === false, 'a private host stays editable');

{
  const s = mem();
  s.setItem('eye_ui_config', JSON.stringify({ haToken: 'geheim', haUrl: 'ws://ha.local/api/websocket' }));
  s.setItem('gk_ha_token', 'alt');
  vergissToken(s);
  const roh = JSON.parse(s.getItem('eye_ui_config'));
  assert(roh.haToken === '' && roh.haUrl === 'ws://ha.local/api/websocket', 'the token is cleared and the address stays');
  assert(s.getItem('gk_ha_token') == null, 'the old token key is removed');
}

assert(normModus('fortune') === 'led' && normModus('bold') === 'vollbild' && normModus('cute') === '2d' && normModus('cube') === '2d', 'theme names');
assert(normModus('nope') === '', 'unknown theme');
assert(waehleModus('', '') === 'vollbild' && waehleModus('cube', 'led') === '2d' && waehleModus('', 'led') === 'led', 'Bold is the default theme');
assert(VORGABE.uhr === false && VORGABE.tuer === '' && VORGABE.kamera === '' && VORGABE.dimNachSekunden === 60 && VORGABE.dimStufe === 0.3 && VORGABE.dimVorMinuten === 15, 'clock, door, camera, and dim defaults');
assert(helligkeit(0, 0, VORGABE) === 1 && helligkeit(61, 0, VORGABE) === 0.3, 'idle dim reaches 30 percent');
assert(helligkeit(0, 900, VORGABE) === 1 && helligkeit(30, 900, VORGABE) === 1, 'dimLead does not dim the inactivity timeout at once');
assert(helligkeit(61, 900, VORGABE) === 0.3, 'dimAfter still applies during the inactivity timeout');
const plan = { ...VORGABE, planSekunden: 7.5 * 60 };
assert(helligkeit(0, 900, { ...VORGABE, planSekunden: 20 * 60 }) === 1, 'a scheduled sleep outside the lead stays bright');
assert(helligkeit(0, 900, plan) < 1 && helligkeit(0, 900, plan) > 0.3, 'dimLead ramps only before a scheduled sleep time');
assert(helligkeit(0, 900, { ...VORGABE, planSekunden: 0 }) === 0.3, 'a scheduled sleep that is due is dim');
assert(tuerKante(null, 'on') === false && tuerKante('off', 'on') === true && tuerKante('on', 'on') === false && tuerKante('closed', 'open') === true, 'door greeting is a rising edge');

{
  const datei = {
    haUrl: 'http://ha.local:8123',
    haToken: 'do-not-keep',
    token: 'also-no',
    lang: 'de',
    theme: 'bold',
    cornerSize: 120,
    dashboard: { coldC: 2, waste: ['calendar.waste', 'sensor.waste_paper'], indoor: ['sensor.kitchen_temperature'] },
  };
  const leer = mem();
  const k = ladeKonfig('', leer, datei);
  assert(k.haUrl === 'ws://ha.local:8123/api/websocket', 'file address is normalized');
  assert(k.haToken === 'do-not-keep', 'a file token fills an empty store');
  assert(k.lang === 'de' && k.modus === 'vollbild', 'file language and theme');
  assert(k.eckGroesse === 120, 'file corner size');
  assert(k.dash.coldC === 2 && k.dash.waste.includes('calendar.waste') && k.dash.indoor[0] === 'sensor.kitchen_temperature', 'file dashboard');
  assert(k.dash.weather === 'weather.home', 'omitted dashboard fields keep the default');
  assert(k.lichtProfil === 'lebhaft', 'lively light is the default');
  speichereKonfig({ ...k, haUrl: 'ws://saved.local/api/websocket', haToken: 'bleibt-gespeichert', lang: 'en', modus: 'led' }, leer);
  const danach = ladeKonfig('lang=de', leer, { haUrl: 'http://file.local:8123', haToken: 'datei-token', theme: 'cute', lang: 'en' });
  assert(danach.haUrl === 'ws://file.local:8123/api/websocket', 'file address overrides the save');
  assert(danach.haToken === 'bleibt-gespeichert', 'a saved token wins over the file');
  assert(danach.lang === 'de', 'URL wins over the save');
  assert(danach.modus === 'led', 'saved theme wins over the file');
  const demoSpeicher = mem();
  const demoK = ladeKonfig('', demoSpeicher, { haUrl: 'http://ha.local:8123', haToken: 'nicht-auf-demo' }, { hostname: DEMO_HOST });
  assert(demoK.haToken === '' && demoK.haUrl === '', 'the public demo ignores a file address and token');
  assert(!String(demoSpeicher.getItem('eye_ui_config') || '').includes('nicht-auf-demo'), 'a file token is not stored on the demo host');
}

{
  const s = mem();
  s.setItem('eye_ui_config', JSON.stringify({
    gesten: {
      left: { art: 'music_toggle', ziel: '' },
      right: { art: 'none', ziel: '' },
      up: { art: 'light_toggle', ziel: '' },
      down: { art: 'light_toggle', ziel: '' },
      long: { art: 'none', ziel: '' },
    },
    ecken: {
      tl: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
      tr: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
      bl: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
      br: { tap: { art: 'none', ziel: '' }, hold: { art: 'none', ziel: '' } },
    },
  }));
  assert(istAltesLayout(JSON.parse(s.getItem('eye_ui_config')).gesten, JSON.parse(s.getItem('eye_ui_config')).ecken), 'old layout detected');
  const k = ladeKonfig('', s);
  assert(k.gesten.left.art === 'sheet' && k.gesten.right.art === 'dashboard', 'old swipes migrate once');
  assert(k.ecken.bl.tap.art === 'view' && k.ecken.tl.tap.art === 'service', 'old corners take the shipped map');
  assert(k.gestenStand === 2, 'migration is marked');
  const nochmal = ladeKonfig('', s);
  assert(nochmal.gesten.left.art === 'sheet', 'migration does not run twice');
}

assert(siteNachKonfig({ haToken: 'x', theme: 'fortune' }).haToken === 'x', 'site helper keeps the token');
assert(siteNachKonfig({ token: 'alias-token' }).haToken === 'alias-token', 'a token alias becomes haToken');
assert(siteNachKonfig({ access_token: 'drop-me' }).haToken == null, 'access_token is dropped');
assert(siteNachKonfig({ licht_profil: 'lebhaft' }).lichtProfil === 'lebhaft', 'a file can select the lively light');
assert(VORGABE.lichtProfil === 'lebhaft', 'the shipped light profile is lively');
assert(bereit('energy', { dash: normDash(null), states: {} }) === false, 'energy stays hidden without a pv entity');
assert(bereit('day', { dash: normDash(null), states: {} }) === true, 'my day is always in the stack');
assert(bereit('music', { dash: normDash(null), states: {}, scriptMusikAn: 'script.eye_music_on' }) === true, 'music stays when a script is set');
assert(bereit('home', { dash: normDash(null), states: {} }) === false, 'home waits until an entity exists');
assert(bereit('home', { dash: normDash(null), states: { 'weather.home': { state: 'unavailable' } } }) === true, 'an unavailable entity still keeps the view');
assert(siteNachKonfig({ theme: 'fortune' }).modus === 'led', 'site helper maps the theme');
assert(normDash({ waste: 'calendar.waste, sensor.waste_*' }).waste.length === 1, 'a bad entity is dropped');
assert(ECKEN_VORGABE.bl.tap.art === 'view', 'corner default');

const jetzt = new Date(2026, 9, 25, 12, 0, 0);
assert(binAusTitel('Paper bin collection') === 'Paper bin', 'bin name from a summary');
assert(binAusTitel('waste: Bio') === 'Bio', 'bin prefix');
assert(istKalt(4.9, 'cloudy', 5) === true && istKalt(5, 'cloudy', 5) === false, 'cold is below the threshold');
assert(istKalt(12, 'snowy', 5) === true, 'snow is cold');
const states = mockZustaende();
states['sensor.waste_paper'] = { entity_id: 'sensor.waste_paper', state: '2026-10-26', attributes: { friendly_name: 'Paper' } };
states['sensor.attic_temperature'] = { entity_id: 'sensor.attic_temperature', state: 'unavailable', attributes: {} };
states['binary_sensor.rain'] = { entity_id: 'binary_sensor.rain', state: 'unavailable', attributes: {} };
const modell = baueDashboard(states, {
  ...normDash(null),
  waste: ['calendar.waste', 'sensor.waste_paper'],
  indoor: ['sensor.living_room_temperature', 'sensor.attic_temperature', 'sensor.missing_temperature'],
  rain: 'binary_sensor.rain',
  wind: '',
}, { events: mockEreignisse(jetzt), forecast: [{ temperature: 6, templow: 1 }], jetzt });
assert(modell.cold === true, 'mock weather is cold');
assert(modell.waste.map((b) => b.name).join('|') === 'Paper bin|Bio|Paper', 'today and tomorrow only');
assert(!modell.waste.some((b) => b.name === 'Rest'), 'a later bin stays hidden');
assert(modell.indoor.length === 1 && modell.indoor[0].name === 'Living room', 'missing indoor sensors stay hidden');
assert(modell.rain == null && modell.wind == null, 'unconfigured or unavailable outdoor tiles stay hidden');
assert(modell.brightness && modell.windows.length === 1, 'configured tiles stay');
assert(modell.events[0].summary === 'School' && modell.events[0].time === '15:00', 'calendar event');
assert(modell.buttons.some((b) => b.kind === 'all_off') && modell.buttons.some((b) => b.kind === 'guard'), 'default buttons');
const leerRegen = baueDashboard(states, { ...normDash(null), rain: 'binary_sensor.not_there' }, { jetzt });
assert(leerRegen.rain == null, 'a missing rain sensor hides the tile');
const antwort = ereignisseAus({ service_response: { 'calendar.waste': { events: [{ summary: 'Bio' }] } } }, 'calendar.waste');
assert(antwort.length === 1 && antwort[0].summary === 'Bio', 'calendar response');
assert(kalenderNachricht('calendar.waste', 'a', 'b').return_response === true, 'calendar call asks for a response');
assert(ledFrame && LED_VORGABE.anzahl === 1330, 'led frame export');

assert(translate('en', 'mode.cube') === 'Cube' && translate('de', 'mode.2d') === 'Cube' && translate('en', 'mode.fortune') === 'Fortune' && translate('en', 'mode.bold') === 'Bold', 'theme labels');
assert(translate('en', 'day.title') === 'My day' && translate('de', 'day.title') === 'Mein Tag', 'my day');
assert(translate('en', 'demo.link') === 'Demo', 'demo link');
assert(translate('de', 'mode.fortune') === 'Fortune' && translate('de', 'settings.profilePhone') === 'Telefon', 'German profile name');
assert(ECK_KEYS.every((key) => ECKEN_DEMO[key].tap.art && ECKEN_DEMO[key].tap.art !== 'none'), 'demo mode assigns every corner');
assert(istStandardEcken(ECKEN_VORGABE) && !istStandardEcken(ECKEN_DEMO), 'demo corners differ from the stock map');
setzeKlasse('tablet');
assert(aktiveKlasse() === 'tablet', 'round tests leave the tablet profile');
assert(HILFE_BASIS === 'https://www.herrvonundzu.eu/grok-bot-universal-home-assistant-ui/', 'help base');
assert(hilfeUrl('phone') === `${HILFE_BASIS}#phone`, 'phone help anchor');
assert(portraitEyeScale(2388 / 1668) === 1 && portraitEyeScale(768 / 1024) === 1, 'landscape and tablet portrait keep the eye size');
assert(portraitEyeScale(390 / 844) < 0.9 && portraitEyeScale(390 / 844) > 0.6, 'phone portrait scales the eyes in');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const seite = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'web/manifest.webmanifest'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'web/sw.js'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const hilfe = fs.readFileSync(path.join(root, 'docs/help.md'), 'utf8');
assert(!/href="\/|src="\//.test(seite + manifest + sw), 'local assets are not root-absolute');
assert(readme.includes('https://grok-bot-ui.herrvonundzu.eu'), 'README names the demo host');
assert(!readme.includes('Home and Music detail views') && !hilfe.includes('Home and Music detail views'), 'detail views are gone');
assert(readme.includes('does not use the microphone') && hilfe.includes('does not use the microphone'), 'the page does not use the microphone');
assert(readme.includes('Voice is not part of this release') && hilfe.includes('Voice is not part of this release'), 'voice is not this release');
assert(readme.includes('option: angry') && hilfe.includes('option: angry'), 'docs show the angry option');
assert(readme.includes('input_boolean.eye_guard') && hilfe.includes('input_boolean.eye_guard'), 'docs show the guard automation');
assert(!readme.includes('seconds: 30') && !hilfe.includes('seconds: 30'), 'the door automation has no 30 second delay');
assert(readme.includes('30 seconds') && hilfe.includes('30 seconds'), 'the demo holds music for 30 seconds');
assert(hilfe.includes('id="states"') && hilfe.includes('id="demo"'), 'help keeps the states and demo anchors');
assert(readme.includes('?alarm=') && (readme.includes('alarm_intensity') || hilfe.includes('alarm_intensity')), 'alarm intensity has a URL');
assert(readme.includes('speaking') && hilfe.includes('speaking'), 'speaking is a Home Assistant option');
assert(readme.includes('Cache-Control') && hilfe.includes('Cache-Control'), 'hosts skip the cache for the worker');
assert(!readme.includes('and the dashboard') && !hilfe.includes('and the dashboard'), 'the demo corner is Home mode');
assert(translate('en', 'dash.group') === 'Home mode' && translate('de', 'dash.group') === 'Hausmodus', 'settings call it Home mode');
assert(!seite.includes('id="dash-cold"') && !seite.includes('Cold below'), 'the cold threshold field is gone');
assert(!readme.includes('demo.herrvonundzu.eu') && !hilfe.includes('demo.herrvonundzu.eu'), 'the old demo host is gone');
assert(!/planned|not verified|does not check that/i.test(readme + hilfe), 'the demo is described as live');
assert(readme.includes('no token is ever stored') && hilfe.includes('no token is ever stored'), 'the public host stores no token');
assert(readme.includes('### Security') && /### Security[\s\S]*non-admin, local-only Home Assistant user/.test(readme), 'the site file warning sits under Security');
assert(readme.includes("browser's localStorage") && hilfe.includes("browser's localStorage"), 'a private token stays in localStorage');
for (const z of (readme + '\n' + hilfe).split('\n')) {
  if (!/iPad 4|iOS 10\.3\.3/.test(z)) continue;
  assert(z.includes('legacy build available, device test pending'), `iPad line: ${z}`);
  assert(!/tested/i.test(z), `iPad line must not say tested: ${z}`);
}
const legacy = fs.readFileSync(path.join(root, 'web/legacy.js'), 'utf8');
const versionSrc = fs.readFileSync(path.join(root, 'web/version.js'), 'utf8');
assert(versionSrc.includes('REPO_PUBLIC = false'), 'the public switch stays off');
assert(!legacy.includes('REPO_PUBLIC = true'), 'the legacy bundle does not turn the switch on');
assert(legacy.includes('bottom edge'), 'the legacy bundle still ships the old gesture copy');
assert(!legacy.includes('sound-hint') && !legacy.includes('demo-badge'), 'the legacy bundle has no hint or badge');
assert(readme.includes('Phone and tablet') && hilfe.includes('Phone and tablet'), 'docs describe the two profiles');
assert(hilfe.includes('id="credits"') && hilfe.includes('must keep this id'), 'the help page tells the maintainer to keep the credits anchor');
const einstellungenSeite = fs.readFileSync(path.join(root, 'web/settings.html'), 'utf8');
assert(einstellungenSeite.includes('data-help="phone"') && hilfe.includes('id="phone"'), 'settings link to the phone section');
assert(!/own tablet|Demo badge|Tap to enable sound|Tippen für Ton/i.test(readme + hilfe), 'the removed hints stay out of the docs');
assert(hilfe.includes('id="requirements"') && hilfe.includes('id="dashboard"') && hilfe.includes('2026.10.4'), 'help sections');
assert(hilfe.includes('one look') || hilfe.includes('One look') || readme.includes('One look'), 'one look');
assert(seite.includes('id="hear-hint"') && seite.includes('id="hinweis"') && seite.includes('id="ecke"'), 'face, note, and the corner');
assert(!seite.includes('id="sheet-demo"') && !seite.includes('id="day-panel"') && !seite.includes('id="cam-zoom"'), 'tiles and detail views are gone');
assert(seite.includes('manifest="eye-ui.appcache"'), 'application cache manifest');
assert(!seite.includes("type: 'module'") || seite.includes("script.type = 'module'"), 'the worker script is not registered as a module');
assert(fs.existsSync(path.join(root, 'web/config.example.json')), 'example config ships');
const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
assert(ignore.includes('*.local.json') && ignore.includes('*-draft.md') && ignore.includes('flur-'), 'local files stay ignored');
if (fs.existsSync(path.join(root, '.git'))) {
  const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' });
  const lokal = tracked.split('\n').filter((name) => name.startsWith('flur-') || name.includes('/flur-') || name.endsWith('.local.json'));
  assert(lokal.length === 0, `local files are tracked: ${lokal.join(', ')}`);
}
assert(!fs.readFileSync(path.join(root, 'web/config.example.json'), 'utf8').includes('haToken'), 'example has no token');
const beispiel = fs.readFileSync(path.join(root, 'web/config.example.json'), 'utf8');
assert(beispiel.includes('binary_sensor.front_door') && beispiel.includes('presenceEntity') && beispiel.includes('reminderEntity') && beispiel.includes('reminderAckScript'), 'the example names the door, presence, and reminder');
assert(!/forecast_home|offene_kontakte|zentral_|alle_fenster|wohnzimmer|terrasse_|waste_morgen|calendar\.muell|solarnet/.test(beispiel), 'the example has no house ids');
assert(!beispiel.includes('energyPv'), 'the example has no energy tiles');

const skip = new Set(['node_modules', '.git']);
const treffer = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const voll = path.join(dir, name);
    const st = fs.statSync(voll);
    if (st.isDirectory()) walk(voll);
    else if (/\.(js|mjs|html|md|json|yml|css)$/.test(name) && !name.endsWith('.sha256')) {
      const text = fs.readFileSync(voll, 'utf8');
      const verboten = new RegExp(`${'ku' + 'gel'}|${'glass' + ' ball'}`, 'i');
      if (verboten.test(text)) treffer.push(path.relative(root, voll));
    }
  }
}
walk(root);
assert(treffer.length === 0, `forbidden name in ${treffer.join(', ')}`);

if (fehler) {
  console.error(`${fehler} checks failed`);
  process.exit(1);
}
console.log('Demo host, site config, dashboard, and themes ok');
